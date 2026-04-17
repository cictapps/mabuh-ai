import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  role: "user" | "moderator" | "admin";
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let authInitializationPromise: Promise<void> | null = null;
let authListenerBound = false;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("fetchProfile failed", error);
    return null;
  }
  return (data as Profile) ?? null;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    if (authInitializationPromise) {
      return authInitializationPromise;
    }

    authInitializationPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        const user = session?.user ?? null;
        const profile = user ? await fetchProfile(user.id) : null;
        set({ session, user, profile, loading: false });

        if (!authListenerBound) {
          authListenerBound = true;
          supabase.auth.onAuthStateChange(async (_event, newSession) => {
            const newUser = newSession?.user ?? null;
            const newProfile = newUser ? await fetchProfile(newUser.id) : null;
            set({ session: newSession, user: newUser, profile: newProfile, loading: false });
          });
        }
      } catch (error) {
        authInitializationPromise = null;
        set({ session: null, user: null, profile: null, loading: false });
        console.error("auth initialize failed", error);
        throw error;
      }
    })();

    return authInitializationPromise;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, user: null, profile: null });
  },
}));

export const useAuth = () => {
  const { session, user, profile, loading } = useAuthStore();
  return { session, user, profile, loading, isAuthenticated: !!session };
};

export const useAuthActions = () => {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);

  return { signIn, signUp, signOut };
};
