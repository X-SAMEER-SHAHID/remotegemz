import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });
    
    // If signup was successful and user was created, complete the signup process
    if (data.user && !error) {
      try {
        // Complete the user signup process (creates profile, preferences, categories)
        const { data: signupResult, error: signupError } = await supabase.rpc('complete_user_signup', {
          user_uuid: data.user.id
        });
        
        if (signupError) {
          console.warn('Failed to complete user signup:', signupError);
        } else if (signupResult) {
          console.log('User signup completed:', signupResult);
        }
      } catch (signupErr) {
        console.warn('Error completing user signup:', signupErr);
      }
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}