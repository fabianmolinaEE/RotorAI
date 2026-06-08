import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/pending")({
  component: PendingPage,
});

function PendingPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.browser");
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut({ scope: "local" });
    await router.navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground" />

        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Account pending approval
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has been created. The shop owner will review and approve
          your access. You&apos;ll be notified when your account is ready.
        </p>

        <button
          onClick={handleSignOut}
          className="mt-6 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
