import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Headset,
  Wrench,
  Car,
  ArrowRight,
} from "lucide-react";
import { useRole, roleLandingRoute } from "@/app/RoleContext";
import type { Role } from "@/data/types";

export const Route = createFileRoute("/demo")({
  component: DemoRolePicker,
});

interface RoleCard {
  role: Role;
  label: string;
  tagline: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const ROLES: RoleCard[] = [
  {
    role: "owner",
    label: "Shop Owner",
    tagline: "Revenue · KPIs · Team",
    description:
      "See the full business at a glance — open tickets, weekly revenue, tech utilization, and pending approvals.",
    Icon: LayoutDashboard,
    accent: "from-violet-500/20 to-violet-500/5 border-violet-500/30 hover:border-violet-400/60",
  },
  {
    role: "manager",
    label: "Foreman",
    tagline: "Bay board · Dispatch · Queue",
    description:
      "Manage the shop floor — assign work orders to technicians, track bay status, and keep jobs moving.",
    Icon: ClipboardList,
    accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30 hover:border-sky-400/60",
  },
  {
    role: "service_advisor",
    label: "Service Advisor",
    tagline: "Quotes · Customer comm · Approvals",
    description:
      "Handle the customer-facing side — write estimates, get approvals, and keep customers informed.",
    Icon: Headset,
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-400/60",
  },
  {
    role: "technician",
    label: "Technician",
    tagline: "My bay · Tickets · Subsystem viewer",
    description:
      "Work your queue — open a ticket, inspect the 3D subsystem breakdown, and log time against each job.",
    Icon: Wrench,
    accent: "from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-400/60",
  },
  {
    role: "customer",
    label: "Customer",
    tagline: "My vehicles · Status · Invoices",
    description:
      "See what the customer sees — vehicle history, live repair status, and invoice approvals.",
    Icon: Car,
    accent: "from-pink-500/20 to-pink-500/5 border-pink-500/30 hover:border-pink-400/60",
  },
];

function DemoRolePicker() {
  const { setRole } = useRole();
  const navigate = useNavigate();

  function pick(role: Role) {
    setRole(role);
    void navigate({ to: roleLandingRoute[role] });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          RotorAI Demo
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Who are you today?
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Pick a role to explore that perspective of the shop.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map(({ role, label, tagline, description, Icon, accent }) => (
          <button
            key={role}
            onClick={() => pick(role)}
            className={`group relative flex flex-col gap-3 rounded-xl border bg-gradient-to-b p-6 text-left transition-all duration-150 ${accent} cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/60">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{tagline}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
              Enter as {label} <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        You can switch roles anytime from the header.
      </p>
    </div>
  );
}
