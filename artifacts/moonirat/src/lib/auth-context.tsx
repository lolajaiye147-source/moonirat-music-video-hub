"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signUpWithAuthEmail } from "@/lib/api/auth-email.functions";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: Error | null; session: Session | null; message?: string }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function applySession(nextSession: Session | null) {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsAdmin(false);
      if (nextSession?.user) {
        const admin = await loadAdminStatus(nextSession.user.id);
        if (active) setIsAdmin(admin);
      }
    }

    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) throw error;
        await applySession(data.session);
      })
      .catch((error) => {
        console.error("[Auth] Session initialization failed", error);
        if (active) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session).finally(() => {
        if (active) setIsLoading(false);
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadAdminStatus(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) {
      console.error("[Auth] Admin role lookup failed", error);
      return false;
    }
    return Boolean(data);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, displayName: string) {
    try {
      const result = await signUpWithAuthEmail({ data: { email, password, displayName } });
      return { error: null, session: null, message: result.message };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Account creation failed."),
        session: null,
      };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
