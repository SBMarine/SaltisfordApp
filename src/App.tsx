import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { format, addDays, isBefore } from 'date-fns';
import { Ship, Calendar, Download, AlertTriangle } from 'lucide-react';

import { BoatForm } from './components/BoatForm';
import { MooringSpace } from './components/MooringSpace';
import { useMidnightUpdate } from './hooks/useMidnightUpdate';
import { useSupabaseBoats } from './hooks/useSupabaseBoats';
import type { Boat } from './types';

export default function App() {
  const {
    boats,
    addBoat,
    updateBoat,
    deleteBoat,
  } = useSupabaseBoats();

  const [editMode, setEditMode] = useState(false);
  const [currentBoat, setCurrentBoat] = useState<Boat | null>(null);

  const totalSpace = 564;

  const updateStayDurations = useCallback(() => {}, []);
  useMidnightUpdate(updateStayDurations);

  const editBoat = (id: string) => {
    const boat = boats.find(b => b.id === id);
    if (boat) {
      setCurrentBoat(boat);
      setEditMode(true);
    }
  };

  const handleUpdateBoat = (updated: Boat) => {
    updateBoat(updated);
    setEditMode(false);
    setCurrentBoat(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setCurrentBoat(null);
  };

  const handleDeleteBoat = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this boat?')) {
      await deleteBoat(id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const activeBoat = boats.find(b => b.id === active.id);
    const overBoat = boats.find(b => b.id === over.id);
    if (!activeBoat || !overBoat) return;

    const newSide = overBoat.side;

    const updatedBoats = boats
      .filter(b => b.side === newSide)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const oldIndex = updatedBoats.findIndex(b => b.id === active.id);
    const newIndex = updatedBoats.findIndex(b => b.id === over.id);

    let reordered = updatedBoats;
    if (oldIndex !== -1 && newIndex !== -1) {
      reordered = arrayMove(updatedBoats, oldIndex, newIndex);
    } else {
      reordered.splice(newIndex, 0, { ...activeBoat, side: newSide });
    }

    for (let i = 0; i < reordered.length; i++) {
      const updated = {
        ...reordered[i],
        position: i,
        side: newSide,
      };
      await updateBoat(updated);
    }
  };

  const exportData = () => {
    const filtered = boats.filter(b => b.name.trim().toUpperCase() !== 'SPACE');
    const csv = [
      'Name,Owner,Length,Stay,Arrival Date,Notes,Side',
      ...filtered.map(b =>
        `"${b.name}","${b.owner}","${b.length}","${b.stay}","${format(new Date(b.arrivalDate), 'yyyy-MM-dd')}","${b.notes || ''}","${b.side}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saltisford_moorings_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const banksideBoats = boats
    .filter(b => b.side === 'bankside')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const offsideBoats = boats
    .filter(b => b.side === 'offside')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const banksideSpace = totalSpace - banksideBoats
    .filter(b => b.name.trim().toUpperCase() !== 'SPACE')
    .reduce((acc, b) => acc + Number(b.length), 0);

  const offsideSpace = totalSpace - offsideBoats
    .filter(b => b.name.trim().toUpperCase() !== 'SPACE')
    .reduce((acc, b) => acc + Number(b.length), 0);

  const leavingBoats = boats.filter(b => {
    const arrivalDate = new Date(b.arrivalDate);
    const departureDate = addDays(arrivalDate, Number(b.stay));
    const tomorrow = addDays(new Date(), 1);
    return isBefore(departureDate, tomorrow) && b.name.trim().toUpperCase() !== 'SPACE';
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ship size={32} />
            <h1 className="text-3xl font-bold">Saltisford Mooring Tracker</h1>
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Download size={20} />
            Export Data
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold">Add New Boat</h2>
          </div>
          <BoatForm
            addBoat={addBoat}
            editMode={editMode}
            currentBoat={currentBoat}
            updateBoat={handleUpdateBoat}
            cancelEdit={cancelEdit}
          />
        </div>

        {leavingBoats.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle size={24} className="text-orange-600" />
              <p className="text-orange-700 font-medium">
                {leavingBoats.length} boat(s) due to leave within 24 hours
              </p>
            </div>
          </div>
        )}

        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <div className="grid md:grid-cols-2 gap-6">
            <SortableContext items={banksideBoats.map(b => b.id)}>
              <MooringSpace
                title="Bankside"
                boats={banksideBoats}
                totalSpace={totalSpace}
                availableSpace={banksideSpace}
                onDelete={handleDeleteBoat}
                onEdit={editBoat}
              />
            </SortableContext>

            <SortableContext items={offsideBoats.map(b => b.id)}>
              <MooringSpace
                title="Offside"
                boats={offsideBoats}
                totalSpace={totalSpace}
                availableSpace={offsideSpace}
                onDelete={handleDeleteBoat}
                onEdit={editBoat}
              />
            </SortableContext>
          </div>
        </DndContext>
      </main>
    </div>
  );
}
