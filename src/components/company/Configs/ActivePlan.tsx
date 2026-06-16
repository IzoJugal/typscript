import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../utils/AxiosInstance";
import { Button } from "flowbite-react";
import { formatDate, formatLabel } from "../../../utils/utility";
import { useConfigs } from "../../../context/SiteConfigsProvider";

const ActivePlan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { configData } = useConfigs();
    const [activePlan, setActivePlan] = useState<any>({});
    const [planLoading, setPlanLoading] = useState(false);
    const [isHighestPlan, setisHighestPlan] = useState(false);

    const getActivePlan = useCallback(async () => {
        if (!id) { return };
        try {
            setPlanLoading(true);

            const response = await apiClient.get(`/subscription/active/${id}`);
            if (response?.data?.success) {
                setActivePlan(response?.data?.data);
                setisHighestPlan(response?.data?.isHighestPlan);
            };

            setTimeout(() => {
                setPlanLoading(false);
            }, 500);

        } catch (error) {
            setTimeout(() => {
                setPlanLoading(false);
            }, 500);
            console.error('Error fetching company active plan:', error);
        }
    }, [id]);

    useEffect(() => {
        getActivePlan();
    }, [getActivePlan]);

    // Render the loading skeleton
    if (planLoading) {
        return (
            <div className="animate-pulse">
                <div className="p-6 bg-gray-50 dark:bg-DARK-800 rounded-lg space-y-6">
                    {/* Header Skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 sm:w-1/4"></div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Pricing details side */}
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>

                        {/* Features side */}
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Button Skeleton */}
                <div className="flex justify-end mt-8">
                    <div className="w-36 h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {activePlan && activePlan.plan ? (
                <div className="p-6 bg-gray-50 dark:bg-DARK-800 rounded-lg space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-2xl font-semibold text-DARK-800 dark:text-DARK-100">
                            {activePlan.plan.name} Plan
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-DARK-300 italic">
                            {activePlan.plan.slogan || "No slogan available"}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-gray-800 dark:text-DARK-200">
                                <strong>Price:</strong>{" "}
                                {activePlan?.plan?.isCustomPrice
                                    ? "Custom Pricing"
                                    : `${configData?.currency?.symbol}${activePlan?.plan?.price} / ${formatLabel(activePlan?.plan?.planDuration?.interval)}`}
                            </p>
                            <p className="text-gray-800 dark:text-DARK-200">
                                <strong>Subscription Start:</strong> {formatDate(activePlan?.subscriptionStart,configData?.dateFormat)}
                            </p>
                            <p className="text-gray-800 dark:text-DARK-200">
                                <strong>Subscription End:</strong> {formatDate(activePlan?.subscriptionEnd,configData?.dateFormat)}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 text-gray-800 dark:text-DARK-200">Features:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                {activePlan?.plan?.features.map((feature: any) => (
                                    <div key={feature?._id} className="text-gray-800 dark:text-DARK-200">
                                        <strong className="text-gray-800 dark:text-DARK-200">{formatLabel(feature?.name)}:</strong>{" "}
                                        {feature?.isUnlimited ? "Unlimited" : feature?.count}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-sm mx-auto mt-10 p-6 bg-DARK-50 dark:bg-DARK-800 rounded-lg font-semibold text-center text-gray-700 dark:text-gray-300">
                    No active subscription found.
                </div>
            )}
            <div className="flex justify-end mt-8">
                {!isHighestPlan && (
                    <Button
                        className="w-36 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 !ring-0"
                        size="sm"
                        onClick={() => {
                            localStorage.setItem("companyId", id || "");
                            navigate("/pricing", { state: { from: "register" } });
                        }}
                    >
                        {activePlan?.plan ? "Upgrade Plan" : "Purchase Plan"}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default ActivePlan;