import Link from "next/link";
import type { NavItem } from "@/lib/nav";
import { NavCountBadge } from "@/components/ui/NavCountBadge";

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  count: number;
}

export function SidebarNavItem({ item, active, count }: SidebarNavItemProps) {
  const Icon = item.icon;
  const stateClass = active
    ? "bg-primary text-primary-content"
    : "text-[#94A3B8] hover:bg-[#e0e7ff] hover:text-[#6366f1]";

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] ${stateClass}`}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <NavCountBadge
          count={count}
          tone={item.badge.tone}
          srLabel={item.label.toLowerCase()}
        />
      )}
    </Link>
  );
}