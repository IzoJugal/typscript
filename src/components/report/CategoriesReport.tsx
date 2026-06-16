import { useLocation, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState, useRef } from "react";
import apiClient from "../../utils/AxiosInstance";
import * as XLSX from "xlsx";
import { Button, Table } from "flowbite-react";
import { FaAngleDown, FaAngleUp, FaArrowDown, FaFilter } from "react-icons/fa";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import TableHeaders from "../../utils/common/TableHeaders";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import NoData from "../../utils/common/NoData";
import { createQueryParams } from "../../utils/functions";
import { useAuth } from "../../context/AuthProvider";
import { divContainerStyle, SUPER_ADMIN } from "../../utils/common/constant";
import { Filters } from "../../utils/common/Filters";
import { capitalized } from "../../utils/utility";
import ListLoader from "../../utils/common/ListLoader";
import SearchInput from "../../utils/common/SearchInput";

interface ICategory {
    _id: string;
    name: string;
    description: string;
    listingOrder: string;
    isActive: boolean;
    isBarItem: boolean;
    company: { _id: string; name: string };
}

const CategoriesReport = () => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    console.log("🚀 ~ CategoriesReport ~ loginRole:", loginRole)

    const { pathname } = useLocation();
    const webView = ['/report/products/category/app'];
    const appWebView = webView.includes(pathname);

    const [category, setCategory] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [btnLoader, setBtnLoader] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [numOfRecords, setNumOfRecords] = useState<number>(0);

    const [searchParams, setSearchParams] = useSearchParams();

    // Track initialization to prevent premature effect triggers
    const isFirstRender = useRef(true);

    // Synchronize initial state with URL parameters directly
    const [limit, setLimit] = useState(() => Number(searchParams.get('limit')) || 10);
    const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || "",
        restaurant: searchParams.get("restaurant") || "",
    });

    const columnNames = loginRole === SUPER_ADMIN
        ? ["Sr.No.", "Name", "Business", "Listing Order", "Item Type (Bar/Kitchen)", "Status"]
        : ["Sr.No.", "Name", "Listing Order", "Item Type (Bar/Kitchen)", "Status"];

    const abortControllerRef = useRef<AbortController | null>(null);

    const getCategory = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setIsLoading(true);
            const combinedData = {
                page,
                limit,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/category${queryParams}`, { signal: controller.signal });

            setCategory(response.data?.categories || []);
            setNumOfRecords(response.data?.count || 0);
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            setCategory([]);
            console.error('~ getCategory error :-', error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchFilter]);

    // Effect 1: Handle actual API data fetching with debounce 
    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getCategory();
        }, 300);

        return () => clearTimeout(debounceDelay);
    }, [getCategory]);

    // Effect 2: When filters change, reset back to page 1 and update URL params safely
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        setPage(1);

        const updatedParams = {
            page: 1,
            limit,
            ...searchFilter
        };

        Object.keys(updatedParams).forEach(key => {
            if (updatedParams[key] === "") delete updatedParams[key];
        });

        const queryString = createQueryParams(updatedParams);
        setSearchParams(queryString);
    }, [searchFilter, limit, setSearchParams]);

    // Handle updates when pagination components invoke page changes
    const curPage = (pageNum: number) => {
        setPage(pageNum);
        const updatedParams = {
            page: pageNum,
            limit,
            ...searchFilter
        };
        setSearchParams(createQueryParams(updatedParams));
    };

    const handleLimit = (newLimit: number) => {
        setLimit(newLimit);
        setPage(1);
        const updatedParams = {
            page: 1,
            limit: newLimit,
            ...searchFilter
        };
        setSearchParams(createQueryParams(updatedParams));
    };

    const exportToExcel = async () => {
        try {
            setBtnLoader(true);
            const queryParams = createQueryParams(searchFilter);
            const response = await apiClient.get(`/category${queryParams}`);
            const allCategory: ICategory[] = response.data?.categories;

            const ws = XLSX.utils.json_to_sheet(allCategory?.map(item => ({
                Name: item?.name,
                Description: item?.description,
                ListingOrder: item?.listingOrder,
                ItemType: item?.isBarItem ? 'Bar' : 'Kitchen',
                Status: item?.isActive ? 'Activated' : 'DeActivated'
            })));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Categories");
            XLSX.writeFile(wb, "Categories_Report.xlsx");
        } catch (error) {
            console.error('~ exportToExcel error :-', error);
        } finally {
            setBtnLoader(false);
        }
    };

    return (
        <div className={divContainerStyle}>
            <div>
                {!appWebView && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <FormHeaderPaths page={'Categories Report'} prevLink='#' prevPage='Products' />
                    </div>
                )}
            </div>

            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
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
                                        <span className="flex justify-center items-center mr-1">
                                            <FaArrowDown />
                                        </span>
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
                            module="category"
                            userData={userData}
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
                                <Table.Cell colSpan={10} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        )}

                        {!isLoading && category.length > 0 &&
                            category.map((cat, index) => (
                                <Table.Row key={cat?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                                        {index + 1 + (page - 1) * limit}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(cat?.name)}>
                                        {capitalized(cat?.name) ?? '-'}
                                    </Table.Cell>
                                    {loginRole === SUPER_ADMIN && (
                                        <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={capitalized(cat?.company?.name)}>
                                            {cat?.company?.name ? capitalized(cat?.company?.name) : '-'}
                                        </Table.Cell>
                                    )}
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={cat?.listingOrder}>
                                        {cat?.listingOrder ? cat?.listingOrder : '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={cat.isBarItem ? 'Bar' : 'Kitchen'}>
                                        {cat.isBarItem ? 'Bar' : 'Kitchen'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={cat.isActive ? 'Activated' : 'DeActivated'}>
                                        {cat.isActive ? 'Activated' : 'DeActivated'}
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        }

                        {!isLoading && category.length === 0 && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Category Data Found"
                                        message="Category report data will appear here once available."
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
        </div>
    );
};

export default CategoriesReport;