import { Modal } from "flowbite-react"
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { formatDate, formatLabel, labelLayout } from "../../../utils/utility";
import { useConfigs } from "../../../context/SiteConfigsProvider";

interface ViewSubscriptionProps {
    id: string;
    setId: Dispatch<SetStateAction<string>>;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}
const ViewSubscription: React.FC<ViewSubscriptionProps> = ({ id, setId, open, setOpen }) => {

      const { configData } = useConfigs();
    const [isLoading, setIsLoading] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState<any>({});

    const getSubscriptionById = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await apiClient.get(`/subscription/${id}`);
            if (response?.data?.success) {
                setSubscriptionData(response?.data?.data);
            }
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            console.error('~ get subscription details error :-', error);
        }
    }, [id]);

    useEffect(() => {
        if (open === true) {
            getSubscriptionById();
        }
    }, [getSubscriptionById, open]);

    const handleModalClose = () => {
        setSubscriptionData({});
        setOpen(false);
        setId("");
    };

    return (
        <Modal show={open} onClose={handleModalClose} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">
                <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                    {isLoading ? (
                        <div className="h-10 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                    ) : (
                        "Plan Details"
                    )}
                </span>
            </Modal.Header>
            <Modal.Body className="dark:bg-DARK-900">
                {isLoading ? (
                    <div className="mb-6">
                        <div className="h-7 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="h-7 w-full bg-DARK-200 rounded-md animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                ) : (
                    subscriptionData && (
                        <div className="mb-6 max-w-4xl mx-auto">
                            <div className="flex justify-end pb-4">
                                {labelLayout(subscriptionData?.planStatus)}
                            </div>
                            <div className="bg-white dark:bg-DARK-800 rounded-2xl border dark:border-DARK-600 shadow-md p-6 space-y-6">
                                {/* Plan Info */}
                                <div className="border-b dark:border-DARK-600 pb-4">
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {subscriptionData?.plan?.name}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {subscriptionData?.plan?.slogan}
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {configData?.currency?.symbol || 'Rs'}{subscriptionData?.plan?.price} / {(formatLabel(subscriptionData?.plan?.planDuration?.interval))}
                                    </p>
                                </div>

                                {/* Features */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                        Features
                                    </h3>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-gray-700 dark:text-gray-300">
                                        {subscriptionData?.plan?.features.map((feature: any) => (
                                            <li
                                                key={feature?._id}
                                                className="flex items-center justify-between border-b border-gray-200 dark:border-DARK-700 pb-1"
                                            >
                                                <span>{formatLabel(feature?.name)}</span>
                                                <span className="font-medium">
                                                    {feature?.isUnlimited ? "Unlimited" : feature?.count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Flags */}
                                <div className="flex flex-wrap gap-3">
                                    <div
                                        className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${subscriptionData?.isTrial ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                    >
                                        Trial: {subscriptionData?.isTrial ? "Yes" : "No"}
                                    </div>
                                    <div
                                        className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${subscriptionData?.isAutopay ? "bg-blue-500" : "bg-gray-400"
                                            }`}
                                    >
                                        Autopay: {subscriptionData?.isAutopay ? "Enabled" : "Disabled"}
                                    </div>
                                    <div
                                        className={`px-4 py-1.5 rounded-full text-white text-sm font-medium ${subscriptionData?.isActive ? "bg-green-500" : "bg-red-600"
                                            }`}
                                    >
                                        Active: {subscriptionData?.isActive ? "Yes" : "No"}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-400 text-sm">
                                    <div>
                                        <p className="font-medium">Start At</p>
                                        <p>{formatDate(subscriptionData?.subscriptionStart,configData?.dateFormat)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">End At</p>
                                        <p>{formatDate(subscriptionData?.subscriptionEnd,configData?.dateFormat)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </Modal.Body>
        </Modal>
    )
}

export default ViewSubscription
