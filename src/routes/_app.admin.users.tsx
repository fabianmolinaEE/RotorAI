import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/AuthContext";
import { roleLandingRoute } from "@/app/RoleContext";
import { listPendingUsers, approvePendingUser } from "@/lib/api/auth.functions";
import type { PendingUser } from "@/lib/api/auth.functions";
import type { Role } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveErrors, setApproveErrors] = useState<Record<string, string>>(
    {},
  );

  // Access control: only owner role may access this page
  useEffect(() => {
    const role = session?.user?.user_metadata?.role as Role | undefined;
    if (role && role !== "owner") {
      void router.navigate({ to: roleLandingRoute[role] });
    }
  }, [session, router]);

  useEffect(() => {
    void (async () => {
      try {
        const users = await listPendingUsers();
        setPendingUsers(users);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const handleApprove = async (userId: string) => {
    const role = selectedRoles[userId];
    if (!role) return;

    setApprovingId(userId);
    setApproveErrors((prev) => ({ ...prev, [userId]: "" }));
    try {
      await approvePendingUser({ data: { userId, role } });
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setApproveErrors((prev) => ({
        ...prev,
        [userId]: "Could not approve this user. Please try again.",
      }));
    } finally {
      setApprovingId(null);
    }
  };

  const roleOptions: { value: Role; label: string }[] = [
    { value: "owner", label: "Service Manager" },
    { value: "manager", label: "Foreman" },
    { value: "service_advisor", label: "Service Advisor" },
    { value: "technician", label: "Technician" },
    { value: "customer", label: "Customer" },
  ];

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve pending accounts and assign roles.
          </p>
        </div>
        {pendingUsers.length > 0 && (
          <Badge variant="secondary">{pendingUsers.length} pending</Badge>
        )}
      </div>

      {/* Pending users list */}
      <div className="mt-6">
        {loadingData ? (
          /* Loading skeletons */
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : pendingUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending accounts.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 rounded-md border bg-card p-4"
              >
                {/* Avatar initials */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-normal">
                  {getInitials(user.email)}
                </div>

                {/* User info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Signed up {formatDate(user.created_at)}
                  </p>
                </div>

                {/* Role selector */}
                <Select
                  value={selectedRoles[user.id] ?? ""}
                  onValueChange={(val) =>
                    setSelectedRoles((prev) => ({
                      ...prev,
                      [user.id]: val as Role,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assign role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Approve button */}
                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={
                      !selectedRoles[user.id] || approvingId === user.id
                    }
                    onClick={() => void handleApprove(user.id)}
                  >
                    Approve
                  </Button>
                  {approveErrors[user.id] && (
                    <p className="text-xs text-destructive">
                      {approveErrors[user.id]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
