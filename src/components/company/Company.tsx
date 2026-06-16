import { Button, Modal, Table, } from "flowbite-react"
import { useCallback, useEffect, useState } from "react"
import { HiPencil } from "react-icons/hi"
import { RiDeleteBin6Line } from "react-icons/ri"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import apiClient from "../../utils/AxiosInstance"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import TableHeaders from "../../utils/common/TableHeaders"
import { Filters } from "../../utils/common/Filters"
import { useAuth } from "../../context/AuthProvider"
import NoData from "../../utils/common/NoData"
import { IoSettingsSharp } from "react-icons/io5";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant"
import { createQueryParams } from "../../utils/functions"
import { capitalized, labelLayout } from "../../utils/utility"
import { useSocket } from "../../context/SocketProvider"
import { FaArrowRotateLeft } from "react-icons/fa6";
import ListLoader from "../../utils/common/ListLoader"
import { setTitle } from "../../utils/utility"
import AddActionButton from "../../utils/common/AddActionButton"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../utils/common/SearchInput"

// Address interface
interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

// CompanyDocument interface
interface CompanyDocument {
    _id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: Address;
    registrationNumber: string;
    taxID: string;
    createdAt: Date;
    isActive: boolean;
    isDelete: boolean;
    currency?: {
        code?: string;
        symbol?: string;
        label?: string;
    }
}

