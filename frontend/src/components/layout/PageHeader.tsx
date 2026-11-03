import Link from "next/link";
import { Plus } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";

interface PageHeaderSearch {
  value: string;
  onChange: (value: string) => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small text above the title, mobile only (e.g. "Mon, Oct 5"). */
  mobileLabel?: string;
  hideSubtitleOnMobile?: boolean;
  search?: PageHeaderSearch;
  showAddCustomer?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  mobileLabel,
  hideSubtitleOnMobile = false,
  search,
  showAddCustomer = false,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {mobileLabel && (
            <p className="text-xs text-[#64748B] md:hidden">{mobileLabel}</p>
          )}
          <h1 className="text-2xl font-semibold text-neutral md:text-[28px] md:leading-9">
            {title}
          </h1>
          {subtitle && (
            <p
              className={`mt-1 text-sm text-[#64748B] ${hideSubtitleOnMobile ? "hidden md:block" : ""}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {showAddCustomer && (
          <Link
            href="/customers/new"
            aria-label="Add customer"
            className="btn btn-primary btn-square h-11 min-h-11 w-11 rounded-[10px] md:hidden"
          >
            <Plus className="size-5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div
        className={`items-center gap-3 md:justify-end ${search ? "flex" : "hidden md:flex"}`}
      >
        {search && (
          <SearchInput value={search.value} onChange={search.onChange} />
        )}
        {showAddCustomer && (
          <Link
            href="/customers/new"
            className="btn btn-primary hidden h-12 min-h-12 shrink-0 rounded-[10px] px-5 font-semibold md:inline-flex"
          >
            <Plus className="size-[18px]" aria-hidden="true" />
            Add Customer
          </Link>
        )}
      </div>
    </header>
  );
}