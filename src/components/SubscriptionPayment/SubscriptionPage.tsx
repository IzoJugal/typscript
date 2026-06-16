import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useState } from "react";

export default function SubscriptionPage() {
    const navigate = useNavigate();
    const { activePlan } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const benefits = [
        "Real-time inventory management with automated low-stock alerts",
        "Kitchen display system for efficient order handling",
        "Advanced reporting and analytics for business insights",
        "Omnichannel order integration (dine-in, online, delivery)",
        "Table and reservation management",
        "Mobile POS and tableside ordering",
        "Secure payment processing with multiple options",
        "Cloud-based access across multiple devices",
    ];

    return (
        <div className="h-full flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-3xl w-full shadow-xl rounded-2xl bg-white p-8">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="text-center mb-8">
                            <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </div>

                        <div className="grid gap-4 mb-8">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-gray-300 rounded-full mt-1"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <div className="w-full sm:w-auto h-12 bg-gray-300 rounded-lg"></div>
                            <div className="w-full sm:w-auto h-12 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold">{activePlan ? 'Upgrade Your POS Experience' : 'Purchase Your POS Plan'}</h1>
                            <p className="text-gray-500 mt-2">
                                Unlock all features to run your business smoothly
                            </p>
                        </div>

                        <div className="grid gap-4 mb-8">
                            {benefits.map((item, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <Check className="text-green-500 mt-1" />
                                    <p className="text-gray-700">{item}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="w-full sm:w-auto px-6 py-3 bg-BRAND-500 text-white rounded-lg shadow-md hover:bg-BRAND-500 transition-colors duration-300"
                                onClick={() => navigate("/pricing")}
                            >
                                {activePlan ? 'View Upgrade Plans' : 'View Pricing Plans'}
                            </button>

                            <button
                                className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-300"
                                onClick={() => navigate("/")}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
