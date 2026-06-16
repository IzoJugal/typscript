/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Table } from "flowbite-react";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "../../utils/AxiosInstance";
import ClockIn from "./ClockInForm";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import { RiDeleteBin6Line } from "react-icons/ri";
import Pagination from "../Pagination/Pagination";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import PageSize from "../Pagination/PageSize";
import { useAuth } from "../../context/AuthProvider";
import { FaAngleDown, FaAngleUp, FaFilter, FaRegClock } from "react-icons/fa";
import { TbClockCheck } from "react-icons/tb";
import TableHeaders from "../../utils/common/TableHeaders";
import { Filters } from "../../utils/common/Filters";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { createQueryParams } from "../../utils/functions";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, formatDate, formatTime, setTitle } from "../../utils/utility";
import ListLoader from "../../utils/common/ListLoader";
import { LucideClockArrowDown, LucideClockArrowUp } from "lucide-react";
import { useConfigs } from "../../context/SiteConfigsProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import SearchInput from "../../utils/common/SearchInput";

interface ClockRecord {
  _id: string;
  server: {
    _id: string;
    name: string;
    role: { name: string };
    phone: string;
    pin: string;
  };
  clockInOutDate: string;
  type: "in" | "out";
  clockInTime: string;
  clockOutTime?: string;
  workingHours?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  company: { _id: string; name: string };
  restaurant: { _id: string; name: string };
}

