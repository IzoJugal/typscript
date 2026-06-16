import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../utils/common/constant";
import { toast } from "react-toastify";
import { FaAngleDown, FaAngleUp, FaArrowCircleDown, FaArrowDown, FaFilter, FaSearch } from "react-icons/fa";
import { Button, Modal, Table } from "flowbite-react";
import { MdClear } from "react-icons/md";
import TableHeaders from "../utils/common/TableHeaders";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { capitalized } from "../utils/utility";
import { HiEye } from "react-icons/hi";
import NoData from "../utils/common/NoData";
import PageSize from "../components/Pagination/PageSize";
import Pagination from "../components/Pagination/Pagination";
import * as XLSX from "xlsx";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { apiUrl } from "../environment/env";


interface DecodedToken {
    role?: string;
    roleName?: string;
    company?: string;
    restaurant?: string;
    [key: string]: any;
}

interface Modifier {
    name: string;
    description: string;
}

interface IProduct {
    _id: string;
    name: string;
    description: string;
    price: string;
    sku: string;
    type: string;
    unit: string;
    modifiers: Modifier[];
    category: {
        _id: string
        name: string
    };
    stock: string;
    isAvailable: boolean;
    company: {
        _id: string
        name: string
    }
    restaurant: {
        _id: string
        name: string
    }
}

const AppProductReport = () => {

    const { search } = useLocation();

    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const urlParams = new URLSearchParams(search);
    const token = urlParams.get("token");
    const [restaurant, setRestaurant] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem("webView", `${token}`);
            const decodedToken: any = jwtDecode<DecodedToken>(token);
            setSearchFilter((prev) => ({ ...prev, restaurant: decodedToken.restaurant }));
            setRestaurant(decodedToken.restaurant);
            setDecoded(decodedToken);
        }
    }, [search]);

    const loginRole = decoded?.roleName || SUPER_ADMIN;
    // const companyId = decoded?.company || "";
    // const restaurantId = decoded?.restaurant || null;

    const [products, setProducts] = useState<IProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [nameFilter, setNameFilter] = useState('');
    const [keys, setKeys] = useState('');
    const [searchFilter, setSearchFilter] = useState({ key: "", value: "", restaurant: "" });
    const [openModal, setOpenModal] = useState(false);
    const [url, setUrl] = useState("");

    // const [companyDetails, setCompanyDetails] = useState<any>([]);
    const [company, setCompany] = useState<string | null>(null);
    // const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
    
    const [btnLoader, setBtnLoader] = useState(false);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(10);
    const [limit, setLimit] = useState(10);
    // const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLimit = (data: any) => {
        curPage(1)
        const adjustedLimit = data > numOfRecords ? numOfRecords : data;
        setLimit(adjustedLimit);
    }

    const columnNames = loginRole === SUPER_ADMIN ?
        ["Sr.No.", "Name", "Business", "Category", "Price", "SKU", "Stock", "Actions"] :
        ["Sr.No.", "Name", "Category", "Price", "SKU", "Stock", "Actions"];

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;


