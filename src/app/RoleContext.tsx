import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "@/data/types";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);
const KEY = "haw.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("owner");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as Role | null;
    if (stored === "owner" || stored === "manager" || stored === "technician" || stored === "customer") {
      setRoleState(stored);
    }
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole must be used inside RoleProvider");
  return v;
}

export const roleLandingRoute: Record<Role, string> = {
  owner: "/owner",
  manager: "/manager",
  technician: "/tech",
  customer: "/portal",
};

export const roleLabel: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  technician: "Technician",
  customer: "Customer",
};