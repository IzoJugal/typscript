import { Button, Table, } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import { useLoading } from "../../context/LoadingContext";
import ConfirmModal from "../../hooks/ConfirmModal";
import apiClient from "../../utils/AxiosInstance";
import { createQueryParams, formatTime, parseTimeStringToDate } from "../../utils/functions";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { Filters } from "../../utils/common/Filters";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, labelLayout, setTitle } from "../../utils/utility";
import ListLoader from "../../utils/common/ListLoader";
import MealPeriodFormModal from "./MealPeriodFormModal";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type Week = {
    [K in WeekDay]: boolean;
};

export interface IMealPeriod {
    _id?: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    isFullDay: boolean;
    company: string;
    restaurant: string;
    mealPlan: 'day' | 'week' | 'month' | 'time';
    time?: {
        timeStartTime: string;
        timeEndTime: string;
    },
    day?: {
        specialDayName: string,
        specialDayDate: string
    },
    month?: string,
    week?: Week;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    _id: string;
}

export interface Company {
    _id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: Address;
    registrationNumber: string;
    taxID: string;
    isActive: boolean;
    text: string;
    profile: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    owner: string;
    logo: string;
    timeOut: number;
}

export interface Restaurant {
    _id: string;
    name: string;
    company: string;
    address: Address;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface ErrorState {
    company?: string,
    restaurant?: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    timeStartTime?: string;
    timeEndTime?: string;
    specialDayName?: string;
    specialDayDate?: string;
    month: string;
    week?: string;
    /*  weekMonth: string,
     weekStartDate: string,
     weekEndDate: string */
}

export const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
export const allDays: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const mealPlan = ['time', 'day', 'week', 'month']

const MealPeriods = () => {
    setTitle("Meal Periods");
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [mealPeriods, setMealPeriods] = useState<IMealPeriod[]>([]);
    const { isButtonLoading, setIsButtonLoading } = useLoading();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({
        company: '',
        restaurant: '',
        name: '',
        startTime: '',
        endTime: '',
        timeStartTime: '',
        timeEndTime: '',
        specialDayName: '',
        specialDayDate: '',
        month: '',
        // weekMonth: '',
        // weekStartDate: '',
        // weekEndDate: ''
    });

    const initialFormData: IMealPeriod = {
        _id: '',
        name: '',
        startTime: "",
        endTime: "",
        isActive: true,
        isFullDay: false,
        company: '',
        restaurant: '',
        mealPlan: 'time',
        time: { timeStartTime: "", timeEndTime: "" },
        day: {
            specialDayName: "",
            specialDayDate: ""
        },
        month: "",
        week: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
        }
    };

