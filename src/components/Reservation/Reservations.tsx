import React, { useCallback, useEffect, useRef, useState } from "react";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { Filters } from "../../utils/common/Filters";
import { Button, Modal, Table, } from "flowbite-react";
import TableHeaders from "../../utils/common/TableHeaders";
import Skeleton from "react-loading-skeleton";
import PageSize from "../Pagination/PageSize";
import NoData from "../../utils/common/NoData";
import { editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { HiEye, } from "react-icons/hi";
import apiClient from "../../utils/AxiosInstance";
import { capitalized, convertTimeSlotTo12HourFormat, labelLayout, formatDate } from "../../utils/utility";
import { useConfigs } from "../../context/SiteConfigsProvider";
import Pagination from "../Pagination/Pagination";
import { useAuth } from "../../context/AuthProvider";
import { createQueryParams } from "../../utils/functions";
import { IBusiness, IPackage, IPayment, IPaymentMethod, Irestaurant, Iroom, IUser } from "../../utils/common/Interface/OrderInterface";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import FormLoader from "../../utils/common/FormLoader";
import { useSocket } from "../../context/SocketProvider";
import { FaAngleDown, FaAngleUp, FaCreditCard, FaFilter, FaGift, FaMoneyBillWave } from "react-icons/fa";
import ListLoader from "../../utils/common/ListLoader";
import { HiCheckCircle } from "react-icons/hi2";
import PaymentModal from "./PaymentModal";
import { setTitle } from "../../utils/utility";
import AddActionButton from "../../utils/common/AddActionButton";
import SearchInput from "../../utils/common/SearchInput";

const statusOptions = ["pending", "confirmed", "completed", "cancelled"];
export interface IReservation {
  _id: string;
  customer: IUser;
  bookingName: string;
  tableIds: string[];
  guests: number;
  date: Date;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  type: "table" | "venue" | "private" | "outdoor";
  room: Iroom;
  company: IBusiness;
  restaurant: Irestaurant;
  package: IPackage;
  notes: string;
  payment: IPayment;
}


const Reservation: React.FC = () => {
  setTitle("Reservations");
  const socket: any = useSocket();
  const { userData } = useAuth();
    const { configData } = useConfigs();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingById, setIsLoadingById] = useState(false);
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [numOfRecords, setNumOfRecords] = useState(0);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [openModal, setOpenModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [reservation, setReservation] = useState<IReservation | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const navigate = useNavigate();
  const staffCompanyId = userData?.staffMember?.company?._id || "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
    date: searchParams.get("date") || "",
  });
  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const socketAllowDataPermission = (data: any) => {
    let status = false
    if (loginRole === SUPER_ADMIN) {
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
    const createReservation = (data: any) => {
      if (socketAllowDataPermission(data)) {
        setReservations((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [data, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };

    const updateReservation = (reservationData: any) => {
      setReservation(reservationData);
      setReservations(prev => prev.map(r => r._id === reservationData._id ? reservationData : r));
    };

    const refundReservationPayment = (responseData: any) => {
      const { reservationData } = responseData
      setReservation(reservationData);
      setReservations(prev => prev.map(r => r._id === reservationData._id ? reservationData : r));
    };

    socket.on('createReservation', createReservation);
    socket.on('updateReservation', updateReservation);
    socket.on('refundReservationPayment', refundReservationPayment);

    return () => {
      // Cleanup both listeners
      socket.off('createReservation', createReservation);
      socket.off('updateReservation', updateReservation);
      socket.off('refundReservationPayment', refundReservationPayment);
    };
  }, [socket]);


  const fetchReservations = useCallback(async () => {
    setIsLoading(true);

    const combinedData: any = {
      ...formDataRef.current,
      ...searchFilterRef.current,
      source: "web",
    };

    if (loginRole === SUPER_ADMIN) {
    } else if (MANAGER_ROLES.includes(loginRole)) {
      combinedData.company =
        userData?.staffMember?.company?._id ||
        userData?.staffMember?.company;
      if (searchFilterRef.current?.restaurant) {
        combinedData.restaurant = searchFilterRef.current.restaurant;
      } else {
        delete combinedData.restaurant;
      }
    } else {
      combinedData.company =
        userData?.staffMember?.company?._id ||
        userData?.staffMember?.company;

      combinedData.restaurant =
        userData?.staffMember?.restaurant?._id ||
        userData?.staffMember?.restaurant;
    }

    if (loginRole !== SUPER_ADMIN) {
      combinedData.company =
        userData?.staffMember?.company?._id ||
        userData?.staffMember?.company;

      if (!searchFilterRef.current?.restaurant) {
        delete combinedData.restaurant;
      }
    }

    const queryParams = createQueryParams(combinedData);
    const response = await apiClient.get(`/reservations${queryParams}`);

    if (response.data.success) {
      setReservations(response.data.reservations);
      setNumOfRecords(response.data.count);
    }

    setIsLoading(false);
  }, [loginRole, userData]);

  useEffect(() => {
    if (!userData) return;

    const debounceDelay = setTimeout(() => {
      fetchReservations();
    }, 300);

    return () => clearTimeout(debounceDelay);
  }, [userData, page, limit, searchFilter, fetchReservations, location.search]);

  /* const openModel = (reservation: any) => {
    setReservation(reservation);
    setOpenModal(true);
  }; */

  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }));
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/reservation/bookings/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true)
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    if (Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")) {

      if (formData?.page !== 1) {
        setFormData((prev) => ({ ...prev, page: 1 }));
        setPage(1);
      }
    }
  }, [searchFilter]);

  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setFormData((prev) => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));

    setPage(pageFromURL);
    setLimit(limitFromURL);
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(formDataRef.current);
    setLimit(formDataRef.current?.limit)
    setPage(formDataRef.current?.page);
  }, [searchFilter, formData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);


  const baseColumns = [
    "Sr.No.",
    "Customer Name",
    "Date",
    "Time Slot",
    "Room",
    "Customer Phone",
    "Guests",
    "Status",
    "Actions",
  ];

  const superAdminColumns = [...baseColumns.slice(0, 2), "Business", ...baseColumns.slice(2)];
  const columnNames = loginRole === SUPER_ADMIN ? superAdminColumns : baseColumns;

  const handleStatusChange = async (value: string) => {
    const response = await apiClient.patch(`/reservations/${reservation?._id}`, { status: value });
    if (response.data.success) {
      const updatedReservations = reservations.map((reservation) => {
        if (reservation._id === response.data.reservation._id) {
          return response.data.reservation;
        }
        return reservation;
      });
      setReservations(updatedReservations);
      setReservation(response.data.reservation);
      setOpenModal(false);
    }
  };

  const getReservationById = async (id: string) => {
    setIsLoadingById(true);
    const response = await apiClient.get(`/reservations/get-reservation-by-id/${id}`);
    if (response.data.success) {
      setReservation(response.data.reservation);
      setOpenModal(true);
    }
    setTimeout(() => {
      setIsLoadingById(false);
    }, 500);
  };


  /* const paymentReservation = useCallback(async (paymentData: any) => {
    try {
      const response = await apiClient.post(`/reservations/make-package-payment/${reservation?._id}`, { ...paymentData, referenceCode: "pay_uct" });
      const { success, message } = response.data;
      if (success) {
        toast.success(message || "Payment success!");
        setOpenModal(false);
      } else {
        toast.error(message || "Failed to book the reservation. Please try again.");
      }
    } catch (error: any) {
      console.error('Error booking reservation:', error);
      toast.error(error.message || `An error occurred while booking the reservation.`);
    }
  }, []); */

  return (
    <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
      <div>
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <DetailHeaderPaths label="Reservations" />
        </div>

        <div className="mx-auto w-full">
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-4 flex-1">
              <button
                className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white shrink-0"
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

              <SearchInput
                value={searchFilter.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] max-w-xs w-full"
              />
            </div>

            <div className="relative group shrink-0">
              <Link to="/reservation/availability" className="block">
                <AddActionButton text="Add" />
              </Link>
            </div>
          </div>

          <div
            className={`transition-all duration-500 ease-in-out ${showFilters
                ? "max-h-screen opacity-100 mt-4 visible"
                : "max-h-0 opacity-0 overflow-hidden invisible"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4 border border-DARK-100 dark:border-DARK-700">
              <Filters
                searchFilter={searchFilter}
                loginRole={loginRole}
                setSearchFilter={setSearchFilter}
                module="reservation"
                setIsDropdownOpen={setIsDropdownOpen}
                isDropdownOpen={isDropdownOpen}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading ? (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            ) : !isLoading && reservations?.length > 0 ? (
              reservations.map((elem: IReservation | any, index: number) => (
                <Table.Row key={elem._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell
                    className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"
                    title={elem?.customer
                      ? `${capitalized(elem?.customer?.firstName ?? '')} ${elem?.customer?.lastName ? capitalized(elem?.customer?.lastName ?? '') : ''}`
                      : 'Guest'
                    }
                  >
                    {elem?.customer
                      ? `${capitalized(elem?.customer?.firstName ?? '')} ${elem?.customer?.lastName ? capitalized(elem?.customer?.lastName ?? '') : ''}`
                      : 'Guest'}
                  </Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(elem?.company?.name)}>{capitalized(elem?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.date ? new Date(elem.date).toLocaleDateString('en-US') : '-'}>
                    {elem?.date ? formatDate(elem.date,configData?.dateFormat) : '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${convertTimeSlotTo12HourFormat(elem?.timeSlot)}`}>
                    {convertTimeSlotTo12HourFormat(elem?.timeSlot) ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.room?.name}>
                    {elem?.room?.name ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.customer?.phoneNumber}>
                    {elem?.customer?.phoneNumber ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.guests}>
                    {elem?.guests ?? '-'}
                  </Table.Cell>

                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.status}>
                    {labelLayout(elem?.status)}
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button onClick={() => getReservationById(elem._id)} className={editBtnStyle.btn} size="xs">
                      <HiEye className={editBtnStyle.icon} />
                      <span className="sr-only">View</span>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4">
                  <NoData
                    title="No Reservations Found"
                    message="No reservation entries are available right now. Added reservation entries will appear here."
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
                <PageSize handleLimit={handleLimit} limit={limit} />
              </div>
            )}
            <div>
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>
        )}
      </div>

      <Modal show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header className="bg-BRAND-100 dark:bg-DARK-700 text-white">
          {isLoadingById ? (
            <div className="flex justify-center items-center h-full">
              <Skeleton count={1} height={20} width={100} />
            </div>
          ) : (
            <div className="flex justify-between items-center w-full space-x-4">
              {/* Customer Name and Reservation Title */}
              <div className="flex-1 text-lg font-semibold">
                {capitalized(reservation?.customer?.firstName ?? 'Guest')} Reservation
              </div>
              {labelLayout(reservation?.status)}
            </div>
          )}
        </Modal.Header>
        <Modal.Body>
          {isLoadingById ? (
            <FormLoader />
          ) : (
            <div className="mx-auto rounded-lg">
              {/* Customer Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg ">
                  <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Customer Name</p>
                  <p className="text-DARK-900 dark:text-DARK-100 font-medium">
                    {reservation?.customer ? `${capitalized(reservation?.customer?.firstName)} ${reservation?.customer?.lastName ? capitalized(reservation?.customer?.lastName) : ''}` : 'Guest'}
                  </p>
                </div>
                <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                  <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Phone Number</p>
                  <p className="text-DARK-900 dark:text-DARK-100 font-medium">{reservation?.customer?.phoneNumber || 'Not provided'}</p>
                </div>
              </div>

              {/* Reservation Info */}
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                  <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Reservation Date & Time Slot</p>
                  <div className="text-DARK-900 dark:text-DARK-100 font-medium">
                    <p>
                      {reservation?.date
                        ? formatDate(reservation.date,configData?.dateFormat)
                        : 'Not specified'}
                    </p>
                    <p className="text-DARK-700 dark:text-DARK-100">
                      {reservation?.timeSlot ? convertTimeSlotTo12HourFormat(reservation.timeSlot) : <span className="italic text-DARK-500">Not specified</span>}
                    </p>
                  </div>
                </div>
                <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                  <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Room</p>
                  <p className="text-DARK-900 dark:text-DARK-100 font-medium">
                    {reservation?.room?.name ?? 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Table Reservation Details */}
              {reservation?.type === "table" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Reservation Type</p>
                    <p className="text-DARK-900 dark:text-DARK-100 font-medium">{capitalized(reservation?.type) ?? 'Not specified'}</p>
                  </div>
                  <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Table(s) Reserved</p>
                    <p className="text-DARK-900 dark:text-DARK-100 font-medium">
                      {reservation?.tableIds?.length ? reservation.tableIds.map((table: any) => table.name).join(", ") : 'Not assigned'}
                    </p>
                  </div>
                </div>
              )}

              {/* Guest & Status */}
              {reservation?.timeSlot && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Number of Guests</p>
                    <p className="text-DARK-900 dark:text-DARK-100 font-medium">
                      {reservation?.guests ?? 'Not specified'}
                      <span className="text-DARK-600 dark:text-DARK-400 text-sm"> {reservation?.guests > 1 ? 'People' : 'Person'}</span>
                    </p>
                  </div>
                  <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                    <p className="text-DARK-600 dark:!text-DARK-400 text-sm font-semibold">Change Status</p>
                    <select
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-DARK-300 p-2 text-DARK-900 dark:bg-DARK-800 dark:text-DARK-200 dark:border-DARK-600 focus:ring focus:ring-indigo-300"
                      defaultValue={reservation?.status}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Package Details */}
              {reservation?.package && (
                <div className="mt-6 bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-DARK-800 dark:text-DARK-400">Package Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm">
                      <strong className="text-DARK-900 dark:text-DARK-100">Package Name:</strong> {reservation?.package?.name ?? 'Not specified'}
                    </p>
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm">
                      <strong className="text-DARK-900 dark:text-DARK-100">Price:</strong> {reservation?.company?.currency?.symbol}{reservation?.package?.price ?? 'N/A'}
                    </p>
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm">
                      <strong className="text-DARK-900 dark:text-DARK-100">Facilities Included:</strong> {reservation?.package?.facilities?.length ? reservation.package.facilities.join(", ") : 'No facilities listed'}
                    </p>
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm">
                      <strong className="text-DARK-900 dark:text-DARK-100">Duration:</strong> {reservation?.package?.duration ? `${reservation.package.duration} ${reservation.package.duration > 1 ? 'hours' : 'hour'}` : 'Not specified'}
                    </p>
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm">
                      <strong className="text-DARK-900 dark:text-DARK-100">Maximum Guests:</strong> {reservation?.package?.maxGuests ?? 'Not specified'}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes & Deposit */}
              {reservation?.notes && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Notes</p>
                    {/* <p className="text-DARK-900 font-medium">{reservation?.notes.length > 55 ? `${reservation?.notes.slice(0, 55)}...` : reservation?.notes}</p> */}
                    <div>
                      {reservation?.notes?.length > 55 ? (
                        <div>
                          <input
                            type="checkbox"
                            id="notes-toggle"
                            className="hidden peer"
                          />
                          <label
                            htmlFor="notes-toggle"
                            className="text-DARK-900 dark:text-DARK-100 font-medium peer-checked:hidden"
                          >
                            {reservation?.notes.slice(0, 55)}...
                            <span className="inline-flex items-center text-BRAND-500 text-sm font-medium hover:text-BRAND-600 transition-colors duration-200 ml-2 cursor-pointer">
                              View More
                              <svg
                                className="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </span>
                          </label>
                          <div className="hidden peer-checked:block mt-2">
                            <p className="text-DARK-900 dark:text-DARK-100 font-medium">
                              {reservation?.notes}
                            </p>
                            <label
                              htmlFor="notes-toggle"
                              className="inline-flex items-center text-BRAND-500 text-sm font-medium hover:text-BRAND-600 transition-colors duration-200 mt-2 cursor-pointer"
                            >
                              View Less
                              <svg
                                className="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <p className="text-DARK-900 dark:text-DARK-100 font-medium">{reservation?.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-DARK-100 dark:bg-DARK-800 p-4 rounded-lg">
                    <p className="text-DARK-600 dark:text-DARK-400 text-sm font-semibold">Deposit Amount</p>
                    <p className="text-DARK-900 dark:text-DARK-100 font-medium">{reservation?.company?.currency?.symbol}{reservation?.payment?.amount ?? 'Not specified'}</p>
                  </div>
                </div>
              )}

              {reservation?.package && reservation?.status !== 'completed' && (
                <div className="flex justify-between items-center max-w-3xl mx-auto p-6 bg-DARK-100 dark:bg-DARK-800 rounded-lg shadow-md mt-6">
                  <Button color="green" onClick={() => setOpenPaymentModal(true)}>
                    Pay Now
                  </Button>
                  <span className="text-lg font-bold text-emerald-500">
                    Due: {reservation?.company?.currency?.symbol}{Math.max(0, Number(reservation?.package?.price || 0) - Number(reservation?.payment?.amount || 0)).toFixed(2)}
                  </span>
                </div>
              )}

              {reservation?.payment && (
                <div className="max-w-3xl mx-auto p-6 bg-DARK-100 dark:bg-DARK-800 rounded-lg -shadow-md mt-6">
                  <h2 className="text-xl font-bold text-DARK-800 dark:text-DARK-400 mb-4">Payment Details</h2>

                  <div className="grid sm:grid-cols-1">
                    {/* <div className="bg-gradient-to-br from-BRAND-100 to-BRAND-200 shadow-sm rounded-xl py-6 px-4 text-white w-full mb-6"> */}
                    <div className="bg-white dark:bg-DARK-700 shadow-sm rounded-xl py-6 px-4 text-white w-full mb-2">
                      <p className="text-sm font-semibold uppercase text-slate-700 dark:text-DARK-100">Total Payment</p>
                      <p className="text-2xl font-extrabold mt-2 text-slate-700 dark:text-DARK-100">
                        {reservation?.company?.currency?.symbol}{reservation?.payment?.amount ?? 'Free'}
                      </p>
                    </div>

                    {/* {reservation?.payment?.multipleMethods?.length > 0 && (
                      <div className="sm:col-span-2 grid md:grid-cols-2 gap-6">
                        {reservation.payment.multipleMethods.map((method: IPaymentMethod) => (
                          <div key={method._id} className="bg-white shadow-lg rounded-xl p-6 border border-DARK-200 hover:shadow-2xl transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-DARK-100 p-2 rounded-full">
                                <span className="text-DARK-700 text-lg">{method.method === 'CASH' ? <FaMoneyBillWave /> : method.method === 'CARD' ? <FaCreditCard /> : method.method === 'GIFT_CARD' ? <FaGift /> : null}</span>
                              </div>
                              <p className="text-lg font-semibold text-DARK-900">{method.method}</p>
                            </div>

                            <div className="mt-2 space-y-3 text-DARK-700 text-sm">
                              <p><span className="font-semibold">Amount:</span> <span className="text-DARK-900">${method.amount}</span></p>
                              <p><span className="font-semibold">Card Number:</span> **** **** **** <span className="text-DARK-900">{method.cardNumber ? method.cardNumber.slice(-4) : 'Not specified'}</span></p>
                              <p><span className="font-semibold">Card Type:</span> <span className="text-DARK-900">{method.cardType}</span></p>
                              <p><span className="font-semibold">Reference Code:</span> <span className="text-DARK-900">{method.referenceCode}</span></p>
                              <p><span className="font-semibold">Auth Code:</span> <span className="text-DARK-900">{method.authCode}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )} */}
                    {reservation?.payment?.multipleMethods?.length > 0 && (
                      <div className="grid sm:grid-cols-1 gap-2">
                        {reservation.payment.multipleMethods.map((method: IPaymentMethod) => (
                          <div
                            key={method._id}
                            className="relative bg-white dark:bg-DARK-700 shadow-sm rounded-xl p-4 overflow-hidden"
                          >
                            {/* Decorative Top-Right Icon */}
                            <div className="absolute top-3 right-3 text-DARK-300  opacity-40 dark:opacity-100">
                              {/* <FcApproval size={28}/> */}
                              <HiCheckCircle className="text-green-500 dark:text-green-400" size={34} />
                              {/* {method.method === 'CASH' ? (
                              ) : method.method === 'CARD' ? (
                                <FaCreditCard size={28} />
                              ) : method.method === 'GIFT_CARD' ? (
                                <FaGift size={28} />
                              ) : null} */}
                            </div>

                            {/* Header with Icon and Method */}
                            <div className="flex items-center gap-4 -mb-0">
                              <div
                                className={`p-2 rounded-full ${method.method === 'CASH'
                                  ? 'bg-green-100 text-green-600'
                                  : method.method === 'CARD'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-purple-100 text-purple-600'
                                  }`}
                              >
                                {method.method === 'CASH' ? (
                                  <FaMoneyBillWave size={20} />
                                ) : method.method === 'CARD' ? (
                                  <FaCreditCard size={20} />
                                ) : method.method === 'GIFT_CARD' ? (
                                  <FaGift size={20} />
                                ) : null}
                              </div>
                              <p className="text-xl font-bold text-DARK-900 dark:text-DARK-100 tracking-tight">
                                {method.method.replace('_', ' ')}
                              </p>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-1 text-DARK-700 text-sm">
                              <p className="flex items-center justify-between">
                                <span className="font-semibold text-DARK-800 dark:text-DARK-100 ">Amount:</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{reservation?.company?.currency?.symbol}{method.amount}</span>
                              </p>
                              {method.method === 'CARD' && <p className="flex items-center justify-between">
                                <span className="font-semibold text-DARK-800 dark:text-DARK-100">Card Number:</span>
                                <span className="text-DARK-900 font-mono dark:text-DARK-100">
                                  {method.cardNumber ? method.cardNumber : 'Not specified'}
                                  {/* {method.cardNumber ? `**** **** **** ${method.cardNumber.slice(-4)}` : 'Not specified'} */}
                                </span>
                              </p>}
                              {method.method === 'CARD' && <p className="flex items-center justify-between">
                                <span className="font-semibold text-DARK-800 dark:text-DARK-100">Card Type:</span>
                                <span
                                  className={`text-xs font-semibold px-2 -py-1 rounded-full ${method.cardType === 'Visa'
                                    ? 'bg-blue-100 text-blue-700'
                                    : method.cardType === 'MasterCard'
                                      ? 'bg-red-100 text-red-700'
                                      : method.cardType === 'Amex'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-DARK-100 text-DARK-700'
                                    }`}
                                >
                                  {method.cardType || 'N/A'}
                                </span>
                              </p>}
                              {method.method === 'CARD' && <p className="flex items-center justify-between">
                                <span className="font-semibold text-DARK-800 dark:text-DARK-100">Reference Code:</span>
                                <span className="text-DARK-900 font-mono dark:text-DARK-100">{method.referenceCode || 'N/A'}</span>
                              </p>}
                              {method.method === 'CARD' && <p className="flex items-center justify-between">
                                <span className="font-semibold text-DARK-800 dark:text-DARK-100">Auth Code:</span>
                                <span className="text-DARK-900 font-mono dark:text-DARK-100">{method.authCode || 'N/A'}</span>
                              </p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
      <PaymentModal
        open={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
        formData={reservation}
        setFormData={setReservation}
        // onPaymentSubmit={async (paymentData) => paymentReservation(paymentData)}
        currency={reservation?.company?.currency?.symbol}
      />
    </div>
  );
};

export default Reservation;
