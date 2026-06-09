import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/data/types";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);
const KEY = "haw.role";
const VALID: Role[] = ["owner", "manager", "service_advisor", "technician", "customer"];

function readStoredRole(): Role {
  try {
    const stored = localStorage.getItem(KEY) as Role | null;
    if (stored && VALID.includes(stored)) return stored;
  } catch {
    /* SSR or private browsing */
  }
  return "owner";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readStoredRole);

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
  service_advisor: "/service-advisor",
  technician: "/tech",
  customer: "/portal",
};

export const roleLabel: Record<Role, string> = {
  owner: "Service Manager",
  manager: "Foreman",
  service_advisor: "Service Advisor",
  technician: "Technician",
  customer: "Customer",
};