const Company = () => {
    setTitle("Business");
    const [companies, setCompanies] = useState<CompanyDocument[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isRestoreOpen, setIsRestoreOpen] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const location = useLocation();
    const navigate = useNavigate();
    const columnNames = ["Sr.No.", "Name", "Contact Person", "Email", "Phone", "Currency", "Status", "Actions"];
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        isActive: searchParams.get("isActive") || "",
        isDelete: searchParams.get("isDelete") || false,
    });

    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });

    const getCompanies = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);

            const response = await apiClient.get(`/business${queryParams}`,)
            setTimeout(() => {
                setIsLoading(false)
                setCompanies(response.data.companies)
                setNumOfRecords(response.data.count)
            }, 500)
        } catch (error: any) {
            setTimeout(() => {
                setCompanies([])
                setIsLoading(false)
                toast.error(error.response.message ? error.response.message : "")
            }, 500);
            console.error('~ getCompanies error :-', error)
        }
    }, [formData, searchFilter])


    // useEffect(() => {
    //     const shouldFetch = nameFilter.length === 0 || nameFilter.length > 2
    //     if (shouldFetch) {
    //         getCompanies()
    //     }
    // }, [getCompanies, nameFilter])

    useEffect(() => {
        // const myParam: any = new URLSearchParams(location.search).get("page");
        // if (myParam) {
        //     setPage(myParam - 1);
        // }
        const debounceDelay = setTimeout(() => {
            getCompanies();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getCompanies, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/business/${updatedFormData.page}/${queryParams}`);
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


    const handleDelete = async () => {
        if (!selectedId) return
        setIsModalOpen(false)
        setSelectedId(null)
        try {
            setIsLoading(true)
            const response = await apiClient.post(`/business/soft-delete/${selectedId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
            setTimeout(() => {
                const updatedCompanies = companies.filter(item => item._id !== selectedId)
                setCompanies(updatedCompanies)
                // toast.success(response.data.message)
                getCompanies();
                if (updatedCompanies.length === 0) {
                    // curPage(page - 1)
                    if (page > 1) {
                        curPage(page - 1);
                    } else {
                        curPage(1);
                    }
                }
                setNumOfRecords(numOfRecords - 1)
                setIsLoading(false)
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false)
            }, 500);
            console.error('Delete company error:', error)
            toast.error('Failed to delete the company. Please try again.')
        }
    };
    const handlePermanentDelete = async () => {
        if (!selectedId) return
        setIsDeleteOpen(false)
        setSelectedId(null)
        try {
            setIsLoading(true)
            const response = await apiClient.post(`/business/delete/${selectedId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false)
            }, 500);
            console.error('permanent Delete company error:', error)
            toast.error('Failed to permanent delete the company. Please try again.')
        }
    };

    const handleRestore = async () => {
        if (!selectedId) return;
        setIsRestoreOpen(false);
        setSelectedId(null);
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/business/restore/${selectedId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false)
            });
            console.log("Restore company error: ", error);
            toast.error("Failed to restore the company. Please try again.");
        }

    };

    const confirmDelete = (id: string) => {
        setSelectedId(id)
        setIsModalOpen(true)
    };

    const restoreDelete = (id: string) => {
        setSelectedId(id);
        setOpen(true);
    };

    const onCloseModal = () => {
        setSelectedId(null);
        setOpen(false);
    };

    const socket = useSocket()

    const socketAllowDataPermission = () => {
        let status = false
        if (loginRole === "Super Admin") {
            status = true
        }
        return status
    }

    useEffect(() => {
        const addCompany = (companyData: any) => {
            if (socketAllowDataPermission()) {
                setCompanies((prevData: any) => {
                    const updatedData = [...prevData];
                    if (prevData?.length >= limit) {
                        updatedData?.pop();
                    }
                    return [companyData, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updateCompany = (companyData: any) => {
            setCompanies((prev: any) => prev.map((item: any) => item._id === companyData._id ? companyData : item));
        };
        const restoreCompany = (companyData: any) => {
            setCompanies((prev: any) => prev.map((item: any) => item._id === companyData._id ? companyData : item));
        };
        const deleteCompany = (companyData: any) => {
            const exists = companies?.some((item: any) => {
                return String(item._id) === String(companyData._id)
            });
            if (!exists) {
                setIsLoading(false)
                return
            };
            const updatedCompanies = companies.filter(item => item._id !== companyData?._id);
            setCompanies(updatedCompanies);
            getCompanies();
            if (updatedCompanies.length === 0) {
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setNumOfRecords(numOfRecords - 1)
        };

        socket.on("addCompany", addCompany);
        socket.on("updateCompany", updateCompany);
        socket.on("deleteCompany", deleteCompany);
        socket.on("restoreCompany", restoreCompany);

        return () => {
            socket.off("addCompany", addCompany);
            socket.off("updateCompany", updateCompany);
            socket.off("deleteCompany", deleteCompany);
            socket.off("restoreCompany", restoreCompany);
        };
    }, [companies, socket]);

    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className={divContainerStyle}>
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Business" />
                </div>

                <div className="mt-4">
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

                        {loginRole === SUPER_ADMIN && (
                            <div className="shrink-0 sm:ml-auto">
                                <Link to="/business/add">
                                    <AddActionButton text="Add a new business" />
                                </Link>
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
                                module="company"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Company Table */}
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />

                    <Table.Body className="divide-y">
                        {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                            <Table.Cell colSpan={10} className="text-center py-4">
                                {/* <Loader /> */}
                                <ListLoader />
                            </Table.Cell>
                        </Table.Row>}
                        {(companies && companies.length > 0 && !isLoading) ? companies.map((item, index) => (
                            <Table.Row key={item._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item?.name) ?? ''}>{capitalized(item?.name) ?? ''}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{item.contactPerson}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{item.email}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{item.phone}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{item?.currency?.label || "-"}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                    {labelLayout(item.isActive ? 'activated' : 'deactivated')}
                                </Table.Cell>
                                {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {item.isActive ? 'Activated' : 'DeActivated'}
                                    </span>
                                </Table.Cell> */}
                                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/business/bussiness_configs/${item._id}`)} size="xs" disabled={item?.isDelete ? true : false}><IoSettingsSharp className={editBtnStyle.icon} /></Button>
                                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/business/edit/${item._id}`)} size="xs" disabled={item?.isDelete ? true : false}><HiPencil className={editBtnStyle.icon} /></Button>
                                    <Button
                                        title={userData?.staffMember?.company?._id === item?._id ? "Your company cannot be deleted by you." : ""} onClick={() => confirmDelete(item._id)}
                                        disabled={item?.isDelete || userData?.staffMember?.company?._id === item?._id}
                                        className={deleteBtnStyle.btn} size="xs">
                                        <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                    </Button>
                                    {searchFilter?.isDelete === true && (<Button title={userData?.staffMember?.company?._id === item?._id ? "Your company cannot be deleted or restore by you." : ""} onClick={() => restoreDelete(item._id)} disabled={item?.isDelete ? false : true} className={editBtnStyle.btn} size="xs"><FaArrowRotateLeft className={editBtnStyle.icon} /></Button>)}
                                </Table.Cell>
                            </Table.Row>
                        )) : !isLoading && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Businesses Found"
                                        message="No businesses are available right now. Added businesses will appear here."
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
            <ConfirmModal
                isOpen={isModalOpen}
                message="Are you sure you want to marked this company as deleted?"
                onConfirm={handleDelete}
                onCancel={() => setIsModalOpen(false)}
            />
            <ConfirmModal
                isOpen={isDeleteOpen}
                message="Are you sure you want to permanent delete this company?"
                onConfirm={handlePermanentDelete}
                onCancel={() => setIsDeleteOpen(false)}
            />
            <ConfirmModal
                isOpen={isRestoreOpen}
                message="Are you sure you want to restore this company?"
                onConfirm={handleRestore}
                onCancel={() => setIsRestoreOpen(false)}
            />
            <Modal show={open} onClose={() => onCloseModal()} className=" backdrop-blur-sm dark:bg-DARK-950" >
                <Modal.Header className="dark:bg-DARK-800">Restore or Permanently Delete?</Modal.Header>
                <Modal.Body className="dark:bg-DARK-800">
                    <div className="flex justify-center gap-4">
                        <Button
                            className="flex items-center justify-center gap-2 w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => { setIsRestoreOpen(true); setOpen(false) }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <FaArrowRotateLeft className="h-2/3 w-2/3" />
                                <span>Restore</span>
                            </div>
                        </Button>

                        <Button
                            className="flex items-center justify-center gap-2 w-full max-w-[150px] px-2 py-1 !bg-ERROR_HOVER text-white rounded-lg font-medium shadow-sm hover:!bg-ERROR_ACTIVE focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => { setIsDeleteOpen(true); setOpen(false) }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <RiDeleteBin6Line className="h-2/3 w-2/3" />
                                <span>Delete</span>
                            </div>
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div >
    )
}

export default Company
