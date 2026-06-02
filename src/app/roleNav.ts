import {
  LayoutDashboard,
  Wrench,
  Car,
  Users,
  Package,
  Receipt,
  ClipboardList,
  CalendarClock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/data/types";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const ownerNav: NavItem[] = [
  { title: "Overview", url: "/owner", icon: LayoutDashboard },
  { title: "Work orders", url: "/work-orders", icon: Wrench },
  { title: "Vehicles", url: "/vehicles", icon: Car },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Invoices", url: "/invoices", icon: Receipt },
];

const managerNav: NavItem[] = [
  { title: "Today", url: "/manager", icon: LayoutDashboard },
  { title: "Work orders", url: "/work-orders", icon: Wrench },
  { title: "Vehicles", url: "/vehicles", icon: Car },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Invoices", url: "/invoices", icon: Receipt },
];

const techNav: NavItem[] = [
  { title: "My bay", url: "/tech", icon: LayoutDashboard },
  { title: "Work orders", url: "/work-orders", icon: Wrench },
  { title: "Schedule", url: "/tech", icon: CalendarClock },
];

const customerNav: NavItem[] = [
  { title: "My garage", url: "/portal", icon: Car },
  { title: "Service history", url: "/portal", icon: ClipboardList },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Recommendations", url: "/portal", icon: Sparkles },
];

export const navByRole: Record<Role, NavItem[]> = {
  owner: ownerNav,
  manager: managerNav,
  technician: techNav,
  customer: customerNav,
};