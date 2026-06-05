import { useNavigate } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel, roleLandingRoute, useRole } from "@/app/RoleContext";
import type { Role } from "@/data/types";

const ROLES: Role[] = ["owner", "manager", "service_advisor", "technician", "customer"];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();

  return (
    <Select
      value={role}
      onValueChange={(v) => {
        const next = v as Role;
        setRole(next);
        navigate({ to: roleLandingRoute[next] });
      }}
    >
      <SelectTrigger className="h-8 w-[170px] bg-background/80 text-sm shadow-sm" aria-label="Switch role">
        <span className="text-muted-foreground mr-1">View as</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {roleLabel[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
