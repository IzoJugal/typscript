import { Button, Modal, Table, } from "flowbite-react"
import TableHeaders from "../../utils/common/TableHeaders"
import { useCallback, useEffect, useRef, useState } from "react"
import { capitalized } from "../../utils/utility"
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant"
import NoData from "../../utils/common/NoData"
import PageSize from "../Pagination/PageSize"
import Pagination from "../Pagination/Pagination"
import { HiPencil, HiTrash, } from "react-icons/hi";
import apiClient from "../../utils/AxiosInstance"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PackageModal from "./PackageModal"
import { toast } from "react-toastify"
import { Filters } from "../../utils/common/Filters"
import { useAuth } from "../../context/AuthProvider"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { createQueryParams } from "../../utils/functions"
import ListLoader from "../../utils/common/ListLoader"
import { setTitle } from "../../utils/utility"
import AddActionButton from "../../utils/common/AddActionButton"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../utils/common/SearchInput"

const Packages = () => {
    setTitle("Packages");
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [numOfRecords, setNumOfRecords] = useState(0);
    const [packages, setPackages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openPackageModal, setOpenPackageModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [confirmationModal, setConfirmationModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const staffCompanyId = userData?.staffMember?.company?._id || "";
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || staffCompanyId,
        restaurant: searchParams.get("restaurant") || "",
    });
    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const navigate = useNavigate();

    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const columnNames = ["Sr. No.", "Name", "Price", "Description", "Duration", "Max Guests", "Actions"]

    const fetchPackages = useCallback(async () => {
        setIsLoading(true)
        const combinedData = {
            ...formDataRef.current,
            ...searchFilterRef.current
        };
        const queryParams = createQueryParams(combinedData);
        const response = await apiClient.get(`/packages${queryParams}`);
        if (response.data.success) {
            setPackages(response.data.packages);
            setNumOfRecords(response.data.count);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            fetchPackages();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, fetchPackages, location.search]);

    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/reservation/packages/${updatedFormData.page}/${queryParams}`);
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


    const openModel = (elem: any) => {
        setSelectedPackage(elem);
        setOpenPackageModal(true);
    }

    const handlePackageSubmit = async (packageData: any) => {
        setPackages((prevPackages: any) => {
            const existingIndex = prevPackages.findIndex((pkg: any) => pkg._id === packageData._id);
            if (existingIndex !== -1) {
                return prevPackages.map((pkg: any) => (pkg._id === packageData._id ? packageData : pkg));
            } else {
                return [packageData, ...prevPackages];
            }
        });
    };

    const deletePackage = async (elem: any) => {
        try {
            const response = await apiClient.post(`/packages/delete/${elem?._id}`);
            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }

            setPackages((prevPackages: any) => {
                const filtered = prevPackages.filter((pkg: any) => pkg._id !== elem._id);
                if (filtered.length === 0 && page > 1) {
                    curPage(page - 1);
                }
                return filtered;
            });

            fetchPackages();
            setNumOfRecords((prev: any) => prev - 1);
        } catch (error) {
            console.log(error);
        } finally {
            setConfirmationModal(false);
            setSelectedPackage(null);
        }
    }
    const [showFilters, setShowFilters] = useState(false);


    return (
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
            <div>
                <div className="flex items-center justify-between">
                    <DetailHeaderPaths label="Packages" />
                </div>

                {/* Filters Section */}
                <div className="mx-auto mt-4">
                    <div className="flex items-center justify-between gap-4 w-full">
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
                            {!showFilters &&
                                <SearchInput
                                    value={searchFilter.name}
                                    onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                                    placeholder="Search..."
                                    className="h-[42px] self-center"
                                />
                            }
                        </div>

                        <span onClick={() => openModel(null)} className="flex items-center gap-2 cursor-pointer">
                            <AddActionButton text="Add New Package" />
                        </span>
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
                                module="package"
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
                                <Table.Cell colSpan={8} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        ) : !isLoading && packages?.length > 0 ? (
                            packages.map((elem: any, index: number) => (
                                <Table.Row key={elem._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                                        {index + 1 + (page - 1) * limit}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(elem?.name)}>
                                        {capitalized(elem?.name?.slice(0, 40)) + (elem?.name?.length > 40 ? "..." : "")}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`$${elem?.price}`}>
                                        {elem?.price ? `${elem?.company?.currency?.symbol || "$"}${elem?.price}` : '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(elem?.description)}>
                                        {elem?.description ? capitalized(elem?.description?.slice(0, 25)) + (elem?.description?.length > 25 ? "..." : "") : "-"}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${elem.duration} ${elem.duration === 1 ? 'Hour' : 'Hours'}`}>
                                        {elem?.duration !== undefined && elem?.duration !== null
                                            ? `${elem.duration} ${elem.duration === 1 ? 'Hour' : 'Hours'}`
                                            : '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.maxGuests}>
                                        {elem?.maxGuests ?? '-'}
                                    </Table.Cell>

                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button onClick={() => openModel(elem)} className={editBtnStyle.btn} size="xs">
                                            <HiPencil className={editBtnStyle.icon} />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button onClick={() => {
                                            setSelectedPackage(elem);
                                            setConfirmationModal(true);
                                        }} className={deleteBtnStyle.btn} size="xs">
                                            <HiTrash className={deleteBtnStyle.icon} />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4">
                                    <NoData
                                        title="No Packages Found"
                                        message="No package entries are available right now. Added package entries will appear here."
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
            {openPackageModal && <PackageModal
                openPackageModal={openPackageModal}
                setOpenPackageModal={setOpenPackageModal}
                submitHandler={handlePackageSubmit}
                selectedPackage={selectedPackage}
            />}
            <Modal show={confirmationModal} onClose={() => setConfirmationModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Body>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-medium leading-6 text-DARK-900 dark:text-white text-center">
                            Are you sure you want to delete this package?
                        </h3>
                        <div className="flex gap-2 justify-center items-center w-full">
                            <Button className="bg-BRAND-500 hover:!bg-BRAND-600 w-20 !ring-0 dark:bg-BRAND-500 text-white focus:!ring-0" onClick={() => deletePackage(selectedPackage)}>
                                Delete
                            </Button>
                            <Button className="bg-DARK-300 text-DARK-800 hover:!bg-DARK-400 transition duration-200 focus:!ring-0" onClick={() => setConfirmationModal(false)}>
                                Cancel
                            </Button>

                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default Packages
