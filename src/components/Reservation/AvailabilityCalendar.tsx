import React, { useEffect, useState, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, add, isToday, isBefore, isSameDay } from "date-fns";
import { FaChevronLeft, FaChevronRight, FaCircle } from "react-icons/fa";
import apiClient from "../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import ReservationModal from "./ReservationModal";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import { useSocket } from "../../context/SocketProvider";
import { OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { capitalized, convertTimeSlotTo12HourFormat, formatDate, setTitle } from "../../utils/utility";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { useConfigs } from "../../context/SiteConfigsProvider";

interface Reserved {
    date: string;
    reservedTimes: { [key: string]: { isFull: boolean } };
}

const AvailabilityCalendar: React.FC = () => {
    setTitle("Availability Calendar");
    const socket = useSocket();
    const { userData } = useAuth();
      const { configData } = useConfigs();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [mockReserved, setMockReserved] = useState<Reserved[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [timeSlotsExceptions, setTimeSlotsExceptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState<{ message?: string }>({});

    const isSuperAdmin = loginRole === SUPER_ADMIN;
    const isOwner = OWNER_ROLES.includes(loginRole);

    const today = useMemo(() => new Date(), []);

    const { firstDayOfGrid, lastDayOfGrid, days } = useMemo(() => {
        const firstDayOfMonth = startOfMonth(currentMonth);
        const lastDayOfMonth = endOfMonth(currentMonth);
        const firstDayOfGrid = startOfWeek(firstDayOfMonth);
        const lastDayOfGrid = endOfWeek(lastDayOfMonth);

        const daysArray = [];
        let day = firstDayOfGrid;
        while (day <= lastDayOfGrid) {
            daysArray.push(day);
            day = add(day, { days: 1 });
        }
        return { firstDayOfGrid, lastDayOfGrid, days: daysArray };
    }, [currentMonth]);

    const selectedRoom = useMemo(() => {
        return rooms.find((r) => r._id === selectedRoomId) || null;
    }, [rooms, selectedRoomId]);

    const fetchAvailability = useCallback(async () => {
        if (!selectedRoom) return;
        try {
            setIsLoading(true);
            const response = await apiClient.get('/reservations/availability', {
                params: {
                    month: currentMonth.getMonth() + 1,
                    year: currentMonth.getFullYear(),
                    startDate: firstDayOfGrid,
                    endDate: lastDayOfGrid,
                    room: selectedRoom._id,
                    restaurant: selectedRestaurant?._id,
                    company: selectedCompany?._id,
                },
            });
            const { timeSlots, reserved } = response.data;
            if (response.data.success) {
                setMockReserved(reserved);
                if (!timeSlots) {
                    // toast.error("No available time slots found.");
                    setErrorMessage({ message: "No time slots found for the criteria you've selected." })
                }
                if (timeSlots?.defaultSlots.length > 0) {
                    setTimeSlots(timeSlots.defaultSlots.map((slot: any) => {
                        // return `${slot.start}-${slot.end}`;
                        return `${slot.start}`;
                    }));
                }

                setTimeSlotsExceptions(timeSlots?.exceptions);
                setErrorMessage({});
            } else {
                setErrorMessage({ message: response.data.message || "Failed to fetch availability." })
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setTimeout(() => setIsLoading(false), 1000);
        }
    }, [currentMonth, selectedRoom, selectedRestaurant, selectedCompany]);

    const fetchRooms = useCallback(async (restaurantId: string | null, companyId?: string | null) => {
        try {
            setErrorMessage({});
            setIsLoading(true);
            const params: Record<string, string> = {};
            if (restaurantId) params.restaurant = restaurantId;
            if (companyId) params.company = companyId;
            const response = await apiClient.get('/table/room', { params });
            if (response.data.success && response.data.rooms.length > 0) {
                setRooms(response.data.rooms);

                const roomExists = response.data.rooms.some(
                    (r: any) => r._id === selectedRoomId
                );

                if (!roomExists) {
                    setSelectedRoomId(response.data.rooms[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    }, []);

    const getCompany = useCallback(async () => {
        setErrorMessage({});
        const response = await apiClient.get('/company');
        if (response.data.success) {
            const companies = response.data.companies;
            setCompanies(companies);
            setSelectedCompany(response.data.companies[0])
            fetchRestaurants(companies[0]._id);
            fetchCustomers(companies[0]._id);
        } else {
            emptyAll('company');
        }
    }, []);

    const fetchRestaurants = useCallback(async (companyId: string) => {
        setErrorMessage({});
        const response = await apiClient.get(`/restaurant/company/${companyId}`);
        if (response.data.success) {
            if (response.data.restaurant.length > 0) {
                setRestaurants(response.data.restaurant);
                setSelectedRestaurant(response.data.restaurant[0]);
                // pass both restaurantId and companyId so rooms are scoped correctly
                fetchRooms(response.data.restaurant[0]._id, companyId);
            } else {
                setErrorMessage({ message: "No restaurants found for your selected business. Want to try a different business?" });
            }
        } else {
            emptyAll('restaurant');
        }
    }, [fetchRooms]);

    const fetchCustomers = useCallback(async (companyId: string) => {
        try {
            const response = await apiClient.get(`/customer?company=${companyId}`);
            const { data, status: success, count } = response.data;
            if (success && count > 0) {
                setCustomers(data);
            } else {
                // Don't block the calendar UI — just empty the list
                setCustomers([]);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
        }
    }, []);

    const emptyAll = useCallback((actionModule: string) => {
        setSelectedDate(null);
        if (actionModule === 'company') {
            setCompanies([]);
            setSelectedCompany(null);
            setRestaurants([]);
            setSelectedRestaurant(null);
            setRooms([]);
            setSelectedRoomId("");
            setMockReserved([]);
            setTimeSlots([]);
        } else if (actionModule === 'restaurant') {
            setRestaurants([]);
            setSelectedRestaurant(null);
            setRooms([]);
            setSelectedRoomId("");
            setMockReserved([]);
            setTimeSlots([]);
        } else if (actionModule === 'room') {
            setRooms([]);
            setSelectedRoomId("");
            setMockReserved([]);
            setTimeSlots([]);
        }
    }, []);

    useEffect(() => {
        if (selectedRoomId) {
            fetchAvailability();
        }
    }, [currentMonth, selectedRoomId]);

    useEffect(() => {
        if (isSuperAdmin) {
            getCompany();
        } else if (!isOwner) {
            fetchRooms(null, userData?.staffMember?.company?._id || null);
        } else {
            fetchRestaurants(userData?.staffMember?.company?._id);
            fetchCustomers(userData?.staffMember?.company?._id);
        }
    }, []);

    useEffect(() => {
        const addTimeSlots = (data: any) => setTimeSlots(data);
        socket.on('addReservationTimeSlots', addTimeSlots);
        return () => socket.off('addReservationTimeSlots');
    }, [socket]);

    const handleCompanyChange = useCallback((value: any) => {
        emptyAll('restaurant');
        const company = companies.find((c: any) => c._id === value);
        setSelectedCompany(company);
        fetchRestaurants(company._id);
        fetchCustomers(company._id);
    }, [companies, fetchRestaurants, fetchCustomers, emptyAll]);

    const handleRestaurantChange = useCallback((value: any) => {
        emptyAll('room');
        const restaurant = restaurants.find((r: any) => r._id === value);
        setSelectedRestaurant(restaurant);
        // pass both IDs explicitly — selectedCompany is stable here since it was set before restaurant change
        fetchRooms(restaurant._id, selectedCompany?._id || null);
    }, [restaurants, fetchRooms, emptyAll, selectedCompany]);

    const handleRoomChange = useCallback((value: any) => {
        const room = rooms.find((r: any) => r._id === value);
        setSelectedRoomId(room?._id || "" || value);
    }, [rooms]);

    const getReservation = useCallback((date: Date) => mockReserved.find((d) => isSameDay(new Date(d.date), date)), [mockReserved]);

    const handleDateClick = useCallback((date: Date) => {
        setSelectedDate(null);
        if (!isBefore(date, today)) setSelectedDate(date);
    }, [today]);

    const isTimeSlotPast = useCallback((timeSlot: string, date: Date) => {
        const [startTime] = timeSlot.split("-");
        const [hours, minutes] = startTime.split(":");
        const slotTime = new Date(date);
        slotTime.setHours(parseInt(hours), parseInt(minutes));
        return isBefore(slotTime, today);
    }, [today]);

    const bookReservation = useCallback(async (formData: any) => {
        try {
            const response = await apiClient.post('/reservations/create', formData);
            if (response.data.success) {
                toast.success("Reservation successfully booked!");
                setOpenModal(false);
                fetchAvailability();
            } else {
                setErrorMessage({
                    message: "Failed to book the reservation. Please try again.",
                });
                // toast.error("Failed to book the reservation. Please try again.");
            }
        } catch (error) {
            console.error('Error booking reservation:', error);
            setErrorMessage({
                message: "An error occurred while booking the reservation.",
            });
            // toast.error("An error occurred while booking the reservation.");
        }
    }, [fetchAvailability]);

    const renderDay = useCallback((day: Date, index: number) => {
        const isSameDayDate = selectedDate && isSameDay(day, selectedDate);
        const isPast = isBefore(day, today);
        let reservation: any = getReservation(day);
        const isHoliday = timeSlotsExceptions?.some((ex: any) => isSameDay(new Date(ex.date), day) && ex.isHoliday);
        const hasAvailableSlots = isToday(day)
            ? timeSlots.some((slot) => !isTimeSlotPast(slot, day) && !reservation?.reservedTimes?.[slot]?.isFull)
            : true;

        let futureTimeSlots: any;
        let todaySlots = false;
        if (isSameDay(day, today)) {
            todaySlots = true;
        }
        if (todaySlots) {
            futureTimeSlots = timeSlots.some((slot: any) => !isTimeSlotPast(slot, day));
            const pastTimeSlots: any = timeSlots.filter((slot: any) => isTimeSlotPast(slot, day));
            if (!reservation) {
                reservation = { date: day, reservedTimes: {} };
            }
            if (!reservation.reservedTimes) {
                reservation.reservedTimes = {};
            }
            pastTimeSlots.forEach((slot: any) => {
                reservation.date = day;
                reservation.reservedTimes[slot] = { isFull: true };
            });
        }

        const holiday: any = timeSlotsExceptions?.find(
            (ex: any) => isSameDay(new Date(ex.date), day) && ex.isHoliday
        );
        const holidayName = holiday ? holiday.holidayName : null;
        // const isDisabled = restaurants.length === 0 || rooms.length === 0 || timeSlots.length === 0;
        const isDisabled = rooms.length === 0 || timeSlots.length === 0;
        return (
            <div
                key={index}
                onClick={() => {
                    if (isDisabled) {
                        return;
                    }
                    setErrorMessage({});
                    if (isHoliday || (isPast && !futureTimeSlots)) {
                        setSelectedDate(null);
                        setErrorMessage({
                            message: isHoliday ? `The selected date is a holiday of ${holidayName}.` : "The selected date has already passed.",
                        });
                        return;
                    }
                    if (futureTimeSlots) {
                        setMockReserved([...mockReserved, reservation]);
                        setSelectedDate(day);
                        return;
                    }
                    handleDateClick(day);
                }}
                className={`relative p-6 rounded-lg 
                        ${isDisabled ? "opacity-50 cursor-not-allowed bg-DARK-300 dark:bg-DARK-400 text-DARK-600 dark:text-DARK-900" : "cursor-pointer"}
                        ${isPast && !isDisabled ? "bg-DARK-300 dark:bg-DARK-300 text-DARK-400 dark:text-DARK-400" : ""}
                        ${isSameDayDate && !isDisabled ? "!bg-BRAND-500 text-white hover:!bg-BRAND-600 !font-semibold" : ""}
                        ${hasAvailableSlots && !isPast && !isDisabled ? "bg-green-300 dark:bg-slate-800 text-green-950 dark:text-white hover:bg-green-400 dark:hover:bg-green-600" : ""}
                        ${!hasAvailableSlots && !isSameDayDate && !isPast && !isDisabled ? "bg-DARK-200 dark:bg-DARK-800 text-DARK-800 dark:text-DARK-200" : ""}
                        ${isToday(day) && !isDisabled ? "border-2 border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700" : ""}
                        ${isHoliday && !isDisabled ? "!bg-red-200 dark:!bg-red-800 !text-red-800 dark:!text-red-100 hover:!bg-red-300 dark:hover:!bg-red-700" : ""}`
                }
            >
                {reservation && (
                    <span className="absolute top-0 right-0 text-xs m-1" title="Table Reserved on that day">
                        <FaCircle className=" rounded-full" />
                    </span>
                )}
                <div className="font-semibold mr-1">{format(day, "d")}</div>
                {/* {holidayName ? <small>{holidayName}</small> : null} */}
            </div>
        );
    }, [selectedDate, today, timeSlots, timeSlotsExceptions, mockReserved, handleDateClick, isTimeSlotPast]);

    const getSkeletonCount = () => {
        if (loginRole === SUPER_ADMIN) return 3;
        if (OWNER_ROLES.includes(loginRole)) return 2;
        return 1;
    };

    const skeletonCount = getSkeletonCount();

    return (
        <div className="min-h-screen bg-DARK-100 dark:bg-DARK-900">
            <FormHeaderPaths page={'Calendar'} prevLink='/reservation/bookings/1' prevPage='Reservation' />
            <div className="-max-w-5xl -mx-auto p-8">
                <div className="bg-white dark:bg-DARK-800 rounded-3xl shadow-md px-8 py-6 border border-DARK-200 dark:border-DARK-800">
                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="flex space-x-6 mb-6">
                                {Array(skeletonCount).fill(0).map((_, i) => (
                                    <div key={i} className="w-1/4">
                                        <div className="h-6 bg-DARK-200 rounded-md mb-2" />
                                        <div className="h-10 bg-DARK-200 rounded-md" />
                                    </div>
                                ))}
                            </div>
                            <hr className="my-6 border-DARK-200" />
                            <div className="flex justify-between mb-6">
                                <div className="w-10 h-10 bg-DARK-200 rounded-full" />
                                <div className="w-32 h-10 bg-DARK-200 rounded-md" />
                                <div className="w-10 h-10 bg-DARK-200 rounded-full" />
                            </div>
                            <div className="grid grid-cols-7 gap-3">
                                {Array(7).fill(0).map((_, i) => (
                                    <div key={i} className="h-8 bg-DARK-200 rounded-md" />
                                ))}
                                {Array(42).fill(0).map((_, i) => (
                                    <div key={i} className="p-8 bg-DARK-200 rounded-md" />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-3">
                                {loginRole === SUPER_ADMIN && (
                                    <div>
                                        <label className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-2">Business</label>
                                        {/* <Select
                                            onChange={handleCompanyChange}
                                            value={selectedCompany?._id}
                                            className="w-full rounded-md border-DARK-300 focus:ring-1 focus:ring-BRAND-500 focus:border-BRAND-500 py-2.5 transition-colors duration-150"
                                        >
                                            {companies.map((company) => (
                                                <option key={company._id} value={company._id}>
                                                    {capitalized(company.name)}
                                                </option>
                                            ))}
                                        </Select> */}
                                        <DropdownWithSearch
                                            setSelectedItem={setSelectedCompany}
                                            selectedItem={companies?.find((c: any) => c._id === selectedCompany?._id)?.name || ''}
                                            items={companies}
                                            title="Business"
                                            handleFilter={handleCompanyChange}
                                            fieldKey="company"
                                        />
                                    </div>
                                )}

                                {OWNER_ROLES.includes(loginRole) && (
                                    <div>
                                        <label className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-2">Restaurant</label>
                                        {restaurants.length > 0 ? (
                                            <DropdownWithSearch
                                                setSelectedItem={setSelectedRestaurant}
                                                selectedItem={restaurants?.find((c: any) => c._id === selectedRestaurant?._id)?.name || ''}
                                                items={restaurants}
                                                title="Restaurant"
                                                handleFilter={handleRestaurantChange}
                                                fieldKey="restaurant"
                                            />
                                        ) : (
                                            <div className="w-full px-4 py-2.5 text-sm text-DARK-400 dark:text-DARK-500 bg-DARK-50 dark:bg-DARK-700 border border-DARK-200 dark:border-DARK-600 rounded-lg italic">
                                                No restaurants available
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-2">Room</label>
                                    <DropdownWithSearch
                                        setSelectedItem={setSelectedRoomId}
                                        selectedItem={rooms?.find((c: any) => c._id === selectedRoomId)?.name || ''}
                                        items={rooms}
                                        title="Room"
                                        handleFilter={handleRoomChange}
                                        fieldKey="room"
                                    />
                                </div>
                            </div>
                            {errorMessage.message && (
                                <div className="text-ERROR_HOVER text-sm mb-6 text-center font-medium bg-red-50 p-3 rounded-md border border-red-200 dark:bg-red-900 dark:border-red-700 dark:text-red-100">
                                    {errorMessage.message}
                                </div>
                            )}
                            <hr className="my-6 border-DARK-200" />
                            {/* <div className={`${rooms.length === 0 || timeSlots.length === 0 ? 'bg-DARK-100 dark:bg-DARK-400 p-2 rounded-xl pointer-events-none' : ''}`}> */}
                            <div className={`p-2 rounded-xl ${rooms.length === 0 || timeSlots.length === 0 ? 'bg-DARK-100 text-DARK-400 dark:bg-DARK-600 dark:text-DARK-500 pointer-events-none opacity-50' : 'bg-DARK-50 text-black dark:bg-DARK-900 dark:text-white'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        disabled={rooms.length === 0 || timeSlots.length === 0}
                                        onClick={() => { setCurrentMonth(add(currentMonth, { months: -1 })); setSelectedDate(null); }}
                                        // className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-150 shadow-sm"
                                        className={`flex items-center justify-center p-2 h-10 w-10 rounded-full transition-colors duration-150 shadow-sm
                                            ${rooms.length === 0 || timeSlots.length === 0
                                                ? "bg-DARK-300 text-DARK-500 cursor-not-allowed"
                                                : "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                            }`}
                                    >
                                        <FaChevronLeft className="w-4 h-4" />
                                    </button>
                                    <h2
                                        onClick={() => { setCurrentMonth(today); setSelectedDate(null); }}
                                        className="text-2xl font-semibold text-DARK-800 dark:text-DARK-200 cursor-pointer hover:text-BRAND-500 transition-colors duration-150"
                                        title="Go to current month"
                                    >
                                        {format(currentMonth, "MMMM yyyy")}
                                    </h2>
                                    <button
                                        disabled={rooms.length === 0 || timeSlots.length === 0}
                                        onClick={() => { setCurrentMonth(add(currentMonth, { months: 1 })); setSelectedDate(null); }}
                                        // className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-150 shadow-sm"
                                        className={`flex items-center justify-center p-2 h-10 w-10 rounded-full transition-colors duration-150 shadow-sm
                                            ${rooms.length === 0 || timeSlots.length === 0
                                                ? "bg-DARK-300 text-DARK-500 cursor-not-allowed"
                                                : "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                            }`}
                                    >
                                        <FaChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-3 text-center">
                                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                                        <div key={day} className="text-sm font-medium text-DARK-600 dark:text-white">{day}</div>
                                    ))}
                                    {days.map(renderDay)}
                                </div>

                                {selectedDate && timeSlots.length > 0 && (
                                    <div className="mt-8 bg-white dark:bg-DARK-800 p-5 rounded-xl border-t-2 border-t-DARK-200 dark:border-t-DARK-600">
                                        <h3 className="text-lg font-semibold text-DARK-800 dark:text-DARK-100 mb-3">
                                            Select Time for <span className="text-BRAND-500 font-medium">{formatDate(selectedDate,configData?.dateFormat)}</span>
                                        </h3>
                                        {/* <div className="grid grid-cols-2 gap-x-4">
                                            <div>
                                                <label htmlFor="date" className="block text-sm text-DARK-800 dark:text-DARK-100 mb-1">
                                                    Choose a date:
                                                </label>
                                                <input
                                                    type="date"
                                                    id="date"
                                                    value={format(selectedDate, "yyyy-MM-dd")}
                                                    // onChange={handleDateChange}
                                                    className="w-full p-2 border rounded-md bg-white dark:bg-DARK-700 text-DARK-800 dark:text-DARK-100 focus:outline-none focus:ring-2 focus:ring-BRAND-500"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="time" className="block text-sm text-DARK-800 dark:text-DARK-100 mb-1">
                                                    Choose a time:
                                                </label>
                                                <input
                                                    type="time"
                                                    id="time"
                                                    // value={selectedTime}
                                                    // onChange={handleTimeChange}
                                                    className="w-full p-2 border rounded-md bg-white dark:bg-DARK-700 text-DARK-800 dark:text-DARK-100 focus:outline-none focus:ring-2 focus:ring-BRAND-500"
                                                />
                                            </div>
                                        </div> */}

                                        {/* <hr /> */}
                                        {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"> */}
                                        <div className="">
                                            {/* {timeSlots.map((timeSlot, index) => {
                                                const selectedDayReservation = getReservation(selectedDate);
                                                const isTimeReserved = selectedDayReservation?.reservedTimes[timeSlot]?.isFull;
                                                const isDisabled = timeSlotsExceptions.some((ex: any) => isSameDay(new Date(ex.date), selectedDate) && ex.isHoliday);
                                                const unavailableSlots = timeSlotsExceptions.some((ex: any) => isSameDay(new Date(ex.date), selectedDate) && ex?.unavailableSlots?.includes(index));

                                                return (
                                                    <button
                                                        key={timeSlot}
                                                        onClick={() => {
                                                            if (isTimeReserved || unavailableSlots || isDisabled) {
                                                                setErrorMessage({
                                                                    message: isTimeReserved
                                                                        ? "Selected time slot is full."
                                                                        : unavailableSlots
                                                                            ? "Selected time slot is unavailable."
                                                                            : "Selected date is a holiday.",
                                                                });
                                                                return;
                                                            }
                                                            setOpenModal(true);
                                                            setErrorMessage({});
                                                            setSelectedObject({ date: selectedDate, timeSlot, room: selectedRoom });
                                                        }}
                                                        className={`px-4 py-2 rounded-md font-medium transition-colors duration-150 shadow-sm
                                                            ${isTimeReserved || isDisabled || unavailableSlots
                                                                ? "bg-DARK-200 text-DARK-500 cursor-not-allowed border border-DARK-300 dark:bg-DARK-700 dark:text-DARK-400 dark:border-DARK-600"
                                                                : "bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 dark:bg-orange-600 dark:hover:bg-orange-700 dark:border-orange-600"
                                                            }`}

                                                    >
                                                        {convertTimeSlotTo12HourFormat(timeSlot)}
                                                    </button>
                                                );
                                            })} */}

                                            {["morning", "afternoon", "evening", "night"].map((period) => {
                                                // Filter time slots based on the period (morning, afternoon, evening, night)
                                                const periodSlots = timeSlots?.filter((timeSlot: any) => {
                                                    const hour = parseInt(timeSlot?.split(':')[0], 10);
                                                    switch (period) {
                                                        case "morning":
                                                            return hour >= 6 && hour < 12;
                                                        case "afternoon":
                                                            return hour >= 12 && hour < 17;
                                                        case "evening":
                                                            return hour >= 17 && hour < 21;
                                                        case "night":
                                                            return hour >= 21 && hour < 24;
                                                        default:
                                                            return false;
                                                    }
                                                });

                                                return (
                                                    <div key={period} className="my-6">
                                                        <div className="relative mb-6">
                                                            <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 py-2">
                                                                {capitalized(period)}
                                                            </h3>
                                                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r to-BRAND-300 from-[#8A6B8A] rounded-full"></div>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {periodSlots.map((timeSlot: any, index: number) => {
                                                                const selectedDayReservation = getReservation(selectedDate);
                                                                const isTimeReserved = selectedDayReservation?.reservedTimes[timeSlot]?.isFull;
                                                                const isDisabled = timeSlotsExceptions.some(
                                                                    (ex: any) => isSameDay(new Date(ex.date), selectedDate) && ex.isHoliday
                                                                );
                                                                const unavailableSlots = timeSlotsExceptions.some(
                                                                    (ex: any) =>
                                                                        isSameDay(new Date(ex.date), selectedDate) && ex?.unavailableSlots?.includes(index)
                                                                );

                                                                const isUnavailable = isTimeReserved || unavailableSlots || isDisabled;
                                                                const tooltipMessage = isTimeReserved
                                                                    ? "This time slot is fully booked"
                                                                    : unavailableSlots
                                                                        ? "This slot is unavailable"
                                                                        : isDisabled
                                                                            ? "Holiday - no bookings available"
                                                                            : "Available for booking";

                                                                return (
                                                                    <div
                                                                        key={timeSlot._id}
                                                                        className="relative group"
                                                                        data-tooltip={tooltipMessage}
                                                                    >
                                                                        <button
                                                                            onClick={() => {
                                                                                if (isUnavailable) {
                                                                                    setErrorMessage({
                                                                                        message: tooltipMessage,
                                                                                    });
                                                                                    return;
                                                                                }
                                                                                setOpenModal(true);
                                                                                setErrorMessage({});
                                                                                setSelectedObject({ date: selectedDate, timeSlot, room: selectedRoom });
                                                                            }}
                                                                            className={` w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 focus:!ring-0 
                                                                                        ${isUnavailable
                                                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700"
                                                                                    : "bg-gradient-to-br from-BRAND-400 to-BRAND-500 text-white hover:from-BRAND-500 hover:to-BRAND-600 shadow-md hover:shadow-lg active:scale-[0.98] dark:from-BRAND-400 dark:to-BRAND-500 dark:hover:from-BRAND-500 dark:hover:to-BRAND-600"
                                                                                }
                                                                                flex items-center justify-center
                                                                            `}
                                                                            disabled={isUnavailable}
                                                                        >
                                                                            <span className="relative z-10">
                                                                                {convertTimeSlotTo12HourFormat(timeSlot)}
                                                                            </span>
                                                                            {isUnavailable && (
                                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                                    <div className="w-full h-px bg-gray-400 dark:bg-gray-600"></div>
                                                                                </div>
                                                                            )}
                                                                        </button>

                                                                        {/* Hover tooltip */}
                                                                        <div className=" absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                                                            px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-lg
                                                                            shadow-lg opacity-0 group-hover:opacity-100 transition-opacity
                                                                            pointer-events-none z-20 whitespace-nowrap
                                                                            before:absolute before:top-full before:left-1/2 before:-translate-x-1/2
                                                                            before:border-4 before:border-transparent before:border-t-gray-800
                                                                            ">
                                                                            {tooltipMessage}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </>
                    )}
                </div>
            </div>
            {selectedRoom && (
                <ReservationModal
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    selectedObject={selectedObject}
                    setSelectedObject={setSelectedObject}
                    onSubmit={(data: any) => bookReservation(data)}
                    rooms={rooms}
                    setSelectedRoom={setSelectedRoomId}
                    loginRole={loginRole}
                    selectedCompany={selectedCompany}
                    selectedRestaurant={selectedRestaurant}
                    customers={customers}
                />
            )}
        </div>
    );
};

export default AvailabilityCalendar;