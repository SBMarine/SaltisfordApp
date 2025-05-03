import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';
import { Ship, Calendar, Download, AlertTriangle } from 'lucide-react';
import { BoatForm } from './components/BoatForm';
import { MooringSpace } from './components/MooringSpace';
import { useMidnightUpdate } from './hooks/useMidnightUpdate';
import type { Boat } from './types';

export default function App() {
  const [boats, setBoats] = useState<Boat[]>(() => {
    const saved = localStorage.getItem('boats');
    return saved ? JSON.parse(saved) : [];
  });
  const [editMode, setEditMode] = useState(false);
  const [currentBoat, setCurrentBoat] = useState<Boat | null>(null);
  const totalSpace = 564;

  useEffect(() => {
    localStorage.setItem('boats', JSON.stringify(boats));
  }, [boats]);

  const updateStayDurations = useCallback(() => {
    setBoats(prevBoats => 
      prevBoats.map(boat => {
        const arrivalDate = new Date(boat.arrivalDate || '');
        const daysElapsed = differenceInDays(new Date(), arrivalDate);
        const originalStay = Number(boat.stay);
        const remainingStay = Math.max(originalStay - daysElapsed, 0);
        
        return {
          ...boat,
          stay: remainingStay
        };
      })
    );
  }, []);

  // Use the custom hook for midnight updates
  useMidnightUpdate(updateStayDurations);

  const addBoat = (boat: Boat) => {
    const newBoat = {
      ...boat,
      id: Date.now().toString(),
      arrivalDate: new Date().toISOString()
    };
    setBoats(prev => [...prev, newBoat]);
  };

  const deleteBoat = (id: string) => {
    setBoats(prev => prev.filter(boat => boat.id !== id));
  };

  const editBoat = (id: string) => {
    const boat = boats.find(b => b.id === id);
    if (boat) {
      setCurrentBoat(boat);
      setEditMode(true);
    }
  };

  const updateBoat = (updated: Boat) => {
    setBoats(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    setEditMode(false);
    setCurrentBoat(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setCurrentBoat(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over || active.id === over.id) return;

    setBoats((boats) => {
      const oldIndex = boats.findIndex(b => b.id === active.id);
      const newIndex = boats.findIndex(b => b.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return boats;

      const draggedBoat = boats[oldIndex];
      const targetBoat = boats[newIndex];
      
      // Update the side of the dragged boat to match the target's side
      const newBoats = boats.map((boat, index) => {
        if (index === oldIndex) {
          return { ...boat, side: targetBoat.side };
        }
        return boat;
      });

      return arrayMove(newBoats, oldIndex, newIndex);
    });
  };

  const exportData = () => {
    const csv = [
      'Name,Owner,Length,Stay,Arrival Date,Notes,Side',
      ...boats.map(b => 
        `"${b.name}","${b.owner}","${b.length}","${b.stay}","${format(new Date(b.arrivalDate), 'yyyy-MM-dd')}","${b.notes || ''}","${b.side}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saltisford_moorings_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const banksideBoats = boats.filter(b => b.side === 'bankside');
  const offsideBoats = boats.filter(b => b.side === 'offside');
  
  const banksideSpace = totalSpace - banksideBoats.reduce((acc, b) => acc + Number(b.length), 0);
  const offsideSpace = totalSpace - offsideBoats.reduce((acc, b) => acc + Number(b.length), 0);

  const leavingBoats = boats.filter(b => {
    const arrivalDate = new Date(b.arrivalDate);
    const departureDate = addDays(arrivalDate, Number(b.stay));
    const tomorrow = addDays(new Date(), 1);
    return isBefore(departureDate, tomorrow);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ship size={32} />
            <h1 className="text-3xl font-bold">Saltisford Mooring Tracker</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportData}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download size={20} />
              Export Data
            </button>
          </div>
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
            updateBoat={updateBoat}
            cancelEdit={cancelEdit}
          />
        </div>

        {(banksideSpace < 50 || offsideSpace < 50) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle size={24} className="text-yellow-600" />
              <p className="text-yellow-700 font-medium">
                Warning: Limited space available! 
                {banksideSpace < 50 && ` Bankside: ${banksideSpace}' remaining.`}
                {offsideSpace < 50 && ` Offside: ${offsideSpace}' remaining.`}
              </p>
            </div>
          </div>
        )}

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
          <SortableContext items={boats.map(b => b.id)}>
            <div className="grid md:grid-cols-2 gap-6">
              <MooringSpace
                title="Bankside Mooring"
                boats={banksideBoats}
                totalSpace={totalSpace}
                availableSpace={banksideSpace}
                onDelete={deleteBoat}
                onEdit={editBoat}
              />
              <MooringSpace
                title="Offside Mooring"
                boats={offsideBoats}
                totalSpace={totalSpace}
                availableSpace={offsideSpace}
                onDelete={deleteBoat}
                onEdit={editBoat}
              />
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
}