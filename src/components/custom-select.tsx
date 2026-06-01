"use client";

import { ChevronDown, Search } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export type CustomSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type CustomSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  showSearch?: boolean;
};

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  error,
  required = false,
  showSearch = false,
}: CustomSelectProps) {
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) {
      return options;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, searchQuery, showSearch]);

  useEffect(() => {
    if (isOpen && showSearch) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, showSearch]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    setHoveredIndex(-1);
  }

  function selectOption(optionValue: string) {
    onChange(optionValue);
    closeMenu();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "Enter":
      case " ": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(Math.max(0, options.findIndex((option) => option.value === value)));
          return;
        }

        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          selectOption(filteredOptions[highlightedIndex].value);
        }
        break;
      }
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          closeMenu();
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
          return;
        }
        setHighlightedIndex((current) =>
          current < filteredOptions.length - 1 ? current + 1 : current,
        );
        break;
      case "ArrowUp":
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex((current) => (current > 0 ? current - 1 : 0));
        }
        break;
      case "Tab":
        if (isOpen) {
          closeMenu();
        }
        break;
    }
  }

  return (
    <div className="grid w-full gap-2 text-sm font-medium text-slate-700" ref={containerRef}>
      <span id={labelId}>
        {label}
        {required ? <span className="ml-1 text-[#d4183d]">*</span> : null}
      </span>
      <select
        aria-label={label}
        className="sr-only"
        disabled={disabled}
        tabIndex={-1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="relative">
        <button
          aria-controls={isOpen ? `${labelId}-menu` : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`${label} dropdown`}
          className={[
            "flex min-h-[54px] w-full items-center justify-between rounded-[14px] border bg-white px-5 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-150",
            disabled
              ? "cursor-not-allowed border-[#dce4ee] bg-[#f3f3f5] opacity-55"
              : "cursor-pointer",
            error
              ? "border-[#d4183d] focus:border-[#d4183d]"
              : isOpen
                ? "border-[#1d73ff] shadow-[0_0_0_5px_rgba(191,219,254,0.78),0_2px_8px_rgba(15,23,42,0.08)]"
                : "border-[#dce4ee] hover:border-[#b4c5d8] focus:border-[#1d73ff] focus:shadow-[0_0_0_5px_rgba(191,219,254,0.65)]",
          ].join(" ")}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((current) => !current);
              setHighlightedIndex(
                Math.max(0, options.findIndex((option) => option.value === value)),
              );
            }
          }}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <span
            className={[
              "min-w-0 truncate text-[15px] font-semibold leading-6",
              selectedOption ? "text-[#020617]" : "text-slate-400",
            ].join(" ")}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={[
              "ml-4 h-4 w-4 flex-shrink-0 text-[#020617] transition-transform duration-200",
              isOpen ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {isOpen ? (
          <div
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-[#e4e8ee] bg-white shadow-[0_18px_34px_rgba(15,23,42,0.14)]"
            id={`${labelId}-menu`}
            role="listbox"
          >
            {showSearch ? (
              <div className="border-b border-[#e4e8ee] bg-[#f8f9fa] p-3">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
                  />
                  <input
                    className="h-10 w-full rounded-lg border border-[#dce4ee] bg-white pl-9 pr-3 text-[14px] font-medium text-[#020617] outline-none transition focus:border-[#1d73ff]"
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        closeMenu();
                      }
                    }}
                    placeholder="Search options..."
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                  />
                </div>
              </div>
            ) : null}

            <div
              className={filteredOptions.length > 8 ? "max-h-[360px] overflow-y-auto" : ""}
              style={{
                scrollbarColor: "#8a8f98 #d4d9e1",
                scrollbarWidth: "thin",
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-5 py-4 text-sm font-medium text-[#64748b]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted =
                    index === highlightedIndex || index === hoveredIndex;

                  return (
                    <button
                      aria-selected={isSelected}
                      className={[
                        "w-full border-none px-5 py-3 text-left transition-colors duration-100",
                        isSelected
                          ? "bg-[#e8f2ff] text-[#020617]"
                          : isHighlighted
                            ? "bg-[#f5f8fb] text-[#020617]"
                            : "bg-white text-[#020617]",
                      ].join(" ")}
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(-1)}
                      role="option"
                      type="button"
                    >
                      <span className="block truncate text-[15px] font-semibold leading-5">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="mt-1 block text-[12px] font-normal leading-4 text-[#64748b]">
                          {option.description}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs font-medium text-[#d4183d]">{error}</span> : null}
    </div>
  );
}
