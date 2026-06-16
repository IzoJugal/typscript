import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createQueryParams } from "../../utils/functions";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { Button, Table } from "flowbite-react";
import { Filters } from "../../utils/common/Filters";
import TableHeaders from "../../utils/common/TableHeaders";
import ListLoader from "../../utils/common/ListLoader";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import NoData from "../../utils/common/NoData";
import PageSize from "../Pagination/PageSize";
import Pagination from "../Pagination/Pagination";
import { capitalized, labelLayout, setTitle } from "../../utils/utility";
import InventoryForm from "./InventoryForm";
import { useSocket } from "../../context/SocketProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";


interface IInventory {
    _id: string;
    name: string;
    unit: string;
    area: string;
    category: string;
    sku: string;
    quantity: number;
    expirationDate: Date;
    mfgDate: Date;
    isActive: boolean;
    company?: {
        _id: string;
        name: string;
    };
    restaurant?: {
        _id: string;
        name: string;
    }
}

const Inventory = () => {

    setTitle("Inventory");
    const socket: any = useSocket();
    const navigate = useNavigate();
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [inventoryList, setInventoryList] = useState<IInventory[] | any>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const staffCompanyId = userData?.staffMember?.company?._id || "";
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || staffCompanyId,
        isActive: searchParams.get("isActive") || "",
    });

    const [queryData, setQueryData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
        sortBy: 'createdAt',
        order: 'desc',
    });

    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const queryDataRef = useRef(queryData);
    useEffect(() => {
        queryDataRef.current = queryData;
    }, [queryData]);

    const baseColumns = ["Sr.No.", "Name", "Quantity", "Unit", "Category", "Status", "Actions"];
    const superAdminColumns = [...baseColumns.slice(0, 2), "Business", ...baseColumns.slice(2)];
    const columnNames = loginRole === SUPER_ADMIN ? superAdminColumns : baseColumns;

    const [openInventoryForm, setOpenInventoryForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const getInventoryList = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...queryDataRef.current,
                ...searchFilterRef.current
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/inventory${queryParams}`,)
            if (response?.data?.status === true || response?.data?.success === true) {
                setInventoryList(response.data?.ingredients);
                setNumOfRecords(response.data?.count);
            } else {
                setInventoryList([]);
                setNumOfRecords(0);
            }

            setIsLoading(false);
        } catch (error) {
            setInventoryList([])
            setIsLoading(false)
            console.error('~ getInventoryList error :-', error);
        }
    }, []);

    const socketAllowDataPermission = (data: any) => {
        let status = false
        if (loginRole === SUPER_ADMIN) {
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
        const handleNewIngredient = (newIng: IInventory) => {
            if (socketAllowDataPermission(newIng)) {
                setInventoryList((prevData: any) => {
                    const updatedData = [...prevData];
                    if (prevData?.length >= limit) {
                        updatedData?.pop();
                    }
                    return [newIng, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };

        const handleUpdateIngredient = (updatedIng: IInventory) => {
            setInventoryList((prev: any) =>
                prev.map((ing: any) => (ing._id === updatedIng._id ? updatedIng : ing))
            );
        };

        const handleDeleteIngredient = (deletedIng: IInventory) => {
            setInventoryList((prev: any) => {
                const exists = prev?.some((item: any) => String(item._id) === String(deletedIng._id));
                if (!exists) return prev;
                const updated = prev.filter((ing: any) => ing._id !== deletedIng?._id);
                if (updated.length === 0) {
                    if (page > 1) {
                        curPage(page - 1);
                    } else {
                        curPage(1);
                    }
                }
                return updated;
            });
            getInventoryList();
            setNumOfRecords((prev: any) => prev - 1);
        };

        socket.on("addIngredient", handleNewIngredient);
        socket.on("updateIngredient", handleUpdateIngredient);
        socket.on("deleteIngredient", handleDeleteIngredient);

        return () => {
            socket.off("addIngredient", handleNewIngredient);
            socket.off("updateIngredient", handleUpdateIngredient);
            socket.off("deleteIngredient", handleDeleteIngredient);
        };
    }, [socket]);


    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getInventoryList();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, getInventoryList, location.search]);

    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setQueryData((prev) => ({ ...prev, limit: data }))
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/inventory/${updatedFormData.page}/${queryParams}`);
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

    const handleEdit = (id: string) => {
        setSelectedId(id);
        setOpenInventoryForm(true);
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsConfirmModalOpen(true);
    };

    const handleDelete = async () => {
        setIsConfirmModalOpen(false);
        const deleteId = selectedId;
        setSelectedId(null);
        if (!deleteId) return;

        try {
            setIsLoading(true)
            const response = await apiClient.post(`/inventory/${deleteId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }

            setInventoryList((prev: any) => {
                const updated = prev?.filter((inv: any) => inv._id !== deleteId) || [];
                if (updated.length === 0 && page > 1) {
                    curPage(page - 1);
                }
                return updated;
            });
            setNumOfRecords((prev: any) => prev - 1);
            getInventoryList();
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            console.log('Delete ingredient error:', error);
            toast.error('Failed to delete the ingredient. Please try again.');
        }
    };

    const handleInventoryFormClose = () => {
        setOpenInventoryForm(false);
        setSelectedId(null);
        getInventoryList();
    };

    return (
        <div className={divContainerStyle}>
            <div>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Inventory" />
                </div>

                {/* Filters Section */}
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

                        <div className="shrink-0">
                            <span
                                onClick={() => { setOpenInventoryForm(true); }}
                                className="cursor-pointer inline-block"
                            >
                                <AddActionButton text="Add a new ingredient" />
                            </span>
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
                                module="inventory"
                                userData={userData}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Element Layout Container */}
            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400 mt-4">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />

                    <Table.Body className="divide-y">
                        {isLoading && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={8} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {inventoryList && inventoryList?.length > 0 && !isLoading ? (
                            inventoryList?.map((elem: any, index: number) => (
                                <Table.Row key={elem?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                                        {index + 1 + (page - 1) * limit}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(elem?.name)}>
                                        {capitalized(elem?.name) ?? '-'}
                                    </Table.Cell>
                                    {loginRole === SUPER_ADMIN && (
                                        <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(elem?.company?.name)}>
                                            {capitalized(elem?.company?.name) ?? '-'}
                                        </Table.Cell>
                                    )}
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.quantity}>
                                        {elem?.quantity?.toFixed(2) ?? '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.unit}>
                                        {capitalized(elem?.unit) ?? '-'}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.category}>
                                        {capitalized(elem?.category) ?? '-'}
                                    </Table.Cell>

                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.isActive ? 'Activated' : 'DeActivated'}>
                                        {labelLayout(elem?.isActive ? 'activated' : 'deactivated')}
                                    </Table.Cell>

                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button className={editBtnStyle.btn} onClick={() => handleEdit(elem?._id)} size="xs">
                                            <HiPencil className={editBtnStyle.icon} /> <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            onClick={() => confirmDelete(elem?._id)}
                                            className={deleteBtnStyle.btn}
                                            size="xs"
                                        >
                                            <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            isLoading === false && (
                                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                        <NoData
                                            title="No Inventory Items Found"
                                            message="No inventory items are available right now. Added items will appear here."
                                        />
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


            <InventoryForm
                open={openInventoryForm}
                setOpen={setOpenInventoryForm}
                id={selectedId}
                onClose={handleInventoryFormClose}
            />

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                message="Are you sure you want to delete this ingredient ?"
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmModalOpen(false)}
            />
        </div>
    )
}

export default Inventory
