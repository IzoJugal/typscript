import { useState, useEffect, ChangeEvent } from "react";
import apiClient from "../../utils/AxiosInstance";
// import { Button, Checkbox } from "flowbite-react";
import { Filters } from "../../utils/common/Filters";
import { useAuth } from "../../context/AuthProvider";
import { SUPER_ADMIN } from "../../utils/common/constant";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createQueryParams } from "../../utils/functions";
import { convertTo12HourFormat, formatDate } from "../../utils/utility";
// import { MdAccessTime } from "react-icons/md";
import { toast } from "react-toastify";
import { useConfigs } from "../../context/SiteConfigsProvider";
import CommonInput from "../../utils/common/CommonInput";
import { Select } from "flowbite-react";

interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
}

interface Exception {
  date: string;
  isHoliday?: boolean;
  holidayName?: string;
  unavailableSlots?: number[];
}

const TimeSlotForm = () => {
  const today = new Date().toISOString().split('T')[0];
  const { userData } = useAuth();
    const { configData } = useConfigs();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const navigate = useNavigate();
  const [gap, setGap] = useState<number>(15);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("23:00");
  const [defaultSlots, setDefaultSlots] = useState<TimeSlot[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(today);
  const [holidayDate, setHolidayDate] = useState<string>("");
  const [holidayName, setHolidayName] = useState<string>("");
  const [unavailableDate, setUnavailableDate] = useState<string>(today);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchFilter, setSearchFilter] = useState<any>({
    company: searchParams.get("company") || "",
    restaurant: searchParams.get("restaurant") || "",
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  const timeToMinutes = (time: string): number => {
    const [h, m] = time?.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const generateDefaultSlots = (start: string, end: string, gap: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let current = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    while (current + gap <= endMinutes) {
      const slotStart = minutesToTime(current);
      const slotEnd = minutesToTime(current + gap);
      slots.push({ start: slotStart, end: slotEnd, isAvailable: true });
      current += gap;
    }
    return slots;
  };

  const calculateGap = (slots: TimeSlot[]): number => {
    if (slots.length === 0) return 15;
    return timeToMinutes(slots[0].end) - timeToMinutes(slots[0].start);
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const message = "Are you sure you want to leave? Changes you made may not be saved.";
      event.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  useEffect(() => {
    if (searchFilter?.restaurant) {
      fetchSchedule();
    } else {
      cleanData();
    }
  }, [searchFilter?.restaurant]);

  // Set company for non-SUPER_ADMIN
  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      setSearchFilter((prev: any) => ({
        ...prev,
        company: userData?.staffMember?.company?._id
      }));
    }
  }, [loginRole, userData]);

  useEffect(() => {
    updateURL();
  }, [searchFilter]);

  useEffect(() => {
    if (searchFilter?.restaurant) {
      const slots = generateDefaultSlots(startTime, endTime, gap);

      if (slots.length > 0) {
        setDefaultSlots(slots);
      }
    }
  }, [startTime, endTime, gap, searchFilter?.restaurant]);

  const updateURL = () => {
    const queryParams = createQueryParams(searchFilter);
    setSearchParams(queryParams);
    navigate(`/reservation/settings/${queryParams}`);
  };

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = createQueryParams(searchFilter);
      const response = await apiClient.get(`/timeslot/${queryParams}`);
      const { success, schedule, openTime, closeTime } = response.data;

      if (success) {
        setStartTime(openTime || "09:00");
        setEndTime(closeTime || "23:00");
        setDefaultSlots(schedule?.defaultSlots);
        setExceptions(schedule?.exceptions);
        setGap(calculateGap(schedule?.defaultSlots));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateDefaultSlots = async () => {
    if (!searchFilter?.restaurant) {
      toast.error("Please select a restaurant before saving.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = createQueryParams(searchFilter);
      setSearchParams(queryParams);
      const response = await apiClient.post(`/timeslot/default${queryParams}`, {
        startTime,
        endTime,
        gap
      });
      if (response.data.success) {
        const { defaultSlots, message } = response.data;
        setDefaultSlots(defaultSlots);
        toast.success(message);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleTimeChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
    compareTime: string,
    isStart: boolean
  ) => {
    const newTime = e.target.value;
    const [newHour, newMinute] = newTime.split(":").map(Number);
    const [compHour, compMinute] = compareTime.split(":").map(Number);

    if (
      (isStart && (newHour > compHour || (newHour === compHour && newMinute >= compMinute))) ||
      (!isStart && (newHour < compHour || (newHour === compHour && newMinute <= compMinute)))
    ) {
      return;
    }
    setter(newTime);
  };

  const addHoliday = async () => {
    if (!holidayDate || new Date(holidayDate) < new Date()) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = createQueryParams(searchFilter);
      const response = await apiClient.post(`/timeslot/exceptions${queryParams}`, {
        date: holidayDate,
        isHoliday: true,
        holidayName,
      });
      if (!response.data.success) throw new Error("Failed to add holiday");
      const data = response.data;
      setExceptions((prev) => {
        const existing = prev.find((e) => e.date === holidayDate);
        if (existing) {
          return prev.map((e) => (e.date === holidayDate ? data.exception : e));
        }
        return [...prev, data.exception];
      });
      setHolidayDate("");
      setHolidayName("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (slotIdx: number) => {
    if (!unavailableDate) return;

    setLoading(true);
    setError(null);
    try {
      const existing = exceptions.find((e) => e.date === unavailableDate);
      if (existing?.isHoliday) return;

      const newUnavailable = existing?.unavailableSlots?.includes(slotIdx)
        ? existing.unavailableSlots.filter((i) => i !== slotIdx)
        : [...(existing?.unavailableSlots || []), slotIdx];

      const response = await apiClient.post(`/timeslot/exceptions`, {
        date: unavailableDate,
        restaurant: searchFilter.restaurant,
        unavailableSlots: newUnavailable,
      });
      if (!response.data.success) { toast.error(response?.data?.message || "Failed to update unavailable slots"); throw new Error("Failed to update unavailable slots"); }
      const data = response.data;
      if (response.data.success) {
        setExceptions((prev) => {
          const existingIdx = prev.findIndex((e) => e.date === data.exception.date);
          if (data?.exception?.unavailableSlots?.length === 0) {
            if (existingIdx >= 0) {
              return prev.filter((e) => e.date !== data.exception.date);
            }
            return prev;
          }
          if (existingIdx >= 0) {
            return prev.map((e) =>
              e.date === data.exception.date ? data.exception : e
            );
          }

          return [...prev, data.exception];
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSlots = (): TimeSlot[] => {
    const exception = exceptions.find((e) => e.date === currentDate);
    if (exception?.isHoliday) return [];
    if (exception?.unavailableSlots) {
      return defaultSlots.map((slot, idx) => ({
        ...slot,
        isAvailable: !exception.unavailableSlots?.includes(idx),
      }));
    }
    return defaultSlots;
  };

  const cleanData = () => {
    setExceptions([]);
    setDefaultSlots([]);
    setError(null);
    setLoading(false);
    setHolidayName('');
    setHolidayDate('');
  }

  const isEndTimeAfterStartTime = (
    startTime: string,
    endTime: string
  ): boolean => {
    return timeToMinutes(endTime) > timeToMinutes(startTime);
  };

  return (
    <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-full">
      <div className="bg-white dark:bg-DARK-950 rounded-2xl shadow-lg overflow-hidden border-0 dark:border-BRAND-700 border-t-2 border-t-BRAND-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-DARK-700 dark:to-DARK-900 p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-BRAND-500">Time Slot Manager</h2>
              <p className="text-DARK-600 dark:text-DARK-300 text-sm font-semibold mt-1">Effortlessly manage your schedule</p>
            </div>
            <div className="bg-BRAND-500 dark:bg-BRAND-600 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-8">
          {/* {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-BRAND-500"></div>
            </div>
          )} */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Global Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
            <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="timeSlot" />
          </div>

          <div className={`relative transition-opacity ${!searchFilter?.restaurant ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Time Inputs */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-BRAND-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Time Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                  <div className="relative">
                    <CommonInput
                      type="time"
                      value={startTime}
                      onChange={(e) => handleTimeChange(e, setStartTime, endTime, true)}
                      // className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                  <div className="relative">
                    <CommonInput
                      type="time"
                      value={endTime}
                      onChange={(e) => handleTimeChange(e, setEndTime, startTime, false)}
                      // className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slot Gap</label>
                  <div className="relative">
                    <Select
                      value={gap}
                      onChange={(e) => setGap(Number(e.target.value))}
                      // className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                      // className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors appearance-none"
                    >
                      {[15, 30, 60, 120, 180, 240].map((g) => (
                        <option key={g} value={g}>
                          {g === 60 ? '1 hr' :
                            g === 120 ? '2 hrs' :
                              g === 180 ? '3 hrs' :
                                g === 240 ? '4 hrs' :
                                  `${g} min`}
                        </option>
                      ))}
                    </Select>
                    {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div> */}
                  </div>
                </div>
              </div>
              {(!isEndTimeAfterStartTime(startTime, endTime)) ?
                <span className="text-red-500"> <span className="font-semibold">Start time</span> should be before <span className="font-semibold">End time</span> </span> : ''}
            </div>

            {/* Holiday and Unavailable Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-BRAND-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2H4a1 1 0 100 2h3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zm4-1a1 1 0 100-2h-3a1 1 0 100 2h3z" clipRule="evenodd" />
                  </svg>
                  Add Holiday
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <CommonInput
                      type="date"
                      value={holidayDate}
                      min={tomorrowDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      // className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-BRAND-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <CommonInput
                      type="text"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="Holiday name"
                      // className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-BRAND-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2 self-end">
                    <button
                      onClick={addHoliday}
                      disabled={loading || !holidayName}
                      type="button"
                      className={`w-full p-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${loading || !holidayName
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white'
                        }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Add Holiday
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-BRAND-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2H4a1 1 0 100 2h3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zm4-1a1 1 0 100-2h-3a1 1 0 100 2h3z" clipRule="evenodd" />
                  </svg>
                  Set Unavailable Slots
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <CommonInput
                      type="date"
                      value={unavailableDate}
                      onChange={(e) => {
                        setCurrentDate(e.target.value);
                        setUnavailableDate(e.target.value);
                      }}
                      // className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-BRAND-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2 self-end">
                    <button
                      onClick={() => {
                        setUnavailableDate(today);
                        setCurrentDate(today);
                      }}
                      className="w-full p-3 font-semibold text-white rounded-lg bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Reset Date
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Schedule */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">{formatDate(currentDate,configData?.dateFormat)}</span>
                  {exceptions.find((e) => e.date === currentDate)?.isHoliday && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800">
                      Holiday: {exceptions.find((e) => e.date === currentDate)?.holidayName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Available
                  <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span>
                  Unavailable
                </div>
              </div>

              {getCurrentSlots().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                  {getCurrentSlots().map((slot, slotIdx) => {
                    const isAvailable = !exceptions.find((e) => e.date === currentDate)?.unavailableSlots?.includes(slotIdx);
                    const isDisabled = !unavailableDate || exceptions.find((e) => e.date === unavailableDate)?.isHoliday;

                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-lg border transition-all ${isAvailable
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        onClick={() => !isDisabled && toggleAvailability(slotIdx)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {convertTo12HourFormat(slot.start)} - {convertTo12HourFormat(slot.end)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${isAvailable
                              ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                              }`}>
                              {isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                            <input
                              type="checkbox"
                              checked={isAvailable}
                              onChange={() => !isDisabled && toggleAvailability(slotIdx)}
                              className="h-4 w-4 rounded border-gray-300 text-BRAND-600 focus:ring-BRAND-500 dark:border-gray-600 dark:bg-gray-700"
                              disabled={isDisabled}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-BRAND-50 dark:bg-BRAND-900/20 border border-BRAND-200 dark:border-BRAND-800/50 rounded-lg p-4 text-center">
                  <p className="text-BRAND-700 dark:text-BRAND-300">No slots available (Holiday)</p>
                </div>
              )}
            </div>

            {/* Default Slots and Exceptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-BRAND-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Default Time Slots
                  </h3>
                  <span className="text-sm bg-BRAND-100 dark:bg-BRAND-900/30 text-BRAND-800 dark:text-BRAND-200 px-3 py-1 rounded-full">
                    {defaultSlots.length} slots ({gap} min intervals)
                  </span>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                  {defaultSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-colors ${slot.isAvailable
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${slot.isAvailable ? 'bg-BRAND-500' : 'bg-gray-500'
                            }`}></span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {convertTo12HourFormat(slot.start)} - {convertTo12HourFormat(slot.end)}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${slot.isAvailable
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                            }`}
                        >
                          {slot.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-BRAND-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Schedule Exceptions
                  </h3>
                  <span className="text-sm bg-BRAND-100 dark:bg-BRAND-900/30 text-BRAND-800 dark:text-BRAND-200 px-3 py-1 rounded-full">
                    {exceptions.length} exceptions
                  </span>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                  {exceptions.length > 0 ? (
                    exceptions.map((exception, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(exception.date,configData?.dateFormat)}</span>
                            {exception.isHoliday && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50">
                                Holiday: {exception.holidayName}
                              </span>
                            )}
                          </div>
                          {exception.unavailableSlots && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">
                              {exception.unavailableSlots.length} unavailable
                            </span>
                          )}
                        </div>
                        {exception?.unavailableSlots?.map((slotIdx) => {
                          const slot = defaultSlots[slotIdx];

                          if (!slot) return null;

                          return (
                            <span
                              key={slotIdx}
                              className="text-xs bg-BRAND-100 dark:bg-BRAND-900/30 text-BRAND-800 dark:text-BRAND-200 px-2 py-1 rounded-full border border-BRAND-200 dark:border-BRAND-800/50"
                            >
                              {convertTo12HourFormat(slot.start)} -{" "}
                              {convertTo12HourFormat(slot.end)}
                            </span>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="bg-BRAND-50 dark:bg-BRAND-900/20 border border-BRAND-200 dark:border-BRAND-800/50 rounded-lg p-4 text-center">
                      <p className="text-BRAND-700 dark:text-BRAND-300 italic">No exceptions set</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={updateDefaultSlots}
                disabled={isLoading || !searchFilter?.restaurant}
                className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${isLoading || !searchFilter?.restaurant
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-800 dark:text-gray-200 cursor-not-allowed'
                  : 'bg-BRAND-500 hover:bg-BRAND-700 dark:bg-BRAND-700 dark:hover:bg-BRAND-800 text-white'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Time Slots
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotForm;