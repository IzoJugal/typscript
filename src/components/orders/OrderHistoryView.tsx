import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { Button, Modal } from "flowbite-react";
import FormLoader from "../../utils/common/FormLoader";
import { FaUserCircle } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { RiExternalLinkLine } from "react-icons/ri";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { formatDate, formatTime } from "../../utils/utility";

interface ViewHistoryProps {
    id: string;
    setId: Dispatch<SetStateAction<string>>;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const OrderHistoryView: React.FC<ViewHistoryProps> = ({ id, setId, open, setOpen }) => {

    const [historyList, setHistoryList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
      const { configData } = useConfigs();

    const getOrderHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/order/history/${id}`);
            if (response.data.success) {
                setHistoryList(response?.data?.data);
            }
        } catch (error: any) {
            setIsLoading(false);
            console.error('Error fetching order history:', error.message);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            getOrderHistory();
        }
    }, [id]);

    const handleClose = () => {
        setHistoryList([]);
        setId('');
        setOpen(false);
    };

    return (
        <Modal show={open} onClose={handleClose} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">
                <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                    {isLoading ? (
                        <div className="h-10 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                    ) : (
                        historyList[0]?.order?.orderName ?? "N/A"
                    )}
                </span>
            </Modal.Header>
            <Modal.Body className="dark:bg-DARK-900">
                {isLoading ? (
                    <FormLoader count={1} />
                ) : historyList && historyList?.length > 0 ? (
                    <div className="space-y-6 p-4">

                        {historyList.length > 0 && (() => {
                            const first = historyList[0];
                            return (
                                <div className="p-4 rounded-lg bg-DARK-100 dark:bg-DARK-800 shadow-sm">
                                    <div className="text-xl flex items-center justify-between gap-3 font-semibold text-DARK-900 dark:text-DARK-100">
                                        {first.order?.orderName || "Order"}
                                        <Link
                                            to={`/order/view/${first?.order?._id}`}
                                            className="flex items-center gap-1 text-BRAND-500 hover:underline"
                                        >
                                            <span className="underline">view order</span>
                                            <RiExternalLinkLine className="text-BRAND-500 text-[18px] mt-[1px]" />
                                        </Link>
                                    </div>

                                    <div className="mt-2 dark:text-DARK-100 flex items-center space-x-2">
                                        <span className="font-medium">{first?.companyName}</span>
                                        <span>|</span>
                                        <span className="font-medium">{first?.restaurantName}</span>
                                    </div>

                                    <div className="text-sm text-DARK-600 dark:text-DARK-300 mt-3 space-y-1">
                                        <div><strong>Amount:</strong> {first?.currencySymbol}{first.order?.orderTotalAmount}</div>
                                        <div><strong>Tax:</strong> {first?.currencySymbol}{first.order?.tax}</div>
                                        <div><strong>Guest Count:</strong> {first?.order?.guestCount}</div>

                                        {first?.order?.status === "cancelled" && (
                                            <div className="mt-2">
                                                <strong>Cancel Reason:</strong> {first?.order?.canceledReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="space-y-8 mt-6">
                            {historyList.map((item, index) => {
                                const { createdByName, serverName, updatedAt, createdAt, previousStatus, updatedStatus } = item;
                                const actionTime = updatedAt || createdAt;

                                const statusAction =
                                    previousStatus !== updatedStatus
                                        ? updatedStatus ? "Removed" : "Restore"
                                        : "No Change";

                                const colorClass =
                                    statusAction === "Removed"
                                        ? "bg-red-500"
                                        : statusAction === "Restore"
                                            ? "bg-green-500"
                                            : "bg-gray-400";

                                return (
                                    <div key={index} className="relative pl-8">
                                        {/* 1. The Vertical Line */}
                                        {index !== historyList.length - 1 && (
                                            <div className="absolute left-1.5 top-3 w-0.5 h-full bg-DARK-300 dark:bg-DARK-600"></div>
                                        )}

                                        {/* 2. Content Node Container */}
                                        <div className="pb-6">
                                            {/* Flex layout fixes dot alignment perfectly */}
                                            <div className="flex items-center relative -left-8 space-x-5">
                                                {/* The Timeline Dot */}
                                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClass}`}></div>

                                                {/* The Header Text */}
                                                <div className="text-base font-semibold text-DARK-900 dark:text-DARK-100 leading-none">
                                                    {statusAction}
                                                </div>
                                            </div>

                                            {/* 3. Subtext Details */}
                                            <div className="flex items-center space-x-2 text-sm text-DARK-600 dark:text-DARK-300 mt-2">
                                                <FaUserCircle size={16} className="text-DARK-500 dark:text-DARK-400" />
                                                <span>{createdByName || serverName}</span>
                                                <span>|</span>
                                                <span>
                                                    {actionTime
                                                        ? `${formatDate(actionTime,configData?.dateFormat)}, ${formatTime(actionTime)}`
                                                        : "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-white dark:bg-DARK-800 rounded-xl border dark:border-DARK-600 shadow-lg p-6">
                            <span className="text-xl font-medium text-DARK-600 dark:text-DARK-300">
                                No Order History Available
                            </span>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="justify-end dark:bg-DARK-800">
                <Button
                    className="w-32 !bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-700 dark:hover:!bg-BRAND-500 focus:!ring-0"
                    disabled={isLoading}
                    size="sm"
                    onClick={handleClose}
                >
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default OrderHistoryView;