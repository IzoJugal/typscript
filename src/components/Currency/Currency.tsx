import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createQueryParams } from "../../utils/functions";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant";
import ConfirmModal from "../../hooks/ConfirmModal";
import CurrencyForm from "./CurrencyForm";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { Button, Table } from "flowbite-react";
import TableHeaders from "../../utils/common/TableHeaders";
import ListLoader from "../../utils/common/ListLoader";
import NoData from "../../utils/common/NoData";
import { HiPencil } from "react-icons/hi"
import { RiDeleteBin6Line } from "react-icons/ri";
import { capitalized, labelLayout } from "../../utils/utility";
import AddActionButton from "../../utils/common/AddActionButton";
import CommonFilter from "../../utils/common/CommonFilter";


export interface ICurrency {
    _id: string;
    name: string;
    code: string;
    symbol: string;
    label?: string;
    isActive?: boolean;
    isDelete?: boolean;
}

const Currency = () => {

    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [currency, setCurrency] = useState<ICurrency[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
    });

    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const columnNames = ["Sr.No.", "Code", "Symbol", "Label", "Name", "Status", "Actions"];
    const [currencyId, setCurrencyId] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [currencyData, setCurrencyData] = useState<any>({});

    const getAllCurrency = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter,
                createdAt: -1
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/currency${queryParams}`,);
            setTimeout(() => {
                setCurrency(response.data?.data);
                setNumOfRecords(response.data.count);
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setCurrency([]);
            setIsLoading(false);
            console.error('~ getAllCurrency error :-', error + currencyData);
        }
    }, [formData, searchFilter,]);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getAllCurrency();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getAllCurrency, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }))
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/currency/${updatedFormData.page}/${queryParams}`);
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
        if (!selectedId) return;
        setIsModalOpen(false);
        setSelectedId(null);

        try {
            setIsLoading(true)
            const response = await apiClient.post(`/currency/delete/${selectedId}`, {});

            if (response?.data?.success) {
                setIsLoading(false);
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }

        } catch (error) {
            setIsLoading(false)
            console.log('Delete currency error:', error);
            toast.error('Failed to delete the currency. Please try again.');
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsModalOpen(true);
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
        const addCurrency = (currencyData: any) => {
            if (socketAllowDataPermission()) {
                setCurrency((prevData: any) => {
                    const prev = Array.isArray(prevData) ? prevData : [];
                    const updatedData = [...prev];

                    if (updatedData.length >= limit) {
                        updatedData.pop();
                    }

                    return [currencyData, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updateCurrency = (currencyData: any) => {
            setCurrency((prev: any) => prev.map((item: any) => item._id === currencyData._id ? currencyData : item));
        };
        const deleteCurrency = (currencyData: any) => {
            const exists = currency?.some((item: any) => {
                return String(item._id) === String(currencyData._id)
            });
            if (!exists) {
                setIsLoading(false)
                return
            };
            const updatedCurrency = currency?.filter(c => c._id !== currencyData?._id);
            setCurrency(updatedCurrency);
            getAllCurrency();
            if (updatedCurrency?.length === 0) {
                // curPage(page - 1)
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setNumOfRecords(numOfRecords - 1)
        };

        socket.on("addCurrency", addCurrency);
        socket.on("updateCurrency", updateCurrency);
        socket.on("deleteCurrency", deleteCurrency);
        socket.on("softDeleteCurrency", deleteCurrency);

        return () => {
            socket.off("addCurrency", addCurrency);
            socket.off("updateCurrency", updateCurrency);
            socket.off("deleteCurrency", deleteCurrency);
            socket.off("softDeleteCurrency", deleteCurrency);
        };
    }, [socket, currency]);

    const handleEdit = (id: string) => {
        setCurrencyId(id);
        setOpenModal(true);
    };

    const handleClear = () => {
        const hasValidFilter = Object.values(searchFilter).some(value => value !== '');
        if (hasValidFilter) {
            setSearchFilter({});
        }
    }

    const totalRecordsCount = currency?.length || 0;

    return (
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
            <div>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Currency" />


                </div>

                {/* Filters Section */}
                <CommonFilter
                    searchValue={searchFilter?.name ?? ""}
                    onSearchChange={(value) =>
                        setSearchFilter((prev: any) => ({
                            ...prev,
                            name: value,
                        }))
                    }
                    totalItems={totalRecordsCount}
                    onClear={handleClear}
                    placeholder="Search by name..."
                    AddButton={
                        <span onClick={() => setOpenModal(true)}>
                            <AddActionButton text="Add a new currency" />
                        </span>
                    }
                />
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
                        {currency && currency?.length > 0 && !isLoading ?
                            currency?.map((currency, index) => (
                                <Table.Row key={currency?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(currency.code)}>{capitalized(currency.code) ?? '-'}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={currency?.symbol}>{currency?.symbol ?? '-'}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${currency?.label}`}>{currency.label ?? '-'}</Table.Cell>
                                    <Table.Cell className="py-4 text-sm text-DARK-500 dark:text-DARK-300" title={currency?.name}>
                                        {currency?.name ?? "-"}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                        {labelLayout(currency?.isActive ? 'activated' : 'deactivated')}
                                    </Table.Cell>
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button className={editBtnStyle.btn} onClick={() => handleEdit(currency?._id)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                                        <Button onClick={() => confirmDelete(currency._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                            : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Currencies Found"
                                        message="No currencies are available right now. Added currencies will appear here."
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
            <ConfirmModal
                isOpen={isModalOpen}
                message="Are you sure you want to delete this currency ?"
                onConfirm={handleDelete}
                onCancel={() => setIsModalOpen(false)}
            />
            <CurrencyForm
                currencyId={currencyId}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setOpenModal={setOpenModal}
                setCurrencyData={setCurrencyData}
                openModal={openModal}
                setCurrencyId={setCurrencyId}
            />
        </div>
    )
}

export default Currency;
