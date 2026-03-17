import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { reportError } from '../utils/errorUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      reportError('AuthContext signOut', error);
    }

    setSession(null);
    setProfile(null);

    return { error };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === 'admin',
      loading,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut,
    }),
    [session, profile, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
