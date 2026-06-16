import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useParams, useSearchParams, } from "react-router-dom"
import apiClient from "../../utils/AxiosInstance"
import * as XLSX from "xlsx";
import { Button, Table, } from "flowbite-react"
import { FaAngleDown, FaAngleUp, FaArrowDown, FaFilter } from "react-icons/fa"
import { FormHeaderPaths } from "../../utils/HeaderPaths"
import TableHeaders from "../../utils/common/TableHeaders"
import Pagination from "../Pagination/Pagination"
import PageSize from "../Pagination/PageSize"
import NoData from "../../utils/common/NoData";
import { createQueryParams } from "../../utils/functions";
import { divContainerStyle, SUPER_ADMIN } from "../../utils/common/constant";
import { useAuth } from "../../context/AuthProvider";
import { Filters } from "../../utils/common/Filters";
import { capitalized } from "../../utils/utility";
import ListLoader from "../../utils/common/ListLoader";
import { toast } from "react-toastify";
import SearchInput from "../../utils/common/SearchInput";

interface Category {
    name: string;
}
interface ItemModifiers {
    _id: string;
    category: Category;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
    isVeg: boolean;
    company: {
        _id: string, name: string;
        currency?: {
            symbol?: string;
        }
    };
    restaurant?: {
        _id: string;
        name: string;
    }
}

const ModifierReport = () => {

    const { pathname } = useLocation();
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const webView = ['/report/products/modifier/app'];
    const appWebView = webView.includes(pathname);

    const [modifiersDetail, setModifiersDetail] = useState<ItemModifiers[]>([])
    const [isLoading, setIsLoading] = useState(true);

    // const [statusFilter, setStatusFilter] = useState('');
    const [btnLoader, setBtnLoader] = useState(false);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(isNaN(+pages) ? 1 : +pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const mountedRef = useRef(false);

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
        modifiercategory: searchParams.get("modifiercategory") || "",
        isAvailable: searchParams.get("isAvailable") || "",
    });

    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });

    const columnNames = loginRole === SUPER_ADMIN
        ? ["Sr.No.", "Name", "Business", "Price", "Modifier Category", "Status"]
        : ["Sr.No.", "Name", "Price", "Modifier Category", "Status"];

    const getModifiers = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/modifier${queryParams}`)
            setTimeout(() => {
                setIsLoading(false)
                setModifiersDetail(response.data.modifiers)
                setNumOfRecords(response.data.count)
            }, 500);
        } catch (error) {
            setIsLoading(false)
            setModifiersDetail([])
            console.error('~ getProduct error :-', error);
        }
    }, [formData, searchFilter])


    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getModifiers();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getModifiers]);

    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
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
        if (!mountedRef.current) {
            mountedRef.current = true;
            navigateSearchPrams();
        }
    }, [navigateSearchPrams]);
    const [showFilters, setShowFilters] = useState(false);

    const exportToExcel = async () => {
        try {
            setBtnLoader(true);

            const queryParams = createQueryParams(searchFilter);
            const response = await apiClient.get(`/modifier${queryParams}`);

            const allModifiers: ItemModifiers[] = response.data.modifiers;

            if (allModifiers.length === 0) {
                toast.error("No data available to export");
                setBtnLoader(false);
                return;
            }
            // Map the data to Excel sheet format
            const ws = XLSX.utils.json_to_sheet(allModifiers.map(item => ({
                Name: item?.name,
                Description: item?.description,
                Price: item?.price,
                Category: item?.category?.name,
                Status: item.isAvailable ? 'Available' : 'Not available',
            })));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Modifier");

            XLSX.writeFile(wb, "Modifier_Report.xlsx");
        } catch (error) {
            console.error('~ exportToExcel error :-', error);
            setBtnLoader(false);
        } finally {
            setBtnLoader(false);
        }
    };

    return (
        <div className={divContainerStyle}>
            <div>
                {!appWebView && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                        <FormHeaderPaths page={'Modifier Report'} prevLink='#' prevPage='Products' />
                    </div>
                )}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <div className="flex gap-4 items-center flex-1 sm:flex-initial">
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

                    {!showFilters && (
                        <SearchInput
                            value={searchFilter.name}
                            onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                            placeholder="Search..."
                            className="h-[42px] self-center"
                        />
                    )}
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:ml-auto w-full sm:w-auto justify-end">
                    {appWebView === false && (
                        <Button
                            onClick={exportToExcel}
                            className="!bg-BRAND-500 hover:!bg-BRAND-600 flex gap-2 items-center justify-center text-white rounded-md h-10 whitespace-nowrap import-btn px-4 text-sm font-medium"
                        >
                            {btnLoader ? (
                                <span>Downloading...</span>
                            ) : (
                                <>
                                    <FaArrowDown className="text-xs mr-1" />
                                    Export to Excel
                                </>
                            )}
                        </Button>
                    )}
                </div>
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
                        module="modifier"
                        setIsDropdownOpen={setIsDropdownOpen}
                        isDropdownOpen={isDropdownOpen}
                    />
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
                        {modifiersDetail && (modifiersDetail?.length > 0 && !isLoading) ? modifiersDetail?.map((item, index) => {
                            return <Table.Row key={item?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item.name)}>{capitalized(item.name) ?? '-'}</Table.Cell>
                                {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.company?.name)}>
                                    {capitalized(item?.company?.name) ?? '-'}
                                </Table.Cell>}
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={`${item?.company?.currency?.symbol || "$"}${item.price}`}>{item?.company?.currency?.symbol || "$"}{item.price ?? '-'}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={item?.category?.name}>{item?.category?.name ?? '-'}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={item?.isAvailable ? 'Available' : 'Not available'}>
                                    {item?.isAvailable ? 'Available' : 'Not available'}
                                </Table.Cell>
                            </Table.Row>
                        }) : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                            <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                <NoData
                                    title="No Modifier Data Found"
                                    message="Modifier report data will appear here once available."
                                />
                            </Table.Cell>
                        </Table.Row>
                        }
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
        </div>
    )
}


export default ModifierReport