export interface Boat {
  id: string;
  name: string;
  owner: string;
  length: number;
  stay: number;
  arrivalDate: string;
  notes?: string;
  side: 'bankside' | 'offside';
  position?: number;
}
