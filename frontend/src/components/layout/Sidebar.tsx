"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, NAV_ITEMS } from "@/lib/nav";
import type { NavCounts } from "@/lib/nav-counts";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { UserMenu } from "@/components/layout/UserMenu";

export function Sidebar({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-[#eef2ff] px-4 py-6 md:flex">
      <Link
        href="/dashboard"
        aria-label="Nigertoday TV, go to dashboard"
        className="mb-8 block rounded-[10px] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
      >
        <BrandLogo />
      </Link>

      <nav aria-label="Main" className="flex-1">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <SidebarNavItem
                item={item}
                active={isNavActive(pathname, item.href)}
                count={item.badge ? counts[item.badge.key] : 0}
              />
            </li>
          ))}
        </ul>
      </nav>

      <UserMenu />
    </aside>
  );
}