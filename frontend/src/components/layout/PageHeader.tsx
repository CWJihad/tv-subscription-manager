import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/cn";

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
             <p className={cn("mt-1 text-sm leading-[22px] text-neutral-500", hideSubtitleOnMobile && "hidden md:block")}>
              {subtitle}
            </p>
          )}
        </div>
        {showAddCustomer && (
          <ButtonLink href="/customers/new" iconOnly aria-label="Add customer" className="md:hidden">
            <Plus className="size-5" aria-hidden="true" />
          </ButtonLink>
        )}
      </div>

      <div className={cn("items-center gap-3 md:justify-end", search ? "flex" : "hidden md:flex")}>
        {search && (
          <SearchInput value={search.value} onChange={search.onChange} />
        )}
        {showAddCustomer && (
          <ButtonLink
            href="/customers/new"
            size="lg"
            leftIcon={<Plus className="size-[18px]" aria-hidden="true" />}
            className="hidden shrink-0 md:inline-flex"
          >
            Add Customer
          </ButtonLink>
        )}
      </div>
    </header>
  );
}