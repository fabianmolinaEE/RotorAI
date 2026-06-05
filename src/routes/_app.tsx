import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RoleSwitcher } from "@/components/role-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NoteProvider } from "@/components/note-context";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
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
              <RoleSwitcher />
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
