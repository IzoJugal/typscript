// components/common/CommonFilter.tsx

import React from "react";
import { MdClear } from "react-icons/md";
interface CommonFilterProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    AddButton?: React.ReactNode;
    totalItems?: number;
}

const CommonFilter: React.FC<CommonFilterProps> = ({
    searchValue,
    onSearchChange,
    onClear,
    placeholder = "Search...",
    AddButton,
    totalItems,
}) => {
    const showSearch = totalItems! > 0 || searchValue.trim().length > 0;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">

            {showSearch && (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="w-full sm:w-72">
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="rounded-md focus:!ring-0 w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-none border border-DARK-300 h-[43px]"
                        />
                    </div>

                    {searchValue?.trim() && (
                        <button
                            onClick={onClear}
                            className="inline-flex h-[43px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:!ring-0 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                        >
                            <MdClear className="w-4 h-4 font-bold" />
                            Clear
                        </button>
                    )}
                </div>
            )}

            {AddButton && (
                <div className="flex items-center sm:justify-end sm:ms-auto w-full sm:w-auto">
                    <span className="w-full sm:w-auto">{AddButton}</span>
                </div>
            )}
        </div>
    );
};

export default CommonFilter;