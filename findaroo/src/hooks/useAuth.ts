import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        // Try to get session from AsyncStorage first
        const storedSession = await AsyncStorage.getItem('sb-session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setSession(parsedSession);
        }

        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Supabase session:', session);
        
        if (!error && session && session.user) {
          setSession(session);
          await AsyncStorage.setItem('sb-session', JSON.stringify(session));
          // Fetch user profile, pass session.user
          await fetchUserProfile(session.user.id, session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
      console.log('Auth state change session:', session);
      
      if (session && session.user) {
        await AsyncStorage.setItem('sb-session', JSON.stringify(session));
        await fetchUserProfile(session.user.id, session.user);
      } else {
        await AsyncStorage.removeItem('sb-session');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Move createUserProfile above fetchUserProfile for correct type inference
  const createUserProfile = async (userId: string, email: string, fullName: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (!error && data) {
        setUser(data);
        return { data, error: null };
      }
      
      return { data: null, error };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      return { data: null, error };
    }
  };

  // Accept sessionUser as a parameter
  const fetchUserProfile = async (userId: string, sessionUser?: any) => {
    try {
      console.log('Fetching user profile for userId:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('fetchUserProfile result:', { data, error });

      if (!error && data) {
        setUser(data);
        console.log('setUser called with:', data);
      } else if (error && error.code === 'PGRST116') {
        // User profile doesn't exist, create it
        console.log('User profile not found, creating it...');
        // Use sessionUser passed as argument
        if (sessionUser && sessionUser.email) {
          const email = sessionUser.email;
          const fullName = sessionUser.user_metadata?.full_name || '';
          const newProfile = await createUserProfile(userId, email, fullName);
          if (newProfile.data) {
            setUser(newProfile.data);
            console.log('setUser called with (created):', newProfile.data);
          }
        } else {
          console.warn('Cannot create user profile: session user or email missing');
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // First, try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This prevents the redirect to localhost
          emailRedirectTo: undefined,
        },
      });

      if (error) throw error;

      // If user is created but not confirmed (email confirmation required)
      if (data.user && !data.session) {
        return { 
          data, 
          error: null, 
          needsConfirmation: true,
          message: 'Please check your email to confirm your account.' 
        };
      }

      // If user is created and confirmed (no email confirmation required)
      if (data.user && data.session) {
        // Wait a moment for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set the session to ensure RLS policies work
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email || email,
              full_name: fullName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw here, the user is created, just profile creation failed
          // We can create the profile later
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        await AsyncStorage.removeItem('sb-session');
        setSession(null);
        setUser(null);
      }
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      console.log(`[useAuth] Updating user profile for user ID: ${user.id}`, updates);
      
      // Ensure profile_pic is properly formatted if it's being updated
      if (updates.profile_pic) {
        updates.profile_pic = updates.profile_pic.trim();
        console.log(`[useAuth] Updating profile picture to: ${updates.profile_pic}`);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[useAuth] Error updating user profile:', error);
        return { data: null, error };
      }
      
      if (data) {
        console.log('[useAuth] User profile updated successfully:', data);
        setUser(data);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('[useAuth] Unexpected error updating profile:', error);
      return { data: null, error };
    }
  };

  const confirmEmail = async (token: string, type: string = 'signup') => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });

      if (error) throw error;

      // If email is confirmed and we have a session, try to create the user profile
      if (data.user && data.session) {
        // Call fetchUserProfile but don't check its return value since it doesn't return anything
        await fetchUserProfile(data.user.id);
        
        // Instead, check if user is set after the fetchUserProfile call
        if (!user) {
          console.log('Creating user profile after email confirmation');
          // Create profile if it doesn't exist
          await createUserProfile(
            data.user.id,
            data.user.email || '',
            data.user.user_metadata?.full_name || 'User'
          );
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Email confirmation error:', error);
      return { data: null, error };
    }
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    createUserProfile,
    confirmEmail,
  };
};
