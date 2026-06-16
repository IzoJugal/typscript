import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthProvider"
import apiClient from "../../utils/AxiosInstance"

const PaymentSucess = () => {
    const { userData, setUserData, setActivePlan } = useAuth();
    const navigate = useNavigate();
    const hasUpdated = useRef(false);

    const updateActivePlan = async () => {
        const companyId =
            userData?.companyId ||
            userData?.staffMember?.company?._id;

        if (!companyId) {
            return true;
        }

        try {
            const response = await apiClient.get(
                `/subscription/active/${companyId}`
            );

            if (response.data.success) {
                const plan = response.data.data.plan;

                setActivePlan(plan);

                setUserData((prev: any) => ({
                    ...prev,
                    activePlan: plan,
                    activeBusinessPlan: {
                        ...prev?.activeBusinessPlan,
                        isActivePlan: true,
                    },
                    updatedAt: Date.now(),
                }));

                return true;
            }

            return false;
        } catch (error) {
            console.error("Error updating active plan:", error);
            return false;
        }
    };

    useEffect(() => {
        if (hasUpdated.current) return;

        const handleSuccess = async () => {
            hasUpdated.current = true;

            const updated = await updateActivePlan();

            setTimeout(() => {
                if (updated) {
                    navigate("/");
                } else {
                    localStorage.removeItem("companyId");
                    localStorage.removeItem("selectedPlan");

                    navigate("/login", {
                        state: {
                            email:
                                localStorage.getItem("userEmail") || "",
                        },
                    });
                }
            }, 3000);
        };

        handleSuccess();
    }, [userData]);

    return (
        <>
            <div className="bg-white min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border">
                    <div className="text-center">
                        <svg
                            viewBox="0 0 24 24"
                            className="text-green-600 w-16 h-16 mx-auto mb-4"
                        >
                            <path
                                fill="currentColor"
                                d="M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z"
                            ></path>
                        </svg>

                        <h3 className="text-2xl font-semibold text-gray-900">
                            Subscribed Successfully!
                        </h3>
                        <p className="text-gray-600 mt-2 whitespace-nowrap">
                            Thank you for completing your secure online payment.
                        </p>
                        <p className="text-gray-600">Have a great day!</p>

                        <div className="mt-8">
                            <Link
                                to="/"
                                className="px-6 py-3 bg-BRAND-500 hover:bg-BRAND-600 text-white font-semibold rounded-md transition"
                            >
                                Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>

    )
}

export default PaymentSucess
