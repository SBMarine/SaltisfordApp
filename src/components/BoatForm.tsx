import React, { useState, useEffect } from 'react';
import type { Boat } from '../types';

interface BoatFormProps {
  addBoat: (boat: Boat) => void;
  editMode: boolean;
  currentBoat: Boat | null;
  updateBoat: (boat: Boat) => void;
  cancelEdit: () => void;
}

export function BoatForm({ addBoat, editMode, currentBoat, updateBoat, cancelEdit }: BoatFormProps) {
  const [form, setForm] = useState<Partial<Boat>>({
    name: '',
    owner: '',
    length: 0,
    stay: 0,
    notes: '',
    side: 'bankside'
  });

  useEffect(() => {
    if (currentBoat) {
      setForm({
        ...currentBoat,
        length: currentBoat.length,
        stay: currentBoat.stay,
      });
    } else {
      setForm({
        name: '',
        owner: '',
        length: 0,
        stay: 0,
        notes: '',
        side: 'bankside'
      });
    }
  }, [currentBoat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.owner ||
      !form.length ||
      !form.stay ||
      !form.side
    ) return;

    const cleanedForm: Boat = {
      ...(form as Boat),
      length: Number(form.length),
      stay: Number(form.stay),
    };

    if (editMode && currentBoat) {
      updateBoat({ ...currentBoat, ...cleanedForm });
    } else {
      const newBoat: Boat = {
        ...cleanedForm,
        id: crypto.randomUUID(), // Ensure unique ID for new boat
        arrivalDate: new Date().toISOString(),
        position: 0,
      };
      addBoat(newBoat);
    }

    setForm({
      name: '',
      owner: '',
      length: 0,
      stay: 0,
      notes: '',
      side: 'bankside'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Boat Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter boat name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
        <input
          type="text"
          value={form.owner}
          onChange={e => setForm(prev => ({ ...prev, owner: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter owner name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Boat Length (ft)</label>
        <input
          type="number"
          value={form.length}
          onChange={e => setForm(prev => ({ ...prev, length: Number(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter length in feet"
          min="1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stay Duration (nights)</label>
        <input
          type="number"
          value={form.stay}
          onChange={e => setForm(prev => ({ ...prev, stay: Number(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter number of nights"
          min="1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mooring Side</label>
        <select
          value={form.side}
          onChange={e => setForm(prev => ({ ...prev, side: e.target.value as 'bankside' | 'offside' }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="bankside">Bankside</option>
          <option value="offside">Offside</option>
        </select>
      </div>

      <div className="md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any additional notes"
          rows={3}
        />
      </div>

      <div className="md:col-span-2 lg:col-span-3 flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {editMode ? 'Update Boat' : 'Add Boat'}
        </button>
        {editMode && (
          <button
            type="button"
            onClick={cancelEdit}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
