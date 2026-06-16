import { Modal } from "flowbite-react";
import { Customer } from "./CustomerView";
import { formatDate, formatTime } from "../../utils/utility";
import { useState, useEffect } from "react";
import { useConfigs } from "../../context/SiteConfigsProvider";
import apiClient from "../../utils/AxiosInstance";

interface HouseCreditProps {
    setOpenModal: (open: boolean) => void;
    openModal: boolean;
    customer: Customer;
    setCustomerViewModal: (open: boolean) => void;
}

const HistoryModal: React.FC<HouseCreditProps> = ({
    openModal,
    setOpenModal,
    customer,
    setCustomerViewModal,
}) => {
      const { configData } = useConfigs();
  
    const [transactionData, setTransactionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHouseHistory = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/house-credits/transaction/${customer._id}`);
            const { success, data } = response.data;
            if (success) {
                setTransactionData(data);
            }
        } catch (error) {
            console.log("house history error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (openModal) {
            getHouseHistory();
        }
    }, [openModal]);

    const currencySymbol = customer?.company?.currency?.symbol || "₹";

    return (
        <>
            <Modal
                size="5xl"
                show={openModal}
                onClose={() => { 
                    setOpenModal(false); 
                    setTransactionData([]);
                    setCustomerViewModal(true);
                }}
                className="backdrop-blur-sm"
            >
                <Modal.Header className="dark:bg-DARK-800">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            House Account History
                        </h2>

                        <p className="text-[11px] sm:text-xs text-DARK-500 dark:text-DARK-400">
                            Transaction ledger (payments & adjustments)
                        </p>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-0">
                    <div className="overflow-hidden rounded-none sm:rounded-2xl border border-DARK-100 dark:border-DARK-700 bg-white dark:bg-DARK-900 shadow-sm">

                        {/* Top Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b border-DARK-100 dark:border-DARK-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-DARK-800 dark:to-DARK-900">

                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-DARK-800 dark:text-white">
                                    Transaction History
                                </h3>

                                <p className="text-[11px] sm:text-xs text-DARK-500 dark:text-DARK-400 mt-0.5">
                                    Recent payment activity
                                </p>
                            </div>

                            <div className="w-fit text-[11px] sm:text-xs px-3 py-1 rounded-full bg-gray-200 dark:bg-DARK-700 text-DARK-700 dark:text-DARK-200 font-medium">
                                {transactionData?.length || 0} Transactions
                            </div>
                        </div>

                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-DARK-500 dark:text-DARK-400 bg-gray-50 dark:bg-DARK-800 border-b border-DARK-100 dark:border-DARK-700">
                            <div className="col-span-5">Date & Time</div>
                            <div className="col-span-4">Payment Method</div>
                            <div className="col-span-3 text-right">Amount</div>
                        </div>

                        {/* Transactions */}
                        <div className="max-h-[65vh] sm:max-h-[420px] overflow-y-auto">
                            {loading ? (
                                <div className="space-y-0">
                                    {[...Array(5)].map((_, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-0 items-start sm:items-center px-4 sm:px-5 py-4 border-b border-DARK-100 dark:border-DARK-800"
                                        >
                                            <div className="sm:col-span-5">
                                                <div className="h-5 bg-gray-200 dark:bg-DARK-700 rounded animate-pulse mb-2"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-DARK-700 rounded animate-pulse w-3/4"></div>
                                            </div>
                                            <div className="sm:col-span-4">
                                                <div className="h-8 bg-gray-200 dark:bg-DARK-700 rounded-full animate-pulse w-32"></div>
                                            </div>
                                            <div className="sm:col-span-3">
                                                <div className="h-5 bg-gray-200 dark:bg-DARK-700 rounded animate-pulse ml-auto w-24"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : transactionData?.length ? (
                                transactionData.map((item: any) => {
                                    const method = item?.method;
                                    const amount = item?.amount;
                                    const isHouseAccount =
                                        method?.toUpperCase() === "HOUSE_ACCOUNT";

                                    return (
                                        <div
                                            key={item._id}
                                            className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-0 items-start sm:items-center px-4 sm:px-5 py-4 border-b border-DARK-100 dark:border-DARK-800 hover:bg-gray-50 dark:hover:bg-DARK-800/60 transition-all duration-200"
                                        >

                                            {/* Date */}
                                            <div className="sm:col-span-5">
                                                <div className="font-medium text-sm sm:text-base text-DARK-800 dark:text-DARK-100">
                                                    {formatDate(item.createdAt,configData?.dateFormat)}
                                                </div>

                                                <div className="text-[11px] sm:text-xs text-DARK-400 mt-1">
                                                    {formatTime(item.createdAt)}
                                                </div>
                                            </div>

                                            {/* Method */}
                                            <div className="sm:col-span-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border
                                        ${isHouseAccount
                                                            ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                                                            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${isHouseAccount
                                                            ? "bg-red-500"
                                                            : "bg-emerald-500"
                                                            }`}
                                                    />

                                                    {method?.replaceAll("_", " ")}
                                                </span>
                                            </div>

                                            {/* Amount */}
                                            <div className="sm:col-span-3 sm:text-right">
                                                <div
                                                    className={`text-sm font-bold ${isHouseAccount
                                                        ? "text-red-600 dark:text-red-400"
                                                        : "text-emerald-600 dark:text-emerald-400"
                                                        }`}
                                                >
                                                    {isHouseAccount ? "-" : "+"}{currencySymbol}
                                                    {amount?.toFixed(2)}
                                                </div>

                                                <div className="text-[11px] text-DARK-400 mt-1">
                                                    {isHouseAccount ? "Debited" : "Credited"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 text-center">

                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 dark:bg-DARK-800 flex items-center justify-center mb-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 sm:w-6 sm:h-6 text-DARK-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M17 9V7a5 5 0 00-10 0v2m-2 0h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"
                                            />
                                        </svg>
                                    </div>

                                    <h4 className="text-sm font-semibold text-DARK-700 dark:text-DARK-200">
                                        No Transactions Found
                                    </h4>

                                    <p className="text-[11px] sm:text-xs text-DARK-400 mt-1 max-w-xs">
                                        No payment activity is available for this account yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>          
        </>
    );
};

export default HistoryModal;
