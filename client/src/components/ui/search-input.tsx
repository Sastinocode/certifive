import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = "Buscar…",
  value,
  onChange,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full pl-9 pr-3",
          "rounded-xl border-0 bg-muted/40",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "outline-none ring-1 ring-transparent",
          "transition-colors duration-100",
          "focus:bg-card focus:ring-primary/30",
        )}
      />
    </div>
  );
}
