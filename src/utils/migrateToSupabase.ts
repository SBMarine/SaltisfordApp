import { supabase } from '../lib/supabase';
import type { Boat } from '../types';
import { toast } from 'react-hot-toast';

export async function migrateLocalStorageToSupabase(): Promise<boolean> {
  try {
    // Check if migration has been done
    const migrationFlag = localStorage.getItem('supabaseMigrationCompleted');
    if (migrationFlag === 'true') {
      return true;
    }
    
    // Get boats from localStorage
    const localBoats = localStorage.getItem('boats');
    if (!localBoats) {
      localStorage.setItem('supabaseMigrationCompleted', 'true');
      return true;
    }
    
    const boats: Boat[] = JSON.parse(localBoats);
    if (!boats.length) {
      localStorage.setItem('supabaseMigrationCompleted', 'true');
      return true;
    }
    
    // Format boats for Supabase
    const supabaseBoats = boats.map(boat => ({
      id: boat.id,
      name: boat.name,
      owner: boat.owner,
      length: Number(boat.length),
      stay: Number(boat.stay),
      arrival_date: boat.arrivalDate,
      notes: boat.notes || null,
      side: boat.side
    }));
    
    // Insert to Supabase (upsert to avoid duplicates)
    const { error } = await supabase
      .from('boats')
      .upsert(supabaseBoats)
      .select();
      
    if (error) throw error;
    
    // Mark migration as completed
    localStorage.setItem('supabaseMigrationCompleted', 'true');
    toast.success(`Migrated ${boats.length} boats to cloud storage`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Migration failed';
    toast.error(`Error migrating data: ${message}`);
    console.error('Migration error:', err);
    return false;
  }
}