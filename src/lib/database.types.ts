export type Database = {
  public: {
    Tables: {
      boats: {
        Row: {
          id: string;
          name: string;
          owner: string;
          length: number;
          stay: number;
          arrival_date: string;
          notes: string | null;
          side: 'bankside' | 'offside';
        };
        Insert: Omit<Database['public']['Tables']['boats']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['boats']['Row']>;
      };
    };
  };
};