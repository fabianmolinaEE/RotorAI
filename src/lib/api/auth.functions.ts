import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/config.server";

// Admin server functions for user approval.
// The service-role key is read from Workers env INSIDE handler bodies — never at module scope.
// These functions are called from /_app/admin/users and app-sidebar (pending count).
// Security: the service-role key never reaches the client bundle — createServerFn
// handler bodies are server-only (tree-shaken from client).

export interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

const roleSchema = z.enum([
  "owner",
  "manager",
  "service_advisor",
  "technician",
  "customer",
]);

/**
 * Returns all users with user_metadata.status === 'pending'.
 * Called by admin users page and sidebar badge.
 * Pagination: defaults to 50 users (sufficient for demo; document limit).
 */
export const listPendingUsers = createServerFn({ method: "GET" }).handler(
  async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const cfg = getSupabaseConfig();
    const admin = createClient(cfg.url, cfg.serviceRoleKey);
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) throw error;
    const pending: PendingUser[] = data.users
      .filter((u) => u.user_metadata?.status === "pending")
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
      }));
    return pending;
  }
);

/**
 * Approves a pending user and assigns their role.
 * Sets user_metadata.status='approved' and user_metadata.role=<role>.
 * Only callable server-side; service-role key never reaches browser.
 */
export const approvePendingUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      role: roleSchema,
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const cfg = getSupabaseConfig();
    const admin = createClient(cfg.url, cfg.serviceRoleKey);
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      user_metadata: { status: "approved", role: data.role },
    });
    if (error) throw error;
  });
