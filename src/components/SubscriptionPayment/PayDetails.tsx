import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import apiClient from "../../utils/AxiosInstance";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { formatLabel } from "../../utils/utility";

const PayDetails = () => {

    const { id } = useParams();
    const navigate = useNavigate();
      const { configData } = useConfigs();
    const [plan, setPlan] = useState<any>(null);
    // const companyId = sessionStorage.getItem("companyId");
    // const [remainingPrice, setRemainingPrice] = useState(0);
    // const [priceDetails, setPriceDetails] = useState<any>({
    //     planPrice: 0,
    // });
    const [isLoading, setIsLoading] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);

    const currencySymbol =configData?.currency?.symbol;

    const getSinglePlan = useCallback(async () => {

        if (!id) return;
        try {

            setIsLoading(true);
            const response = await apiClient.get(`/plan/${id}`);

            setPlan(response?.data?.data);

            setTimeout(() => {
                setIsLoading(false);
            }, 500);

        } catch (error) {
            setPlan({});
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
            // toast.error(error?.data?.message || 'There was an issue getting the plan.');
            console.error('~ getPlan error :-', error);
            setBtnLoader(false);
        }
    }, [id]);

    // const getRemainingPrice = async () => {
    //     try {

    //         const response = await apiClient.post(`/subscription/remaining-balance`);

    //         setRemainingPrice(response?.data?.remainingValue || 0);
    //     } catch (error) {
    //         console.error("Failed to get remaining price", error);
    //     }
    // };

    useEffect(() => {
        getSinglePlan();
    }, [getSinglePlan]);

    // const makePayment = async (plan: any) => {
    //     if (!plan) return;

    //     setBtnLoader(true);

    //     try {
    //         const response = await apiClient.post("/payment/create-checkout-session", {
    //             planId: plan?._id,
    //             amount: priceDetails?.planPrice,
    //             currency: "usd",
    //         });

    //         if (response?.data?.url) {
    //             window.location.href = response.data.url;
    //         }
    //     } catch (error) {
    //         console.error("Payment initiation failed", error);
    //         setBtnLoader(false);
    //     }
    // };

    return (
        <section className="bg-gray-50 dark:bg-DARK-900 py-12">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <button
                        onClick={() => { navigate('/pricing'), localStorage.removeItem('selectedPlan'), localStorage.removeItem('userEmail') }}
                        className="flex items-center gap-2 px-4 py-3 bg-BRAND-500 text-gray-100 hover:bg-BRAND-600 hover:text-gray-200 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h2 className="mb-10 text-center font-bold text-3xl md:text-4xl dark:text-gray-100">
                        You’re almost there!{" "}
                        <span className="text-pink">Complete your Purchase</span>
                    </h2>

                    {isLoading ? (
                        <div className="flex flex-wrap gap-6 justify-center">
                            {/* Skeleton Pricing Card */}
                            <div className="animate-pulse w-full sm:w-80 p-6 bg-white dark:bg-DARK-800 border rounded-lg shadow">
                                <div className="h-6 bg-gray-300 dark:bg-DARK-600 rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-gray-200 dark:bg-DARK-700 rounded w-full mb-6"></div>
                                <div className="h-4 bg-gray-300 dark:bg-DARK-600 rounded w-1/3 mb-2"></div>
                                <div className="h-10 bg-gray-400 dark:bg-DARK-500 rounded w-2/3"></div>
                            </div>

                            {/* Skeleton Features Card */}
                            <div className="animate-pulse w-full sm:w-80 p-6 bg-white dark:bg-DARK-800 border rounded-lg shadow">
                                <div className="h-6 bg-gray-300 dark:bg-DARK-600 rounded w-1/3 mb-4"></div>
                                <ul className="space-y-2">
                                    <li className="h-4 bg-gray-200 dark:bg-DARK-700 rounded w-full"></li>
                                    <li className="h-4 bg-gray-200 dark:bg-DARK-700 rounded w-5/6"></li>
                                    <li className="h-4 bg-gray-200 dark:bg-DARK-700 rounded w-4/6"></li>
                                </ul>
                            </div>

                            {/* Skeleton Note Card */}
                            <div className="animate-pulse w-full sm:w-full p-6 bg-white dark:bg-DARK-800 border rounded-lg shadow">
                                <div className="h-6 bg-gray-300 dark:bg-DARK-600 rounded w-1/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-DARK-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Selected Plan */}
                            <p className="mb-12 text-center text-2xl font-bold dark:text-gray-100">
                                Selected Plan: <span className="text-BRAND-500">{plan?.name || "N/A"}</span>
                            </p>

                            <div className="flex flex-col lg:flex-row gap-6 dark:text-gray-100">
                                {/* Pricing Card */}
                                <div className="flex-1 bg-white dark:bg-DARK-800 border rounded-lg shadow p-6">
                                    {!plan?.isCustomPrice ? (
                                        <>
                                            <p className="mb-2 font-semibold">Duration</p>
                                            <p className="text-xl font-bold mb-6">
                                                {plan?.planDuration?.intervalCount}{" "}
                                                {formatLabel(plan?.planDuration?.interval)}
                                                {plan?.planDuration?.intervalCount > 1 ? "s" : ""}
                                            </p>

                                            {/* <p className="text-gray-400 dark:text-DARK-400 mb-2">
                                                <del>{currencySymbol}{(plan?.price * 1.2).toFixed(2)}</del>
                                            </p> */}
                                            <p className="text-4xl font-bold text-BRAND-500">{currencySymbol}{plan?.price}</p>
                                        </>
                                    ) : (
                                        <p className="text-xl font-bold">Custom Plan</p>
                                    )}

                                    {plan?.slogan && (
                                        <p className="mt-2 text-gray-600 dark:text-DARK-300 italic">{plan.slogan}</p>
                                    )}
                                </div>

                                {/* Features Card */}
                                <div className="flex-1 bg-white dark:bg-DARK-800 border rounded-lg shadow p-6">
                                    <h3 className="text-xl font-bold mb-4">Features</h3>
                                    <ol className="list-decimal list-inside space-y-1">
                                        {plan?.features?.map((feature: any) => (
                                            <li key={feature?._id}>
                                                {formatLabel(feature?.name)}
                                                {feature?.isUnlimited ? " (Unlimited)" : ` (${feature?.count})`}
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Note Card */}
                                <div className="flex-1 bg-white dark:bg-DARK-800 border rounded-lg shadow p-6">
                                    <h3 className="text-xl font-bold mb-2">Note:</h3>
                                    <p>This is a one-time payment. Your plan will not auto-renew.</p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => navigate("/subscription/payment")}
                                    disabled={btnLoader}
                                    className="inline-block py-3 px-8 text-white font-semibold bg-BRAND-500 hover:bg-BRAND-600 rounded shadow-md h-[50px] transition duration-300 disabled:opacity-50"
                                >
                                    {btnLoader ? "Processing..." : "Pay Now"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>

    )
}

export default PayDetails
