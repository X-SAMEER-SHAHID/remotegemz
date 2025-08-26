import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      work_entries: {
        Row: {
          id: string;
          user_id: string;
          work_date: string;
          work_time: string;
          description: string;
          hours_spent: number;
          commit_link: string | null;
          screenshot_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          work_date: string;
          work_time: string;
          description: string;
          hours_spent: number;
          commit_link?: string | null;
          screenshot_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          work_date?: string;
          work_time?: string;
          description?: string;
          hours_spent?: number;
          commit_link?: string | null;
          screenshot_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};