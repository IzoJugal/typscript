/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiCheck } from "react-icons/hi";
import { createQueryParams } from "../../utils/functions";
import apiClient from "../../utils/AxiosInstance";
import { IPlan } from "../plans/Plan";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { formatLabel } from "../../utils/utility";

const Pricing = () => {
    const navigate = useNavigate();
    const { userData, setActivePlan } = useAuth();
      const { configData } = useConfigs();
    const [plans, setPlans] = useState<IPlan[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState(4);
    const [currentPlan, setCurrentPlan] = useState<IPlan | null>(null);
    const [planLoading, setPlanLoading] = useState(true);

    const [selectedPlanData, setSelectedPlanData] = useState<any>(null);

    const [submitLoading, setSubmitLoading] = useState(false);
    const companyId = userData?.companyId || localStorage.getItem("companyId");

    const filteredPlans = useMemo(() => {
        if (!userData) return plans;

        return plans.filter((plan) => {
            if (plan.isCustomPrice) return true;

            if (plan.price === 0 && userData.hasUsedFreePlan) {
                return false;
            }

            // Always show selected plan
            if (selectedPlanData && plan._id === selectedPlanData._id) {
                return true;
            }

            if (currentPlan && !plan.isCustomPrice && currentPlan.price !== null && plan.price !== null && plan.price! < currentPlan.price!) {
                return false;
            }

            return true;
        });

    }, [plans, userData, currentPlan]);

    const getCurrentPlan = useCallback(async () => {
        if (!companyId) {
            setPlanLoading(false);
            return;
        }
        try {
            const response = await apiClient.get(`/subscription/active/${companyId}`);
            if (response.data.success) {
                setCurrentPlan(response.data.data.plan);
            }
        } catch (error) {
            console.error('~ getCurrentPlan error :-', error);
        } finally {
            setPlanLoading(false);
        }
    }, [companyId]);

    const getAllPlans = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                isActive: "true",
                // ...(!userData && { priority: 1 }),
                ...(userData ? { customPrice: false } : { customPrice: true })
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/plan${queryParams}`,);
            setTimeout(() => {
                setPlans(response?.data?.data);
                setCount(response?.data?.count);
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setPlans([]);
            setIsLoading(false);
            console.error('~ getAllPlans error :-', error);
        }
    }, [userData]);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem("companyId");
        const storedSelectedPlan = localStorage.getItem("selectedPlan");

        if (!userData && storedCompanyId && storedSelectedPlan) {
            try {
                const plan = JSON.parse(storedSelectedPlan);
                if (plan.isCustomPrice) {
                    navigate("/contactus", { state: { selectedPlan: plan } });
                } else {
                    navigate(`/subscription/pay/${plan._id}`, { state: { selectedPlan: plan } });
                }
                localStorage.removeItem("userEmail");
            } catch (error) {
                console.error("Error parsing stored selectedPlan:", error);
            }
        }
    }, [userData, navigate]);

    useEffect(() => {
        if (userData) {
            getCurrentPlan();
            // Clear stored items to prevent unwanted navigation after login/registration
            localStorage.removeItem("selectedPlan");
            localStorage.removeItem("userEmail");
        }
        getAllPlans();
    }, [getAllPlans, getCurrentPlan, userData]);



    // const growthPlan = {
    //     name: "Growth",
    //     slogan: "Designed to accelerate your growth.",
    //     isCustomPrice: true,
    //     features: [
    //         { _id: 1, name: "restaurant", isUnlimited: true },
    //         { _id: 2, name: "products", isUnlimited: true },
    //         { _id: 3, name: "staff members", isUnlimited: true },
    //         { _id: 4, name: "product modifiers", isUnlimited: true },
    //         { _id: 5, name: "pos devices", isUnlimited: true },
    //         { _id: 6, name: "table management", },
    //         { _id: 7, name: "meal periods", },
    //         { _id: 8, name: "split order", },
    //         { _id: 9, name: "kitchen's view", },
    //         { _id: 10, name: "30+ business reports", },
    //     ],
    // };

    // const allPlans = [...plans, growthPlan];

    const handleFreePlan = async (plan: any) => {
        try {

            if (!companyId || !plan?._id) {
                console.log("companyID and selectedPlanID is required");
                return;
            }

            setSubmitLoading(true);

            const res = await apiClient.post("/subscription/free-plan", {
                companyId,
                planId: plan._id,
            });

            if (res.data.success) {
                if (res.data?.activePlan) {
                    setActivePlan(res.data?.activePlan);
                }
                navigate("/subscription/success");
            } else {
                navigate("/subscription/failed");
            }

        } catch (error) {
            // setTimeout(() => {
            //     setSubmitLoading(false);
            // }, 500);
            navigate("/subscription/failed");
            console.error('Error buying free plan:', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleBack = () => {
        if (userData?.companyId) {
            navigate(
                `/business/bussiness_configs/${userData.companyId}?activeTab=Active+Plan`
            );
        } else {
            navigate("/");
        }
    };

    return (
        <section className="bg-white py-12">
            {userData && (
                <div className="mb-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>
            )}
            <div className="text-center mb-10">

                <h2 className="text-3xl font-extrabold text-gray-800">
                    Pricing for Our POS System
                </h2>
                <p className="text-gray-500 mt-2">
                    A custom plan made for your business
                </p>
            </div>

            <div className="grid grid-cols-1 bg-[#F5F5F5] p-6 rounded-xl md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 max-w-7xl mx-auto">
                {isLoading || (userData && planLoading)
                    ? Array(count)
                        .fill(null)
                        .map((_, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl border shadow-md p-6 h-full flex flex-col justify-between bg-white animate-pulse"
                            >
                                <div>
                                    <div className="h-6 bg-gray-300 rounded w-1/2 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />

                                    <div className="h-8 bg-gray-300 rounded w-1/3 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-2/5 mb-4" />

                                    <ul className="space-y-3 mt-4">
                                        {Array(4)
                                            .fill(null)
                                            .map((__, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <div className="h-4 w-4 bg-gray-300 rounded-full" />
                                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                </li>
                                            ))}
                                    </ul>
                                </div>

                                <div className="h-10 bg-gray-300 rounded w-full mt-6" />
                            </div>
                        ))
                    : filteredPlans?.map((plan) => {
                        const isCurrent = currentPlan?._id === plan._id;
                        const priceDisplay = plan.isCustomPrice
                            ? "Custom"
                            : `${configData?.currency?.symbol ?? "Rs"}${plan.price ?? 0}`;
                        const durationDisplay = plan.isCustomPrice
                            ? "-"
                            : `${plan?.planDuration?.intervalCount} ${plan?.planDuration?.interval}${plan?.planDuration?.intervalCount > 1 ? "s" : ""}`;
                        const isSelected = selectedPlanData?._id === plan._id;

                        return (
                                <div
                                key={plan._id}
                                onClick={() => {
                                    if (isCurrent) return;
                                    setSelectedPlanData(selectedPlanData?._id === plan._id ? null : plan);
                                }}
                                className={`relative rounded-2xl border shadow-md p-6 transition duration-300 h-full flex flex-col justify-between
                                ${isCurrent ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                                ${isSelected
                                        ? "bg-gradient-to-r from-BRAND-500 to-BRAND-600 text-white"
                                        : "bg-white text-gray-800"
                                    }
                                `}
                            >
                                <div>
                                    <h3 className={`text-xl font-bold ${isSelected ? "text-white" : "text-BRAND-500"}`}>
                                        {plan?.name}
                                    </h3>
                                    <p className="text-sm mb-4">{plan?.slogan}</p>

                                    <p className="text-3xl font-extrabold">
                                        {priceDisplay}
                                        {!plan.isCustomPrice && (
                                            <span className="text-base font-medium">/Month</span>
                                        )}
                                    </p>

                                    {!plan?.isCustomPrice && (
                                        <p className={`text-sm mt-1 ${isSelected ? "text-white" : "text-gray-500"}`}>
                                            Duration: {formatLabel(durationDisplay)}
                                        </p>
                                    )}

                                    <ul className={`my-6 space-y-3 ${isSelected ? "text-white" : "text-gray-700"}`}>
                                        {plan?.features &&
                                            plan?.features.map((feature) => (
                                                <li key={feature?._id} className="flex items-center gap-2">
                                                    <HiCheck className="text-blue-600 shrink-0" />
                                                    <span>
                                                        {formatLabel(feature?.name)} {" "}
                                                        {feature?.isUnlimited ? "(Unlimited)" : `(${feature?.count})`}
                                                    </span>
                                                </li>
                                            ))}
                                        <li className="flex items-center gap-2">
                                            <HiCheck className="text-blue-600 shrink-0" />
                                            <span>
                                                30+ Business Reports
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                {isSelected && (
                                    <span className="absolute top-3 right-3 bg-white text-BRAND-500 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                                        ✓ Selected
                                    </span>
                                )}

                                <div className="mt-auto pt-4">
                                    <button
                                        type="button"
                                        disabled={isCurrent}
                                        className={!isSelected ? `w-full py-2 rounded-2xl font-semibold transition 
                                         ${"bg-BRAND-500 text-white hover:bg-BRAND-600"
                                            }` : `w-full py-2 rounded-2xl font-semibold transition 
                                         ${"bg-white text-BRAND-500 hover:bg-BRAND-100"
                                            } 
                                             ${isCurrent ? "cursor-not-allowed opacity-50" : ""}`}
                                    >
                                        {isCurrent
                                            ? "Current Plan"
                                            : plan.isCustomPrice
                                                ? "Contact Sales"
                                                : `Choose ${plan?.name} Plan`}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/*
            <div className="bg-[#F5F5F5] p-6 rounded-xl max-w-xl mx-auto">
                <div className="flex justify-center">
                    <div
                        className={`cursor-pointer rounded-2xl border shadow-md p-6  flex flex-col justify-between max-w-md w-full bg-white text-gray-800 transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]`}
                    >
                        <div>
                            <h3 className="text-2xl font-bold text-BRAND-500">{plan.name}</h3>
                            <p className="text-sm mb-4">{plan.slogan}</p>

                            <p className="text-3xl font-extrabold">Custom</p>

                            <ul className="my-6 space-y-3 text-gray-700">
                                {plan.features.map((feature) => (
                                    <li key={feature._id} className="flex items-center gap-2">
                                        <HiCheck className="text-blue-600 shrink-0" />
                                        <span>
                                            {feature.name.charAt(0).toUpperCase() +
                                                feature.name.slice(1)}{" "}
                                            {feature.isUnlimited ? "(Unlimited)" : ""}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => {
                                navigate('/contactus');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full font-semibold mt-auto rounded-3xl bg-BRAND-500 text-white hover:bg-BRAND-600 py-2">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>
            */}


            {/* <div className="bg-[#F5F5F5] p-3 rounded-xl mx-6 mt-6">
                <p className="text-gray-500">
                    <strong>Note:</strong> Pricing varies based on your specific requirements. Please contact us for details!
                </p>
            </div> */}

            {/* Floating Continue Button */}
            {selectedPlanData && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        disabled={submitLoading || !selectedPlanData}
                        onClick={async () => {
                            if (!selectedPlanData) {
                                toast.error("Please select a plan first");
                                return;
                            }

                            const plan = selectedPlanData;

                            try {
                                setSubmitLoading(true);

                                // ✅ NO COMPANY ID — GO TO SIGNUP
                                if (!companyId) {
                                    localStorage.setItem("selectedPlan", JSON.stringify(plan));
                                    navigate("/company/register", { state: { selectedPlan: plan } });
                                    return;
                                }

                                // ✅ FREE PLAN
                                if (plan.price === 0 || !plan.price) {
                                    await handleFreePlan(plan);
                                    return;
                                }

                                // ✅ LOGGED IN
                                if (userData) {
                                    if (plan.isCustomPrice) {
                                        navigate("/contactus", { state: { selectedPlan: plan } });
                                    } else {
                                        localStorage.setItem("selectedPlan", JSON.stringify(plan));
                                        navigate(`/subscription/pay/${plan._id}`, {
                                            state: { selectedPlan: plan },
                                        });
                                    }
                                    return;
                                }

                                // ✅ EXISTING COMPANY
                                if (companyId) {
                                    localStorage.setItem("selectedPlan", JSON.stringify(plan));

                                    if (plan.isCustomPrice) {
                                        navigate("/contactus", { state: { selectedPlan: plan } });
                                    } else {
                                        navigate(`/subscription/pay/${plan._id}`, {
                                            state: { selectedPlan: plan },
                                        });
                                    }
                                    return;
                                }
                            } finally {
                                setSubmitLoading(false);
                            }
                        }}
                        className={`px-6 py-3 min-w-[200px] rounded-full font-semibold shadow-lg 
                         ${submitLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-BRAND-500 to-BRAND-600 hover:scale-105"
                            } text-white`}
                    >
                        {submitLoading
                            ? "Processing..."
                            : `Continue • ${selectedPlanData.name}`}
                    </button>
                </div>
            )}
        </section>
    );
};

export default Pricing;
