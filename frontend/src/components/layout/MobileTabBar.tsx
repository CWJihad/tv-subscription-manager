"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { isNavActive, MOBILE_TAB_ITEMS, MORE_ITEMS } from "@/lib/nav";
import type { NavCounts } from "@/lib/nav-counts";
import { NavCountBadge } from "@/components/ui/NavCountBadge";
import { MoreSheet } from "@/components/layout/MoreSheet";

const tabClass =
  "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#6366F1]";

export function MobileTabBar({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const moreActive = MORE_ITEMS.some((i) => isNavActive(pathname, i.href));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-base-300 bg-base-100 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-4">
          {MOBILE_TAB_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${tabClass} ${active ? "text-primary" : "text-[#64748B]"}`}
                >
                  <span className="relative">
                    <Icon className="size-5" aria-hidden="true" />
                    {item.badge && (
                      <NavCountBadge
                        count={counts[item.badge.key]}
                        tone={item.badge.tone}
                        srLabel={item.label.toLowerCase()}
                        className="absolute -right-3.5 -top-2"
                      />
                    )}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => sheetRef.current?.showModal()}
              className={`${tabClass} ${moreActive ? "text-primary" : "text-[#64748B]"}`}
            >
              <span className="relative">
                <Ellipsis className="size-5" aria-hidden="true" />
                {counts.expired > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 size-2 rounded-full bg-error"
                  />
                )}
              </span>
              More
              {counts.expired > 0 && (
                <span className="sr-only">
                  , {counts.expired} expired
                </span>
              )}
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet dialogRef={sheetRef} counts={counts} />
    </>
  );
}