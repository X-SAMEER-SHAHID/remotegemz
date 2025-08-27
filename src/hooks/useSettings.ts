import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Settings {
  hourlyRate: number;
}

const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 50,
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('work-tracker-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('work-tracker-settings', JSON.stringify(settings));
  }, [settings]);

  // Load from Supabase when user is available
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('hourly_rate')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data && typeof data.hourly_rate === 'number') {
        setSettings(prev => ({ ...prev, hourlyRate: data.hourly_rate }));
      }
    };
    load();
  }, [user]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Persist to Supabase if logged in
    try {
      if (user && newSettings.hourlyRate !== undefined) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({ user_id: user.id, hourly_rate: newSettings.hourlyRate }, { onConflict: 'user_id' });
        if (error) console.error('Failed to save settings:', error.message);
      }
    } catch (e) {
      console.error('Error saving settings', e);
    }
  };

  return {
    settings,
    updateSettings,
  };
}
