import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/app/RoleContext";
import { navByRole } from "@/app/roleNav";
import { cn } from "@/lib/utils";
import { listPendingUsers } from "@/lib/api/auth.functions";

export function AppSidebar() {
  const { role } = useRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = navByRole[role];
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending user count for sidebar badge — owner role only
  useEffect(() => {
    if (role !== "owner") return;
    void listPendingUsers().then((users) => setPendingCount(users.length));
  }, [role]);

  const accentClasses = [
    "text-sky-600 bg-sky-500/12 dark:text-sky-300 dark:bg-sky-400/12",
    "text-blue-600 bg-blue-500/12 dark:text-blue-300 dark:bg-blue-400/12",
    "text-cyan-600 bg-cyan-500/12 dark:text-cyan-300 dark:bg-cyan-400/12",
    "text-sky-700 bg-sky-600/14 dark:text-sky-200 dark:bg-sky-300/12",
    "text-blue-700 bg-blue-600/14 dark:text-blue-200 dark:bg-blue-300/12",
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b bg-sidebar/70">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary shadow-sm shadow-primary/20">
            <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground/90" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                Hialeah
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Auto Works
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) => {
                const active =
                  item.url === pathname ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={`${item.title}-${item.url}`}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={item.url}
                        className="group flex items-center gap-2"
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                              : accentClasses[index % accentClasses.length],
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                        {/* Pending badge — only for Users item when expanded and count > 0 */}
                        {!collapsed &&
                          item.title === "Users" &&
                          pendingCount > 0 && (
                            <span
                              className="ml-auto h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-normal tabular-nums text-primary-foreground"
                              aria-label={`${pendingCount} pending approvals`}
                            >
                              {pendingCount}
                            </span>
                          )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
