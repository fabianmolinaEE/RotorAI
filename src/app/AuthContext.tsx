import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRole } from "@/app/RoleContext";
import type { Role } from "@/data/types";

// Read at module scope — Vite replaces import.meta.env at build time.
// VITE_USE_MOCK=true in .env.local activates mock mode (no Supabase calls).
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" ||
  import.meta.env.VITE_USE_MOCK === "1";

const VALID_ROLES: Role[] = [
  "owner",
  "manager",
  "service_advisor",
  "technician",
  "customer",
];

interface AuthCtxShape {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthCtxShape | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setRole } = useRole();
  const [session, setSession] = useState<Session | null>(null);
  // In mock mode we skip auth entirely — loading is immediately false.
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return; // bypass: no Supabase calls in mock mode

    let unsubscribe: (() => void) | null = null;

    import("@/lib/supabase.browser").then(({ getSupabaseBrowserClient }) => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === "INITIAL_SESSION") {
          // Initialization complete — stop showing loading state
          setLoading(false);
        }
        if (event === "SIGNED_OUT") {
          setSession(null);
        } else if (newSession) {
          setSession(newSession);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Feed role from session into RoleContext when session changes
  useEffect(() => {
    if (USE_MOCK) return;
    const role = session?.user?.user_metadata?.role as Role | undefined;
    if (role && VALID_ROLES.includes(role)) {
      setRole(role);
    }
  }, [session, setRole]);

  const signOut = async () => {
    if (USE_MOCK) return;
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.browser");
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
  };

  return (
    <AuthCtx.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthCtxShape {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
