import { divContainerStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import { Filters } from "../../utils/common/Filters"
import { useAuth } from "../../context/AuthProvider"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { createQueryParams } from "../../utils/functions"
import apiClient from "../../utils/AxiosInstance"
import Pagination from "../Pagination/Pagination"
import PageSize from "../Pagination/PageSize"
import TableHeaders from "../../utils/common/TableHeaders"
import { Button, Table } from "flowbite-react"
import ListLoader from "../../utils/common/ListLoader"
import { capitalized, formatDate, formatTime, labelLayout } from "../../utils/utility"
import { HiEye } from "react-icons/hi"
import NoData from "../../utils/common/NoData"
import OrderHistoryView from "./OrderHistoryView"
import { useConfigs } from "../../context/SiteConfigsProvider"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../utils/common/SearchInput"

const OrderHistory = () => {

    const { userData } = useAuth();
    const navigate = useNavigate();
      const { configData } = useConfigs();

    const { role: { name: loginRole } = { name: SUPER_ADMIN }, } = userData?.staffMember;
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || "",
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
    const [dataList, setDataList] = useState<any>([]);
    const columnNames = ["SR.No.", "Order", "Amount", "Order Type", "Status", "Order Date", "Previous Status", "Updated Status", "Done By", "Action"];
    if (loginRole === SUPER_ADMIN) {
        const staffIndex = columnNames.indexOf("Order");
        if (staffIndex !== -1) {
            columnNames.splice(staffIndex + 1, 0, "Business");
        }
    }

    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const getOrderHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...formDataRef.current,
                ...searchFilterRef.current,
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/order/history-remove-order${queryParams}`);
            if (response.data.success) {
                setDataList(response?.data?.data);
                setNumOfRecords(response?.data?.count);
            }
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            console.error('Error fetching remove order history:', error.message);
        }
    }, []);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getOrderHistory();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, getOrderHistory, location.search]);

    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/order-history/${updatedFormData.page}/${queryParams}`);
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

    dataList?.forEach((item: any) => {
        const groupKey = item?.order?._id?.toString();
        if (groupKey && !(groupKey in orderGroups)) {
            orderGroups[groupKey] = groupCounter++ % groupColorClasses.length;
        }
    });

    return (
        <div className={divContainerStyle}>
            <div>
                <div className="flex items-center mb-4">
                    <DetailHeaderPaths label="Order History" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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
                            module="orders"
                        />
                    </div>
                </div>
            </div>

            {/* Table Block Container Component */}
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-800">
                        {isLoading ? (
                            <Table.Row>
                                <Table.Cell colSpan={12} className="text-center py-6">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        ) : dataList?.length > 0 ? (
                            dataList.map((item: any, index: number) => {
                                const groupKey = item?.order?._id?.toString();
                                const grpColorClass = groupKey ? groupColorClasses[orderGroups[groupKey]] : '';
                                return (
                                    <Table.Row
                                        key={item?._id}
                                        className={`${grpColorClass}`}
                                    >
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                                            {index + 1 + (page - 1) * limit}
                                        </Table.Cell>
                                        <Table.Cell
                                            onClick={() => { setSelectedId(item?.order?._id); setIsModalOpen(true); }}
                                            className="py-4 px-6 hover:!text-BRAND-500 transition-colors duration-150 cursor-pointer"
                                            title={item?.order?.orderName?.toString() ?? ''}
                                        >
                                            <div className="flex flex-col min-w-[120px]">
                                                <span className="font-medium whitespace-nowrap">{item?.order?.orderName ?? "-"}</span>
                                                {(!item?.order?.splitOrderId && item?.order?.isSplitOrder) ? (
                                                    <span className="text-xs font-normal text-DARK-500 mt-0.5">Main Order</span>
                                                ) : (
                                                    item?.order?.splitOrderId && (
                                                        <span className="text-xs font-normal text-DARK-500 mt-0.5">Split #{item?.order?.splitCount}</span>
                                                    )
                                                )}
                                            </div>
                                        </Table.Cell>
                                        {loginRole === SUPER_ADMIN && (
                                            <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                                {capitalized(item?.companyName) ?? "-"}
                                            </Table.Cell>
                                        )}
                                        <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                            {item?.currencySymbol || "$"}{item?.order?.orderTotalAmount?.toFixed(2) ?? "-"}
                                        </Table.Cell>

                                        <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                            {item?.order?.orderType ? capitalized(item?.order?.productOrderType) : "-"}
                                        </Table.Cell>
                                        <Table.Cell className="py-4 px-6 text-sm text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <span>
                                                    {labelLayout(item?.order?.status)}
                                                </span>

                                                {item?.order?.canceledType?.toLowerCase() === "void" && (
                                                    <div className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-500/10 dark:text-amber-400">
                                                        Voided
                                                    </div>
                                                )}

                                                {item?.order?.canceledType?.toLowerCase() === "return" && (
                                                    <div className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 shadow-sm dark:bg-red-500/10 dark:text-red-400">
                                                        Returned
                                                    </div>
                                                )}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300 whitespace-wrap">
                                            {item?.order?.orderDate
                                                ? `${formatDate(item?.order.orderDate,configData?.dateFormat || "DD/MM/YYYY")}, ${formatTime(item?.order.orderDate)}`
                                                : "-"}
                                        </Table.Cell>
                                        <Table.Cell className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300`} >
                                            {item?.previousStatus != null ? (item?.previousStatus ? "Removed" : "Restore") : "-"}
                                        </Table.Cell>
                                        <Table.Cell className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300`} >
                                            {item?.updatedStatus != null ? (item?.updatedStatus ? "Removed" : "Restore") : "-"}
                                        </Table.Cell>
                                        <Table.Cell className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300`} >
                                            {capitalized(item?.createdByName) ?? "-"}
                                        </Table.Cell>
                                        <Table.Cell className="py-4 px-6">
                                            <div className="flex justify-center">
                                                <Button
                                                    className={editBtnStyle.btn}
                                                    size="xs"
                                                    title="View Order History"
                                                    onClick={() => {
                                                        setSelectedId(item?.order?._id);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    <HiEye className={editBtnStyle.icon} />
                                                    <span className="sr-only">View</span>
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })
                        ) : (
                            <Table.Row>
                                <Table.Cell colSpan={11} className="text-center py-10 text-DARK-500 dark:text-DARK-400">
                                    <NoData
                                        title="No Order History Found"
                                        message="No order history is available right now."
                                    />
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>

                {/* Bottom Pagination Control Section */}
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

            {/* Component Drawer/Modal Details Trigger Element */}
            <OrderHistoryView
                id={selectedId}
                setId={setSelectedId}
                open={isModalOpen}
                setOpen={setIsModalOpen}
            />
        </div>
    )
}

export default OrderHistory