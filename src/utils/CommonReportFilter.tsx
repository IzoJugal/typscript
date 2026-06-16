import { FaAngleDown, FaAngleUp, FaArrowDown, FaFilter, FaSearch } from "react-icons/fa";
import { MdClear } from "react-icons/md";
import { Button } from "flowbite-react";
import { DropdownWithSearch } from "./common/Filters";
import NewDateRangePicker from "./common/NewDateRangePicker";

interface CommonReportFilterProps {
    showFilters: boolean;
    setShowFilters: (value: boolean) => void;

    // search
    keys?: string;
    setKeys?: (value: string) => void;

    searchValue?: string;
    setSearchValue?: (value: string) => void;

    options?: {
        label: string;
        value: string;
    }[];

    onSearch?: () => void;
    onClear: () => void;

    // business
    loginRole: string;
    SUPER_ADMIN: string;
    MANAGER_ROLES: string[];

    company?: string | null;
    setCompany?: (value: string) => void;
    companyDetails?: any[];

    restaurant?: string | null;
    restaurantDetails?: any[];

    handleBusiness?: (value: string) => void;
    handleRestaurant?: (value: string) => void;

    dateFilter?: boolean;
    dateValue?: any;
    onDateChange?: (value: any) => void;

    children?: React.ReactNode;

    isDropdownOpen?: boolean;
    setIsDropdownOpen?: (value: boolean) => void;

    showClear?: boolean;

    // export
    appWebView?: boolean;
    exportToExcel?: () => void;
    btnLoader?: boolean;
}

const CommonReportFilter = ({
    showFilters,
    setShowFilters,

    keys,
    setKeys,

    searchValue,
    setSearchValue,

    options,

    onSearch,
    onClear,

    loginRole,
    SUPER_ADMIN,
    MANAGER_ROLES,

    company,
    companyDetails = [],

    restaurant,
    restaurantDetails = [],

    handleBusiness,
    handleRestaurant,

    dateFilter,
    dateValue,
    onDateChange,
    children,

    isDropdownOpen,
    setIsDropdownOpen,

    showClear,

    appWebView,
    exportToExcel,
    btnLoader,
}: CommonReportFilterProps) => {
    return (
        <div>
            <div className="flex justify-between gap-4">
                <button
                    className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white"
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

                {!appWebView && exportToExcel && (
                    <Button
                        onClick={exportToExcel}
                        className="!bg-BRAND-500 hover:!bg-BRAND-600 flex gap-2 items-center justify-center text-white rounded-md h-10 whitespace-nowrap"
                    >
                        {btnLoader ? (
                            <span>Exporting...</span>
                        ) : (
                            <>
                                <span className="flex justify-center items-center mr-1">
                                    <FaArrowDown />
                                </span>
                                Export Excel
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div
                className={`transition-all duration-500 ease-in-out ${showFilters
                    ? "max-h-screen opacity-100 mt-3"
                    : "max-h-0 opacity-0 overflow-hidden"
                    }`}
            >
                <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                    <div className="flex flex-wrap gap-2 items-end">

                        {/* Company + Restaurant */}
                        <div
                            className={`grid gap-2 ${loginRole === SUPER_ADMIN
                                ? "grid-cols-1 md:grid-cols-2"
                                : "grid-cols-1"
                                }`}
                        >
                            {loginRole === SUPER_ADMIN && (
                                <DropdownWithSearch
                                    setSelectedItem={() => {}}
                                    selectedItem={
                                        companyDetails?.find(
                                            (c: any) => c._id === company
                                        )?.name || ""
                                    }
                                    items={companyDetails}
                                    title="Business"
                                    setIsDropdownOpen={setIsDropdownOpen}
                                    isDropdownOpen={isDropdownOpen}
                                    handleFilter={handleBusiness}
                                    fieldKey="company"
                                />
                            )}

                            {(loginRole === SUPER_ADMIN ||
                                MANAGER_ROLES.includes(loginRole)) && (
                                <DropdownWithSearch
                                    setSelectedItem={() => {}}
                                    selectedItem={
                                        restaurantDetails?.find(
                                            (c: any) => c._id === restaurant
                                        )?.name || ""
                                    }
                                    items={restaurantDetails}
                                    title="Restaurant"
                                    handleFilter={handleRestaurant}
                                    fieldKey="restaurant"
                                />
                                )}
                        </div>

                        {/* Search Type */}
                        {options && options.length > 0 && (
                            <>
                                {/* Search Type */}
                                <select
                                    value={keys}
                                    onChange={(e) => {
                                        setKeys?.(e.target.value);
                                        setSearchValue?.("");
                                    }}
                                    className="min-w-[220px] p-2 border border-DARK-300 rounded-md dark:bg-DARK-700 dark:border-none dark:text-DARK-100"
                                >
                                    <option value="">Please select criteria</option>

                                    {options.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Search Input */}
                                {/* Search Input */}
                                <input
                                    type="text"
                                    placeholder={
                                        !keys ? "Please select criteria first" : "Search..."
                                    }
                                    title={
                                        !keys ? "Please select criteria" : ""
                                    }
                                    value={searchValue}
                                    onChange={(e) => setSearchValue?.(e.target.value)}
                                    disabled={!keys}
                                    className={`min-w-[220px] p-2 border rounded-md dark:bg-DARK-700 dark:text-DARK-100 dark:border-none dark:placeholder:text-DARK-400
                                    ${!keys
                                            ? "bg-gray-100 cursor-not-allowed opacity-60"
                                            : "border-DARK-300"
                                        }`}
                                />

                                {/* Search */}
                                <button
                                    className="bg-slate-50 dark:bg-DARK-700 dark:hover:!bg-DARK-600 dark:border-none border rounded flex justify-center items-center h-10 min-w-[50px] px-4" onClick={onSearch}
                                >
                                    <FaSearch className="dark:text-DARK-100" />
                                </button>
                            </>
                        )}

                        {children}
                        {/* Date Filter */}
                        {dateFilter && (
                            <div className="min-w-[260px] flex flex-col">
                                <NewDateRangePicker
                                    value={dateValue}
                                    onChange={onDateChange}
                                />
                            </div>
                        )}

                        {/* Clear */}
                        {showClear && (
                            <button
                                className="bg-slate-50 dark:bg-DARK-700 dark:border-none border rounded flex justify-center items-center h-10 min-w-[50px] px-4"
                                onClick={onClear}
                            >
                                <MdClear className="dark:text-DARK-100 text-lg" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommonReportFilter;