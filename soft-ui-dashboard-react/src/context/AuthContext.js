/**
 * Contexto de autenticación — sesión de Supabase Auth + membresía (tenant/rol)
 * del usuario autenticado. Todas las pantallas protegidas del CRM leen de aquí
 * en vez de llamar a supabase.auth directamente.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import PropTypes from "prop-types";

import { supabase } from "lib/supabaseClient";
import { completeSignup } from "lib/api";
import { getPendingTenantName, clearPendingTenantName } from "lib/pendingTenant";

const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  // getSession() y onAuthStateChange pueden disparar casi al mismo tiempo al
  // montar; este ref evita lanzar dos completeSignup en paralelo para el
  // mismo email (la constraint memberships_user_id_unique es el respaldo
  // final, pero esto evita el 500 innecesario en el caso normal).
  const pendingSignupInFlight = useRef(new Set());

  const loadMembership = useCallback(async (userId) => {
    if (!userId) {
      setMembership(null);
      return null;
    }
    const { data, error } = await supabase
      .from("memberships")
      .select("tenant_id, role, tenants ( name, plan, status )")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error al cargar la membresía del usuario:", error.message);
      setMembership(null);
      return null;
    }
    setMembership(data);
    return data;
  }, []);

  // Si el signup quedó pendiente de confirmación de email, termina de crear
  // el tenant (vía backend) en cuanto detecta una sesión real sin membresía.
  const completePendingSignup = useCallback(
    async (currentSession) => {
      const email = currentSession?.user?.email;
      if (!email) return;

      const pendingTenantName = getPendingTenantName(email);
      if (!pendingTenantName) return;

      if (pendingSignupInFlight.current.has(email)) return;
      pendingSignupInFlight.current.add(email);

      try {
        await completeSignup({
          accessToken: currentSession.access_token,
          tenantName: pendingTenantName,
        });
        clearPendingTenantName(email);
        await loadMembership(currentSession.user.id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error al completar el signup pendiente:", error.message);
      } finally {
        pendingSignupInFlight.current.delete(email);
      }
    },
    [loadMembership]
  );

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      const currentMembership = await loadMembership(currentSession?.user?.id);
      if (currentSession && !currentMembership) {
        await completePendingSignup(currentSession);
      }
      if (isMounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentMembership = await loadMembership(newSession?.user?.id);
      if (newSession && !currentMembership) {
        await completePendingSignup(newSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadMembership, completePendingSignup]);

  const signIn = useCallback(
    (email, password) => supabase.auth.signInWithPassword({ email, password }),
    []
  );

  const signUp = useCallback(
    (email, password, options) => supabase.auth.signUp({ email, password, options }),
    []
  );

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      tenantId: membership?.tenant_id ?? null,
      role: membership?.role ?? null,
      tenant: membership?.tenants ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshMembership: () => loadMembership(session?.user?.id),
    }),
    [session, membership, loading, signIn, signUp, signOut, loadMembership]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
