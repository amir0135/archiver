import React, { useCallback, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = React.memo(function SearchBar({ value, onChange }: SearchBarProps) {
  // Debounce search input
  const debounceTimeout = useRef<number>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = window.setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        defaultValue={value}
        onChange={handleChange}
        placeholder="Search files by name, type, or content..."
        className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
});