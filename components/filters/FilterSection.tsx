import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all cursor-pointer"
      >
        <span className="font-medium text-sm text-purple-900">{title}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-purple-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-purple-600" />
        )}
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3 border-t border-purple-200 bg-gradient-to-b from-white to-purple-50/30">
          {children}
        </div>
      )}
    </div>
  );
}
