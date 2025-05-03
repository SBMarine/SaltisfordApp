import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Boat } from '../types';
import { toast } from 'react-hot-toast';

export function useSupabaseBoats() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial data fetch and real-time subscription setup
  useEffect(() => {
    const fetchBoats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get boats from Supabase
        const { data, error } = await supabase
          .from('boats')
          .select('*')
          .order('arrival_date', { ascending: false });
          
        if (error) throw error;
        
        // Convert from Supabase format to app format
        setBoats(data.map(boatFromSupabase));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch boats';
        setError(message);
        toast.error(`Error loading boats: ${message}`);
        console.error('Error fetching boats:', err);
      } finally {
        setLoading(false);
      }
    };

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel('boats-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'boats' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBoats((current) => [boatFromSupabase(payload.new), ...current]);
              toast.success('New boat added');
            } else if (payload.eventType === 'UPDATE') {
              setBoats((current) => 
                current.map((boat) => 
                  boat.id === payload.new.id ? boatFromSupabase(payload.new) : boat
                )
              );
              toast.success('Boat updated');
            } else if (payload.eventType === 'DELETE') {
              setBoats((current) => 
                current.filter((boat) => boat.id !== payload.old.id)
              );
              toast.success('Boat removed');
            }
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.error('Failed to subscribe to real-time updates');
            toast.error('Real-time updates unavailable');
          }
        });
      
      return channel;
    };

    // Initial fetch
    fetchBoats();
    
    // Set up subscription
    const channel = setupRealtimeSubscription();
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to convert Supabase format to app format
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
  
  // Helper to convert app format to Supabase format
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

  // CRUD operations
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
      const message = err instanceof Error ? err.message : 'Failed to add boat';
      toast.error(`Error adding boat: ${message}`);
      console.error('Error adding boat:', err);
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
      const message = err instanceof Error ? err.message : 'Failed to update boat';
      toast.error(`Error updating boat: ${message}`);
      console.error('Error updating boat:', err);
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
      const message = err instanceof Error ? err.message : 'Failed to delete boat';
      toast.error(`Error deleting boat: ${message}`);
      console.error('Error deleting boat:', err);
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