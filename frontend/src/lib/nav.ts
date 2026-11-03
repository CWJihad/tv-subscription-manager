import {
  Clock,
  LayoutGrid,
  Settings,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavCounts } from "@/lib/nav-counts";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: { key: keyof NavCounts; tone: "warning" | "error" };
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/customers", label: "Customers", icon: Users },
  {
    href: "/expiring",
    label: "Expiring",
    icon: Clock,
    badge: { key: "expiring", tone: "warning" },
  },
  {
    href: "/expired",
    label: "Expired",
    icon: TriangleAlert,
    badge: { key: "expired", tone: "error" },
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_TAB_HREFS = ["/dashboard", "/customers", "/expiring"];
const MORE_HREFS = ["/expired", "/settings"];

export const MOBILE_TAB_ITEMS = NAV_ITEMS.filter((i) =>
  MOBILE_TAB_HREFS.includes(i.href),
);
export const MORE_ITEMS = NAV_ITEMS.filter((i) => MORE_HREFS.includes(i.href));

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}