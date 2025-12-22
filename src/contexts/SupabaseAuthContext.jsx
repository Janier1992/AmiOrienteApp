
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // If the refresh token is invalid, we must clear the session locally
          // to prevent the app from getting stuck in an error loop.
          if (error.message.includes("Refresh Token Not Found") ||
            error.message.includes("Invalid Refresh Token")) {
            console.warn("Session expired or invalid, clearing local session.");
            await supabase.auth.signOut();
            handleSession(null);
          } else {
            console.warn("Error getting session:", error);
            handleSession(null);
          }
        } else {
          handleSession(data.session);
        }
      } catch (err) {
        console.error("Unexpected error getting session:", err);
        handleSession(null);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          handleSession(session);
        } else if (event === 'SIGNED_IN') {
          handleSession(session);
        } else {
          // For INITIAL_SESSION and any other events
          handleSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  // Helper to translate Auth errors to Spanish
  const getFriendlyErrorMessage = (error) => {
    if (!error) return null;
    const msg = error.message || "";

    // Check for specific error codes or messages from Supabase
    if (error.code === "user_already_exists" || msg.includes("User already registered") || msg.includes("already exists")) {
      return "Este correo electrónico ya está registrado. Por favor, inicia sesión o utiliza otro correo.";
    }
    if (msg.includes("Invalid login credentials") || msg.includes("Invalid email or password")) {
      return "Correo o contraseña incorrectos.";
    }
    if (msg.includes("Password should be")) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (msg.includes("Email not confirmed")) {
      return "Por favor confirma tu correo electrónico antes de continuar.";
    }

    return msg; // Fallback to original message if no translation found
  };

  const signUp = useCallback(async (email, password, options, suppressToast = false) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error && !suppressToast) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: getFriendlyErrorMessage(error),
      });
    }

    return { user: data?.user, session: data?.session, error };
  }, [toast]);

  const signIn = useCallback(async (email, password, suppressToast = false) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error && !suppressToast) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: getFriendlyErrorMessage(error),
      });
    }

    return { user: data?.user, session: data?.session, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      // 1. Clear Global Stores (Crucial for Data Isolation)
      // We import it dynamically to avoid circular dependencies if possible, 
      // or just rely on the module cache.
      // Ideally correct way:
      const { useStoreDashboard } = await import('@/stores/useStoreDashboard');
      useStoreDashboard.getState().reset();

      const { error } = await supabase.auth.signOut();

      // If the user was already deleted or token is invalid (403 user_not_found), 
      // we should consider the logout successful locally and not show an error.
      if (error) {
        const isIgnorableError =
          error.message?.includes('user_not_found') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.status === 403 ||
          error.code === '403';

        if (!isIgnorableError) {
          toast({
            variant: "destructive",
            title: "Error al cerrar sesión",
            description: getFriendlyErrorMessage(error),
          });
        }
      }
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
    } finally {
      // Always force local cleanup
      setUser(null);
      setSession(null);
      setLoading(false);
      navigate('/'); // Redirect to home immediately
    }

    return { error: null };
  }, [toast, navigate]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
