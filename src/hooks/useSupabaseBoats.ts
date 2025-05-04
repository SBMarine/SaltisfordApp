import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Boat } from '../types';

export function useSupabaseBoats() {
  const [boats, setBoats] = useState<Boat[]>([]);

  useEffect(() => {
    fetchBoats();

    const channel = supabase
      .channel('realtime:boats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boats' },
        payload => {
          const newBoat = payload.new as Boat;
          const oldBoat = payload.old as Boat;

          if (payload.eventType === 'INSERT') {
            setBoats(prev => [...prev, newBoat]);
          }

          if (payload.eventType === 'UPDATE') {
            setBoats(prev =>
              prev.map(b => (b.id === newBoat.id ? { ...b, ...newBoat } : b))
            );
          }

          if (payload.eventType === 'DELETE') {
            setBoats(prev => prev.filter(b => b.id !== oldBoat.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchBoats() {
    const { data, error } = await supabase
      .from('boats')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Fetch error:', error.message);
    } else if (data) {
      setBoats(data as Boat[]);
    }
  }

  async function addBoat(boat: Omit<Boat, 'id' | 'arrivalDate' | 'position'>) {
    const newBoat = {
      ...boat,
      arrivalDate: new Date().toISOString(),
      position: 0, // Default, but will reorder correctly
    };

    const { error } = await supabase.from('boats').insert([newBoat]);
    if (error) console.error('Insert error:', error.message);
  }

  async function updateBoat(boat: Boat) {
    const { error } = await supabase
      .from('boats')
      .update({
        name: boat.name,
        owner: boat.owner,
        length: boat.length,
        stay: boat.stay,
        arrivalDate: boat.arrivalDate,
        notes: boat.notes,
        side: boat.side,
        position: boat.position,
      })
      .eq('id', boat.id);

    if (error) console.error('Update error:', error.message);
  }

  async function deleteBoat(id: string) {
    const { error } = await supabase.from('boats').delete().eq('id', id);
    if (error) console.error('Delete error:', error.message);
  }

  return {
    boats,
    addBoat,
    updateBoat,
    deleteBoat,
  };
}
