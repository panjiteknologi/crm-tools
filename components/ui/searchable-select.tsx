"use client";

import * as React from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: string[] | SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const SearchableSelect = React.memo(({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  emptyText = "Tidak ada data",
  className,
  disabled = false,
  required = false,
}: SearchableSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Convert options to uniform format
  const normalizedOptions = React.useMemo(() => {
    if (options.length === 0) return [];

    // Check if first item is an object with value and label
    if (typeof options[0] === 'object' && 'value' in options[0]) {
      return options as SearchableSelectOption[];
    }

    // Convert string array to option objects
    return (options as string[]).map(opt => ({
      value: opt,
      label: opt,
    }));
  }, [options]);

  // Find current label
  const currentLabel = React.useMemo(() => {
    if (!value) return "";
    const option = normalizedOptions.find(opt => opt.value === value);
    return option?.label || value;
  }, [value, normalizedOptions]);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return normalizedOptions;

    const searchLower = searchValue.toLowerCase();
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(searchLower) ||
      opt.value.toLowerCase().includes(searchLower)
    );
  }, [normalizedOptions, searchValue]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setOpen(!open);
      if (!open) {
        // Focus input after a short delay to ensure dropdown is rendered
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchValue("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        className={cn(
          "w-full justify-between text-left font-normal h-9 text-sm bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
          !value && "text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50 bg-slate-100 dark:bg-slate-900",
          open && "ring-2 ring-slate-200 dark:ring-slate-700",
          className
        )}
        disabled={disabled}
      >
        <span className="truncate">{currentLabel || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && !disabled && !required && (
            <X
              className="h-3 w-3 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </Button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 min-w-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{ minWidth: '300px', width: 'auto' }}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500 mr-2 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Cari..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400 min-w-0"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-2",
                      isSelected && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 min-w-0 whitespace-normal break-words">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };
