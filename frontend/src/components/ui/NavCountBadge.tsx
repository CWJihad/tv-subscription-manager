interface NavCountBadgeProps {
  count: number;
  tone: "warning" | "error";
  srLabel: string;
  className?: string;
}

export function NavCountBadge({
  count,
  tone,
  srLabel,
  className = "",
}: NavCountBadgeProps) {
  if (count <= 0) return null;
  const toneClass = tone === "warning" ? "bg-warning" : "bg-error";
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white ${toneClass} ${className}`}
    >
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">
        {count} {srLabel}
      </span>
    </span>
  );
}