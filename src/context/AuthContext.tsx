import type { Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";

import { demoProfile } from "@/constants/demo";
import { getCurrentUserProfile } from "@/services/profileService";
import { supabase } from "@/services/supabase";
import type { Usuario } from "@/types/database";

type AuthContextValue = {
  session: Session | null;
  profile: Usuario | null;
  loading: boolean;
  demoMode: boolean;
  startDemo: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const demoModeRef = useRef(false);

  async function refreshProfile() {
    const nextProfile = await getCurrentUserProfile();
    setProfile(nextProfile);
  }

  function startDemo() {
    demoModeRef.current = true;
    setDemoMode(true);
    setSession(null);
    setProfile(demoProfile);
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) {
          await refreshProfile();
        }
      })
      .catch(() => {
        setSession(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession);
        if (nextSession) {
          demoModeRef.current = false;
          setDemoMode(false);
          await refreshProfile();
        } else {
          setProfile((currentProfile) => (demoModeRef.current ? currentProfile : null));
        }
      } finally {
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, demoMode, startDemo, refreshProfile }),
    [session, profile, loading, demoMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return value;
}
