export interface Boat {
  id: string;
  name: string;
  owner?: string;
  length: string | number;
  stay?: string | number;
  notes?: string;
  arrivalDate?: string;
  side: 'bankside' | 'offside';
}