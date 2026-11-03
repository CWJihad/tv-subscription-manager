import Link from "next/link";
import { LogOut } from "lucide-react";
import { OWNER } from "@/lib/owner";

export function UserMenu() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0E7FF] text-sm font-semibold text-[#4338CA]"
      >
        {OWNER.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-black">{OWNER.name}</p>
        <p className="truncate text-xs text-[#94A3B8]">{OWNER.role}</p>
      </div>
      <Link
        href="/login"
        aria-label="Log out"
        className="btn btn-ghost btn-square btn-sm text-[#94A3B8] hover:bg-white/10 hover:text-rose-600"
      >
        <LogOut className="size-[18px]" aria-hidden="true" />
      </Link>
    </div>
  );
}