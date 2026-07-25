import { Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCountries, type Country } from "@/hooks/use-countries";
import { queryClient } from "@/lib/queryClient";

interface CountrySwitcherProps {
  /** Currently active countryId. Pass null to mean "All countries" */
  activeCountryId: string | null;
  onSelect: (countryId: string | null) => void;
  className?: string;
}

/**
 * Dropdown for System Administrators to switch between country tenants.
 * Rendered only when the user has isSuperAdmin / "System Administrator" role.
 */
export function CountrySwitcher({
  activeCountryId,
  onSelect,
  className,
}: CountrySwitcherProps) {
  const { data: countries = [], isLoading } = useCountries();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = countries.find((c) => c.countryId === activeCountryId) ?? null;

  function handleSelect(countryId: string | null) {
    onSelect(countryId);
    setOpen(false);
    // Invalidate data queries so views refresh for new country scope
    queryClient.invalidateQueries({ queryKey: ["/api"] });
  }

  if (isLoading || countries.length === 0) return null;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
          "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
          "transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-white/30"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        id="country-switcher-trigger"
      >
        <span className="text-lg leading-none" aria-hidden>
          {active?.flagEmoji ?? "🌐"}
        </span>
        <span className="flex-1 truncate text-left text-sidebar-foreground font-medium text-xs">
          {active?.name ?? "All Countries"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-labelledby="country-switcher-trigger"
          className={cn(
            "absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md",
            "border border-white/10 bg-sidebar shadow-xl shadow-black/30",
            "animate-in fade-in-0 slide-in-from-top-2 duration-150"
          )}
        >
          {/* All Countries option (super-admin wide view) */}
          <CountryOption
            flagEmoji="🌐"
            name="All Countries"
            isActive={activeCountryId === null}
            onSelect={() => handleSelect(null)}
          />
          <div className="my-1 border-t border-white/10" />
          {countries.filter((c) => c.isActive).map((country) => (
            <CountryOption
              key={country.countryId}
              flagEmoji={country.flagEmoji ?? "🏳"}
              name={country.name}
              code={country.countryCode}
              isActive={country.countryId === activeCountryId}
              onSelect={() => handleSelect(country.countryId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CountryOption({
  flagEmoji,
  name,
  code,
  isActive,
  onSelect,
}: {
  flagEmoji: string;
  name: string;
  code?: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className="text-base leading-none">{flagEmoji}</span>
      <span className="flex-1 truncate text-left font-medium text-xs">{name}</span>
      {code && (
        <span className="text-[10px] uppercase tracking-widest text-white/30">{code}</span>
      )}
      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-white/70" />}
    </button>
  );
}
