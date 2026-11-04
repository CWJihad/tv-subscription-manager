"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { LogOut, X } from "lucide-react";
import { MORE_ITEMS } from "@/lib/nav";
import type { NavCounts } from "@/lib/nav-counts";
import { NavCountBadge } from "@/components/ui/NavCountBadge";
import { useLogout } from "@/hooks/useLogout";

interface MoreSheetProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
  counts: NavCounts;
}

const rowClass =
  "flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-base-content hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]";

export function MoreSheet({ dialogRef, counts }: MoreSheetProps) {
  const close = () => dialogRef.current?.close();
  const logout = useLogout();

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom"
      aria-labelledby="more-sheet-title"
    >
      <div className="modal-box rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="more-sheet-title"
            className="text-lg font-semibold text-neutral"
          >
            More
          </h2>
          <form method="dialog">
            <button
              className="btn btn-ghost btn-square btn-sm"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        <ul className="flex flex-col gap-1">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className={rowClass}>
                  <Icon className="size-5 text-[#64748B]" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <NavCountBadge
                      count={counts[item.badge.key]}
                      tone={item.badge.tone}
                      srLabel={item.label.toLowerCase()}
                    />
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                close();
                logout();
              }}
              className={`${rowClass} w-full text-left`}
            >
              <LogOut className="size-5 text-[#64748B]" aria-hidden="true" />
              <span className="flex-1">Log out</span>
            </button>
          </li>
        </ul>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  );
}
