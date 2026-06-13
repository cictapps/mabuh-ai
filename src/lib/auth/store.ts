import { create } from "zustand";
import type { Provider, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isMobileApp, isNativeApp, signInWithGoogleNative } from "@/lib/auth/nativeOAuth";
import { deleteUserData } from "@/lib/auth/deleteUserData";

export type Profile = {
  id: string;
  display_name: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>;
  requestPasswordReset: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  signOut: () => Promise<void>;
};

export type SignUpResult = {
  session: Session | null;
  needsEmailConfirmation: boolean;
};

type AuthSnapshot = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
};

let authInitializationPromise: Promise<void> | null = null;
let authListenerBound = false;

function getAuthRedirectUrl(path = "/auth/callback") {
  return `${window.location.origin}${path}`;
}

export function isUserEmailVerified(user: User | null) {
  if (!user?.email) return false;
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("fetchProfile failed", error);
      return null;
    }
    if (data) return data as Profile;
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return null;
}

async function getAuthSnapshot(session: Session | null): Promise<AuthSnapshot> {
  const user = session?.user ?? null;
  const profile = user ? await fetchProfile(user.id) : null;
  return { session, user, profile };
}

async function ensureProfile(snapshot: AuthSnapshot): Promise<AuthSnapshot> {
  if (snapshot.user && !snapshot.profile) {
    console.warn(
      "Profile record not found for the authenticated user. " +
        "The session is still valid, so sign-in will continue. " +
        "If this persists, run supabase/schema.sql to install the on_auth_user_created trigger.",
    );
  }

  return snapshot;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  refresh: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const snapshot = await getAuthSnapshot(data.session);

    if (snapshot.user && !snapshot.profile) {
      console.warn(
        "Profile record not found while refreshing the session. " +
          "Keeping the user signed in. Run supabase/schema.sql if this persists.",
      );
    }

    set({ ...snapshot, loading: false });
  },

  initialize: async () => {
    if (authInitializationPromise) {
      return authInitializationPromise;
    }

    authInitializationPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const snapshot = await getAuthSnapshot(data.session);

        if (snapshot.user && !snapshot.profile) {
          console.warn(
            "Profile record not found during auth init. " +
              "Keeping the user signed in. Run supabase/schema.sql if this persists.",
          );
        }

        set({ ...snapshot, loading: false });

        if (!authListenerBound) {
          authListenerBound = true;
          supabase.auth.onAuthStateChange(async (_event, newSession) => {
            const snapshot = await getAuthSnapshot(newSession);

            if (snapshot.user && !snapshot.profile) {
              console.warn(
                "Profile record not found after auth state change. " +
                  "Keeping the user signed in.",
              );
            }

            set({ ...snapshot, loading: false });
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const snapshot = await ensureProfile(await getAuthSnapshot(data.session));
    set({ ...snapshot, loading: false });
  },

  signUp: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) throw error;

    if (data.session) {
      const snapshot = await ensureProfile(await getAuthSnapshot(data.session));
      set({ ...snapshot, loading: false });
    }

    return {
      session: data.session,
      needsEmailConfirmation: !data.session,
    };
  },

  signInWithGoogle: async (nextPath = "/") => {
    const safeNextPath = nextPath.startsWith("/") ? nextPath : "/";

    if (isMobileApp()) {
      await signInWithGoogleNative(safeNextPath);
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const snapshot = await ensureProfile(await getAuthSnapshot(sessionData.session));
        set({ ...snapshot, loading: false });
      }
      return;
    }

    if (isNativeApp()) {
      throw new Error(
        "Google sign-in is currently supported in the mobile app and web app.",
      );
    }

    const provider: Provider = "google";
    const next = encodeURIComponent(safeNextPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthRedirectUrl(`/auth/callback?next=${next}`),
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  },

  resendConfirmation: async (email) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) throw error;
  },

  updateProfile: async (patch): Promise<Profile> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error("Not signed in.");

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select("id, display_name")
      .single();
    if (error) throw error;

    const profile = (data as Profile) ?? null;
    if (!profile) throw new Error("Profile update returned no row.");
    set({ profile });
    return profile;
  },

  requestPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) throw error;
  },

  changePassword: async (newPassword) => {
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  deleteAccount: async () => {
    const { error } = await supabase.rpc("delete_user");
    if (error) throw error;
    await supabase.auth.signOut().catch(() => {});
    set({ session: null, user: null, profile: null, loading: false });
  },

  deleteAllData: async () => {
    await deleteUserData();
    // The auth account stays; only the user-scoped rows are gone.
    // Clear the cached profile (display_name was reset to null on the server).
    set({ profile: null });
  },

  signOut: async () => {
    // Always clear local state, even if the server call fails.
    await supabase.auth.signOut().catch(() => {});
    set({ session: null, user: null, profile: null, loading: false });
  },
}));

export const useAuth = () => {
  const { session, user, profile, loading } = useAuthStore();
  return {
    session,
    user,
    profile,
    loading,
    isAuthenticated: !!session,
    isEmailVerified: isUserEmailVerified(user),
  };
};

export const useAuthActions = () => {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resendConfirmation = useAuthStore((s) => s.resendConfirmation);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const changePassword = useAuthStore((s) => s.changePassword);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const deleteAllData = useAuthStore((s) => s.deleteAllData);
  const signOut = useAuthStore((s) => s.signOut);

  return {
    signIn,
    signUp,
    signInWithGoogle,
    resendConfirmation,
    updateProfile,
    requestPasswordReset,
    changePassword,
    deleteAccount,
    deleteAllData,
    signOut,
  };
};
