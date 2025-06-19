import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface FilterOption {
  key: string;
  label: string;
  values: { value: string; label: string }[];
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  placeholder = "Buscar...",
  className = ""
}: SearchFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Filter Controls */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-10 ${hasActiveFilters ? 'border-primary bg-primary/5' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onClearFilters?.();
                        setIsFilterOpen(false);
                      }}
                      className="h-8 px-2 text-xs"
                    >
                      Limpiar todo
                    </Button>
                  )}
                </div>
                <Separator />
                
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {filter.label}
                    </label>
                    <Select
                      value={activeFilters[filter.key] || ""}
                      onValueChange={(value) => onFilterChange?.(filter.key, value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {filter.values.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quick clear button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 px-3"
              title="Limpiar filtros"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find(f => f.key === key);
            const option = filter?.values.find(v => v.value === value);
            if (!option || !filter) return null;

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                <span className="text-xs text-gray-600">{filter.label}:</span>
                {option.label}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-gray-800"
                  onClick={() => onFilterChange?.(key, "")}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}