/*     const getCompany = useCallback(async () => {
        try {
            try {
                const response = await axios.get(`${apiUrl}/business`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Time-Zone': timeZone,
                        'Authorization': `Bearer ${token}`
                    },
                })
                setTimeout(() => {
                    setCompanyDetails(response.data.companies)
                }, 500);
            } catch (error) {
                setCompanyDetails([])
                console.error('~ getCompany error :-', error);
            }
        } catch (error) {
            console.error('~ getCompany error :-', error);
        }
    }, []); */

    /* const getRestaurant = async (companyId: string) => {
        try {
            const response = await axios.get(`${apiUrl}/restaurant/company/${companyId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                },
            });
            if (response.data.success) {
                setRestaurantDetails(response.data.restaurant)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    } */


    /* useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany()
        }
        if (MANAGER_ROLES.includes(loginRole)) {
            getRestaurant(companyId)
        }
    }, [getCompany, loginRole]); */



    const getProduct = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axios.post(
                `${apiUrl}/product/detail/report`,
                searchFilter,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Time-Zone': timeZone,
                        'Authorization': `Bearer ${token}`
                    },
                    params: {
                        limit: Number(limit),
                        page: Number(page - 1),
                        sort: -1,
                    }
                }
            );

            setTimeout(() => {
                setIsLoading(false);
                setProducts(response.data?.products);
                setNumOfRecords(response.data?.total)
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false);
                setProducts([])
            }, 500);
            console.error('~ getProduct error :-', error);
        }
    }, [setIsLoading, searchFilter, limit, page]);

    useEffect(() => {
        getProduct();
    }, [getProduct]);

    const exportToExcel = async () => {
        setBtnLoader(true);
        try {
            const response = await axios.post(`${apiUrl}/product/detail/report`, searchFilter, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                },
            },)
            const productData = response.data.products
            const ws = XLSX.utils.json_to_sheet(productData.map((product: IProduct) => ({
                Name: product?.name,
                company: product?.company?.name,
                category: product?.category?.name,
                Price: product?.price,
                SKU: product?.sku,
                Stock: product?.stock,
                Type: product?.type,
                Unit: product?.unit,
                Restaurant: product?.restaurant?.name,
                Status: (Number(product?.stock) > 0 && product?.isAvailable) ? 'Available' : 'Not available',
                Description: product?.description,
            })));

            setTimeout(() => {
                setBtnLoader(false);
                if (response.data.success === false) {
                    toast.error(response.data?.message)
                }
            }, 500);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Products");

            XLSX.writeFile(wb, "Products_Report.xlsx");
        } catch (error) {
            console.log(error);
            setBtnLoader(false);
            toast.error("Failed to export Excel file. Please try again.")
        }

    };
    const handleSearch = () => {
        const searchCriteria: any = { key: keys, value: nameFilter, };
        if (company) {
            searchCriteria.company = company;
        }
        if (restaurant) {
            searchCriteria.restaurant = restaurant;
        }
        const isAllEmpty = !searchCriteria.key && !searchCriteria.value && !searchCriteria.company && !searchCriteria.restaurant;

        if (isAllEmpty) { return }

        curPage(1)
        setSearchFilter(searchCriteria);
    }
    const handleClear = () => {
        setNameFilter('')
        setCompany('')
        setKeys('')
        setRestaurant('')
        /* if (loginRole === SUPER_ADMIN) {
            setRestaurantDetails([])
        } */
        if (searchFilter.key && searchFilter.value || searchFilter.restaurant) {
            setSearchFilter({ key: "", value: "", restaurant: restaurant || "" })
        }

    }

    /* const handleBusiness = (value: string) => {
        setCompany(value)
        getRestaurant(value)
    }
    const handleRestaurant = (value: string) => {
        setRestaurant(value)
    } */

    const handlePrint = async (id: string) => {
        try {
            const response = await axios.get(`${apiUrl}/product/detail/report/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                },
                responseType: "blob"
            });

            const blob = new Blob([response.data], {
                type: response.headers["content-type"],
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;

            const filename = `report.pdf`;
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            console.log("File downloaded successfully.");
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "An error occurred while downloading the report.";
            console.error("Error downloading report:", errorMessage);
            toast.error(errorMessage);
        }
    };
    const handlePreview = async (id: string) => {
        try {
            const response = await axios.get(`${apiUrl}/product/detail/report/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                },
                responseType: "blob"
            });


            const blob = new Blob([response.data], {
                type: response.headers["content-type"],
            });
            const url = window.URL.createObjectURL(blob);
            setUrl(url)
            setOpenModal(true)
            // Open the blob URL in a new tab for preview
            // window.open(url);

            // Optionally, revoke the object URL after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100); // Adjust the timeout as necessary

            console.log("Report preview opened successfully.");
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "An error occurred while retrieving the report.";
            console.error("Error retrieving report:", errorMessage);
            toast.error(errorMessage);
        }
    };

    const navigate = useNavigate()

    const curPage = (pageNum: any) => {
        setIsLoading(true);
        const url = `/report/product/app/${pageNum}?token=${token}`;
        setPage(pageNum);
        navigate(url);
    };

    const navigateSearchPrams = useCallback(() => {
        if (!search.includes("token")) {
            return;
        }
        setIsLoading(true);
        const url = `/report/product/app/1?token=${token}`;
        setPage(1);
        navigate(url);
    }, []);


    useEffect(() => {
        navigateSearchPrams();
    }, []);

    useEffect(() => {
        const myParam: any = new URLSearchParams(location.search).get("page");
        if (myParam) {
            setPage(myParam - 1);
        }
        getProduct();
    }, [page, limit, getProduct, location.search]);
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="flex flex-col gap-4 bg-slate-200 p-2 min-h-screen">
            {/* Filter Section */}
            <div>
                <div className="flex justify-between gap-4">
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
                    <Button
                        onClick={exportToExcel}
                        className="bg-BRAND-500 hover:!bg-BRAND-600 flex gap-2 items-center justify-center text-white rounded-md h-10 whitespace-nowrap col-span-4 xs:col-span-2 import-btn"
                    >
                        {btnLoader ? (
                            <span>Downloading...</span>
                        ) : (
                            <>
                                <span className="flex justify-center items-center mr-1">
                                    <FaArrowDown />
                                </span>
                                Export Excel
                            </>
                        )}
                    </Button>
                </div>
                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <div className=":flex flex-col md:flex-row flex-wrap grid grid-cols-4 md:grid-cols-2 xl:flex gap-2 mb-2">
                            {/* <div className={`grid ${loginRole === SUPER_ADMIN && " md:grid-cols-2 "}sm:grid-cols-1 gap-2`}>
                                {loginRole === SUPER_ADMIN && (
                                    <DropdownWithSearch
                                        setSelectedItem={setCompany}
                                        selectedItem={companyDetails?.find((c: any) => c._id === company)?.name || ''}
                                        items={companyDetails}
                                        title="Business"
                                        setIsDropdownOpen={setIsDropdownOpen}
                                        isDropdownOpen={isDropdownOpen}
                                        handleFilter={handleBusiness}
                                        fieldKey="company"
                                    />)}
                                {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && (
                                    <DropdownWithSearch
                                        setSelectedItem={setRestaurant}
                                        selectedItem={restaurantDetails?.find((c: any) => c._id === restaurant)?.name || ''}
                                        items={restaurantDetails}
                                        title="Restaurant"
                                        handleFilter={handleRestaurant}
                                        fieldKey="restaurant"
                                    />)}
                            </div> */}
                            <select value={keys} onChange={(e) => { setKeys(e.target.value); setNameFilter(''); }} className="p-2 border border-DARK-300 rounded-md w-full col-span-4 xs:col-span-2 xl:w-1/4">
                                <option value="">Please select criteria</option>
                                <option value="name">Name</option>
                                <option value="sku">SKU</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={nameFilter}
                                onChange={e => setNameFilter(e.target.value)}
                                disabled={!keys}
                                className="p-2 border border-DARK-300 rounded-md w-full  col-span-4 xs:col-span-2 xl:w-1/4"
                            />
                            <button className="bg-slate-50 p-1 border rounded flex justify-center items-center col-span-2 xs:col-span-1 h-10 w-full xl:w-16 " onClick={() => { handleSearch() }}>
                                <FaSearch />
                            </button>
                            {(company || keys || nameFilter || (searchFilter.key && searchFilter.value) || restaurant) &&
                                <button className="bg-slate-50 p-1 border rounded flex justify-center items-center col-span-2 xs:col-span-1 h-10 w-full xl:w-16 " onClick={() => { handleClear() }}>
                                    <MdClear />
                                </button>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading &&
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4">
                                    {/* <Loader /> */}
                                    <SkeletonTheme baseColor="#E5E7EB" highlightColor="#FFF" width="100%">
                                        <Skeleton count={10} height={60} className="my-1" />
                                    </SkeletonTheme>
                                </Table.Cell>
                            </Table.Row>}
                        {(products && products.length > 0 && !isLoading) ? (
                            products.map((product, index) => (
                                <Table.Row key={product?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                                        {index + 1 + (page - 1) * limit}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(product.name)}>
                                        {capitalized(product.name) ?? '-'}
                                    </Table.Cell>
                                    {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={capitalized(product?.company?.name)}>
                                        {capitalized(product.company?.name) ?? '-'}
                                    </Table.Cell>}
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={capitalized(product?.category?.name)}>
                                        {capitalized(product.category?.name) ?? '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={`${product.price}`}>
                                        ${product.price ?? '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={`${product.sku}`}>
                                        {product.sku ?? '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={product.stock}>
                                        {product.stock ?? '-'}
                                    </Table.Cell>
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className="flex gap-2">
                                            <Button onClick={() => handlePreview(product._id)} title="Preview" className={deleteBtnStyle.btn} size="xs">
                                                <HiEye className={deleteBtnStyle.icon} />
                                            </Button>
                                            <Button onClick={() => handlePrint(product._id)} title="Download" className={editBtnStyle.btn} size="xs">
                                                <FaArrowCircleDown className={editBtnStyle.icon} />
                                            </Button>

                                            {/* <button onClick={() => handlePreview(product._id)} title="Preview" className="text-ERROR_HOVER hover:text-red-900">
                                                <HiEye className="h-5 w-5" />
                                                <span className="sr-only">Preview</span>
                                            </button>
                                            <button onClick={() => handlePrint(product._id)} title="Print" className="text-BRAND-500 hover:text-BRAND-600 mr-2">
                                                <FaArrowCircleDown className="h-5 w-5" />
                                                <span className="sr-only">Print</span>
                                            </button> */}
                                        </span>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            isLoading === false && (
                                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                        <NoData />
                                    </Table.Cell>
                                </Table.Row>
                            )
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
            <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm">
                <Modal.Header>Products Detail Report</Modal.Header>
                <Modal.Body>
                    <iframe src={url} width="100%" height="500px" />
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default AppProductReport
