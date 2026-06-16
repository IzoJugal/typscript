import { useEffect, useRef, useState } from "react";
import { capitalized } from "../utility";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";


const SelectWithSearch = ({
    items,
    title,
    handleChange,
    setSelectedItem,
    selectedItem,
    fieldKey,
    displayKey = "name",
    searchKey = "name",
    valueKey = "_id",
    disabled = false,
    isLoading = false,
}: any) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const categoryRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const onchangeHandler = (item: any) => {
        setSelectedItem(item?.[displayKey]);
        handleChange(valueKey === 'item' ? item : item?.[valueKey]);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !categoryRef.current?.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative z-auto" ref={categoryRef}>
            <button
                onClick={() => {
                    if (disabled) return;
                    setIsDropdownOpen(!isDropdownOpen);
                    setSearchTerm("");
                }}
                disabled={disabled}
                className={`w-full h-11 border border-BRAND-200 dark:border-DARK-600 bg-white dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-5 text-center flex gap-x-2 justify-between items-center transition-all duration-200 hover:border-BRAND-400 dark:hover:bg-DARK-600 shadow-sm ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                    }`}
                type="button"
            >
                {(typeof selectedItem === 'string' ? capitalized(selectedItem) : selectedItem) || `Select ${title}`}
                {isDropdownOpen ? <FaAngleUp /> : <FaAngleDown />}
            </button>

            {!disabled && isDropdownOpen && (
                <div ref={dropdownRef} className="z-10 bg-white dark:bg-DARK-600 rounded-lg shadow w-full min-w-60 absolute">
                    <div className="p-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <svg className="w-4 h-4 text-DARK-500 dark:text-DARK-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="block w-full p-2 ps-10 text-sm text-DARK-900 dark:text-white border border-DARK-300 dark:border-DARK-400 rounded-lg bg-DARK-50 dark:bg-DARK-500 placeholder-DARK-400 dark:placeholder-DARK-300 focus:ring-BRAND-500 focus:border-BRAND-500"
                                placeholder="Search"
                            />
                        </div>
                    </div>

                    <ul className="max-h-60 h-auto px-4 pb-3 overflow-y-auto text-sm text-DARK-700 dark:text-DARK-200">
                        {isLoading ? (
                            <div className="text-center py-4 text-DARK-500 dark:text-DARK-400">Loading...</div>
                        ) : items?.length > 0 ? (
                            items.filter((item: any) =>
                                item?.[searchKey]?.toLowerCase().includes(searchTerm)
                            ).length > 0 ? (
                                items
                                    .filter((item: any) =>
                                        item?.[searchKey]?.toLowerCase().includes(searchTerm)
                                    )
                                    .map((item: any, index: number) => {
                                        const isSelected = item?.[displayKey] === selectedItem;
                                        return (
                                            <div key={index} onClick={() => { onchangeHandler(item); setIsDropdownOpen(false); }}>
                                                <li>
                                                    <div className={`flex items-center rounded cursor-pointer transition-colors ${isSelected ? "bg-BRAND-200" : "hover:bg-BRAND-500 dark:hover:bg-orange-600"}`}>
                                                        <label className={`w-full py-2 px-2 text-sm font-medium rounded ${isSelected ? "text-BRAND-600 hover:text-white" : "text-slate-900 dark:text-DARK-300 hover:text-white"}`}>
                                                            {typeof item?.[displayKey] === 'string' ? capitalized(item[displayKey]) : item?.[displayKey]}
                                                        </label>
                                                        {isSelected && (
                                                            <RxCross2
                                                                className="text-lg mr-1 text-red-500 hover:text-red-700 shrink-0 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent item click
                                                                    setSelectedItem("");
                                                                    handleChange("");
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </li>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="text-center py-4 text-DARK-500 dark:text-DARK-400">No {fieldKey} data found</div>
                            )
                        ) : (
                            <div className="text-center py-4 text-DARK-500 dark:text-DARK-400">No {fieldKey} data found</div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SelectWithSearch;

