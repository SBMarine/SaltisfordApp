import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit2 } from 'lucide-react';
import type { Boat } from '../types';

interface BoatCardProps {
  boat: Boat;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function BoatCard({ boat, onDelete, onEdit }: BoatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: boat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLeavingSoon = Number(boat.stay) <= 1;
  const arrivalDate = boat.arrivalDate ? new Date(boat.arrivalDate) : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this boat?')) {
      onDelete(boat.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(boat.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        w-full p-4 rounded-lg shadow-md bg-white
        ${isLeavingSoon ? 'border-2 border-orange-400 bg-orange-50' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div {...attributes} {...listeners} className="flex-1 cursor-move">
          <h3 className="text-lg font-semibold">{boat.name}</h3>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            type="button"
            onClick={handleEdit}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          >
            <Edit2 size={18} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
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
          <p className="font-medium">
            {arrivalDate?.toLocaleDateString()}
          </p>
        </div>
      </div>

      {boat.notes && (
        <div className="mt-2 text-sm">
          <p className="text-gray-600">Notes</p>
          <p className="text-gray-700">{boat.notes}</p>
        </div>
      )}

      {isLeavingSoon && (
        <div className="mt-2 text-sm text-orange-600 font-medium">
          Due to leave within 24 hours
        </div>
      )}
    </div>
  );
}

interface MooringSpaceProps {
  title: string;
  boats: Boat[];
  totalSpace: number;
  availableSpace: number;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function MooringSpace({
  title,
  boats,
  totalSpace,
  availableSpace,
  onDelete,
  onEdit
}: MooringSpaceProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-sm">
          <span className="font-medium">{availableSpace}'</span>
          <span className="text-gray-500"> available of </span>
          <span className="font-medium">{totalSpace}'</span>
        </div>
      </div>

      <div className="space-y-4">
        {boats.map((boat) => (
          <BoatCard
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