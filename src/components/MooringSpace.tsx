import React from 'react';
import type { Boat } from '../types';
import { Edit2, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MooringSpaceProps {
  title: string;
  boats: Boat[];
  totalSpace: number;
  availableSpace: number;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function SortableBoatCard({
  boat,
  onDelete,
  onEdit,
}: {
  boat: Boat;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: boat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSpace = boat.name.trim().toUpperCase() === 'SPACE';
  const isLeavingSoon = Number(boat.stay) <= 1;
  const arrivalDate = boat.arrivalDate
    ? new Date(boat.arrivalDate).toLocaleDateString()
    : '';

  let bgClass = 'bg-white';
  let borderClass = 'border border-gray-200';

  if (isSpace) {
    bgClass = 'bg-yellow-100';
    borderClass = 'border-2 border-yellow-300';
  } else if (isLeavingSoon) {
    bgClass = 'bg-orange-50';
    borderClass = 'border-2 border-orange-400';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full p-4 rounded-lg shadow-sm ${bgClass} ${borderClass}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{boat.name}</h3>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            type="button"
            onClick={() => onEdit(boat.id)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          >
            <Edit2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this boat?')) {
                onDelete(boat.id);
              }
            }}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600">Owner</p>
          <p className="font-medium">{boat.owner}</p>
        </div>
        <div>
          <p className="text-gray-600">Length</p>
          <p className="font-medium">{boat.length}'</p>
        </div>
        <div>
          <p className="text-gray-600">Stay</p>
          <p className="font-medium">{boat.stay} nights</p>
        </div>
        <div>
          <p className="text-gray-600">Arrival</p>
          <p className="font-medium">{arrivalDate}</p>
        </div>
      </div>

      {boat.notes && (
        <div className="mt-2 text-sm">
          <p className="text-gray-600">Notes</p>
          <p className="text-gray-700">{boat.notes}</p>
        </div>
      )}

      {isLeavingSoon && !isSpace && (
        <div className="mt-2 text-sm text-orange-600 font-medium">
          Due to leave within 24 hours
        </div>
      )}
    </div>
  );
}

export function MooringSpace({
  title,
  boats,
  totalSpace,
  availableSpace,
  onDelete,
  onEdit,
}: MooringSpaceProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title} Mooring</h2>
        <div className="text-sm">
          <span className="font-medium">{availableSpace}'</span>
          <span className="text-gray-500"> available of </span>
          <span className="font-medium">{totalSpace}'</span>
        </div>
      </div>

      <div className="space-y-4">
        {boats.map((boat) => (
          <SortableBoatCard
            key={boat.id}
            boat={boat}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
