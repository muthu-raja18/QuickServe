"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface SearchableDropdownProps {
  options: Array<{ en: string; ta: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  lang: "en" | "ta";
  disabled?: boolean;
  className?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  lang,
  disabled = false,
  className = "",
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected option display text
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption
    ? lang === "en"
      ? selectedOption.en
      : selectedOption.ta
    : "";

  // Filter options based on search
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredOptions(options);
    } else {
      const query = search.toLowerCase();
      const filtered = options.filter(
        (opt) =>
          opt.en.toLowerCase().includes(query) ||
          opt.ta.includes(query) ||
          opt.value.toLowerCase().includes(query)
      );
      setFilteredOptions(filtered);
    }
  }, [search, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange("");
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:border-blue-500 focus:border-blue-500"
        } ${
          isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"
        }`}
      >
        {value ? (
          <span className="truncate">{displayText}</span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}

        <div className="flex items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "Search services..."
                    : "சேவைகளைத் தேடுங்கள்..."
                }
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-gray-500 text-sm">
                {lang === "en" ? "No services found" : "சேவைகள் கிடைக்கவில்லை"}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors ${
                      value === option.value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="font-medium">
                      {lang === "en" ? option.en : option.ta}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {lang === "en" ? option.ta : option.en}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Option Count */}
          <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
            {filteredOptions.length} {lang === "en" ? "services" : "சேவைகள்"}
          </div>
        </div>
      )}
    </div>
  );
}
