import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export interface WorkEntry {
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
}

export function useWorkEntries() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEntries = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('work_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('work_date', { ascending: false });

    if (error) {
      console.error('Error fetching work entries:', error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const addEntry = async (entry: Omit<WorkEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    const { data, error } = await supabase
      .from('work_entries')
      .insert([{ ...entry, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setEntries(prev => [data, ...prev]);
    }

    return { data, error };
  };

  const updateEntry = async (id: string, updates: Partial<WorkEntry>) => {
    const { data, error } = await supabase
      .from('work_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setEntries(prev => prev.map(entry => entry.id === id ? data : entry));
    }

    return { data, error };
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('work_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }

    return { error };
  };

  const uploadScreenshot = async (file: File) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `screenshots/${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) {
      return { data: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return { data: { publicUrl }, error: null };
  };

  const getEntriesForDate = (date: string) => {
    return entries.filter(entry => entry.work_date === date);
  };

  const getTotalHours = () => {
    return entries.reduce((total, entry) => total + entry.hours_spent, 0);
  };

  const getTotalTasks = () => {
    return entries.length;
  };

  const getWorkDays = () => {
    const uniqueDates = new Set(entries.map(entry => entry.work_date));
    return uniqueDates.size;
  };

  const getAverageHoursPerDay = () => {
    const workDays = getWorkDays();
    return workDays > 0 ? getTotalHours() / workDays : 0;
  };

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    uploadScreenshot,
    getEntriesForDate,
    getTotalHours,
    getTotalTasks,
    getWorkDays,
    getAverageHoursPerDay,
    refetch: fetchEntries,
  };
}