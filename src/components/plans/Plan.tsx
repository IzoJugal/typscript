/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { Button, Table, ToggleSwitch } from "flowbite-react";
import TableHeaders from "../../utils/common/TableHeaders";
import ListLoader from "../../utils/common/ListLoader";
import NoData from "../../utils/common/NoData";
import PageSize from "../Pagination/PageSize";
import Pagination from "../Pagination/Pagination";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiPencil } from "react-icons/hi";
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant";
import { capitalized } from "../../utils/utility";
import { createQueryParams } from "../../utils/functions";
import apiClient from "../../utils/AxiosInstance";
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import { useConfigs } from "../../context/SiteConfigsProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import CommonFilter from "../../utils/common/CommonFilter";


export interface IPlan {
    _id: string;
    name?: string;
    price?: number | null;
    isCustomPrice?: boolean;
    priority?: number;
    slogan?: string;
    features?: [{
        name: string;
        count: number;
        isUnlimited?: boolean
        _id?: string;
    }];
    planDuration: {
        interval: string;
        intervalCount: number;
    };
    isActive?: boolean;
}


const Plan = () => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [plans, setPlans] = useState<IPlan[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
    const location = useLocation();
    const navigate = useNavigate();
      const { configData } = useConfigs();
    const [searchParams, setSearchParams] = useSearchParams();
    const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
    const [searchFilter, setSearchFilter] = useState<any>({
        name: searchParams.get("name") || "",
    });

    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const columnNames = ["Sr.No.", "Name", "Price", "Duration", "Status", "Actions"];

    const currencySymbol =configData?.currency?.symbol || "$";

    const getAllPlans = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/plan${queryParams}`,);
            setTimeout(() => {
                setPlans(response.data?.data);
                setNumOfRecords(response.data.count)
                setIsLoading(false)
            }, 500);
        } catch (error) {
            setPlans([])
            setIsLoading(false)
            console.error('~ getAllSocialMedia error :-', error);
        }
    }, [formData, searchFilter,]);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getAllPlans();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getAllPlans, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }))
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/plan/${updatedFormData.page}/${queryParams}`);
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

    const socket = useSocket()
    const socketAllowDataPermission = () => {
        let status = false
        if (loginRole === "Super Admin") {
            status = true
        }
        return status
    }

    useEffect(() => {
        const addPlan = (planData: any) => {
            if (socketAllowDataPermission()) {
                setPlans((prevData: any) => {
                    const prev = Array.isArray(prevData) ? prevData : [];
                    const updatedData = [...prev];

                    if (updatedData.length >= limit) {
                        updatedData.pop();
                    }

                    return [planData, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updatePlan = (planData: any) => {
            setPlans((prev: any) => prev.map((item: any) => item._id === planData._id ? planData : item));
        };
        const deletePlan = (planData: any) => {
            const exists = plans?.some((item: any) => {
                return String(item._id) === String(planData._id)
            });
            if (!exists) {
                setIsLoading(false)
                return
            };
            const updatedPlan = plans?.filter(p => p._id !== planData?._id);
            setPlans(updatedPlan);
            getAllPlans();
            if (updatedPlan?.length === 0) {
                // curPage(page - 1)
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setNumOfRecords(numOfRecords - 1)
        };

        socket.on("addPlan", addPlan);
        socket.on("updatePlan", updatePlan);
        socket.on("changeStatusPlan", updatePlan);
        socket.on("deletePlan", deletePlan);

        return () => {
            socket.off("addPlan", addPlan);
            socket.off("updatePlan", updatePlan);
            socket.off("changeStatusPlan", updatePlan);
            socket.off("deletePlan", deletePlan);
        };
    }, [socket, plans]);

    const handleClear = () => {
        const hasValidFilter = Object.values(searchFilter).some(value => value !== '');
        if (hasValidFilter) {
            setSearchFilter({});
        }
    };

    const handleEdit = (id: string) => {
        navigate(`/plan/edit/${id}`)
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        setIsModalOpen(false);
        setSelectedId(null);

        try {
            setIsLoading(true)
            const response = await apiClient.post(`/plan/delete/${selectedId}`, {});

            if (response?.data?.success) {
                setIsLoading(false);
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }

        } catch (error) {
            setIsLoading(false)
            console.log('Delete plan error:', error);
            toast.error('Failed to delete the plan. Please try again.');
        }
    };

    const handleToggleChange = async (id: string, checked: boolean) => {
        try {
            setIsLoading(true)
            const response = await apiClient.patch(`/plan/status/${id}`, { status: checked });

            if (response?.data?.success) {
                toast.success(response.data.message);
                setIsLoading(false);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setIsLoading(false)
            console.log('change active status of plan error:', error);
            toast.error('Failed to change active status of the plan. Please try again.');
        }
    };

    const totalRecordsCount = plans?.length || 0;

    return (
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
            <div>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Plan" />

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
                    placeholder="Search by plan name..."
                    AddButton={
                        <Link to="/plan/add" className="w-full sm:w-auto block">
                            <AddActionButton text="Add a new plan" />
                        </Link>
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
                        {plans && plans?.length > 0 && !isLoading ?
                            plans?.map((plan, index) => (
                                <Table.Row key={plan?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(plan.name)}>{capitalized(plan.name) ?? '-'}</Table.Cell>
                                    <Table.Cell
                                        className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                                        title={plan?.isCustomPrice ? 'Custom' : `${currencySymbol}${plan?.price}`}
                                    >
                                        {plan?.isCustomPrice ? 'Custom' : `${currencySymbol}${plan?.price ?? '-'}`}
                                    </Table.Cell>
                                    <Table.Cell
                                        className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                                        title={
                                            plan?.isCustomPrice
                                                ? '-'
                                                : `${plan?.planDuration?.intervalCount} ${plan?.planDuration?.interval}${plan?.planDuration?.intervalCount > 1 ? 's' : ''}`
                                        }
                                    >
                                        {plan?.isCustomPrice
                                            ? '-'
                                            : `${plan?.planDuration?.intervalCount} ${plan?.planDuration?.interval}${plan?.planDuration?.intervalCount > 1 ? 's' : ''}`}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                        <ToggleSwitch
                                            checked={!!plan?.isActive}
                                            onChange={(e) => handleToggleChange(plan?._id, e)}
                                            // label={plan?.isActive ? 'Activated' : 'Deactivated'}
                                            color="success"
                                        />
                                    </Table.Cell>
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button className={editBtnStyle.btn} onClick={() => handleEdit(plan?._id)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                                        <Button onClick={() => confirmDelete(plan._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                            : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Plans Found"
                                        message="No plan records are available right now. Added plan records will appear here."
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
                message="Are you sure you want to delete this plan ?"
                onConfirm={handleDelete}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    )
}

export default Plan;
