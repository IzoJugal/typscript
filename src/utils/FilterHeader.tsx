import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "./common/SearchInput";

interface FilterHeaderProps {
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    searchValue: string;
    setSearchValue: (value: string) => void;
    placeholder?: string;
    children?: React.ReactNode;
    actionButton?: React.ReactNode;
    actionDropdown?: React.ReactNode;
    hideFilters?: boolean; // New optional property
}

const FilterHeader = ({
    showFilters,
    setShowFilters,
    searchValue,
    setSearchValue,
    placeholder = "Search ...",
    children,
    actionButton, 
    actionDropdown,
    hideFilters = false, // Defaults to showing them
}: FilterHeaderProps) => {
    return (
        <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                
                {/* Only render filter button and search if NOT hidden */}
                {!hideFilters && (
                    <>
                        <button
                            className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FaFilter className="text-sm" />
                            Filters

                            {showFilters ? (
                                <FaAngleUp className="transition-transform duration-300 h-4 w-4" />
                            ) : (
                                <FaAngleDown className="transition-transform duration-300 h-4 w-4" />
                            )}
                        </button>

                        {!showFilters && (
                            <SearchInput
                                value={searchValue}
                                onChange={setSearchValue}
                                placeholder={placeholder}
                                className="h-[42px] self-center w-full sm:w-auto"
                            />
                        )}
                    </>
                )}

                {/* This block handles layout pushing actions to the right side */}
                {(actionButton || actionDropdown) && (
                    <div className="sm:ml-auto w-full sm:w-auto flex flex-row items-center gap-3 justify-start sm:justify-end">
                        {actionDropdown}
                        {actionButton}
                    </div>
                )}
            </div>

            {/* Dropdown element section */}
            {!hideFilters && (
                <div
                    className={`transition-all duration-500 ease-in-out ${
                        showFilters
                            ? "max-h-screen opacity-100 mt-3"
                            : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterHeader;