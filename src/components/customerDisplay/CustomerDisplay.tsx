/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Table, } from "flowbite-react";
import TableHeaders from "../../utils/common/TableHeaders";
import ListLoader from "../../utils/common/ListLoader";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import NoData from "../../utils/common/NoData";
import PageSize from "../Pagination/PageSize";
import Pagination from "../Pagination/Pagination";
import { createQueryParams } from "../../utils/functions";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiPencil } from "react-icons/hi";
import apiClient from "../../utils/AxiosInstance";
import CustomerDisplayForm from "./CustomerDisplayForm";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import { capitalized, labelLayout, setTitle } from "../../utils/utility";
import { useAuth } from "../../context/AuthProvider";
import { useSocket } from "../../context/SocketProvider";
import { Filters } from "../../utils/common/Filters";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";


interface IDisplay {
    _id?: string;
    title: string;
    type: string;
    company?: string;
    restaurant?: string;
    file?: File | null;
    isActive?: boolean;
}

const CustomerDisplay = () => {
    setTitle("Customer Display");
    const navigate = useNavigate();
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [displayData, setDisplayData] = useState<IDisplay[]>([]);
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
        isActive: searchParams.get("isActive") || "",
    });
    const [showFilters, setShowFilters] = useState(false);

    const [queryData, setQueryData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const [id, setId] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const columnNames = ["Sr.No.", "Title", "Type", "Status", "Actions"];
    if (loginRole === SUPER_ADMIN) {
        const staffIndex = columnNames.indexOf("Title");
        if (staffIndex !== -1) {
            columnNames.splice(staffIndex + 1, 0, "Business");
        }
    }

    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const queryDataRef = useRef(queryData);
    useEffect(() => {
        queryDataRef.current = queryData;
    }, [queryData]);

    const getDisplayData = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...queryDataRef.current,
                ...searchFilterRef.current
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/customer_display${queryParams}`,);

            setIsLoading(false);
            setDisplayData(response.data.data);
            setNumOfRecords(response.data.count)
        } catch (error) {
            setIsLoading(false);
            setDisplayData([]);
            console.error(" ~ getDevice error :- ", error);
        }
    }, []);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getDisplayData();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, getDisplayData, location.search]);

    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setQueryData((prev) => ({ ...prev, limit: data }))
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/customer_display/${updatedFormData.page}/${queryParams}`);
    };

    const curPage = (pageNum: any) => {
        setIsLoading(true)
        setQueryData((prev) => {
            const updatedFormData = { ...prev, page: pageNum };
            updateURL(updatedFormData);
            return updatedFormData;
        });
        setPage(pageNum);
    };

    useEffect(() => {
        if (Object.values(searchFilter).some((value) => value !== "") ||
            Object.values(searchFilter).every((value) => value === "")) {

            if (queryData?.page !== 1) {
                setQueryData((prev) => ({ ...prev, page: 1 }));
                setPage(1);
            }
        }
    }, [searchFilter]);


    useEffect(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
        const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

        setQueryData((prev) => ({
            ...prev,
            page: pageFromURL,
            limit: limitFromURL,
        }));

        setPage(pageFromURL);
        setLimit(limitFromURL);
    }, []);

    const navigateSearchPrams = useCallback(() => {
        setIsLoading(true);
        updateURL(queryDataRef.current);
        setLimit(queryDataRef.current?.limit)
        setPage(queryDataRef.current?.page);
    }, [searchFilter, queryData]);

    useEffect(() => {
        navigateSearchPrams();
    }, [searchFilter, navigateSearchPrams]);


    const confirmDelete = (id: string) => {
        setId(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleteOpen(false);
        const deleteId = id;
        setId('');
        if (!deleteId) return;

        try {
            setIsLoading(true)
            const response = await apiClient.post(`/customer_display/delete/${deleteId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }

            setDisplayData(prev => prev.filter(item => item._id !== deleteId));

            getDisplayData();
            if (displayData?.length === 0) {
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setTimeout(() => {
                setIsLoading(false);
                setNumOfRecords(numOfRecords - 1)
            }, 500);

        } catch (error: any) {
            setIsLoading(false);
            console.log('Delete Customer display error:', error);
            toast.error('Failed to delete the cutomer display. Please try again.');
        }
    };

    const socket = useSocket()
    const socketAllowDataPermission = (data: any) => {
        let status = false
        if (loginRole === "Super Admin") {
            status = true
        } else if (MANAGER_ROLES.includes(loginRole)) {
            if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
                status = true
            }
        } else if (!MANAGER_ROLES.includes(loginRole)) {
            if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
                status = true
            }
        }
        return status
    }

    useEffect(() => {
        const addDisplay = (displayData: any) => {
            if (socketAllowDataPermission(displayData)) {
                setDisplayData((prevData: any) => {
                    const updatedData = [...prevData];
                    if (prevData?.length >= limit) {
                        updatedData?.pop();
                    }
                    return [displayData, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updateDisplay = (displayData: any) => {
            setDisplayData((prev: any) => prev.map((item: any) => item._id === displayData._id ? displayData : item));
        };
        const deleteDisplay = (customerDisplayData: any) => {
            setDisplayData((prev: any) => {
                const exists = prev?.some((item: any) => String(item._id) === String(customerDisplayData._id));
                if (!exists) return prev;
                const updatedDisplay = prev?.filter((pos: any) => pos._id !== customerDisplayData?._id) || [];
                if (updatedDisplay.length === 0 && page > 1) {
                    curPage(page - 1);
                }
                return updatedDisplay;
            });
            getDisplayData();
            setNumOfRecords((prev: any) => prev - 1);
        };

        socket.on("addCustomerDisplay", addDisplay);
        socket.on("updateCustomerDisplay", updateDisplay);
        socket.on("deleteCustomerDisplay", deleteDisplay);

        return () => {
            socket.off("addCustomerDisplay", addDisplay);
            socket.off("updateCustomerDisplay", updateDisplay);
            socket.off("deleteCustomerDisplay", deleteDisplay);
        };
    }, [socket, displayData]);

    const handleFilter = (value: string) => {
        setSearchFilter((prev: any) => ({ ...prev, company: value }))
    }

    return (
        <div className={divContainerStyle}>
            <div>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Customer Display" />
                </div>

                {/* Filters & Actions Section */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <button
                            className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white whitespace-nowrap"
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
                                placeholder="Search ..."
                                className="h-[42px] self-center"
                            />
                        )}
                    </div>

                    <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                        <span onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto cursor-pointer">
                            <AddActionButton text="Add a new customer display" />
                        </span>
                    </div>
                </div>

                <div
                    className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                >
                    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                        <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="customerDisplay" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
                    </div>
                </div>
            </div>

            {/* Table Data Layout */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading && (
                            <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <Table.Cell colSpan={8} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {displayData && displayData?.length > 0 && !isLoading ? (
                            displayData?.map((item: any, index) => (
                                <Table.Row key={item?._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={item?.title?.toString() ?? ''}>
                                        {item?.title ?? "-"}
                                    </Table.Cell>
                                    {loginRole === SUPER_ADMIN && (
                                        <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                            {capitalized(item.company?.name) ?? "-"}
                                        </Table.Cell>
                                    )}
                                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300" title={item?.type?.toString() ?? ''}>
                                        {item?.type ?? "-"}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                        {labelLayout(item.isActive ? 'activated' : 'deactivated')}
                                    </Table.Cell>
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button className={editBtnStyle.btn} onClick={() => { setId(item?._id); setIsModalOpen(true); }} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                                        <Button onClick={() => confirmDelete(item?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            isLoading === false && (
                                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell colSpan={10} className="text-center py-4 text-gray-500">
                                        <NoData
                                            title="No Customer Displays Found"
                                            message="No customer displays are available right now. Added customer displays will appear here."
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            )
                        )}
                    </Table.Body>
                </Table>

                {numOfRecords > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                        {numOfRecords > 10 && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 sm:mb-0">
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

            {isModalOpen && (
                <CustomerDisplayForm open={isModalOpen} setOpen={setIsModalOpen} id={id} setId={setId} />
            )}

            <ConfirmModal
                isOpen={isDeleteOpen}
                message="Are you sure you want to delete this customer display ?"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </div>
    )
}

export default CustomerDisplay;
