import { Button, Checkbox, Table, ToggleSwitch } from "flowbite-react";
import { useAuth } from "../../context/AuthProvider";
import { useSocket } from "../../context/SocketProvider";
import { divContainerStyle, editBtnStyle, OWNER_ADMIN_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { capitalized, formatDate, formatTime, labelLayout, setTitle } from "../../utils/utility";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IOrder } from "../../utils/common/Interface/OrderInterface";
import { Filters } from "../../utils/common/Filters";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import ListLoader from "../../utils/common/ListLoader";
import NoData from "../../utils/common/NoData";
import { HiEye } from "react-icons/hi";
import { createQueryParams } from "../../utils/functions";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import ConfirmModal from "../../hooks/ConfirmModal";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

const RemovedOrders = () => {
    setTitle('Removed Orders');
    const socket = useSocket();
      const { configData } = useConfigs();

    const { userData } = useAuth();
    const { role: { name: loginRole } = { name: SUPER_ADMIN }, } = userData?.staffMember;
    const featureConfig = userData?.featureConfig;
    const columnNames = ["SR.No.", "Order", "Customer", "Server", "Amount", "Order Type", "Status", "Order Date", "Removed By", "Action"];
    if (loginRole === SUPER_ADMIN) {
        const staffIndex = columnNames.indexOf("Server");
        if (staffIndex !== -1) {
            columnNames.splice(staffIndex + 1, 0, "Business");
        }
    }
    const shouldRestoreOrder = (featureConfig?.order_features?.remove_order === true && OWNER_ADMIN_ROLES.includes(loginRole)) || loginRole === SUPER_ADMIN;
    const [enableMultiRemove, setEnableMultiRemove] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    const [ordersList, setOrdersList] = useState<IOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingBtn, setIsLoadingBtn] = useState(false);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const staffCompanyId = loginRole !== SUPER_ADMIN
        ? (userData?.staffMember?.company?._id || "")
        : "";
    // const staffRestaurantId = loginRole !== SUPER_ADMIN && !OWNER_ROLES.includes(loginRole)
    //     ? (userData?.staffMember?.restaurant?._id || "")
    //     : "";
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || staffCompanyId,
        status: searchParams.get("status") || "",
        date: searchParams.get("toDate") || "",
        restaurant: searchParams.get("restaurant") || "",
        orderType: searchParams.get("orderType") || "",
    });
    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
        source: 'web',
    });


    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        const restoreOrder = (orderIds: any) => {
            if (!Array.isArray(orderIds) || orderIds.length === 0) return;

            setOrdersList((prevData: IOrder[]) => {
                const updatedOrders = prevData.filter(order => !orderIds.includes(order._id));
                return updatedOrders;
            });
            getOrders();
        };

        socket.on("restoreOrder", restoreOrder);

        return () => {
            socket.off("restoreOrder", restoreOrder);
        };
    }, [socket]);

    const getOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...formDataRef.current,
                ...searchFilterRef.current,
                isRemoved: true
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/order${queryParams}`);
            if (response.data.success) {
                setOrdersList(response.data.orders);
                setNumOfRecords(response.data.count);
            }
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            console.error('Error fetching remove orders:', error.message);
        }
    }, []);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getOrders();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, getOrders, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/removed-order/${updatedFormData.page}/${queryParams}`);
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

    const groupColorClasses = [
        '!border-l-4 !border-l-blue-500 dark:!border-l-blue-600',
        '!border-l-4 !border-l-green-500 dark:!border-l-green-600',
        '!border-l-4 !border-l-indigo-500 dark:!border-l-indigo-600',
        '!border-l-4 !border-l-amber-500 dark:!border-l-amber-600',
        '!border-l-4 !border-l-red-500 dark:!border-l-red-600',
    ];

    const orderGroups: Record<string, number> = {};
    let groupCounter = 0;

    ordersList.forEach(order => {
        const groupKey = order.isSplitOrder ? order._id : order.splitOrderId ?? order._id;
        if (!orderGroups[groupKey]) {
            orderGroups[groupKey] = groupCounter++ % groupColorClasses.length;
        }
    });

    const handleRestoreOrder = async () => {
        try {

            setIsLoadingBtn(true);
            const response: any = await apiClient.post(`/order/restore-order`, { orderIds: selectedOrders });
            if (response?.data?.success) {
                toast.success(response?.data?.message || "Order Restore process completed successfully.")
            }

        } catch (error: any) {
            console.error('~ restore order error :-', error);
            toast.error(error?.response?.data?.message || error?.message || "Something went wrong");
        } finally {
            setSelectAll(false);
            setSelectedOrders([]);
            setIsLoadingBtn(false);
            setIsModalOpen(false);
        }
    };


    return (
        <div className={divContainerStyle}>
            <div>
                <div className="flex items-center mb-4">
                    <DetailHeaderPaths label="Removed Orders" />
                </div>

                {/* Unified Top Controls Container */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">

                    {/* Left/Middle Action: Filter & Search Group */}
                    <div className="flex items-center gap-4">
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

                        {!showFilters && (
                            <SearchInput
                                value={searchFilter.name}
                                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                                placeholder="Search..."
                                className="h-[42px] self-center"
                            />
                        )}
                    </div>

                    {/* Right Action: Restore Order Toggle & Action Button */}
                    {shouldRestoreOrder && (
                        <div className="flex items-center gap-4 ml-auto sm:ml-0">
                            <label className="flex items-center gap-2 text-sm font-medium text-DARK-700 dark:text-DARK-300 whitespace-nowrap">
                                Restore Order
                                <ToggleSwitch
                                    color="success"
                                    checked={enableMultiRemove}
                                    onChange={(val) => {
                                        setEnableMultiRemove(val);
                                        if (!val) {
                                            setSelectedOrders([]);
                                            setSelectAll(false);
                                        }
                                    }}
                                />
                            </label>

                            {enableMultiRemove && (
                                <Button
                                    color="blue"
                                    className="!bg-BRAND-500 hover:!bg-BRAND-600 focus:!ring-0 w-28 h-10 flex items-center justify-center gap-1"
                                    disabled={selectedOrders?.length === 0}
                                    onClick={() => { setIsModalOpen(true); }}
                                >
                                    <MdOutlineSettingsBackupRestore className="h-5 w-5" />
                                    Restore
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Collapsible Filters Dropdown Section */}
                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <Filters
                            searchFilter={searchFilter}
                            loginRole={loginRole}
                            setSearchFilter={setSearchFilter}
                            module="orders"
                        />
                    </div>
                </div>
                <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                    <Table hoverable>
                        <Table.Head>
                            {enableMultiRemove && (
                                <Table.HeadCell className="bg-BRAND-100 dark:bg-slate-700 dark:text-white select-none">
                                    <Checkbox
                                        checked={selectAll}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setSelectAll(checked);

                                            if (checked) {
                                                const allIds = ordersList.map((o) => o._id);
                                                setSelectedOrders(allIds);
                                            } else {
                                                setSelectedOrders([]);
                                            }
                                        }}
                                        className="cursor-pointer checked:!bg-BRAND-500 focus:!ring-0"
                                    />
                                </Table.HeadCell>
                            )}

                            {columnNames.map((columnName, index) => (
                                <Table.HeadCell key={index} className="bg-BRAND-100 dark:bg-slate-700 dark:text-white select-none">
                                    {columnName}
                                </Table.HeadCell>
                            ))}
                        </Table.Head>

                        <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-800">
                            {isLoading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={columnNames.length + (enableMultiRemove ? 1 : 0)} className="text-center py-6">
                                        <ListLoader />
                                    </Table.Cell>
                                </Table.Row>
                            ) : ordersList?.length > 0 ? (
                                ordersList.map((order: IOrder, index: number) => {
                                    const groupKey = order.splitOrderId ?? order._id;

                                    if (!(groupKey in orderGroups)) {
                                        orderGroups[groupKey] = groupCounter++ % groupColorClasses.length;
                                    }

                                    const grpColorClass = groupColorClasses[orderGroups[groupKey]];
                                    return (
                                        <Table.Row
                                            key={order._id}
                                            className={`${grpColorClass} ${order?.isSplitOrder
                                                ? 'bg-DARK-200 dark:bg-DARK-800'
                                                : 'bg-white dark:bg-DARK-900 hover:bg-DARK-50 dark:hover:bg-DARK-800'} transition-colors duration-150`}
                                        >
                                            {enableMultiRemove && (
                                                <Table.Cell className="w-10 text-center">
                                                    <Checkbox
                                                        checked={selectedOrders.includes(order._id)}
                                                        onChange={() => {
                                                            if (selectedOrders.includes(order._id)) {
                                                                setSelectedOrders(selectedOrders.filter((id) => id !== order._id));
                                                                setSelectAll(false);
                                                            } else {
                                                                const newSelected = [...selectedOrders, order._id];
                                                                setSelectedOrders(newSelected);
                                                                if (newSelected.length === ordersList.length) {
                                                                    setSelectAll(true);
                                                                }
                                                            }
                                                        }}
                                                        className="cursor-pointer checked:!bg-BRAND-500 focus:!ring-0"
                                                    />
                                                </Table.Cell>
                                            )}
                                            <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                                                {index + 1 + (page - 1) * limit}
                                            </Table.Cell>
                                            <Table.Cell className="py-4 px-6" title={order?.orderName?.toString() ?? ''}>
                                                <Link
                                                    to={`/order/view/${order?._id}`}
                                                    className="flex flex-col text-DARK-900 dark:text-white hover:!text-BRAND-500 transition-colors duration-150 font-medium"
                                                >
                                                    <span>{order?.orderName ?? "-"}</span>
                                                    {(!order?.splitOrderId && order?.isSplitOrder) ? (<span className="text-xs font-normal text-DARK-500">Main Order</span>) : (order?.splitOrderId) && (<span className="text-xs font-normal text-DARK-500">Split #{order?.splitCount}</span>)}
                                                </Link>
                                            </Table.Cell>
                                            <Table.Cell className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300 `}>
                                                {order.customerId?.firstName
                                                    ? capitalized(`${order?.customerId?.firstName} ${order?.customerId?.lastName}`)
                                                    : "Guest"}
                                            </Table.Cell>
                                            <Table.Cell className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300`} >
                                                {capitalized(order.server?.name) ?? "-"}
                                            </Table.Cell>
                                            {loginRole === SUPER_ADMIN && (
                                                <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                                    {capitalized(order.company?.name) ?? "-"}
                                                </Table.Cell>
                                            )}
                                            <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                                {order?.company?.currency?.symbol || "$"}{order?.orderTotalAmount?.toFixed(2) ?? "-"}
                                            </Table.Cell>

                                            <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                                {order?.orderType === "product" ? (
                                                    capitalized(order?.productOrderType)
                                                ) : (
                                                    <span title={`Room: ${capitalized(order?.roomName)}`}>
                                                        <span className="mr-1">{capitalized(order?.orderType)}</span>
                                                        <span className="font-medium">({capitalized(order?.roomName)})</span>
                                                    </span>
                                                )}
                                            </Table.Cell>
                                            <Table.Cell className="flex flex-col items-center justify-center py-4 px-6 text-sm text-center space-y-2">
                                                <span>
                                                    {labelLayout(order?.status)}
                                                </span>

                                                {(order?.canceledType?.toLowerCase() === 'void') && (
                                                    <div className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-500/10 dark:text-amber-400">
                                                        Voided
                                                    </div>
                                                )}

                                                {(order?.canceledType?.toLowerCase() === 'return') && (
                                                    <div className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 shadow-sm dark:bg-red-500/10 dark:text-red-400">
                                                        Returned
                                                    </div>
                                                )}
                                            </Table.Cell>


                                            <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                                {order?.orderDate
                                                    ? `${formatDate(order.orderDate,configData?.dateFormat || "DD/MM/YYYY")}, ${formatTime(order.orderDate)}`
                                                    : "-"}
                                            </Table.Cell>
                                            <Table.Cell className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300`} >
                                                {capitalized((order as any)?.removedBy) ?? "-"}
                                            </Table.Cell>
                                            <Table.Cell className="py-4 px-6 text-center flex gap-1">
                                                <Link to={`/order/view/${order?._id}`}>
                                                    <Button className={editBtnStyle.btn} size="xs" title="View Order">
                                                        <HiEye className={editBtnStyle.icon} />
                                                        <span className="sr-only">View</span>
                                                    </Button>
                                                </Link>
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                })
                            ) : (
                                <Table.Row>
                                    <Table.Cell colSpan={columnNames.length + (enableMultiRemove ? 1 : 0)} className="text-center py-10 text-DARK-500 dark:text-DARK-400">
                                        <NoData
                                            title="No Removed Orders Found"
                                            message="No removed orders are available right now."
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>

                    {/* Pagination */}
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

                <ConfirmModal
                    isOpen={isModalOpen}
                    message={`Are you sure you want to restore ${selectedOrders?.length} order?`}
                    onConfirm={handleRestoreOrder}
                    onCancel={() => setIsModalOpen(false)}
                    isLoadingBtn={isLoadingBtn}
                />
            </div>
        </div>
    )
}

export default RemovedOrders