import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Boat } from '../types';
import { toast } from 'react-hot-toast';

export function useSupabaseBoats() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoats = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('boats')
          .select('*')
          .order('arrival_date', { ascending: false });

        if (error) throw error;
        setBoats(data.map(boatFromSupabase));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch boats';
        setError(message);
        toast.error('Error loading boats');
      } finally {
        setLoading(false);
      }
    };

    const channel = supabase
      .channel('boats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boats' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBoats(current => [boatFromSupabase(payload.new), ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setBoats(current =>
              current.map(b => b.id === payload.new.id ? boatFromSupabase(payload.new) : b)
            );
          } else if (payload.eventType === 'DELETE') {
            setBoats(current => current.filter(b => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    fetchBoats();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const boatFromSupabase = (dbBoat: any): Boat => ({
    id: dbBoat.id,
    name: dbBoat.name,
    owner: dbBoat.owner,
    length: dbBoat.length,
    stay: dbBoat.stay,
    arrivalDate: dbBoat.arrival_date,
    notes: dbBoat.notes || '',
    side: dbBoat.side
  });

  const boatToSupabase = (boat: Boat) => ({
    id: boat.id,
    name: boat.name,
    owner: boat.owner,
    length: Number(boat.length),
    stay: Number(boat.stay),
    arrival_date: boat.arrivalDate,
    notes: boat.notes || null,
    side: boat.side
  });

  const addBoat = async (boat: Omit<Boat, 'id' | 'arrivalDate'>) => {
    try {
      const newBoat = {
        ...boat,
        arrival_date: new Date().toISOString(),
        length: Number(boat.length),
        stay: Number(boat.stay)
      };

      const { data, error } = await supabase
        .from('boats')
        .insert([newBoat])
        .select();

      if (error) throw error;
      return data?.[0]?.id;
    } catch (err) {
      toast.error('Error adding boat');
      throw err;
    }
  };

  const updateBoat = async (updatedBoat: Boat) => {
    try {
      const { error } = await supabase
        .from('boats')
        .update(boatToSupabase(updatedBoat))
        .eq('id', updatedBoat.id);

      if (error) throw error;
    } catch (err) {
      toast.error('Error updating boat');
      throw err;
    }
  };

  const deleteBoat = async (id: string) => {
    try {
      const { error } = await supabase
        .from('boats')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      toast.error('Error deleting boat');
      throw err;
    }
  };

  return {
    boats,
    loading,
    error,
    addBoat,
    updateBoat,
    deleteBoat
  };
}
