import { Button, Table, TextInput } from "flowbite-react"
import { FaAngleDown, FaAngleUp, FaArrowDown, FaFilter } from "react-icons/fa"
import { Filters } from "../utils/common/Filters"
import TableHeaders from "../utils/common/TableHeaders"
import Skeleton, { SkeletonTheme } from "react-loading-skeleton"
import NoData from "../utils/common/NoData"
import PageSize from "../components/Pagination/PageSize"
import Pagination from "../components/Pagination/Pagination"
import { useDarkMode } from "../context/DarkModeProvider"
import { useCallback, useEffect, useState } from "react"
import { SUPER_ADMIN } from "../utils/common/constant"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { createQueryParams } from "../utils/functions"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { apiUrl } from "../environment/env"
import * as XLSX from "xlsx";
import { capitalized } from "../utils/utility"


interface DecodedToken {
    role?: string;
    roleName?: string;
    company?: string;
    restaurant?: string;
    [key: string]: any;
}

interface ICategory {
    _id: string
    name: string
    description: string
    listingOrder: string
    isActive: boolean
    isBarItem: boolean
    company: { _id: string, name: string }
}
const AppCategoryReport = () => {
    const { isDarkMode } = useDarkMode();

    const { search } = useLocation();

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
    const mockUserData = decoded ? {
        staffMember: {
            company: { _id: decoded.company },
            restaurant: { _id: decoded.restaurant },
            role: { name: decoded.roleName }
        }
    } : undefined;

    const [category, setCategory] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    // const [statusFilter, setStatusFilter] = useState('');
    const [btnLoader, setBtnLoader] = useState(false);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || "",
        restaurant: searchParams.get("restaurant") || "",
    });



    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });

    const columnNames = loginRole === SUPER_ADMIN
        ? ["Sr.No.", "Name", "Business", "Listing Order", "Item Type (Bar/Kitchen)", "Status"]
        : ["Sr.No.", "Name", "Listing Order", "Item Type (Bar/Kitchen)", "Status"];


    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const getCategory = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);
            const response = await axios.get(`${apiUrl}/category${queryParams}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                }
            });
            setTimeout(() => {
                setCategory(response.data?.categories);
                setNumOfRecords(response.data.count)
                setIsLoading(false)
            }, 500);

        } catch (error) {
            setCategory([])
            setIsLoading(false)
            console.error('~ getCategory error :-', error);
        }
    }, [formData, searchFilter,]);



    useEffect(() => {
        // const myParam: any = new URLSearchParams(location.search).get("page");
        // if (myParam) {
        //   setPage(myParam - 1);
        // }
        const debounceDelay = setTimeout(() => {
            getCategory();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getCategory, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        if (!search.includes("token")) {
            return;
        }
        const combinedData = { ...updatedFormData, ...searchFilter, token: token };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/report/category/app/${updatedFormData.page}/${queryParams}`);
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


    const exportToExcel = async () => {
        try {
            setBtnLoader(true);
            const queryParams = createQueryParams(formData);

            const response = await axios.get(`${apiUrl}/category${queryParams}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                },
            });

            const allCategory: ICategory[] = response.data?.categories;

            // Map the data to Excel sheet format
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

    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className='flex flex-col gap-4 bg-slate-200 p-2 min-h-screen'>
            <div className="mt-4">
                <div className="flex gap-4">
                    <button
                        className="flex items-center justify-center gap-1.5 text-[14px] sm:text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-3 sm:px-4 py-2.5 rounded-full bg-white transition-all duration-300 hover:bg-BRAND-500 hover:text-white"
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
                    {!showFilters &&
                        <div className="transition-all duration-500 ease-in-out">
                            <TextInput
                                type="text"
                                placeholder="Search..."
                                value={searchFilter?.name ?? ''}
                                onChange={e => setSearchFilter((prev: any) => ({ ...prev, name: e.target.value }))}
                                className="rounded-md focus:!ring-0 min-w-60"
                            />
                        </div>}
                </div>

                {/* Collapsible Filters Section */}
                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="category" userData={mockUserData} />
                    </div>
                </div>
            </div>
            <div className="flex xs:justify-start md:justify-end">
                <Button
                    onClick={exportToExcel}
                    className="bg-BRAND-500 hover:!bg-BRAND-600 flex gap-2 items-center justify-center text-white rounded-md h-10 whitespace-nowrap import-btn"
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
            </div>
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                            <Table.Cell colSpan={10} className="text-center py-4">
                                {/* <Loader /> */}
                                <SkeletonTheme 
                                    baseColor={isDarkMode ? "#212529" : "#F1E9EE"} 
                                    highlightColor={isDarkMode ? "#343A40" : "#F9F5F7"} 
                                    width="100%"
                                >
                                    <Skeleton count={10} height={60} className="my-1" />
                                </SkeletonTheme>
                            </Table.Cell>
                        </Table.Row>}
                        {category && (category?.length > 0 && !isLoading) ?
                            category?.map((category, index) => {
                                return <Table.Row key={category?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(category?.name)}>{capitalized(category?.name) ?? '-'}</Table.Cell>
                                    {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={capitalized(category?.company?.name)}>{category?.company?.name ? capitalized(category?.company?.name) : '-'}</Table.Cell>}
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={category?.listingOrder}>{category?.listingOrder ? category?.listingOrder : '-'}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={category.isBarItem ? 'Bar' : 'Kitchen'}>
                                        {category.isBarItem ? 'Bar' : 'Kitchen'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={category.isActive ? 'Activated' : 'DeActivated'}>
                                        {category.isActive ? 'Activated' : 'DeActivated'}
                                    </Table.Cell>

                                </Table.Row>
                            })
                            : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Categories Found"
                                        message="No menu categories are available at the moment."
                                    />
                                </Table.Cell>
                            </Table.Row>}
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

export default AppCategoryReport
