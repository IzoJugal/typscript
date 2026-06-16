import { Button, Modal, Table, Tooltip } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiDeleteBin6Line, RiEdit2Fill } from "react-icons/ri";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import ConfirmModal from "../../hooks/ConfirmModal";
import Pagination from "../Pagination/Pagination";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import { useAuth } from "../../context/AuthProvider";
import { Filters } from "../../utils/common/Filters";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { createQueryParams } from "../../utils/functions";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, labelLayout, setTitle } from "../../utils/utility";
import { FaArrowRotateLeft } from "react-icons/fa6";
import ListLoader from "../../utils/common/ListLoader";
import { IoSettingsSharp } from "react-icons/io5";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface CompanyDocument {
    _id: string;
    name: string;
    company: {
        name: string;
    };
    address: Address;
    isActive: boolean;
    isDelete?: boolean;
}

const Restaurant = () => {
    setTitle('Restaurant');
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    const [restaurant, setRestaurant] = useState<CompanyDocument[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // const { pages } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Parse values safely directly from URL searchParams
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || "",
        isActive: searchParams.get("isActive") || "",
        isDelete: searchParams.get("isDelete") || false,
    });

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [open, setOpen] = useState(false);

    const debounceRef = useRef<any | null>(null);
    const controllerRef = useRef<AbortController | null>(null);

    // Keep Refs current for socket events
    const restaurantRef = useRef(restaurant);
    const pageRef = useRef(page);
    const limitRef = useRef(limit);

    useEffect(() => { restaurantRef.current = restaurant; }, [restaurant]);
    useEffect(() => { pageRef.current = page; }, [page]);
    useEffect(() => { limitRef.current = limit; }, [limit]);

    const columnNames = loginRole === SUPER_ADMIN
        ? ["Sr.No.", "Name", "Business", "Address", "Status", "Actions"]
        : ["Sr.No.", "Name", "Address", "Status", "Actions"];


    const handleLimit = (data: any) => {
        const queryParams = createQueryParams({ ...searchFilter, page: 1, limit: data });
        setSearchParams(queryParams);
    };

    const curPage = (pageNum: any) => {
        const queryParams = createQueryParams({ ...searchFilter, page: pageNum, limit: limit });
        setSearchParams(queryParams);
    };

    const getRestaurants = useCallback(async () => {
        try {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
            controllerRef.current = new AbortController();
            setIsLoading(true);

            const combinedData = {
                page,
                limit,
                ...searchFilter,
            };

            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/restaurant${queryParams}`, {
                signal: controllerRef.current.signal,
            });

            setRestaurant(response.data.restaurants);
            setNumOfRecords(response.data.count);
        } catch (error: any) {
            if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
                console.error("getRestaurants error:", error);
                setRestaurant([]);
                toast.error(error?.response?.data?.message || "Failed to fetch restaurants");
            }
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchFilter.name, searchFilter.company, searchFilter.isActive, searchFilter.isDelete]);

    // Single source Debounced API Fetch Coordinator
    useEffect(() => {
        setIsLoading(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            getRestaurants();
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [getRestaurants]);

    const [numOfRecords, setNumOfRecords] = useState<number>(0);

    const handleDelete = async () => {
        if (!selectedId) return;
        setIsModalOpen(false);
        setSelectedId(null);
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/restaurant/soft-delete/${selectedId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Delete restaurant error:', error);
            toast.error('Failed to delete the restaurant.');
        }
    };

    const handlePermanentDelete = async () => {
        if (!selectedId) return;
        setIsDeleteOpen(false);
        setSelectedId(null);
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/restaurant/delete/${selectedId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
                setIsLoading(false);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Delete restaurant error:', error);
            toast.error('Failed to delete the restaurant.');
        }
    };

    const handleRestore = async () => {
        if (!selectedId) return;
        setIsRestoreOpen(false);
        setSelectedId(null);
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/restaurant/restore/${selectedId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Restore restaurant error:', error);
            toast.error('Failed to restore the restaurant.');
        }
    };

    const restoreDelete = (id: string) => {
        setSelectedId(id);
        setOpen(true);
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    const onCloseModal = () => {
        setSelectedId(null);
        setOpen(false);
    };

    const socket = useSocket();
    const socketAllowDataPermission = (data: any) => {
        let status = false;
        if (loginRole === "Super Admin") {
            status = true;
        } else if (MANAGER_ROLES.includes(loginRole)) {
            if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
                status = true;
            }
        }
        return status;
    };

    useEffect(() => {
        const addRestaurant = (restaurantItem: any) => {
            if (socketAllowDataPermission(restaurantItem)) {
                setRestaurant((prevData: any) => {
                    const updatedData = [...prevData];
                    if (prevData?.length >= limitRef.current) {
                        updatedData?.pop();
                    }
                    return [restaurantItem, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updateRestaurant = (restaurantItem: any) => {
            setRestaurant((prev: any) => prev.map((item: any) => item._id === restaurantItem._id ? restaurantItem : item));
        };
        const restoreRestaurant = (restaurantItem: any) => {
            setRestaurant((prev: any) => prev.map((item: any) => item._id === restaurantItem._id ? restaurantItem : item));
        };
        const deleteRestaurant = (restaurantData: any) => {
            const exists = restaurantRef.current?.some((item: any) => String(item._id) === String(restaurantData._id));
            if (!exists) return;
            const updatedRestaurants = restaurantRef.current?.filter((item: any) => item._id !== restaurantData?._id);
            setRestaurant(updatedRestaurants);
            if (updatedRestaurants.length === 0) {
                if (pageRef.current > 1) {
                    curPage(pageRef.current - 1);
                } else {
                    curPage(1);
                }
            }
            setNumOfRecords((prev) => prev - 1);
        };

        socket.on("addRestaurant", addRestaurant);
        socket.on("updateRestaurant", updateRestaurant);
        socket.on("deleteRestaurant", deleteRestaurant);
        socket.on("restoreRestaurant", restoreRestaurant);

        return () => {
            socket.off("addRestaurant", addRestaurant);
            socket.off("updateRestaurant", updateRestaurant);
            socket.off("deleteRestaurant", deleteRestaurant);
            socket.off("restoreRestaurant", restoreRestaurant);
        };
    }, [socket]);

    const [showFilters, setShowFilters] = useState(false);
    const userRole = (loginRole !== SUPER_ADMIN && !MANAGER_ROLES.includes(loginRole));

    return (
        <div className={divContainerStyle}>
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Restaurant" />
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
                                placeholder="Search..."
                                className="h-[42px] self-center"
                            />
                        )}
                    </div>

                    {!userRole ? (
                        <div className="self-end sm:self-auto">
                            <Link to="/restaurant/add">
                                <AddActionButton text="Add a new restaurant" />
                            </Link>
                        </div>
                    ) : undefined}
                </div>

                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <Filters
                            searchFilter={searchFilter}
                            loginRole={loginRole}
                            setSearchFilter={setSearchFilter}
                            module="restaurant"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={8} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {restaurant && restaurant.length > 0 && !isLoading ? restaurant.map((item, index) => (
                            <Table.Row key={item._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                                    {index + 1 + (page - 1) * limit}
                                </Table.Cell>
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item?.name)}>
                                    {capitalized(item?.name) ?? "-"}
                                </Table.Cell>
                                {loginRole === SUPER_ADMIN && (
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.company?.name)}>
                                        {capitalized(item?.company?.name) ?? "-"}
                                    </Table.Cell>
                                )}
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item?.address?.city)}>
                                    {item?.address?.city ? (
                                        <>
                                            {capitalized(item?.address?.city)}{' '}
                                            <span className="text-xs">({item?.address?.zipCode})</span>
                                        </>
                                    ) : "-"}
                                </Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                    {labelLayout(item.isActive ? 'activated' : 'deactivated')}
                                </Table.Cell>
                                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Tooltip content="Go to advance settings">
                                        <Button className={editBtnStyle.btn} onClick={() => navigate(`/restaurant/settings/${item._id}?limit=10&page=1`)} size="xs" disabled={!!item?.isDelete}>
                                            <IoSettingsSharp className={editBtnStyle.icon} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Edit restaurant">
                                        <Button className={editBtnStyle.btn} onClick={() => navigate(`/restaurant/edit/${item._id}`)} size="xs" disabled={!!item?.isDelete || userRole}>
                                            <RiEdit2Fill className={editBtnStyle.icon} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Delete restaurant">
                                        <Button onClick={() => confirmDelete(item._id)} className={deleteBtnStyle.btn} size="xs" disabled={!!item?.isDelete || userRole}>
                                            <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                        </Button>
                                    </Tooltip>
                                    {searchFilter?.isDelete === true && (
                                        <Button title={userData?.staffMember?.company?._id === item?._id ? "Your company cannot be deleted or restored by you." : ""} onClick={() => restoreDelete(item._id)} disabled={!item?.isDelete} className={editBtnStyle.btn} size="xs">
                                            <FaArrowRotateLeft className={editBtnStyle.icon} />
                                        </Button>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        )) : !isLoading && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Restaurants Found"
                                        message="No restaurant entries are available right now. Added restaurant entries will appear here."
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

            <ConfirmModal isOpen={isModalOpen} message="Are you sure you want to mark this restaurant as deleted?" onConfirm={handleDelete} onCancel={() => setIsModalOpen(false)} />
            <ConfirmModal isOpen={isDeleteOpen} message="Are you sure you want to permanent delete this restaurant?" onConfirm={handlePermanentDelete} onCancel={() => setIsDeleteOpen(false)} />
            <ConfirmModal isOpen={isRestoreOpen} message="Are you sure you want to restore this restaurant?" onConfirm={handleRestore} onCancel={() => setIsRestoreOpen(false)} />

            <Modal show={open} onClose={() => onCloseModal()} className=" backdrop-blur-sm" >
                <Modal.Header className="dark:bg-DARK-800">Restore or Permanently Delete?</Modal.Header>
                <Modal.Body className="dark:bg-DARK-800">
                    <div className="flex justify-center gap-4">
                        <Button className="flex items-center justify-center gap-2 w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setIsRestoreOpen(true); setOpen(false); }}>
                            <div className="flex items-center justify-center gap-2">
                                <FaArrowRotateLeft className="h-2/3 w-2/3" />
                                <span>Restore</span>
                            </div>
                        </Button>
                        <Button className="flex items-center justify-center gap-2 w-full max-w-[150px] px-2 py-1 !bg-ERROR_HOVER text-white rounded-lg font-medium shadow-sm hover:!bg-ERROR_ACTIVE focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setIsDeleteOpen(true); setOpen(false); }}>
                            <div className="flex items-center justify-center gap-2">
                                <RiDeleteBin6Line className="h-2/3 w-2/3" />
                                <span>Delete</span>
                            </div>
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Restaurant;