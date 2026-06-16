/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Table } from "flowbite-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { RiDeleteBin6Line } from "react-icons/ri"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import apiClient from "../../utils/AxiosInstance"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import TableHeaders from "../../utils/common/TableHeaders"
import { useAuth } from "../../context/AuthProvider"
import { Filters } from "../../utils/common/Filters"
import NoData from "../../utils/common/NoData"
import { deleteBtnStyle, divContainerStyle, SUPER_ADMIN } from "../../utils/common/constant"
import { createQueryParams } from "../../utils/functions"
import { capitalized, formatDate, formatTime, setTitle } from "../../utils/utility"
import ListLoader from "../../utils/common/ListLoader"
import { useConfigs } from "../../context/SiteConfigsProvider"
import SearchInput from "../../utils/common/SearchInput"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"

const CloseOutLists = () => {
    setTitle("Close Outs");
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [closeouts, setCloseOuts] = useState<any[]>([])
      const { configData } = useConfigs();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    // const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const staffCompanyId = loginRole !== SUPER_ADMIN
        ? (userData?.staffMember?.company?._id || "")
        : "";
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
        company: searchParams.get("company") || staffCompanyId,
    });
    const [showFilters, setShowFilters] = useState(false);
    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const debounceRef = useRef<any | null>(null);

    const baseColumns = ["Sr.No.", "Close-Out Time", "Closed By", "Restaurant", "Actions"];
    const columnNames = loginRole === SUPER_ADMIN
        ? [...baseColumns.slice(0, 4), "Business", ...baseColumns.slice(4)]
        : baseColumns;


    const getCloseOuts = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);

            const { data } = await apiClient.get(`/close-out/getAll${queryParams}`)
            const { success, closeOuts, count } = data;

            if (success) {
                setTimeout(() => {
                    setIsLoading(false)
                    setCloseOuts(closeOuts)
                    setNumOfRecords(count)
                }, 500)
            }
        } catch (error: any) {
            setTimeout(() => {
                setCloseOuts([])
                setIsLoading(false)
                toast.error(error.response.message ? error.response.message : "")
            }, 500);
            console.error('~ getRestaurants error :-', error)
        }
    }, [formData, searchFilter,])

    // useEffect(() => {
    //     const debounceDelay = setTimeout(() => {
    //         getCloseOuts();
    //     }, 500);
    //     return () => clearTimeout(debounceDelay);
    // }, [page, limit, getCloseOuts, location.search]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            getCloseOuts();
        }, 500);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [page, limit, searchFilter, formData]);

    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/close-outs/${updatedFormData.page}/${queryParams}`);
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

        // Close modal but keep ID until delete succeeds
        setIsDeleteOpen(false);

        try {
            setIsLoading(true);

            const response = await apiClient.post(`/close-out/delete/${selectedId}`, {});
            const { data } = response;

            if (data?.success) {
                setCloseOuts((prev: any[]) =>
                    prev.filter((closeOut: any) => closeOut._id !== selectedId)
                );
                toast.success(data.message);
            } else {
                toast.error(data?.message || "Failed to delete.");
            }
        } catch (error) {
            console.error("Delete restaurant error:", error);
            toast.error("Failed to delete the restaurant. Please try again.");
        } finally {
            // Always reset loading and selected ID
            setIsLoading(false);
            setSelectedId(null);
        }
    };



    const confirmDelete = (id: string) => {
        setSelectedId(id)
        setIsDeleteOpen(true);
    };


    return (
        <div className={divContainerStyle}>
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Close Outs" />
                </div>

              <div className="mt-4">
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

                    {/* Collapsible Filters Section */}
                    <div
                        className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
                            }`}
                    >
                        <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                            <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="room" />
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
                            <Table.Cell colSpan={8} className="text-center py-4">
                                <ListLoader />
                            </Table.Cell>
                        </Table.Row>}
                        {closeouts && closeouts?.length > 0 && !isLoading ? closeouts?.map((item, index) => (
                            <Table.Row key={item._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (page - 1) * limit}</Table.Cell>
                                {/* <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                    {item?.closeoutTime
                                        ? `${formatDate(item.closeoutTime,configData?.dateFormat)}, ${formatTime(item.closeoutTime)}`
                                        : "-"}
                                </Table.Cell> */}
                                <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                    {item?.closeoutTime ? (
                                        <div className="flex flex-col leading-tight">
                                            <span className="font-medium">
                                                {formatDate(item.closeoutTime,configData?.dateFormat)}
                                            </span>

                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {formatTime(item.closeoutTime)}
                                            </span>
                                        </div>
                                    ) : (
                                        "-"
                                    )}
                                </Table.Cell>
                                {/* <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                                    {formatUTCToTZ(item.closeoutTime, item?.restaurant?.[0]?.timeZone || "Asia/Kolkata")}
                                </Table.Cell> */}
                                <Table.Cell
                                    className={`whitespace-nowrap font-medium ${item?.closedBy?.name ? 'text-DARK-900 dark:text-white' : 'text-RED-500'
                                        }`}
                                    title={capitalized(item?.closedBy?.name) || "Auto Close"}
                                >
                                    {capitalized(item?.closedBy?.name) || "Auto Close"}
                                </Table.Cell>

                                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.restaurant?.name)}>{capitalized(item?.restaurant?.name) ?? "-"}</Table.Cell>
                                {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.company?.name)}>{capitalized(item?.company?.name) ?? "-"}</Table.Cell>}

                                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button onClick={() => confirmDelete(item._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                </Table.Cell>
                            </Table.Row>
                        )) : !isLoading && (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Close Outs Found"
                                        message="No close out entries are available right now. Added close out entries will appear here."
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
                isOpen={isDeleteOpen}
                message="Are you sure you want to delete this closeOut?"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </div>
    )
}

export default CloseOutLists
