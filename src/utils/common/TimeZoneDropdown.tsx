/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronsUpDown, Search } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezonePlugin from "dayjs/plugin/timezone";
import CommonInput from "./CommonInput";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface TimeZoneDropdownProps {
  value: string | null;
  onChange: (value: string) => void;
  region?: string;
  utcDate?: string | Date; // Optional: if you want to show formatted date
}

export const TimeZoneDropdown = ({
  value,
  onChange,
  region,
  utcDate,
}: TimeZoneDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // List of all timezones
  const allTimeZones = useMemo(() => {
    const zones =
      typeof (Intl as any).supportedValuesOf === "function"
        ? (Intl as any).supportedValuesOf("timeZone")
        : [];

    return zones.map((tz: string) => {
      try {
        const shortName =
          new Intl.DateTimeFormat("en", {
            timeZone: tz,
            timeZoneName: "short",
          }).formatToParts(new Date())[3]?.value || "";
        return { id: tz, label: tz, shortName };
      } catch {
        return { id: tz, label: tz, shortName: "" };
      }
    });
  }, []);

  const filtered = allTimeZones.filter((tz: any) => {
    const matchesRegion = region ? tz.id.startsWith(`${region}/`) : true;
    const matchesSearch = tz.id.toLowerCase().includes(search.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper: format date in selected timezone
  const formattedDate = utcDate && value
    ? dayjs.utc(utcDate).tz(value).format("DD/MM/YYYY hh:mm:ss A")
    : "";

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full h-11 items-center justify-between rounded-xl border border-BRAND-200 bg-white px-3 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 dark:hover:bg-DARK-600 dark:border-DARK-600 dark:bg-DARK-700 dark:text-DARK-100 text-gray-900 transition-all duration-200"
      >
        <span className="truncate">{value || "Select Time Zone"}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center border-b border-gray-100 px-3 dark:border-gray-800">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommonInput
              // className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-500"
              placeholder="Search city or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No results found.
              </div>
            ) : (
              filtered.map((tz: any) => (
                <div
                  key={tz.id}
                  onClick={() => {
                    onChange(tz.id);
                    setOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-blue-50 dark:hover:bg-gray-800 ${
                    value === tz.id
                      ? "bg-blue-100 font-medium text-blue-700 dark:bg-gray-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{tz.label}</span>
                  <span className="text-xs opacity-50">{tz.shortName}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {formattedDate && (
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Formatted: {formattedDate}
        </div>
      )}
    </div>
  );
};
