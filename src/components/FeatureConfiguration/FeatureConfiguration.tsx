import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import ConfirmModal from "../../hooks/ConfirmModal";
import { Button, Table } from "flowbite-react";
import TableHeaders from "../../utils/common/TableHeaders";
import ListLoader from "../../utils/common/ListLoader";
import { capitalized, labelLayout } from "../../utils/utility";
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant";
import { RiDeleteBin6Line } from "react-icons/ri";
import NoData from "../../utils/common/NoData";
import PageSize from "../Pagination/PageSize";
import Pagination from "../Pagination/Pagination";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { createQueryParams } from "../../utils/functions";
import { HiPencil } from "react-icons/hi"
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import CommonFilter from "../../utils/common/CommonFilter";

export interface IFeatureChild {
    value: string;
    label: string;
    _id?: string;
}

export interface IFeature {
    _id: string;
    value: string;
    label: string;
    child: IFeatureChild[];
    isActive?: boolean;
}

const FeatureConfiguration = () => {

    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [features, setFeatures] = useState<IFeature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { pages }: any = useParams<{ id: string }>();
    const [page, setPage] = useState<number>(+pages);
    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const columnNames = ["Sr.No.", "Name", "Status", "Actions"];

    const getAllFeatures = useCallback(async () => {
        try {
            setIsLoading(true)
            const combinedData = {
                ...formData,
                ...searchFilter,
                createdAt: -1
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/features${queryParams}`,);
            setTimeout(() => {
                setFeatures(response.data?.data);
                setNumOfRecords(response.data.count);
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setFeatures([]);
            setIsLoading(false);
            console.error('~ getAllFeature error :-', error);
        }
    }, [formData, searchFilter,]);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getAllFeatures();
        }, 500);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, getAllFeatures, location.search]);


    const handleLimit = (data: any) => {
        curPage(1)
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }))
    }

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilter };
        const queryParams = createQueryParams(combinedData);

        setSearchParams(queryParams);
        navigate(`/feature-config/${updatedFormData.page}/${queryParams}`);
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
            const response = await apiClient.post(`/features/delete/${selectedId}`, {});

            if (response?.data?.success) {
                setIsLoading(false);
                toast.success(response.data.message);
            } else {
                setIsLoading(false);
                toast.error(response?.data?.message);
            }

        } catch (error) {
            setIsLoading(false)
            console.log('Delete feature error:', error);
            toast.error('Failed to delete the feature. Please try again.');
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    const handleClear = () => {
        const hasValidFilter = Object.values(searchFilter).some(value => value !== '');
        if (hasValidFilter) {
            setSearchFilter({
                name: ""
            });
        }
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
        const addFeature = (featureData: any) => {
            if (socketAllowDataPermission()) {
                setFeatures((prevData: any) => {
                    const prev = Array.isArray(prevData) ? prevData : [];
                    const updatedData = [...prev];

                    if (updatedData.length >= limit) {
                        updatedData.pop();
                    }

                    return [featureData, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updateFeature = (featureData: any) => {
            setFeatures((prev: any) => prev.map((item: any) => item._id === featureData._id ? featureData : item));
        };
        const deleteFeature = (featureData: any) => {
            const exists = features?.some((item: any) => {
                return String(item._id) === String(featureData._id)
            });
            if (!exists) {
                setIsLoading(false)
                return
            };
            const updatedfeatures = features?.filter(f => f._id !== featureData?._id);
            setFeatures(updatedfeatures);
            getAllFeatures();
            if (updatedfeatures?.length === 0) {
                if (page > 1) {
                    curPage(page - 1);
                } else {
                    curPage(1);
                }
            }
            setNumOfRecords(numOfRecords - 1)
        };

        socket.on("addFeatures", addFeature);
        socket.on("updateFeatures", updateFeature);
        socket.on("deleteFeatures", deleteFeature);

        return () => {
            socket.off("addFeatures", addFeature);
            socket.off("updateFeatures", updateFeature);
            socket.off("deleteFeatures", deleteFeature);
        };
    }, [socket, features]);

    const totalRecordsCount = features?.length || 0;

    return (
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
            <div>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <DetailHeaderPaths label="Feature-config" />


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
                        <span
                            onClick={() => navigate("/feature-config/add")}
                            className="w-full sm:w-auto block"
                        >
                            <AddActionButton text="Add a new feature" />
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
                        {features && features?.length > 0 && !isLoading ?
                            features?.map((feature, index) => (
                                <Table.Row key={feature?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(feature.label)}>{capitalized(feature.label) ?? '-'}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                                        {labelLayout(feature?.isActive ? 'activated' : 'deactivated')}
                                    </Table.Cell>
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button className={editBtnStyle.btn} onClick={() => navigate(`/feature-config/edit/${feature?._id}`)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                                        <Button onClick={() => confirmDelete(feature._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                            : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Features Found"
                                        message="No features are available right now. Added features will appear here."
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
                message="Are you sure you want to delete this feature ?"
                onConfirm={handleDelete}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    )
}

export default FeatureConfiguration;