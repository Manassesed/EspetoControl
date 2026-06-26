import type { Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";

import { demoProfile } from "@/constants/demo";
import { loadProfileForUser } from "@/services/profileService";
import { supabase } from "@/services/supabase";
import type { Usuario } from "@/types/database";

type AuthContextValue = {
  session: Session | null;
  profile: Usuario | null;
  profileError: string | null;
  loading: boolean;
  demoMode: boolean;
  startDemo: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const demoModeRef = useRef(false);
  const profileRef = useRef<Usuario | null>(null);
  const busyRef = useRef(false);

  function applyProfile(p: Usuario | null) {
    profileRef.current = p;
    setProfile(p);
  }

  function done() {
    busyRef.current = false;
    setLoading(false);
  }

  async function fetchAndApplyProfile(s: Session) {
    const p = await loadProfileForUser(
      s.user.id,
      s.user.email ?? undefined,
      s.user.user_metadata
    );
    applyProfile(p);
    return p;
  }

  // Guard contra cargas concorrentes. Usado pelo bootstrap e pelos eventos de auth.
  async function loadProfileGuarded(s: Session) {
    if (busyRef.current) return;
    busyRef.current = true;
    setProfileError(null);
    try {
      await fetchAndApplyProfile(s);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : String(e));
      applyProfile(null);
    } finally {
      done();
    }
  }

  async function refreshProfile() {
    setProfileError(null);
    const { data: { session: current } } = await supabase.auth.getSession();
    setSession(current);
    if (!current) {
      applyProfile(null);
      return;
    }
    try {
      await fetchAndApplyProfile(current);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  function startDemo() {
    demoModeRef.current = true;
    setDemoMode(true);
    setSession(null);
    applyProfile(demoProfile);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    // Rede de segurança: nunca deixa a tela presa em "carregando".
    const fallback = setTimeout(() => { if (active) setLoading(false); }, 12000);

    // Bootstrap proativo: lê a sessão persistida FORA de qualquer callback de auth,
    // evitando o deadlock do lock interno do supabase-js no web.
    (async () => {
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (!active || demoModeRef.current) return;
        setSession(current);
        if (current) {
          await loadProfileGuarded(current);
        } else {
          applyProfile(null);
          setLoading(false);
        }
      } catch (e) {
        if (!active) return;
        setProfileError(e instanceof Error ? e.message : String(e));
        applyProfile(null);
        setLoading(false);
      } finally {
        if (active) clearTimeout(fallback);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (demoModeRef.current) return;

      if (!nextSession) {
        applyProfile(null);
        setLoading(false);
        return;
      }

      // INITIAL_SESSION já é tratado pelo bootstrap acima.
      if (event === "INITIAL_SESSION") return;

      // TOKEN_REFRESHED: só recarrega se o perfil estiver faltando.
      if (event === "TOKEN_REFRESHED" && profileRef.current !== null) return;

      // Adia a chamada ao Supabase para sair do lock do callback (evita deadlock no web).
      setTimeout(() => {
        if (active) loadProfileGuarded(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, profile, profileError, loading, demoMode, startDemo, refreshProfile }),
    [session, profile, profileError, loading, demoMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return value;
}
