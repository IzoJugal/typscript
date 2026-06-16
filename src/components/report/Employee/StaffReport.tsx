
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Modal, Table } from "flowbite-react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { HiEye, } from "react-icons/hi";
import { FaArrowCircleDown } from "react-icons/fa";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import TableHeaders from "../../../utils/common/TableHeaders";
import PageSize from "../../Pagination/PageSize";
import Pagination from "../../Pagination/Pagination";
import NoData from "../../../utils/common/NoData";
import { editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { capitalized } from "../../../utils/utility";
import ListLoader from "../../../utils/common/ListLoader";
import CommonReportFilter from "../../../utils/CommonReportFilter";

interface IStaff {
    _id: string;
    name: string;
    position: string;
    age: number;
    email: string;
    phone: string;
    salary: number;
    passcode: string;
    hireDate: Date;
    isActive: boolean;
    company: { _id: string, name: string }
}

const StaffReport = () => {
    const [staffs, setStaffs] = useState<IStaff[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { pathname } = useLocation();
    const webView = ['/report/employee/staff/app'];
    const appWebView = webView.includes(pathname);

    const [nameFilter, setNameFilter] = useState('');
    const [keys, setKeys] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [search, setSearch] = useState({ key: "", value: "", company: "", restaurant: "" });
    const [openModal, setOpenModal] = useState(false);
    const [url, setUrl] = useState("");
    const [companyDetails, setCompanyDetails] = useState<any>([]);
    const [company, setCompany] = useState<string | null>(null);
    const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [btnLoader, setBtnLoader] = useState(false);

    const hasActiveFilters = !!(
        (loginRole === SUPER_ADMIN ? company : false) ||
        restaurant ||
        keys ||
        nameFilter ||
        (search.key && search.value)
    );

    const shouldShowFilters = hasActiveFilters || staffs?.length! > 0;

    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(isNaN(+pages) ? 1 : +pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(10);

    const columnNames = loginRole === SUPER_ADMIN ?
        ["Sr.No.", "Name", "Business", "Email", "Phone", "Actions"] :
        ["Sr.No.", "Name", "Email", "Phone", "Actions"]

    const navigate = useNavigate()

    const curPage = (pageNum: any) => {
        setIsLoading(true);
        const queryParams = new URLSearchParams(searchParams);
        queryParams.set('page', pageNum);
        navigate(`/report/employee/staff/${pageNum}?${queryParams.toString()}`);
        setPage(pageNum);
    }

    const updateURL = (updatedSearch: any, pageNum: number) => {
        const combined = { ...updatedSearch, limit, page: pageNum };
        const queryParams = new URLSearchParams();
        Object.entries(combined).forEach(([k, v]) => { if (v) queryParams.set(k, String(v)); });
        setSearchParams(queryParams.toString());
        navigate(`/report/employee/staff/${pageNum}?${queryParams.toString()}`);
    }

    useEffect(() => {
        const pageFromURL = Number(searchParams.get('page')) || 1;
        const limitFromURL = Number(searchParams.get('limit')) || 10;
        setPage(isNaN(pageFromURL) ? 1 : pageFromURL);
        setLimit(isNaN(limitFromURL) ? 10 : limitFromURL);
    }, []);

    const handleLimit = (data: any) => {
        const newLimit = data > numOfRecords ? numOfRecords : data;
        updateURL(search, 1);
        setLimit(newLimit);
        setPage(1);
    }

    const getCompany = useCallback(async () => {
        try {
            try {
                const response = await apiClient.get(`/business`)
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
    }, []);

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurantDetails(response.data.restaurant)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany()
        }
        if (MANAGER_ROLES.includes(loginRole)) {
            getRestaurant(userData?.staffMember?.company?._id)
        }
    }, [getCompany, loginRole]);

    const getStaff = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.post('/staff/detail/report', search, {
                params: {
                    limit: Number(limit),
                    page: Number(page - 1),
                    sort: -1,
                }
            });
            setTimeout(() => {
                setStaffs(response.data?.data || []);
                setNumOfRecords(response.data?.total)
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setStaffs([]);
                setIsLoading(false);
            }, 500);
            console.error('~ getStaff error :-', error);
        }
    }, [setIsLoading, search, page, limit]);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getStaff();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, search, getStaff]);

    const exportToExcel = async () => {
        setBtnLoader(true);
        try {
            const response = await apiClient.post('/staff/detail/report', search,)

            if (response.data.status === false) {
                setBtnLoader(false);
                toast.error(response.data?.message)
                return;
            }

            const staffData = response?.data?.data
            const ws = XLSX.utils.json_to_sheet(staffData?.map((item: any) => ({
                Name: item?.name,
                Position: item?.position,
                Age: item.age,
                Email: item?.email,
                Phone: item?.phone,
                Salary: item?.salary,
                Status: item?.isActive ? 'Activated' : 'DeActivated',
                HireDate: item?.hireDate?.toString(),
                Role: item?.role?.name,
                Company: item?.company?.name,
                Restaurant: item?.restaurant?.name
            })));

            setTimeout(() => {
                setBtnLoader(false);
                if (response.data.success === false) {
                    toast.error(response.data?.message)
                }
            }, 500);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Staff");

            XLSX.writeFile(wb, "Staff_Report.xlsx");
        } catch (error) {
            console.log(error);
            setBtnLoader(false);
            toast.error("Failed to export Excel file. Please try again.")
        }
    };

    const handleSearch = () => {
        const searchCriteria: any = {};
        if (keys) {
            searchCriteria.key = keys
        }
        if (nameFilter) {
            searchCriteria.value = nameFilter
        }
        if (company) {
            searchCriteria.company = company;
        }
        if (restaurant) {
            searchCriteria.restaurant = restaurant;
        }
        if (Object.keys(searchCriteria).length > 0) {
            updateURL(searchCriteria, 1);
            setSearch(searchCriteria);
        }
    }
    const handleClear = () => {
        setNameFilter('')
        setKeys('')
        setCompany('')
        setRestaurant('')
        setKeys('')
        if (loginRole === SUPER_ADMIN) {
            setRestaurantDetails([])
        }
        if (search.key && search.value || search.company || search.restaurant) {
            updateURL({ key: "", value: "", company: "", restaurant: "" }, page);
        }
    }
    const handlePrint = async (id: string) => {
        try {
            const response = await apiClient.get(`/staff/detail/report/${id}`, {
                responseType: "blob",
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
                "Staff not found";
            console.error("Error downloading report:", errorMessage);
            toast.error(errorMessage);
        }
    };

    const handlePreview = async (id: string) => {
        try {
            const response = await apiClient.get(`/staff/detail/report/${id}`, {
                responseType: "blob",
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

            // console.log("Report preview opened successfully.");
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Staff not found";
            console.log("Error retrieving report:", errorMessage);
            toast.error(errorMessage);
        }
    };



    const handleBusiness = (value: string) => {
        setCompany(value);
        getRestaurant(value)
    }
    const handleRestaurant = (value: string) => {
        setRestaurant(value)
    }

    const hasFilters =
        !!keys ||
        !!nameFilter ||
        !!company && companyDetails?.length > 1 ||
        !!restaurant && restaurantDetails?.length > 1;

    return (
        <div className="container mx-auto px-4 sm:px-5 flex flex-col gap-4">
            <div className="flex flex-col gap-4 -ml-8">
                <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-0">
                    {appWebView ? (
                        <div className="mt-6 flex gap-2">
                            {/* Back button can be added here if needed */}
                        </div>
                    ) : (
                        // <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex">
                        // <DetailHeaderPaths label="Detail Report" />
                        // </div>
                        <FormHeaderPaths page={'Detail Report'} prevLink='#' prevPage='Employee' />
                    )}
                </div>
            </div>

            {shouldShowFilters && <CommonReportFilter
                showFilters={showFilters}
                setShowFilters={setShowFilters}

                keys={keys}
                setKeys={setKeys}

                searchValue={nameFilter}
                setSearchValue={setNameFilter}

                options={[
                    {
                        label: "First Name",
                        value: "firstName",
                    },
                    {
                        label: "Last Name",
                        value: "lastName",
                    },
                ]}

                onSearch={handleSearch}
                onClear={handleClear}

                loginRole={loginRole}
                SUPER_ADMIN={SUPER_ADMIN}
                MANAGER_ROLES={MANAGER_ROLES}

                company={company}
                setCompany={setCompany}
                companyDetails={companyDetails}

                restaurant={restaurant}
                restaurantDetails={restaurantDetails}

                handleBusiness={handleBusiness}
                handleRestaurant={handleRestaurant}

                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}

                showClear={hasFilters}

                appWebView={appWebView}
                exportToExcel={exportToExcel}
                btnLoader={btnLoader}
            />}

            {/* <div>
                <div className="flex justify-between gap-4">
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
                    {appWebView === false && <Button
                        onClick={exportToExcel}
                        className="bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600 flex gap-2 items-center justify-center text-white rounded-md h-10 whitespace-nowrap col-span-4 xs:col-span-2 import-btn"
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
                    </Button>}
                </div>
                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <div className=":flex flex-col md:flex-row flex-wrap grid grid-cols-4 md:grid-cols-2 xl:flex gap-2 mb-2">
                            <div className={`grid ${loginRole === SUPER_ADMIN && " md:grid-cols-2 "}sm:grid-cols-1 gap-2`}>
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
                            </div>
                            <select value={keys} onChange={(e) => { setKeys(e.target.value) }} className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md col-span-4 xs:col-span-2 xl:w-1/4">
                                <option value="">Please select criteria</option>
                                <option value="name">First Name</option>
                                <option value="name">Last Name</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={nameFilter}
                                onChange={e => setNameFilter(e.target.value)}
                                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md col-span-4 xs:col-span-2 xl:w-1/4"
                            />
                            <Button className="bg-slate-50  text-slate-950 dark:text-DARK-100 dark:border-none dark:bg-DARK-700 dark:hover:!bg-DARK-600 p-1 border border-DARK-300 rounded flex justify-center items-center col-span-2 xs:col-span-1 h-10 w-full sm:w-20" onClick={() => { handleSearch() }}>
                                <FaSearch />
                            </Button>
                                <Button
                                size="xs"
                                onClick={handleClear}
                                color="failure"
                                className="bg-ERROR_HOVER text-white rounded-md hover:bg-red-700 items-center h-10 w-full sm:w-20"
                              >
                               <MdClear className="w-4 h-4 font-bold" /> Clear
                              </Button>
                        </div>
                    </div>
                </div>
            </div> */}
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />

                    <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-700">
                        {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                            <Table.Cell colSpan={8} className="text-center py-4">
                                <ListLoader />
                            </Table.Cell>
                        </Table.Row>}
                        {(staffs?.length > 0 && !isLoading) ?
                            staffs?.map((staff, index) => (
                                <Table.Row key={staff._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(staff?.name)}>{capitalized(staff?.name) ?? '-'}</Table.Cell>
                                    {(loginRole === SUPER_ADMIN) && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={capitalized(staff?.company?.name)}>{capitalized(staff?.company?.name) ?? '-'}</Table.Cell>}
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={staff?.email}>{staff?.email ?? '-'}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={staff?.phone}>{staff?.phone ?? '-'}</Table.Cell>
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className="flex gap-2">
                                            <Button onClick={() => handlePreview(staff._id)} title="Preview" className={editBtnStyle.btn} size="xs">
                                                <HiEye className={editBtnStyle.icon} />
                                            </Button>
                                            <Button onClick={() => handlePrint(staff._id)} title="Download" className={editBtnStyle.btn} size="xs">
                                                <FaArrowCircleDown className={editBtnStyle.icon} />
                                            </Button>
                                        </span>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                            : !isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Staff Data Found"
                                        message="Staff report data will appear here once available."
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
            <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header>Staff Detail Report</Modal.Header>
                <Modal.Body>
                    <iframe src={url} width="100%" height="500px" />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StaffReport;
