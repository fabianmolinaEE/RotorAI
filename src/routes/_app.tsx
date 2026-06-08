import { useEffect, useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RoleSwitcher } from "@/components/role-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NoteProvider } from "@/components/note-context";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/AuthContext";

// Read at module scope — Vite replaces import.meta.env at build time.
// VITE_USE_MOCK=true in .env.local activates mock mode (no auth guard).
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" ||
  import.meta.env.VITE_USE_MOCK === "1";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const router = useRouter();
  const { session, user, loading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Auth guard: runs on client after INITIAL_SESSION fires.
  // On Cloudflare Workers, localStorage (Supabase session) is unavailable during SSR —
  // we rely on the client-side check once loading=false (INITIAL_SESSION resolved).
  useEffect(() => {
    if (USE_MOCK) return; // mock mode: no auth required
    if (loading) return; // wait for INITIAL_SESSION

    if (!session) {
      // No session — redirect to login
      void router.navigate({ to: "/login" });
      return;
    }

    const status = session.user?.user_metadata?.status as string | undefined;
    if (status === "pending") {
      // Approved not yet — redirect to pending waiting screen
      void router.navigate({ to: "/pending" });
    }
  }, [session, loading, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    await router.navigate({ to: "/login" });
    setIsSigningOut(false);
  };

  // While auth initializes (INITIAL_SESSION not yet fired), show a loading screen.
  // This prevents the auth-flash where app shell briefly renders before redirect.
  if (!USE_MOCK && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // If no session and not loading (guard effect will navigate) — render nothing
  // to avoid a flash of the app shell while navigation is in-flight.
  if (!USE_MOCK && !loading && !session) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="app-shell-bg flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-card/82 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/72">
            <SidebarTrigger className="border border-border/70 bg-background/70 shadow-sm hover:bg-accent" />
            <div className="ml-1 text-sm font-semibold tracking-tight">
              Hialeah Auto Works
            </div>
            <div className="ml-auto flex items-center gap-2">
              {USE_MOCK ? (
                /* Mock mode: keep role switcher unchanged (D-01, D-05) */
                <RoleSwitcher />
              ) : (
                /* Production mode: user name + logout chip (D-06) */
                <div className="flex items-center gap-2">
                  <span className="max-w-[20ch] truncate text-sm font-semibold">
                    {user?.user_metadata?.name ?? user?.email ?? ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              )}
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1">
            <NoteProvider>
              <Outlet />
            </NoteProvider>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
