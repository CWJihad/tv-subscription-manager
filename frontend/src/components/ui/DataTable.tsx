import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  srOnlyHeader?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  ariaLabel: string;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => ReactNode;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns, rows, getRowKey, ariaLabel, onRowClick, renderMobileCard,
  loading = false, loadingRows = 5, emptyState, className,
}: DataTableProps<T>) {
  const cardClasses = "overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0";

  if (!loading && rows.length === 0 && emptyState) {
    return <div className={cn(cardClasses, className)}>{emptyState}</div>;
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className={className}>
      <div className={cn(cardClasses, renderMobileCard ? "hidden md:block" : "block")}>
        <div className="overflow-x-auto">
          <table className="table" aria-label={ariaLabel} aria-busy={loading || undefined}>
            <thead>
              <tr className="bg-neutral-100">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-6 py-3 text-left text-xs font-semibold uppercase leading-[18px] tracking-wider text-neutral-500",
                      col.headerClassName,
                    )}
                  >
                    {col.srOnlyHeader ? <span className="sr-only">{col.header}</span> : col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: loadingRows }, (_, i) => (
                    <tr key={`sk-${i}`} className="h-16 border-t border-neutral-200">
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-3">
                          <div className="skeleton h-4 w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={getRowKey(row)}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={onRowClick ? (e) => handleKeyDown(e, row) : undefined}
                      className={cn(
                        "h-16 border-t border-neutral-200 transition-colors hover:bg-neutral-25",
                        onRowClick &&
                          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
                      )}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={cn("px-6 py-3 align-middle text-sm leading-[22px] text-neutral-700", col.className)}>
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {renderMobileCard && (
        <ul className="flex flex-col gap-3 md:hidden" aria-label={ariaLabel}>
          {loading
            ? Array.from({ length: Math.min(loadingRows, 4) }, (_, i) => (
                <li key={`msk-${i}`} className="rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                  <div className="skeleton h-10 w-full" />
                </li>
              ))
            : rows.map((row) => (
                <li
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("rounded-2xl border border-neutral-200 bg-neutral-0 p-4", onRowClick && "cursor-pointer")}
                >
                  {renderMobileCard(row)}
                </li>
              ))}
        </ul>
      )}
    </div>
  );
}