import { Button, Table, Tooltip } from "flowbite-react";
import TableHeaders from "../../../utils/common/TableHeaders";
import ListLoader from "../../../utils/common/ListLoader";
import NoData from "../../../utils/common/NoData";
import { capitalized, formatDate, labelLayout } from "../../../utils/utility";
import { editBtnStyle } from "../../../utils/common/constant";
import PageSize from "../../Pagination/PageSize";
import Pagination from "../../Pagination/Pagination";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { createQueryParams } from "../../../utils/functions";
import apiClient from "../../../utils/AxiosInstance";
import { useParams } from "react-router-dom";
import { IoMdEye } from "react-icons/io";
import ViewSubscription from "./ViewSubscription";
import { useConfigs } from "../../../context/SiteConfigsProvider";

interface ISubscriptionProps {
    filterParams: any;
    setFilterParams: Dispatch<SetStateAction<any>>;
}


const Subscriptions: React.FC<ISubscriptionProps> = ({ filterParams, setFilterParams }) => {
    const { id } = useParams();
      const { configData } = useConfigs();
    const [subscriptions, setSubscriptions] = useState<any>([]);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);

    const subscriptionColNames = ["Sr. no", "Plan Name", "Start Date", "End Date", "Status", "Actions"];

    const [numOfRecords, setNumOfRecords] = useState<number | any>(0);

    const [sId, setSId] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getSubscriptions = useCallback(async () => {
        if (!id) { return };
        try {
            setSubscriptionLoading(true);

            const queryParams = createQueryParams(filterParams);

            const response = await apiClient.get(`/subscription/company/${id}/${queryParams}`);
            if (response?.data?.success) {
                setSubscriptions(response?.data?.data);
                setNumOfRecords(response?.data?.count);
            };

            setTimeout(() => {
                setSubscriptionLoading(false);
            }, 500);

        } catch (error) {
            setTimeout(() => {
                setSubscriptionLoading(false);
            }, 500);
            console.error('Error fetching company subscriptions:', error);
        }
    }, [id, filterParams]);

    useEffect(() => {
        getSubscriptions()
    }, [getSubscriptions]);

    const handleLimit = (limit: number) => {
        setFilterParams((prev: any) => ({
            ...prev,
            page: 1,
            limit,
        }));
    };

    const curPage = (pageNum: number) => {
        setFilterParams((prev: any) => ({
            ...prev,
            page: pageNum,
        }));
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 bg-DARK-100 dark:bg-gray-900 rounded-2xl -shadow-lg p-4">
                <div className="rounded-lg border-t-2 border-BRAND-400 dark:border-DARK-400 overflow-x-auto">
                    <Table hoverable className="min-w-full">
                        <TableHeaders columnNames={subscriptionColNames} />
                        <Table.Body className="divide-y">
                            {subscriptionLoading && (
                                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell colSpan={6} className="text-center py-4">
                                        <ListLoader />
                                    </Table.Cell>
                                </Table.Row>
                            )}
                            {!subscriptionLoading && subscriptions.length === 0 && (
                                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell colSpan={6} className="text-center py-4 text-gray-500">
                                        <NoData
                                            title="No Subscriptions Found"
                                            message="No subscriptions are available right now. Added subscriptions will appear here."
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            )}
                            {!subscriptionLoading &&
                                subscriptions.map((item: any, index: any) => (
                                    <Table.Row
                                        key={item._id}
                                        className={`'bg-white dark:border-DARK-700 dark:hover:bg-DARK-700 dark:bg-DARK-800'
                                                                    }`}
                                    >
                                        <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (filterParams.page - 1) * filterParams.limit}</Table.Cell>
                                        <Table.Cell className="min-w-[120px] px-3 py-2">{capitalized(item?.plan?.name)}</Table.Cell>
                                        <Table.Cell className="min-w-[100px] px-3 py-2">{formatDate(item?.subscriptionStart,configData?.dateFormat)}</Table.Cell>
                                        <Table.Cell className="min-w-[100px] px-3 py-2">{formatDate(item?.subscriptionEnd,configData?.dateFormat)}</Table.Cell>
                                        <Table.Cell className="min-w-[100px] px-3 py-2">{labelLayout(item?.planStatus)}</Table.Cell>

                                        <Table.Cell className="min-w-32 flex flex-wrap items-center gap-2 px-3 py-2">
                                            <Tooltip content="View Subscription">
                                                <Button onClick={() => { setSId(item?._id); setIsModalOpen(true) }} size="xs" color="gray" className={editBtnStyle.btn}>
                                                    <IoMdEye className={editBtnStyle.icon} />
                                                </Button>
                                            </Tooltip>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                        </Table.Body>
                    </Table>
                    {numOfRecords > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
                            {numOfRecords > 10 && (
                                <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                                    <PageSize handleLimit={handleLimit} limit={filterParams.limit} />
                                </div>
                            )}
                            <div>
                                <Pagination
                                    className="pagination-bar"
                                    currentPage={filterParams.page}
                                    totalCount={numOfRecords}
                                    pageSize={filterParams.limit}
                                    onPageChange={(x: any) => curPage(x)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ViewSubscription
                id={sId}
                setId={setSId}
                open={isModalOpen}
                setOpen={setIsModalOpen}
            />
        </>
    )
}

export default Subscriptions