    const [formData, setFormData] = useState<IMealPeriod>(initialFormData);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [restaurant, setRestaurant] = useState<Restaurant[]>([]);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const staffCompanyId = loginRole !== SUPER_ADMIN
        ? (userData?.staffMember?.company?._id || "")
        : "";
    // const staffRestaurantId = loginRole !== SUPER_ADMIN && !OWNER_ROLES.includes(loginRole)
    //     ? (userData?.staffMember?.restaurant?._id || "")
    //     : "";
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || staffCompanyId,
        restaurant: searchParams.get("restaurant") || "",
    });

    const [queryData, setQueryData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const [selectSpecialDate, setSelectSpecialDate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: null,
        endDate: null,
    });
    const [selectFromDate, setSelectFromDate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: null,
        endDate: null,
    });
    const [selectToDate, setSelectToDate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: null,
        endDate: null,
    });

    const columnNames = loginRole === SUPER_ADMIN ? ["Sr.No.", "Name", "Business", "Start Time", "End Time", "Status", "Actions"]
        : ["Sr.No.", "Name", "Start Time", "End Time", "Status", "Actions"]

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant)
                if (response.data.restaurant.length === 1) {
                    const selectedRestaurant = response.data.restaurant[0];

                    setFormData((prev) => ({
                        ...prev,
                        restaurant: selectedRestaurant._id,
                    }));

                    // clear restaurant error
                    setErrors((prev) => ({
                        ...prev,
                        restaurant: "",
                    }));
                }
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const queryDataRef = useRef(queryData);
    useEffect(() => {
        queryDataRef.current = queryData;
    }, [queryData]);

    const getMealPeriods = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...queryDataRef.current,
                ...searchFilterRef.current
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/meal${queryParams}`,);
            const { data: mealPeriodsData } = response.data;

            const updatedMeals = mealPeriodsData.map((meal: any) => {
                if (meal.mealPlan === 'day') {
                    const formattedDate = new Date(meal.day.specialDayDate).toISOString();
                    return {
                        ...meal,
                        day: {
                            ...meal.day,
                            specialDayDate: formattedDate,
                        },
                    };
                }
                return meal;
            });
            setMealPeriods(updatedMeals);
            setNumOfRecords(response.data.count);
            setIsLoading(false);

        } catch (error) {
            console.error(" ~ getMealPeriods error :- ", error);
            toast.error("Failed to fetch meal periods.");
            setIsLoading(false);
        }
    }, []);

    const handleSpecialDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        if (value?.startDate) {
            const formattedDate = new Date(value.startDate).toISOString().split("T")[0];
            setSelectSpecialDate(value);
            setFormData((prev: any) => ({
                ...prev,
                day: {
                    ...prev.day,
                    specialDayDate: formattedDate,
                },
            }));
        }
        // Clear errors for the field being changed
        if (errors?.specialDayDate) {
            setErrors(prev => ({ ...prev, specialDayDate: "" }));
        }
    };

    // const handleFromDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    //     if (value?.startDate) {
    //         const formattedDate = new Date(value.startDate)
    //             .toISOString()
    //             .split("T")[0];
    //         setSelectFromDate(value);
    //         setFormData((prev: any) => ({
    //             ...prev,
    //             week: {
    //                 ...prev.week,
    //                 weekStartDate: formattedDate,
    //             },
    //         }));
    //     }
    //     // Clear errors for the field being changed
    //     /* if (errors?.weekStartDate) {
    //         setErrors(prev => ({ ...prev, weekStartDate: "" }));
    //     } */
    // };

    // const handleToDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    //     if (value?.startDate) {
    //         const formattedDate = new Date(value.startDate)
    //             .toISOString()
    //             .split("T")[0];
    //         setSelectToDate(value);
    //         setFormData((prev: any) => ({
    //             ...prev,
    //             week: {
    //                 ...prev.week,
    //                 weekEndDate: formattedDate,
    //             },
    //         }));
    //     }
    //     // Clear errors for the field being changed
    //     /*  if (errors?.weekEndDate) {
    //          setErrors(prev => ({ ...prev, weekEndDate: "" }));
    //      } */
    // };

    const dateObj = { selectSpecialDate, selectFromDate, selectToDate, handleSpecialDate };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (name === "company") {
            if (value === "") {
                setRestaurant([]);
            } else {
                getRestaurant(value);
            }

            setFormData((prev: any) => ({
                ...prev,
                restaurant: "",
            }));
        }

        // Day fields
        if (name === "specialDayName" || name === "specialDayDate") {
            setFormData((prev: any) => ({
                ...prev,
                day: {
                    ...prev.day,
                    [name]: value,
                },
            }));

            return;
        }

        // Work time fields (timeStartTime, timeEndTime)
        if (name === "timeStartTime" || name === "timeEndTime") {
            setFormData((prev: any) => ({
                ...prev,
                time: {
                    ...prev.time,
                    [name]: value,
                },
            }));

            // Clear errors for the field being changed
            if (errors[name as keyof ErrorState]) {
                setErrors((prev) => ({
                    ...prev,
                    [name]: "",
                }));
            }

            return;
        }

        // Week days
        if ((e.target as any).type === "weekDays") {
            setFormData((prevState: any) => {
                const prevWeek = prevState?.week || {};

                return {
                    ...prevState,
                    week: {
                        ...prevWeek,
                        [name]: !(prevWeek?.[name] === true || prevWeek?.[name] === "true"),
                    },
                };
            });

            return;
        }

        // Default fields
        setFormData((prev: any) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));

        // Clear errors
        if (errors[name as keyof ErrorState]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const isValid = (): boolean => {
        let isValid = true;
        const errorMessage: Partial<ErrorState> = {};

        if (loginRole === SUPER_ADMIN && !formData.company) {
            errorMessage.company = "Please select a business.";
            isValid = false;
        }
        if (!formData.restaurant) {
            errorMessage.restaurant = "Please select a restaurant.";
            isValid = false;
        }

        // Basic validation for formData fields
        if (!formData.name) {
            errorMessage.name = "Please enter a meal period name.";
            isValid = false;
        }

        if (!formData.startTime && !formData.isFullDay) {
            errorMessage.startTime = "Please enter a start time.";
            isValid = false;
        }
        if (!formData.endTime && !formData.isFullDay) {
            errorMessage.endTime = "Please enter an end time.";
            isValid = false;
        }

        const start = parseTimeStringToDate(formData.startTime);
        const end = parseTimeStringToDate(formData.endTime);

        if (!formData.isFullDay) {
            if (!formData.startTime) {
                errorMessage.startTime = "Please enter a start time.";
                isValid = false;
            }

            if (!formData.endTime) {
                errorMessage.endTime = "Please enter an end time.";
                isValid = false;
            }

            if (start && end) {
                if (end <= start) {
                    errorMessage.endTime =
                        "End time must be greater than start time.";
                    isValid = false;
                }
            }
        }

        // if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        //     errorMessage.endTime = "End time must be greater than start time.";
        //     isValid = false;
        // }

        // Additional validations for 'mealPlan' as 'time'
        if (formData.mealPlan === 'time') {

            if (formData.time) {
                formData.time.timeStartTime = formData.startTime;
            }
            if (formData.time) {
                formData.time.timeEndTime = formData.endTime;
            }
            // Ensure that the start time is not before the meal period's start time
            if (formData.startTime && formData.time?.timeStartTime && formData.startTime && formData.time?.timeStartTime < formData.startTime) {
                errorMessage.timeStartTime = "The meal plan start time must be greater than or equal to the meal period's start time.";
                isValid = false;
            }

            // Ensure that the meal plan's start time is before the end time
            if (formData.time?.timeStartTime && formData.time?.timeEndTime && formData.time?.timeEndTime < formData.time?.timeStartTime) {
                errorMessage.timeEndTime = "The meal plan end time must be greater than the meal plan start time.";
                isValid = false;
            }

            // Ensure that the meal plan's end time is not greater than the meal period's end time
            if (formData.time?.timeStartTime && formData.time?.timeEndTime && formData.time?.timeEndTime > formData.endTime) {
                errorMessage.timeEndTime = "The meal plan end time cannot be later than the meal period's end time.";
                isValid = false;
            }

            // Ensure that start time and end time are not identical
            if (formData.time?.timeStartTime && formData.time?.timeEndTime && formData.time?.timeStartTime === formData.time?.timeEndTime) {
                errorMessage.timeEndTime = "The meal plan end time cannot be the same as the start time.";
                isValid = false;
            }
        }

        if (formData.mealPlan === 'day') {
            if (!formData.day?.specialDayDate) {
                errorMessage.specialDayDate = "Please select the date for the special day.";
                isValid = false;
            }
        }

        if (formData.mealPlan === 'week') {
            if (Object.keys(formData.week ?? {}).length === 0) {
                errorMessage.week = "Please choose any one day of week.";
                isValid = false;
            }
        }

        if (formData.mealPlan === 'month') {
            if (!formData?.month) {
                errorMessage.month = "Please select the month.";
                isValid = false;
            }
        }

        setErrors(prev => ({ ...prev, ...errorMessage }));
        return isValid;
    };

    const addEditMealPeriod = async () => {
        setFormData(initialFormData);

        if (loginRole === SUPER_ADMIN) {
            if (companies.length === 0) {
                await getCompany();
            }
        } else {
            const companyId = userData?.staffMember?.company?._id;

            if (companyId && restaurant.length === 0) {
                await getRestaurant(companyId);
            }
        }

        setIsOpenModal(true);
    };

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                // setIsLoading(true);
                setIsButtonLoading(true);
                let response: any;

                if (formData?.mealPlan === 'time' && (!formData?.time?.timeStartTime || !formData?.time?.timeEndTime)) {
                    if (formData?.time && formData.endTime) {
                        formData.time.timeStartTime = formData.startTime;
                        formData.time.timeEndTime = formData.endTime;
                    }
                }
                if (formData?.mealPlan === 'time') {
                    formData.isFullDay = false;
                }

                if (formData?._id) {
                    // Edit existing meal period
                    const submitData: any = { ...formData };

                    const fieldsToRemove: Record<string, string[]> = {
                        'time': ['month', 'week', 'day'],
                        'day': ['month', 'week', 'time'],
                        'week': ['month', 'day', 'time'],
                        'month': ['week', 'day', 'time'],
                    };

                    // Remove fields based on the selected meal plan
                    const fields = fieldsToRemove[formData.mealPlan] || [];
                    fields.forEach(field => delete submitData[field]);

                    response = await apiClient.patch(`/meal/${formData._id}`, submitData);
                    toast.success(response?.data?.message || 'Meal period updated successfully.');

                    // Update the state with the new data
                    setMealPeriods((prevMealPeriods) =>
                        prevMealPeriods.map((mealPeriod) =>
                            mealPeriod._id === formData._id ? response.data.data : mealPeriod
                        )
                    );
                } else {
                    response = await apiClient.post('/meal/add', formData);
                    if (response.data.status !== 1) {
                        return toast.error(response?.data?.message);
                    }
                    toast.success(response?.data?.message || 'Meal period added successfully.');

                    // Add the new meal period to the state
                    // setMealPeriods((prevMealPeriods) => [response.data.data, ...prevMealPeriods]);
                    // const newData = response.data.data
                    // setMealPeriods((prevData: any) => {
                    //     const updatedData = [...prevData];
                    //     if (prevData?.length >= limit) {
                    //         updatedData?.pop();
                    //     }
                    //     return [newData, ...updatedData];
                    // });
                    // setNumOfRecords((prev: any) => prev + 1);
                }

                setTimeout(() => {
                    onCloseModal();
                    setIsButtonLoading(false);
                }, 1000);
            } catch (error: any) {
                console.error('Error during form submission:', error);
                toast.error(error?.response?.data?.message || 'There was an issue with the request.');
                // setIsLoading(false);
                setIsButtonLoading(false);
            }
        }
    };

    const handleEdit = (item: IMealPeriod | any) => {
        if (item.mealPlan === 'time') {
            setFormData({
                ...item,
                day: { specialDayName: "", specialDayDate: "" },
                week: {},
                month: '',
            });
        } else if (item.mealPlan === 'day') {
            setFormData({
                ...item,
                time: {},
                week: {},
                month: '',
            });
            setSelectSpecialDate({ startDate: item.day.specialDayDate, endDate: item.day.specialDayDate })
        } else if (item.mealPlan === 'week') {
            const allWeekDays = allDays.reduce((acc, day) => {
                acc[day] = false;
                return acc;
            }, {} as Record<typeof allDays[number], boolean>);;

            const mergedWeek = {
                ...allWeekDays,
                ...Object.fromEntries(
                    Object.entries(item.week || {}).map(([key, val]) => [key, val === "true" || val === true])
                )
            };

            setFormData({
                ...item,
                time: {},
                day: {},
                month: '',
                week: mergedWeek
            });
        }
        else if (item.mealPlan === 'month') {
            setFormData({
                ...item,
                time: {},
                day: {},
                week: {},
            });
        } else {
            // If no specific meal plan is selected, just set the form data normally
            setFormData(item);
        }
        getRestaurant(item.company?._id);
        setErrors({
            company: '',
            restaurant: '',
            name: '',
            startTime: '',
            endTime: '',
            timeStartTime: '',
            timeEndTime: '',
            specialDayName: '',
            specialDayDate: '',
            month: ''
        });
        setIsOpenModal(true);
    };


    const handleDelete = async () => {
        if (!selectedId) return;
        setIsDeleteOpen(false);
        setSelectedId(null);
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/meal/${selectedId}`, {});

            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }

            setMealPeriods(mealPeriods.filter(item => item._id !== selectedId));

            getMealPeriods();
            if (mealPeriods?.length === 0) {
                // curPage(page - 1)
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setTimeout(() => {
                setIsLoading(false);
                setNumOfRecords(numOfRecords - 1)
            }, 500);

        } catch (error) {
            console.error('Delete meal period error:', error);
            toast.error('Failed to delete the meal period. Please try again.');
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsDeleteOpen(true);
    };

    const onCloseModal = () => {
        setIsOpenModal(false);
        setFormData(initialFormData);
        setSelectSpecialDate({
            startDate: null,
            endDate: null,
        });
        setSelectFromDate({
            startDate: null,
            endDate: null,
        });
        setSelectToDate({
            startDate: null,
            endDate: null,
        });
        setErrors({
            company: '',
            restaurant: '',
            name: '',
            startTime: '',
            endTime: '',
            timeStartTime: '',
            timeEndTime: '',
            specialDayName: '',
            specialDayDate: '',
            month: ''
        });

        if (loginRole === SUPER_ADMIN) {
            setRestaurant([]);

            setFormData((prev) => ({
                ...prev,
                company: '',
                restaurant: '',
            }));
        }
    };

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getMealPeriods();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, getMealPeriods, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setQueryData((prev) => ({ ...prev, limit: data }));
    };

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/meal_periods/${updatedFormData.page}/${queryParams}`);
    };

    const curPage = (pageNum: any) => {
        if (pageNum !== page) {
            setIsLoading(true)
            setQueryData((prev) => {
                const updatedFormData = { ...prev, page: pageNum };
                updateURL(updatedFormData);
                return updatedFormData;
            });
        }
        setPage(pageNum);
    };

    useEffect(() => {
        if (Object.values(searchFilter).some((value) => value !== "") ||
            Object.values(searchFilter).every((value) => value === "")) {

            if (queryData?.page !== 1) {
                setQueryData((prev) => ({ ...prev, page: 1 }));
                setPage(1);
            }
        }
    }, [searchFilter]);


    useEffect(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
        const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

        setQueryData((prev) => ({
            ...prev,
            page: pageFromURL,
            limit: limitFromURL,
        }));

        setPage(pageFromURL);
        setLimit(limitFromURL);
    }, []);

    const navigateSearchPrams = useCallback(() => {
        setIsLoading(true);
        updateURL(queryDataRef.current);
        setLimit(queryDataRef.current?.limit)
        setPage(queryDataRef.current?.page);
    }, [searchFilter, queryData]);

    useEffect(() => {
        navigateSearchPrams();
    }, [searchFilter, navigateSearchPrams]);

    const socket = useSocket()
    const socketAllowDataPermission = (data: any) => {
        let status = false
        if (loginRole === "Super Admin") {
            status = true
        } else if (MANAGER_ROLES.includes(loginRole)) {
            if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
                status = true
            }
        } else if (!MANAGER_ROLES.includes(loginRole)) {
            if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
                status = true
            }
        }
        return status
    }

    useEffect(() => {
        const addMealPeriod = (data: any) => {
            if (socketAllowDataPermission(data)) {
                setMealPeriods((prevData: any) => {
                    const updatedData = [...prevData];
                    if (prevData?.length >= limit) {
                        updatedData?.pop();
                    }
                    return [data, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updateMealPeriod = (data: any) => {
            setMealPeriods((prev: any) => prev.map((item: any) => item._id === data._id ? data : item));
        };
        const deleteMealPeriod = (data: any) => {
            // setMealPeriods((prev: any) => prev.filter((item: any) => item._id !== data._id));
            const exists = mealPeriods?.some((item: any) => {
                return String(item._id) === String(data._id)
            });
            if (!exists) {
                setIsLoading(false)
                return
            };
            setMealPeriods(mealPeriods.filter(item => item._id !== data?._id));
            getMealPeriods();
            if (mealPeriods?.length === 0) {
                // curPage(page - 1)
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setNumOfRecords(numOfRecords - 1)
        };

        socket.on("addMealPeriod", addMealPeriod);
        socket.on("updateMealPeriod", updateMealPeriod);
        socket.on("deleteMealPeriod", deleteMealPeriod);

        return () => {
            socket.off("addMealPeriod", addMealPeriod);
            socket.off("updateMealPeriod", updateMealPeriod);
            socket.off("deleteMealPeriod", deleteMealPeriod);
        };
    }, [socket, mealPeriods]);
    const [showFilters, setShowFilters] = useState(false);

    const handleFilter = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, company: value }))
    }

    return (
        <div className={divContainerStyle}>
            <div>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Meal Periods" />
                </div>

                {/* Filters Section */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <button
                            className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white whitespace-nowrap"
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
                                value={searchFilter.name}
                                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                                placeholder="Search ..."
                                className="h-[42px] self-center"
                            />
                        )}
                    </div>

                    <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                        <span onClick={() => addEditMealPeriod()} className="w-full sm:w-auto">
                            <AddActionButton text="Add a new meal period" />
                        </span>
                    </div>
                </div>
                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="tax" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                            <Table.Cell colSpan={8} className="text-center py-4">
                                <ListLoader />
                            </Table.Cell>
                        </Table.Row>}
                        {!isLoading && mealPeriods?.length > 0 ? mealPeriods?.map((item: any, index: number) => (
                            <Table.Row key={item?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{capitalized(item?.name) ?? '-'}</Table.Cell>
                                {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{capitalized(item?.company?.name) ?? '-'}</Table.Cell>}
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{formatTime(item?.startTime) ?? '-'}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{formatTime(item?.endTime) ?? '-'}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                    {labelLayout(item.isActive ? 'activated' : 'deactivated')}
                                </Table.Cell>
                                {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                    {item?.isActive ? "Activated" : "DeActivated"}
                                </Table.Cell> */}
                                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button className={editBtnStyle.btn} onClick={() => handleEdit(item)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                                    <Button onClick={() => confirmDelete(item._id!)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                </Table.Cell>
                            </Table.Row>
                        )) : isLoading === false && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Meal Periods Found"
                                        message="No meal periods are available right now. Added meal periods will appear here."
                                    />
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {numOfRecords > 0 &&
                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700 ">
                        {numOfRecords > 10 && <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                            <PageSize
                                handleLimit={handleLimit}
                                limit={limit}
                            />
                        </div>}
                        <div className="float-right">
                            <Pagination
                                className="pagination-bar"
                                currentPage={page}
                                totalCount={numOfRecords}
                                pageSize={limit}
                                onPageChange={(x: any) => curPage(x)}
                            />
                        </div>
                    </div>}
            </div>
            {isOpenModal && (
                <MealPeriodFormModal
                    isOpen={isOpenModal}
                    onClose={onCloseModal}
                    formData={formData}
                    errors={errors}
                    companies={companies}
                    restaurant={restaurant}
                    months={months}
                    loginRole={loginRole}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    isButtonLoading={isButtonLoading}
                    dateObj={dateObj}
                />
            )}
            <ConfirmModal
                isOpen={isDeleteOpen}
                message="Are you sure you want to delete this meal period?"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </div>
    );
}

export default MealPeriods;
