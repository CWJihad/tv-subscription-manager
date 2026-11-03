import Link from "next/link";
import { LogOut } from "lucide-react";
import { OWNER } from "@/lib/owner";
import {Avatar} from '@/components/ui/Avatar'

export function UserMenu() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
      <Avatar name={OWNER.name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-[22px] text-black">{OWNER.name}</p>
        <p className="truncate text-xs leading-[18px] text-neutral-400">{OWNER.role}</p>
      </div>
      <Link
        href="/login"
        aria-label="Log out"
        className="btn btn-ghost btn-square btn-sm text-neutral-400 hover:bg-white/10 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <LogOut className="size-[18px]" aria-hidden="true" />
      </Link>
    </div>
  );
}