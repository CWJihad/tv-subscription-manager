import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search name, phone or email",
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative w-full md:w-80 ${className}`}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#94A3B8]"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input h-12 w-full rounded-[10px] border-base-300 bg-base-100 pl-10 pr-10 text-base text-base-content placeholder:text-[#94A3B8] focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-[#6366F1] md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="btn btn-ghost btn-square btn-xs absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}