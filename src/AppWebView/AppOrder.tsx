import { Button, Table, TextInput } from "flowbite-react"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import { Filters } from "../utils/common/Filters"
import TableHeaders from "../utils/common/TableHeaders"
import ListLoader from "../utils/common/ListLoader"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { capitalized, formatDate } from "../utils/utility"
import { editBtnStyle, SUPER_ADMIN } from "../utils/common/constant"
import { HiEye } from "react-icons/hi"
import NoData from "../utils/common/NoData"
import PageSize from "../components/Pagination/PageSize"
import Pagination from "../components/Pagination/Pagination"
import { useCallback, useEffect, useState } from "react"
import { createQueryParams } from "../utils/functions"
import { IOrder } from "../utils/common/Interface/OrderInterface"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { apiUrl } from "../environment/env"
import { useConfigs } from "../context/SiteConfigsProvider"

interface DecodedToken {
    role?: string;
    roleName?: string;
    company?: string;
    restaurant?: string;
    [key: string]: any;
}
const AppOrder = () => {

    const { search } = useLocation();
      const { configData } = useConfigs();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const urlParams = new URLSearchParams(search);
    const token = urlParams.get("token");

    useEffect(() => {
        if (token) {
            localStorage.setItem("webView", `${token}`);
            const decodedToken = jwtDecode<DecodedToken>(token);
            setDecoded(decodedToken);
        }
    }, [search]);

    const loginRole = decoded?.roleName || SUPER_ADMIN;

    const location = useLocation();
    const columnNames = ["SR.No.", "Order", "Customer", "Server", "Amount($)", "Tip($)", "Order Type", "Status", "Order Date", "Action"];
    if (loginRole === SUPER_ADMIN) {
        const staffIndex = columnNames.indexOf("Server");
        if (staffIndex !== -1) {
            columnNames.splice(staffIndex + 1, 0, "Business");
        }
    }

    const [ordersList, setOrdersList] = useState<IOrder[]>([]);
    // const { isLoading, setIsLoading } = useLoading();
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [showFilters, setShowFilters] = useState(false);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || "",
        status: searchParams.get("status") || "",
        date: searchParams.get("toDate") || "",
        restaurant: searchParams.get("restaurant") || "",
    });

    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
        source: 'web',
    });

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const getOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...formData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);
            const response = await axios.get(`${apiUrl}/order${queryParams}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setOrdersList(response.data.orders);
                setNumOfRecords(response.data.count)
            }
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            console.error('Error fetching sales categories:', error.message);
        } finally {
            setIsLoading(false);
        }
    }, [formData, searchFilter])

    useEffect(() => {
        // const myParam: any = new URLSearchParams(location.search).get("page");
        // if (myParam) {
        //     setPage(myParam - 1);
        // }
        const debounceDelay = setTimeout(() => {
            getOrders();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getOrders, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter, token: token };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/order/app/${updatedFormData.page}/${queryParams}`,);
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
        updateURL(formData);
        setLimit(formData?.limit)
        setPage(formData?.page);
    }, [searchFilter, formData,]);

    useEffect(() => {
        navigateSearchPrams();
    }, [searchFilter, navigateSearchPrams]);



    return (
        <div className={`flex flex-col gap-4 bg-slate-200 p-2 min-h-screen`}>
            <div>
                <div className="mx-auto">
                    <div className="flex gap-4">
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
                            <div className="transition-all duration-500 ease-in-out">
                                <TextInput
                                    type="text"
                                    placeholder="Search..."
                                    value={searchFilter?.name ?? ''}
                                    onChange={e => setSearchFilter((prev: any) => ({ ...prev, name: e.target.value }))}
                                    className="rounded-md focus:!ring-0 min-w-60 dark:bg-DARK-700 dark:text-white"
                                />
                            </div>
                        )}
                    </div>
                    <div
                        className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
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
            </div>

            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-700">
                        {isLoading ? (
                            <Table.Row>
                                <Table.Cell colSpan={11} className="text-center py-6">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        ) : ordersList?.length > 0 ? (
                            ordersList.map((order: IOrder, index: number) => (
                                <Table.Row
                                    key={order._id}
                                    className="bg-white dark:bg-DARK-800 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-150"
                                >
                                    <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                                        {index + 1 + (page - 1) * limit}
                                    </Table.Cell>
                                    <Table.Cell className="py-4 px-6" title={order?.orderName?.toString() ?? ''}>
                                        <Link
                                            to={`/order/app/view/${order?._id}?token=${token}`}
                                            className="text-DARK-900 dark:text-white hover:!text-BRAND-500 transition-colors duration-150 font-medium"
                                        >
                                            {order?.orderName ?? "-"}
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                        {order.customerId?.firstName
                                            ? capitalized(`${order?.customerId?.firstName} ${order?.customerId?.lastName}`)
                                            : "Guest"}
                                    </Table.Cell>
                                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                        {capitalized(order.server?.name) ?? "-"}
                                    </Table.Cell>
                                    {loginRole === SUPER_ADMIN && (
                                        <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                            {capitalized(order.company?.name) ?? "-"}
                                        </Table.Cell>
                                    )}
                                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                        {order?.orderTotalAmount?.toFixed(2) ?? "-"}
                                    </Table.Cell>
                                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                        <input
                                            type="text"
                                            value={0}
                                            className="w-16 rounded-lg border-0 bg-DARK-100 dark:bg-DARK-600 text-DARK-500 dark:text-DARK-400 px-2 py-1 text-sm"
                                            disabled
                                        />
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
                                    <Table.Cell className="py-4 px-6 text-sm">
                                        <span
                                            className={`w-20 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium
                                                ${order?.status === "completed"
                                                    ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-800 dark:text-green-200 dark:border-green-600"
                                                    : order?.status === "hold"
                                                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 dark:border-yellow-600"
                                                        : "bg-red-100 text-red-700 border border-red-200 dark:bg-red-800 dark:text-red-200 dark:border-red-600"
                                                }`}

                                        >
                                            {order?.status.toUpperCase() ?? "-"}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                        {formatDate(order.orderDate, `${configData?.dateFormat} hh:mm A`) ?? "-"}
                                    </Table.Cell>
                                    <Table.Cell className="py-4 px-6 text-center flex gap-1">
                                        <Link to={`/order/app/view/${order?._id}?token=${token}`}>
                                            <Button className={editBtnStyle.btn} size="xs" title="View Order">
                                                <HiEye className={editBtnStyle.icon} />
                                                <span className="sr-only">View</span>
                                            </Button>
                                        </Link>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row>
                                <Table.Cell colSpan={11} className="text-center py-10 text-DARK-500 dark:text-DARK-400">
                                    <NoData
                                        title="No Orders Yet"
                                        message="Customer orders will appear here once placed."
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
        </div >
    )
}

export default AppOrder
