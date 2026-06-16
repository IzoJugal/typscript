import { useState, useRef, useEffect } from "react";
import CommonInput from "./CommonInput";

interface TimeInputProps {
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
}

export const TimeInput = ({
    id,
    name,
    value,
    onChange,
    inputRef,
}: TimeInputProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const hoursContainerRef = useRef<HTMLDivElement>(null);
    const minutesContainerRef = useRef<HTMLDivElement>(null);

    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hours: "", minutes: "" };
        const [h, m] = timeStr.split(":");
        return {
            hours: h || "",
            minutes: m || "",
        };
    };

    const { hours, minutes } = parseTime(value || "");

    const hoursList = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
    );

    const minutesList = Array.from({ length: 60 }, (_, i) =>
        i.toString().padStart(2, "0")
    );

    const createSyntheticEvent = (val: string) => {
        return {
            target: {
                name,
                value: val,
            },
        } as React.ChangeEvent<HTMLInputElement>;
    };

    // Auto-closes when selections are completed from the panel
    const handleTimeSelect = (h: string, m: string) => {
        onChange(createSyntheticEvent(`${h}:${m}`));
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9:]/g, "");

        if (val.length > 5) return;

        const isDeleting = (e.nativeEvent as InputEvent).inputType?.includes("delete");

        if (!val.includes(":")) {
            // --- HOUR INPUT PROCESSING ---
            const num = parseInt(val, 10);

            if (val.length === 1) {
                if (num >= 3 && num <= 9) {
                    val = `0${val}:`;
                }
            } else if (val.length === 2) {
                if (num <= 23) {
                    val = `${val}:`;
                } else {
                    return;
                }
            }
        } else {
            // --- MINUTE INPUT PROCESSING ---
            const [h, m] = val.split(":");

            if (isDeleting && m === "") {
                val = h;
            } else if (m) {
                const minNum = parseInt(m, 10);

                if (m.length === 1) {
                    if (minNum >= 6 && minNum <= 9) {
                        val = `${h}:0${m}`;
                    }
                } else if (m.length === 2) {
                    if (minNum > 59) return;
                }
            }
        }

        onChange(createSyntheticEvent(val));

        // --- CLOSING RULES ---
        // If the length reaches exactly 5 characters (e.g. "14:25"), auto-close suggestions
        if (val.length === 5) {
            setIsOpen(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Auto scroll selected values into view
    useEffect(() => {
        if (!isOpen) return;

        const itemHeight = 40;
        const hourIndex = hoursList.indexOf(hours);
        const minuteIndex = minutesList.indexOf(minutes);

        if (hoursContainerRef.current && hourIndex >= 0) {
            hoursContainerRef.current.scrollTop =
                hourIndex * itemHeight - itemHeight * 2;
        }

        if (minutesContainerRef.current && minuteIndex >= 0) {
            minutesContainerRef.current.scrollTop =
                minuteIndex * itemHeight - itemHeight * 2;
        }
    }, [isOpen, hours, minutes, hoursList, minutesList]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <CommonInput
                    type="text"
                    id={id}
                    name={name}
                    value={value || ""}
                    ref={inputRef}
                    placeholder="HH:MM"
                    onFocus={() => {
                        if (value?.length !== 5) setIsOpen(true);
                    }}
                    onClick={() => setIsOpen(true)} 
                    onChange={handleInputChange}
                    // className="w-full px-3 py-2 pr-10 rounded-md border dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border-DARK-300 time-input-field"
                />

                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-DARK-600 dark:text-DARK-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 bg-white dark:bg-DARK-700 border border-DARK-300 dark:border-DARK-600 rounded-md shadow-lg p-4">
                    <div className="flex gap-4">
                        {/* Hours */}
                        <div className="flex-1">
                            <div className="text-xs font-medium mb-2 dark:text-DARK-200">
                                Hours
                            </div>

                            <div
                                ref={hoursContainerRef}
                                className="h-48 overflow-y-auto border border-DARK-200 dark:border-DARK-600 rounded custom-scrollbar"
                            >
                                {hoursList.map((h) => (
                                    <div
                                        key={h}
                                        onClick={() => handleTimeSelect(h, minutes || "00")}
                                        className={`px-4 py-2 cursor-pointer text-sm transition-colors ${h === hours
                                            ? "bg-blue-500 text-white font-medium border-2 border-black"
                                            : "hover:bg-gray-100 dark:hover:bg-DARK-600 dark:text-DARK-200"
                                            }`}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Minutes */}
                        <div className="flex-1">
                            <div className="text-xs font-medium mb-2 dark:text-DARK-200">
                                Minutes
                            </div>

                            <div
                                ref={minutesContainerRef}
                                className="h-48 overflow-y-auto border border-DARK-200 dark:border-DARK-600 rounded custom-scrollbar"
                            >
                                {minutesList.map((m) => (
                                    <div
                                        key={m}
                                        onClick={() => handleTimeSelect(hours || "00", m)}
                                        className={`px-4 py-2 cursor-pointer text-sm transition-colors ${m === minutes
                                            ? "bg-blue-500 text-white font-medium border-2 border-black"
                                            : "hover:bg-gray-100 dark:hover:bg-DARK-600 dark:text-DARK-200"
                                            }`}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};