function ClockInOut() {
  setTitle("Punch In-Out");
  const socket = useSocket();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const [openModal, setOpenModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClockout, setIsClockout] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clockOutUser, setClockOutUser] = useState<ClockRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clockRecords, setClockRecords] = useState<ClockRecord[]>([]);
  const [numOfRecords, setNumOfRecords] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const { pages } = useParams<{ pages?: string }>();
  const [page, setPage] = useState<number>(Number(pages) || 1);
  const [searchParams, setSearchParams] = useSearchParams();

  const debounceRef = useRef<any | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });

  const staffCompanyId = loginRole !== SUPER_ADMIN
    ? (userData?.staffMember?.company?._id || "")
    : "";

  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    restaurant: searchParams.get("restaurant") || "",
  });

  const [elapsedTimes, setElapsedTimes] = useState<{
    [userId: string]: { hours: number; minutes: number; seconds: number };
  }>({});

  const socketAllowDataPermission = (data: any) => {
    if (loginRole === SUPER_ADMIN) return true;
    const staffCompanyId = userData?.staffMember?.company?._id;
    const incomingCompanyId = data?.company?._id || data?.company;

    if (MANAGER_ROLES.includes(loginRole)) {
      return staffCompanyId === incomingCompanyId;
    }

    const staffId = userData?.staffMember?._id;
    const incomingServerId = data?.server?._id || data?.server;
    const staffRestId = userData?.staffMember?.restaurant?._id;
    const incomingRestId = data?.restaurant?._id || data?.restaurant;

    return (
      staffId === incomingServerId &&
      staffCompanyId === incomingCompanyId &&
      staffRestId === incomingRestId
    );
  };

  const formDataRef = useRef(formData);
  const searchFilterRef = useRef(searchFilter);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  // Real-time Event Listeners
  useEffect(() => {
    const handleClockedInStaff = (clockedInStaff: any) => {
      if (socketAllowDataPermission(clockedInStaff)) {
        setClockRecords((prevData) => {
          const updatedData = Array.isArray(prevData) ? [...prevData] : [];
          if (updatedData.length >= formDataRef.current.limit) {
            updatedData.pop();
          }
          return [clockedInStaff, ...updatedData];
        });
        setNumOfRecords((prev) => prev + 1);
      }
    };

    const handleClockOut = (clock: any) => {
      setClockRecords((prevRecords) =>
        prevRecords.map((item) => (item._id === clock._id ? clock : item))
      );
    };

    const handleDeleteClock = (clock: any) => {
      setClockRecords((prevRecords) => {
        const remaining = prevRecords.filter((item) => item._id !== clock._id);
        if (remaining.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return remaining;
      });
      setNumOfRecords((prev) => Math.max(prev - 1, 0));
    };

    socket.on("clockedInStaff", handleClockedInStaff);
    socket.on("clockOut", handleClockOut);
    socket.on("deleteClock", handleDeleteClock);

    return () => {
      socket.off("clockedInStaff", handleClockedInStaff);
      socket.off("clockOut", handleClockOut);
      socket.off("deleteClock", handleDeleteClock);
    };
  }, [formDataRef.current.limit, page, loginRole, userData]);

  const columnNames = ["Sr.No.", "Staff", "In Time", "Out Time", "Status", "Working Hours", "Punch Out", "Actions"];
  if (loginRole === SUPER_ADMIN) {
    columnNames.splice(2, 0, "Business");
  }

  // Unified Fetch Data Logic
  const fetchClockRecords = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const queryParamsObj = {
        page: formDataRef.current.page,
        limit: formDataRef.current.limit,
        ...searchFilterRef.current,
      };
      const queryParamsStr = createQueryParams(queryParamsObj);
      const response = await apiClient.get(`/clock${queryParamsStr}`);
      setClockRecords(response.data.clocks || []);
      setNumOfRecords(response.data.count || 0);
    } catch (error) {
      setClockRecords([]);
      console.error("Error fetching clock records:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced execution when dependencies change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchClockRecords();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchClockRecords, formData.page, formData.limit, searchFilter]);

  // Synchronize URL and structural filter updates in ONE single step
  useEffect(() => {
    const combinedData = { ...formData, ...searchFilter, page: 1 };
    const queryParams = createQueryParams(combinedData);

    setPage(1);
    setFormData(prev => ({ ...prev, page: 1 }));
    setSearchParams(queryParams, { replace: true });
  }, [searchFilter]);

  const handleLimit = (newLimit: number) => {
    const updatedFormData = {
      ...formData,
      page: 1,
      limit: newLimit,
    };

    setPage(1);
    setFormData(updatedFormData);
    const combinedData = { ...updatedFormData, ...searchFilter };
    setSearchParams(createQueryParams(combinedData));
  };

  const curPage = (pageNum: any) => {
    const updatedFormData = { ...formData, page: pageNum };
    setFormData(updatedFormData);
    setPage(pageNum);

    const combinedData = { ...updatedFormData, ...searchFilter };
    setSearchParams(createQueryParams(combinedData));
  };

  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    if (pageFromURL !== formData.page || limitFromURL !== formData.limit) {
      setPage(pageFromURL);
      setFormData(prev => ({
        ...prev,
        page: pageFromURL,
        limit: limitFromURL,
      }));
    }
  }, [searchParams]);

  const clockOut = async () => {
    if (!clockOutUser?.server?._id) {
      toast.error("Invalid clock-out request.");
      return;
    }
    try {
      const response = await apiClient.post(`/clock/clockout/${clockOutUser.server._id}`);
      if (response.data.success) {
        setIsClockout(false);
        toast.success(response.data.message || "Clock Out successful!");
        fetchClockRecords();
      } else {
        toast.error(response.data.message || "Clock Out failed!");
      }
    } catch (error) {
      toast.error("An error occurred while clocking out. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/clock/${selectedId}`, {});
      toast.success(response.data.message);
      fetchClockRecords();
    } catch (error) {
      toast.error("Failed to delete the record. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  // Live timer tick logic
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedElapsedTimes: typeof elapsedTimes = {};
      const now = new Date().getTime();

      clockRecords.forEach((user: any) => {
        if (!user.clockOutTime && user.clockInTime) {
          const clockInTime = new Date(user.clockInTime).getTime();
          const diff = now - clockInTime;
          const totalSeconds = Math.max(0, Math.floor(diff / 1000));

          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          const serverId = user.server?._id || user.server;
          if (serverId) {
            updatedElapsedTimes[serverId] = { hours, minutes, seconds };
          }
        }
      });

      setElapsedTimes(updatedElapsedTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [clockRecords]);

  const { configData } = useConfigs();

  return (
    <div className={divContainerStyle}>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Punch Clocks" />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex gap-4 items-center w-full sm:w-auto">
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

          <div className="flex items-center gap-2 self-end sm:self-auto pb-1 sm:pb-0">
            <span onClick={() => setOpenModal(true)}>
              <AddActionButton text="Add a new Punch in" />
            </span>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
            }`}
        >
          <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
            <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="clockInOut" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading ? (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={columnNames.length + 1} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            ) : clockRecords.length > 0 ? (
              clockRecords.map((record: any, index: number) => {
                const serverId = record?.server?._id;
                const { hours, minutes, seconds } = elapsedTimes[serverId] || { hours: 0, minutes: 0, seconds: 0 };

                return (
                  <Table.Row key={record?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                      {index + 1 + (formDataRef.current.page - 1) * formDataRef.current.limit}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white flex flex-col">
                      {capitalized(record?.server?.name) ?? "-"}
                      <span className="text-DARK-500 text-xs">
                        {record?.server?.role?.name ? `(${capitalized(record.server.role.name)})` : ""}
                      </span>
                    </Table.Cell>
                    {loginRole === SUPER_ADMIN && (
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                        {record?.company?.name ?? "-"}
                      </Table.Cell>
                    )}
                    <Table.Cell className="text-sm text-DARK-500 dark:text-DARK-300">
                      {record?.clockInTime ? (
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">
                            {formatDate(record.clockInTime, configData?.dateFormat || "DD/MM/YYYY")}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTime(record.clockInTime)}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-DARK-500 dark:text-DARK-300">
                      {record?.clockOutTime ? (
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">
                            {formatDate(record.clockOutTime, configData?.dateFormat || "DD/MM/YYYY")}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTime(record.clockOutTime)}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                      {record?.type === "in" ? (
                        <span className="flex gap-2 text-green-500 items-center">
                          <LucideClockArrowDown className="h-4 w-4" /> Punch In
                        </span>
                      ) : (
                        <span className="flex gap-2 text-red-500 items-center">
                          <LucideClockArrowUp className="h-4 w-4" /> Punch Out
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                      {record?.workingHours
                        ? `${record.workingHours.hours}h ${record.workingHours.minutes}m ${record.workingHours.seconds}s`
                        : `${hours}h ${minutes}m ${seconds}s`}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {record?.type === "in" ? (
                        <Button
                          onClick={() => {
                            setIsClockout(true);
                            setClockOutUser(record);
                          }}
                          className="!bg-BRAND-500 hover:!bg-BRAND-600 !ring-0 flex items-center justify-center space-x-2 text-sm px-4 w-32 dark:!bg-BRAND-700 dark:hover:!bg-BRAND-800 dark:text-white"
                          size="xs"
                        >
                          <FaRegClock className="w-4 h-4 mx-1" />
                          <span className="whitespace-nowrap">Punch Out</span>
                        </Button>
                      ) : (
                        <Button
                          className="!bg-DARK-400 text-black dark:text-DARK-700 !ring-0 flex items-center justify-center space-x-2 text-sm px-4 w-32"
                          size="xs"
                          disabled
                        >
                          <TbClockCheck className="w-4 h-4 mx-1" />
                          <span>Completed</span>
                        </Button>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Button
                        onClick={() => confirmDelete(record?._id)}
                        className={deleteBtnStyle.btn}
                        size="xs"
                      >
                        <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            ) : (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={columnNames.length + 1} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Staff Punch In/Out Records"
                    message="No staff punch in/out details are available right now. Added punch records will appear here."
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
        {numOfRecords > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && (
              <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                <PageSize handleLimit={handleLimit} limit={formDataRef.current.limit} />
              </div>
            )}
            <div>
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={formDataRef.current.limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this clock entry?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <ConfirmModal
        isOpen={isClockout}
        message={`Are you sure you want to clock out ${clockOutUser?.server?.name ?? " "}?`}
        onConfirm={clockOut}
        onCancel={() => setIsClockout(false)}
      />
      {openModal && (
        <ClockIn
          openModal={openModal}
          setOpenModal={setOpenModal}
          setClockData={fetchClockRecords}
        />
      )}
    </div>
  );
}

export default ClockInOut;