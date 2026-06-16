/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox, Label, } from "flowbite-react"
import { useCallback, useEffect, useRef, useState } from "react";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import apiClient from "../AxiosInstance";
import NewDateRangePicker from "./NewDateRangePicker";
import { createQueryParams } from "../functions";
import { MANAGER_ROLES, orderTypes, OWNER_ROLES, productTypes, SUPER_ADMIN } from "./constant";
import NewSingleDate from "./NewSingleDate";
import { capitalized } from "../utility";
import { MdClear } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";

interface CommonSelectProps {
    label?: string;
    options: Array<{
        value: string;
        label: string;
    }>;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>,) => void;
    loading?: boolean;
};

interface CommonCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    name?: string;
};

const DropdownWithSearch = ({ items, title, handleFilter, setSelectedItem, selectedItem, fieldKey, isAllow = false, isManual = false }: any) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (items?.length === 1 && !selectedItem && !isManual) {
            const singleItem = items[0];

            setSelectedItem((prev: any) => ({
                ...prev,
                [fieldKey]: singleItem?.name
            }));

            // Trigger filter with the ID
            handleFilter(singleItem?._id);
        }
    }, [items, isManual, fieldKey, setSelectedItem, handleFilter]);

    const onchangeHandler = (item: any) => {
        setSelectedItem((prev: any) => ({ ...prev, [fieldKey]: item?.name }));
        handleFilter(item?._id);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const categoryRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !categoryRef.current?.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayText = () => {
        if (items?.length === 0) return `No ${title} Found`;
        if (selectedItem) return capitalized(selectedItem);
        if (items?.length === 1) return capitalized(items[0]?.name);
        return `Select ${title}`;
    };

    const canInteract = items?.length > 1;

    return (
        <div className="relative z-auto" ref={categoryRef}>
            <button
                onClick={() => {
                    if (canInteract) {
                        setIsDropdownOpen(!isDropdownOpen);
                        setSearchTerm("");
                    }
                }}
                id="dropdownSearchButton"
                data-dropdown-toggle="dropdownSearch"
                data-dropdown-placement="bottom"
                className="w-full -min-w-60 border-2 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 text-center flex gap-x-2 justify-between items-center  disabled:cursor-not-allowed"
                type="button"
                disabled={isAllow || !canInteract}
            >
                {displayText()}
                {canInteract && (isDropdownOpen ? <FaAngleUp /> : <FaAngleDown />)}
            </button>

            {isDropdownOpen && (
                <div
                    ref={dropdownRef}
                    className="z-10 bg-white dark:bg-DARK-600 rounded-lg shadow w-full min-w-60 absolute"
                >
                    <div className="p-3">
                        <label htmlFor="input-group-search" className="sr-only">
                            Search
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-DARK-500 dark:text-DARK-300"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="block w-full p-2 ps-10 text-sm text-DARK-900 dark:text-white border border-DARK-300 dark:border-DARK-400 rounded-lg bg-DARK-50 dark:bg-DARK-500 placeholder-DARK-400 dark:placeholder-DARK-300 focus:ring-BRAND-500 focus:border-BRAND-500 dark:focus:ring-BRAND-500 dark:focus:border-BRAND-500"
                                placeholder="Search"
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 h-auto px-4 pb-3 overflow-y-auto text-sm text-DARK-700 dark:text-DARK-200">
                        {items && items.length > 0 ? (
                            items.filter((item: any) =>
                                item?.name.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length > 0 ? (
                                items
                                    .filter((item: any) =>
                                        item?.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((item: any, index: number) => {
                                        const selectedName =
                                            item?.name?.trim() === selectedItem?.trim();
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    onchangeHandler(item);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <li>
                                                    <div
                                                        className={`flex items-center rounded cursor-pointer transition-colors ${selectedName
                                                            ? "bg-BRAND-200"
                                                            : "hover:bg-BRAND-500 dark:hover:bg-orange-600"
                                                            }`}
                                                    >
                                                        <label
                                                            htmlFor={`checkbox-item-${index}`}
                                                            className={`w-full py-2 px-2 text-sm font-medium rounded ${selectedName
                                                                ? "text-BRAND-600 hover:text-white"
                                                                : "text-slate-900 dark:text-DARK-300 hover:text-white"
                                                                }`}
                                                        >
                                                            {capitalized(item.name)}
                                                        </label>
                                                        {selectedName && (
                                                            <RxCross2
                                                                className="text-lg text-red-500 hover:text-red-700 mx-2 shrink-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // prevent item select
                                                                    setSelectedItem((prev: any) => ({ ...prev, [fieldKey]: "" }));
                                                                    handleFilter("");
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </li>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="text-center py-4 text-DARK-500 dark:text-DARK-400">
                                    No {fieldKey} data found
                                </div>
                            )
                        ) : (
                            <div className="text-center py-4 text-DARK-500 dark:text-DARK-400">
                                No {fieldKey} data found
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );

}

const CommonSelect: React.FC<CommonSelectProps> = ({
    options,
    value,
    onChange,
    loading,
}: CommonSelectProps) => {

    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                disabled={loading}
                className="min-w-60 bg-slate-50 text-DARK-700 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-BRAND-500 w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none"
            >
                {loading ? (
                    <option disabled>Loading...</option>
                ) : (
                    options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))
                )}
            </select>
        </div>

    );
};

const CommonCheckbox: React.FC<CommonCheckboxProps> = ({
    label,
    checked,
    onChange,
    disabled = false,
    name,
}) => {
    return (
        <div className="flex items-center gap-2 min-w-60">
            <Checkbox
                id="commonCheckbox"
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="checked:!bg-BRAND-500 focus:!ring-0 cursor-pointer"
            />
            <Label htmlFor="commonCheckbox" className="text-sm text-DARK-700 dark:text-DARK-300 cursor-pointer">{label}</Label>
        </div>

    );
};

const TextWithSearch = ({ searchFilter, setSearchFilter }: any) => {
    return (
        <input
            type="text"
            placeholder="Search..."
            value={searchFilter?.name ?? ''}
            onChange={e => setSearchFilter((prev: any) => ({ ...prev, name: e.target.value }))}
            className="rounded-xl bg-slate-50 focus:!ring-0 -min-w-60 w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300"
        />)
}

const ClearFilters = ({ handleClear }: any) => {
    return (
        <button
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:!ring-0 focus:ring-red-500 rounded-lg transition-colors duration-200"
        >
            <MdClear className="w-4 h-4 font-bold" />
            Clear
        </button>
    );
};

const Filters = ({ loginRole, searchFilter, setSearchFilter, module, userData }: any) => {
    const [selectedItem, setSelectedItem] = useState<any>({
        company: "",
        restaurant: "",
        category: "",
        modifiercategory: "",
        employee: "",
        orderType: "",
        productOrderType: "",
    });
    const [allowedFields, setAllowedFields] = useState<any>([]);
    const [allowedDropdown, setAllowedDropdown] = useState<any>([]);
    const [selectOptions, setSelectOptions] = useState<any>([]);
    const [companies, setCompanies] = useState<any>([])
    const [categoryDetails, setCategoryDetails] = useState<any>([]);
    const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
    const [staffDetail, setStaffDetail] = useState<any>([]);
    const [roleDetail, setRoleDetail] = useState<any>([]);
    const [roomDetail, setRoomDetail] = useState<any>([]);
    const [modifierCategory, setModifierCategory] = useState<any>([]);

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isModifierCategoryOpen, setIsModifierCategoryOpen] = useState(false);
    const [isBusinessOpen, setIsBusinessOpen] = useState(false);
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(false);
    const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isRoomOpen, setIsRoomOpen] = useState(false);
    const [isorderTypeOpen, setIsOrderTypeOpen] = useState(false);
    const [isProductTypeOpen, setIsProductTypeOpen] = useState(false);

    const [selectedValue, setSelectedValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedRange, setSelectedRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
        startDate: null,
        endDate: null
    });
    const [checked, setChecked] = useState(false);
    const [isManualFilter, setIsManualFilter] = useState(false);

    const companiesLoaded = useRef<string | null>(null);
    const restaurantsLoaded = useRef<string | null>(null);
    const categoriesLoaded = useRef<string | null>(null);
    const modifierCategoriesLoaded = useRef<string | null>(null);
    const staffLoaded = useRef<string | null>(null);
    const rolesLoaded = useRef(false);
    const roomsLoaded = useRef<string | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);

        const date = queryParams.get("date");
        const fromDate = queryParams.get("fromDate");
        const toDate = queryParams.get("toDate");
        const restaurant = queryParams.get("restaurant");
        const category = queryParams.get("category");
        const modifierCategoryId = queryParams.get("modifiercategory");
        const employee = queryParams.get("employee");
        const role = queryParams.get("role");
        const room = queryParams.get("room");
        const oType = queryParams.get("orderType");
        const pType = queryParams.get("productOrderType");
        const isDeleteParam = queryParams.get("isDelete");
        const isDelete = isDeleteParam === "true";

        const restaurantName = restaurantDetails?.find((c: any) => c._id === restaurant)?.name || '';
        const categoryName = categoryDetails?.find((cat: any) => cat._id === category)?.name || '';
        const modifierCategoryName = modifierCategory?.find((mod: any) => mod._id === modifierCategoryId)?.name || '';
        const employeeName = staffDetail?.find((emp: any) => emp._id === employee)?.name || '';
        const roleName = roleDetail?.find((r: any) => r._id === role)?.name || '';
        const roomName = roomDetail?.find((r: any) => r._id === room)?.name || '';
        const orderTypeName = orderTypes?.find((o: any) => o._id === oType)?.name || '';
        const productTypeName = productTypes?.find((p: any) => p._id === pType)?.name || '';

        let selectedValue: any = "";

        if (module === "modifier") {
            selectedValue = queryParams.get("isAvailable") === "true" ? "available" : queryParams.get("isAvailable") === "false" ? "not_available" : "";
        } else if (["company", "restaurant", "staff", "inventory", "customerDisplay"].includes(module)) {
            selectedValue = queryParams.get("isActive") === "true" ? "activated" : queryParams.get("isActive") === "false" ? "deActivated" : "";
        } else if (["discounts", "coupon"].includes(module)) {
            selectedValue = queryParams.get("discountType") || "";
        } else if (module === "tables") {
            selectedValue = queryParams.get("isFree") === "true" ? "free" : queryParams.get("isFree") === "false" ? "booked" : "";
        } else if (module === "orders") {
            selectedValue = queryParams.get("status") || "";
        }

        setSelectedValue(selectedValue);

        setChecked(isDelete);
        setSelectedRange({
            startDate: fromDate ? new Date(fromDate) : null,
            endDate: toDate ? new Date(toDate) : null,
        });
        if (date) {
            setSelectedRange({
                startDate: date ? new Date(date) : null,
                endDate: date ? new Date(date) : null,
            });
        }
        setSelectedItem((pre: any) => ({
            ...pre,
            restaurant: restaurantName || '',
            category: categoryName || '',
            modifiercategory: modifierCategoryName || '',
            employee: employeeName || '',
            role: roleName || '',
            room: roomName || '',
            orderType: orderTypeName || '',
            productOrderType: productTypeName || '',
        }))

    }, [
        module,
        location.search,
        companies,
        restaurantDetails,
        categoryDetails,
        modifierCategory,
        staffDetail,
        roleDetail,
        roomDetail
    ]);

    useEffect(() => {
        if (loginRole === SUPER_ADMIN && searchFilter?.company) {
            const companyName =
                companies?.find(
                    (c: any) =>
                        String(c._id) === String(searchFilter.company)
                )?.name || "";

            setSelectedItem((prev: any) => ({
                ...prev,
                company: companyName,
            }));
        }
    }, [companies, searchFilter?.company, loginRole]);

    // Auto-inject the logged-in user's company for non-SUPER_ADMIN roles
    useEffect(() => {
        if (
            loginRole !== SUPER_ADMIN &&
            !searchFilter?.company &&
            userData?.staffMember?.company?._id
        ) {
            setSearchFilter((prev: any) => ({ ...prev, company: userData.staffMember.company._id }));
            setSelectedItem((prev: any) => ({
                ...prev,
                company: userData.staffMember.company.name
            }));
        }
    }, [loginRole, userData, searchFilter?.company, setSearchFilter]);

    // Auto-inject the logged-in user's restaurant for non-SUPER_ADMIN/OWNER roles
    useEffect(() => {
        if (
            loginRole !== SUPER_ADMIN &&
            !OWNER_ROLES.includes(loginRole) &&
            !searchFilter?.restaurant &&
            userData?.staffMember?.restaurant?._id
        ) {
            setSearchFilter((prev: any) => ({ ...prev, restaurant: userData.staffMember.restaurant._id }));
            setSelectedItem((prev: any) => ({
                ...prev,
                restaurant: userData.staffMember.restaurant.name
            }));
        }
    }, [loginRole, userData, searchFilter?.restaurant, setSearchFilter]);

    // Auto-inject restaurant when only 1 exists (covers Super Admin after picking a business
     useEffect(() => {
        if (
            allowedDropdown.includes("restaurant") &&
            restaurantDetails?.length === 1 &&
            !searchFilter?.restaurant
        ) {
            const singleRestaurant = restaurantDetails[0];

            setSelectedItem((prev: any) => ({
                ...prev,
                restaurant: singleRestaurant?.name,
            }));

            setSearchFilter((prev: any) => ({
                ...prev,
                restaurant: singleRestaurant?._id,
            }));
        }
    }, [restaurantDetails, allowedDropdown, searchFilter?.restaurant]);

    useEffect(() => {
        if (
            allowedDropdown.includes("room") &&
            roomDetail?.length === 1 &&
            !searchFilter?.room
        ) {
            const singleRoom = roomDetail[0];

            setSelectedItem((prev: any) => ({
                ...prev,
                room: singleRoom?.name,
            }));

            setSearchFilter((prev: any) => ({
                ...prev,
                room: singleRoom?._id,
            }));
        }
    }, [roomDetail, allowedDropdown, searchFilter?.room]);

    useEffect(() => {
        if (
            staffDetail?.length === 1 &&
            !searchFilter?.employee
        ) {
            const employee = staffDetail[0];

            setSelectedItem((prev: any) => ({
                ...prev,
                employee: employee.name,
            }));

            setSearchFilter((prev: any) => ({
                ...prev,
                employee: employee._id,
            }));
        }
    }, [staffDetail]);

    useEffect(() => {
        if (
            roleDetail?.length === 1 &&
            !searchFilter?.role
        ) {
            const role = roleDetail[0];

            setSelectedItem((prev: any) => ({
                ...prev,
                role: role.name,
            }));

            setSearchFilter((prev: any) => ({
                ...prev,
                role: role._id,
            }));
        }
    }, [roleDetail]);

    const stringifiedSearchFilter = JSON.stringify(searchFilter);

    const getCompanies = useCallback(async () => {
        if (companiesLoaded.current === loginRole) return;
        companiesLoaded.current = loginRole;
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }, [loginRole]);

    const getRestaurant = useCallback(async (companyId: string) => {
        if (restaurantsLoaded.current === companyId) return [];
        restaurantsLoaded.current = companyId;
        if (!companyId) return [];
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurantDetails(response.data.restaurant);
                return response.data.restaurant;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
        return [];
    }, []);

    const getCategory = useCallback(async (restaurantId: string) => {
        if (categoriesLoaded.current === restaurantId) return;
        categoriesLoaded.current = restaurantId;
        if (!restaurantId) return [];
        try {
            const response = await apiClient.get(`/category?restaurant=${restaurantId}`);
            if (response.data.success) {
                setCategoryDetails(response.data.categories);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }, []);

    const getModifierCategory = useCallback(async (restaurantId: string) => {
        if (modifierCategoriesLoaded.current === restaurantId) return;
        modifierCategoriesLoaded.current = restaurantId;
        if (!restaurantId) return [];
        try {
            const response = await apiClient.get(
                `/modifier/category/all?restaurant=${restaurantId}`
            );
            if (response.data.success) {
                setModifierCategory(response.data.categories);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }, []);

    const getStaff = useCallback(async () => {
        const filter = JSON.parse(stringifiedSearchFilter);
        const restaurantId = filter.restaurant;
        if (staffLoaded.current === restaurantId) return;
        staffLoaded.current = restaurantId;
        try {
            const queryParams = createQueryParams(filter);
            const response = await apiClient.get(`/staff/web/all${queryParams}`);
            if (response.data.success) {
                setStaffDetail(response.data.data);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }, [stringifiedSearchFilter]);

    const getRoles = useCallback(async () => {
        if (rolesLoaded.current) return;
        rolesLoaded.current = true;
        try {
            const filter = JSON.parse(stringifiedSearchFilter);
            const queryParams = createQueryParams(filter);
            const response = await apiClient.get(`/role${queryParams}`);
            if (response.data.success) {
                setRoleDetail(response?.data?.roles);
            } else {
                setRoleDetail([]);
            }
        } catch (error) {
            setRoleDetail([]);
            console.error("~ getRoles error :-", error);
        }
    }, [stringifiedSearchFilter]);

    const getRoom = useCallback(async () => {
        const filter = JSON.parse(stringifiedSearchFilter);
        const companyId = filter.company;
        if (roomsLoaded.current === companyId) return;
        roomsLoaded.current = companyId;
        try {
            const queryParams = createQueryParams(filter);
            const response = await apiClient.get(`/table/room${queryParams}`);
            if (response.data.success) {
                setRoomDetail(response?.data?.rooms);
            } else {
                setRoomDetail([]);
            }
        } catch (error) {
            setRoomDetail([]);
            console.error("~ getRoom error :-", error);
        }
    }, [stringifiedSearchFilter]);

    useEffect(() => {
        const { company, restaurant } = searchFilter;

        if (loginRole === SUPER_ADMIN && allowedDropdown.includes("business")) {
            getCompanies();
        }
        if (allowedDropdown.includes("restaurant") && company) {
            getRestaurant(company);
        }
        if (allowedDropdown.includes("category") && restaurant) {
            getCategory(restaurant);
        }
        if (allowedDropdown.includes("modifier category") && restaurant) {
            getModifierCategory(restaurant);
        }
        if (allowedDropdown.includes("employee") && restaurant) {
            getStaff();
        }
        if (allowedDropdown.includes("room") && (restaurant || (loginRole === SUPER_ADMIN && company))) {
            getRoom();
        }
        if (allowedDropdown.includes("role")) {
            getRoles();
        }
    }, [
        loginRole,
        allowedDropdown,
        searchFilter.company,
        searchFilter.restaurant,
        getCompanies,
        getRestaurant,
        getCategory,
        getModifierCategory,
        getStaff,
        getRoom,
        getRoles,
    ]);

    const handleCategory = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, category: value }))
    }
    const handleModifierCategory = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, modifiercategory: value }))
    }
    const handleBusiness = (value: string) => {
        setIsManualFilter(true);
        setSelectedItem((prev: any) => ({
            ...prev,
            restaurant: "",
            category: "",
            modifiercategory: "",
            employee: "",
            role: "",
            room: ""
        }));

        setSearchFilter((prev: any) => ({
            ...prev,
            company: value,
            restaurant: "",
            category: "",
            modifiercategory: "",
            employee: "",
            role: "",
            room: ""
        }));

        // Clear dependent lists immediately on company change to prevent stale data in sub-filters (restaurant, mod category etc.)
        setRestaurantDetails([]);
        setStaffDetail([]);
        setRoleDetail([]);
        setRoomDetail([]);
        setModifierCategory([]);
        setCategoryDetails([]);
    };
    const handleRestaurant = (value: string) => {
        setIsManualFilter(true);
        setSelectedItem((prev: any) => ({
            ...prev,
            category: "",
            modifiercategory: "",
            employee: "",
            role: "",
            room: ""
        }));

        setSearchFilter((prev: any) => ({
            ...prev,
            restaurant: value,
            category: "",
            modifiercategory: "",
            employee: "",
            role: "",
            room: ""
        }));
    };
    const handleEmployee = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, employee: value }))
    }
    const handleRole = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, role: value }))
    }
    const handleRoom = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, room: value }))
    }
    const handleOrderType = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, orderType: value, productOrderType: "" }))
    }
    const handleProductType = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, productOrderType: value }))
    }
    const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        setSelectedRange(value);
        if (value?.startDate && value?.endDate) {
            setSearchFilter((prev: any) => ({ ...prev, fromDate: value?.startDate, toDate: value?.endDate }));
        }
    };
    const handleDateChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        setSelectedRange({ startDate: value?.startDate, endDate: value?.startDate });
        if (value?.startDate) {
            setSearchFilter((prev: any) => ({ ...prev, date: value?.startDate }));
        }
    };

    const handleIsDeletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setChecked(isChecked);
        setSearchFilter((prev: any) => ({
            ...prev,
            isDelete: isChecked,
        }));
    };

    const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>,) => {
        setSelectedValue(event.target.value);
        setSearchFilter((prev: any) => {
            const { value } = event.target;
            const updatedFilter = { ...prev };

            if (module === 'modifier') {
                updatedFilter.isAvailable = value === 'available'
                    ? true
                    : value === 'not_available'
                        ? false
                        : undefined;
            } else if (module === 'company') {
                updatedFilter.isActive = value === 'activated'
                    ? true
                    : value === 'deActivated'
                        ? false
                        : undefined;
            } else if (module === 'restaurant') {
                updatedFilter.isActive = value === 'activated'
                    ? true
                    : value === 'deActivated'
                        ? false
                        : undefined;
            } else if (module === 'staff') {
                updatedFilter.isActive = value === 'activated'
                    ? true
                    : value === 'deActivated'
                        ? false
                        : undefined;
            } else if (module === 'discounts') {
                updatedFilter.discountType = value;
            } else if (module === 'tables') {
                updatedFilter.isFree = value === 'free'
                    ? true
                    : value === 'booked'
                        ? false
                        : undefined;
            } else if (module === 'coupon') {
                updatedFilter.discountType = value;
            } else if (module === 'connection') {
                updatedFilter.isActive = value === 'activated'
                    ? true
                    : value === 'deActivated'
                        ? false
                        : undefined;
            } else if (module === 'orders') {
                updatedFilter.status = value;
            }
            else if (module === 'customerDisplay') {
                updatedFilter.isActive = value === 'activated'
                    ? true
                    : value === 'deActivated'
                        ? false
                        : undefined;
            }
            else if (module === 'inventory') {
                updatedFilter.isActive = value === 'activated'
                    ? true
                    : value === 'deActivated'
                        ? false
                        : undefined;
            }

            return updatedFilter;
        });

    }, [module, setSearchFilter]);

    const handleClear = (e: any) => {
        e.preventDefault();

        const clearedFilter = {
            name: "",
            company: "",
            restaurant: "",
            category: "",
            modifiercategory: "",
            employee: "",
            role: "",
            room: "",
            orderType: "",
            productOrderType: "",
            isActive: "",
            isDelete: false,
            fromDate: null,
            toDate: null,
            date: null,
        };

        setSearchFilter(clearedFilter);
        setSelectedItem({
            company: "",
            restaurant: "",
            category: "",
            modifiercategory: "",
            employee: "",
            role: "",
            orderType: "",
            productOrderType: "",
        });

        setChecked(false);
        setIsManualFilter(false); // Reset manual mode

        setSelectedRange({
            startDate: null,
            endDate: null
        });

        setSelectedValue("");

        setIsCategoryOpen(false);
        setIsModifierCategoryOpen(false);
        setIsBusinessOpen(false);
        setIsRestaurantOpen(false);

        setRoleDetail([]);
        setRoomDetail([]);
        setStaffDetail([]);

        if (OWNER_ROLES.includes(loginRole)) {
            setModifierCategory([]);
            setCategoryDetails([]);
        }

        if (loginRole === SUPER_ADMIN) {
            setRestaurantDetails([]);
        }

        companiesLoaded.current = null;
        restaurantsLoaded.current = null;
        categoriesLoaded.current = null;
        modifierCategoriesLoaded.current = null;
        staffLoaded.current = null;
        rolesLoaded.current = false;
        roomsLoaded.current = null;
    };

    const allowedFilters = useCallback(() => {
        const baseFilters: any = {
            product: { fields: ["textSearch", "dropdown"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant", "category"] : ["category"] },
            salesMatrix: { fields: ["dropdown", "dateRange"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant",] : [] },
            zip: { fields: ["textSearch"], dropdown: [] },
            security: { fields: ["textSearch"], dropdown: [] },
            company: { fields: ["textSearch", "select", "deleteCompany"], dropdown: [] },
            role: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            tax: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            tender: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business"] : [] },
            meal: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            posDevice: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            coupon: { fields: ["textSearch", "dropdown", "select"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant",] : [] },
            modifier: { fields: ["textSearch", "dropdown", "select"], dropdown: loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole) ? ["business", "restaurant", "modifier category"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant", "modifier category"] : ["modifier category"] },
            modifierCategory: { fields: ["textSearch", "dropdown"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant"] : [""] },
            orders: { fields: ["textSearch", "dropdown", "dateRange", "select"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant", "orderType", "productOrderType"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant", "orderType", "productOrderType"] : ["orderType", "productOrderType"] },
            restaurant: { fields: ["textSearch", "dropdown", "select", "deleteRestaurant"], dropdown: ["business"] },
            customer: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            staff: { fields: ["textSearch", "dropdown", "select"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant", "role"] : [] },
            tables: { fields: ["textSearch", "dropdown", "select"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant", "room"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant", "room"] : ["room"] },
            customerDisplay: { fields: ["textSearch", "dropdown", "select"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant",] : MANAGER_ROLES.includes(loginRole) ? ["restaurant",] : [""] },
            discounts: { fields: ["dateRange", "select", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant",] : MANAGER_ROLES.includes(loginRole) ? ["restaurant",] : [""] },
            offer: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            room: { fields: ["textSearch", "dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            clockInOut: { fields: ["textSearch", "dropdown", "dateRange"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant", "employee"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant", "employee"] : [] },
            category: { fields: ["textSearch", "dropdown"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", 'restaurant'] : [] },
            employeeCloseOut: { fields: ["dateRange", "dropdown"], dropdown: ["business", "employee"] },
            connection: { fields: ["textSearch", "dropdown", "select"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : MANAGER_ROLES.includes(loginRole) ? ["restaurant"] : [] },
            reservation: { fields: ["textSearch", "dropdown", "date"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant"] : [] },
            package: { fields: ["textSearch", "dropdown"], dropdown: OWNER_ROLES.includes(loginRole) ? ["business", "restaurant"] : [] },
            timeSlot: { fields: ["dropdown"], dropdown: loginRole === SUPER_ADMIN ? ["business", "restaurant"] : ["restaurant"] },
            inventory: { fields: ["textSearch", "dropdown", "select"], dropdown: loginRole === SUPER_ADMIN ? ["business",] : [] }
        };

        const filters = baseFilters[module] || { fields: [], dropdown: [] };

        setAllowedFields(filters.fields);
        setAllowedDropdown(filters.dropdown);
    }, [module, loginRole])

    const allowedOptions = useCallback(() => {
        setLoading(true);

        const baseOptions: any = {
            modifier: [
                { value: "", label: "All Status" },
                { value: "available", label: "Available" },
                { value: "not_available", label: "Not Available" }
            ],
            company: [
                { value: "", label: "All Status" },
                { value: "activated", label: "Activated" },
                { value: "deActivated", label: "DeActivated" }
            ],
            orders: [
                { value: "", label: "All Status" },
                { value: "completed", label: "Completed" },
                { value: "hold", label: "Hold" },
                { value: "cancelled", label: "Cancelled" }
            ],
            restaurant: [
                { value: "", label: "All Status" },
                { value: "activated", label: "Activated" },
                { value: "deActivated", label: "DeActivated" }
            ],
            staff: [
                { value: "", label: "All Status" },
                { value: "activated", label: "Activated" },
                { value: "deActivated", label: "DeActivated" }
            ],
            customerDisplay: [
                { value: "", label: "All Status" },
                { value: "activated", label: "Activated" },
                { value: "deActivated", label: "DeActivated" }
            ],
            discounts: [
                { value: "", label: "Select Discount Type" },
                { value: "percentage", label: "Percentage" },
                { value: "fixed", label: "Fixed" }
            ],
            coupon: [
                { value: "", label: "Select Discount Type" },
                { value: "percentage", label: "Percentage" },
                { value: "fixed", label: "Fixed" }
            ],
            tables: [
                { value: "", label: "All Status" },
                { value: "free", label: "Free" },
                { value: "booked", label: "Booked" }
            ],
            connection: [
                { value: "", label: "All Status" },
                { value: "activated", label: "Activated" },
                { value: "deActivated", label: "DeActivated" }
            ],
            inventory: [
                { value: "", label: "All Status" },
                { value: "activated", label: "Activated" },
                { value: "deActivated", label: "DeActivated" }
            ],
        };

        const options = baseOptions[module] || [];

        setSelectOptions(options);
        setLoading(false);
    }, [module]);

    const dropdownConfigs = [
        {
            key: "business",
            condition: allowedDropdown.includes("business") && loginRole === SUPER_ADMIN,
            title: "Business",
            items: companies,
            selectedItemKey: "company",
            setDropdownOpen: setIsBusinessOpen,
            isDropdownOpen: isBusinessOpen,
            handleFilter: handleBusiness,
        },
        {
            key: "restaurant",
            condition: allowedDropdown.includes("restaurant"),
            title: "Restaurant",
            items: restaurantDetails,
            selectedItemKey: "restaurant",
            setDropdownOpen: setIsRestaurantOpen,
            isDropdownOpen: isRestaurantOpen,
            handleFilter: handleRestaurant,
        },
        {
            key: "category",
            condition: allowedDropdown.includes("category"),
            title: "Categories",
            items: categoryDetails,
            selectedItemKey: "category",
            setDropdownOpen: setIsCategoryOpen,
            isDropdownOpen: isCategoryOpen,
            handleFilter: handleCategory,
        },
        {
            key: "modifier category",
            condition: allowedDropdown.includes("modifier category"),
            title: "Modifier Categories",
            items: modifierCategory,
            selectedItemKey: "modifiercategory",
            setDropdownOpen: setIsModifierCategoryOpen,
            isDropdownOpen: isModifierCategoryOpen,
            handleFilter: handleModifierCategory,
        },
        {
            key: "employee",
            condition: allowedDropdown.includes("employee") && staffDetail.length > 0,
            title: "Employee",
            items: staffDetail,
            selectedItemKey: "employee",
            setDropdownOpen: setIsEmployeeOpen,
            isDropdownOpen: isEmployeeOpen,
            handleFilter: handleEmployee,
        },
        {
            key: "role",
            condition: allowedDropdown.includes("role"),
            title: "Role",
            items: roleDetail,
            selectedItemKey: "role",
            setDropdownOpen: setIsRoleOpen,
            isDropdownOpen: isRoleOpen,
            handleFilter: handleRole,
        },
        {
            key: "room",
            condition: allowedDropdown.includes("room"),
            title: "Room",
            items: roomDetail,
            selectedItemKey: "room",
            setDropdownOpen: setIsRoomOpen,
            isDropdownOpen: isRoomOpen,
            handleFilter: handleRoom,
        },
        {
            key: "orderType",
            condition: allowedDropdown.includes("orderType"),
            title: "Order Type",
            items: orderTypes,
            selectedItemKey: "orderType",
            setDropdownOpen: setIsOrderTypeOpen,
            isDropdownOpen: isorderTypeOpen,
            handleFilter: handleOrderType,
        },
        {
            key: "productOrderType",
            condition: allowedDropdown.includes("productOrderType") && searchFilter?.orderType === "product",
            title: "Product Order Type",
            items: productTypes,
            selectedItemKey: "productOrderType",
            setDropdownOpen: setIsProductTypeOpen,
            isDropdownOpen: isProductTypeOpen,
            handleFilter: handleProductType,
        },
    ];

    useEffect(() => {
        allowedFilters();
        allowedOptions();
    }, [allowedFilters, allowedOptions]);

    // const hasActiveFilters = (() => {
    //     const hasDropdownValue = dropdownConfigs.some(config => {
    //         if (!config.condition) return false;
    //         const val = searchFilter[config.selectedItemKey];
    //         return val !== "" && val !== null && val !== undefined && val !== false;
    //     });

    //     const hasSingleItemDropdown = dropdownConfigs.some(
    //         config => config.condition && config.items?.length === 1
    //     );

    //     const hasTextValue = allowedFields.includes("textSearch") && !!searchFilter.name;
    //     const hasDateRangeValue = allowedFields.includes("dateRange") && !!(searchFilter.fromDate || searchFilter.toDate);
    //     const hasDateValue = allowedFields.includes("date") && !!searchFilter.date;
    //     const hasSelectValue = allowedFields.includes("select") && selectedValue !== "";

    //     return hasDropdownValue || hasSingleItemDropdown || hasTextValue || hasDateRangeValue || hasDateValue || hasSelectValue;
    // })();

    const hasActiveFilters = (() => {
        const hasDropdownValue = dropdownConfigs.some(config => {
            if (!config.condition) return false;

            const val = searchFilter[config.selectedItemKey];

            // Ignore auto-selected single-item dropdowns
            if (config.items?.length === 1) return false;

            return val !== "" && val !== null && val !== undefined && val !== false;
        });

        const hasTextValue =
            allowedFields.includes("textSearch") &&
            !!searchFilter.name;

        const hasDateRangeValue =
            allowedFields.includes("dateRange") &&
            !!(searchFilter.fromDate || searchFilter.toDate);

        const hasDateValue =
            allowedFields.includes("date") &&
            !!searchFilter.date;

        const hasSelectValue =
            allowedFields.includes("select") &&
            selectedValue !== "";

        return (
            hasDropdownValue ||
            hasTextValue ||
            hasDateRangeValue ||
            hasDateValue ||
            hasSelectValue
        );
    })();

    const interactiveDropdownsCount = dropdownConfigs.filter(config => config.condition).length;

    const shouldShowClearButton = hasActiveFilters && (interactiveDropdownsCount > 0 || allowedFields.includes("textSearch") || allowedFields.includes("select") || allowedFields.includes("dateRange") || allowedFields.includes("date"));

    return (
        <div>
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-2 w-full">
                {allowedFields.includes("textSearch") && (
                    <TextWithSearch
                        searchFilter={searchFilter}
                        setSearchFilter={setSearchFilter}
                    />
                )}

                {dropdownConfigs.map(
                    (
                        {
                            condition,
                            title,
                            items,
                            selectedItemKey,
                            setDropdownOpen,
                            isDropdownOpen,
                            handleFilter,
                        },
                        index
                    ) => {
                        if (!condition) return null;

                        return (
                            <div
                                key={index}
                                className="rounded-md focus:!ring-0 gap-2 dark:text-DARK-100"
                            >
                                <DropdownWithSearch
                                    setSelectedItem={setSelectedItem}
                                    selectedItem={selectedItem?.[selectedItemKey]}
                                    items={items}
                                    title={title}
                                    setIsDropdownOpen={setDropdownOpen}
                                    isDropdownOpen={isDropdownOpen}
                                    handleFilter={handleFilter}
                                    fieldKey={selectedItemKey}
                                    isManual={isManualFilter}
                                />
                            </div>
                        );
                    }
                )}

                {allowedFields.includes("select") && (
                    <div className="rounded-md focus:!ring-0 gap-2 dark:text-DARK-100">
                        <CommonSelect
                            options={selectOptions}
                            value={selectedValue}
                            onChange={handleChange}
                            loading={loading}
                        />
                    </div>
                )}

                {allowedFields.includes("dateRange") && (
                    <div className="rounded-md focus:!ring-0 gap-2 dark:text-DARK-100">
                        <NewDateRangePicker
                            value={selectedRange}
                            onChange={handleDateRangeChange}
                        />
                    </div>
                )}

                {allowedFields.includes("date") && (
                    <div className="rounded-md focus:!ring-0 gap-2 dark:text-DARK-100">
                        <NewSingleDate
                            value={selectedRange}
                            onChange={handleDateChange}
                            className="w-full"
                            allowPastDates={true}
                            label="Date"
                        />
                    </div>
                )}

                {shouldShowClearButton && (
                    <div className="flex dark:text-DARK-100">
                        <ClearFilters handleClear={handleClear} />
                    </div>
                )}
            </div>

            {loginRole === SUPER_ADMIN && allowedFields.includes("deleteCompany") && (
                <div className="flex mt-2 dark:text-DARK-100">
                    <CommonCheckbox
                        name="isDeleted"
                        label="Show deleted company(s)."
                        checked={checked}
                        onChange={handleIsDeletedChange}
                    />
                </div>
            )}

            {OWNER_ROLES.includes(loginRole) &&
                allowedFields.includes("deleteRestaurant") && (
                    <div className="flex mt-2 dark:text-DARK-100">
                        <CommonCheckbox
                            name="isDeleted"
                            label="Show deleted restaurant(s)."
                            checked={checked}
                            onChange={handleIsDeletedChange}
                        />
                    </div>
                )}
        </div>
    );


}

export { Filters, DropdownWithSearch, TextWithSearch, ClearFilters }