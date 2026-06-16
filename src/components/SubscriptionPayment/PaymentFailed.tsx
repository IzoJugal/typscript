import { useEffect } from "react"
import { useAuth } from "../../context/AuthProvider"
import { Link } from "react-router-dom";

const PaymentFailed = () => {
    const { userData } = useAuth();

    useEffect(() => {
        if (!userData) {
            localStorage.removeItem("companyId");
            localStorage.removeItem("userEmail");
        }
    }, [userData]);

    return (
        <>
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border">
                    <div className="text-center">
                        <svg
                            className="w-16 h-16 mx-auto mb-4"
                            viewBox="0 0 1024 1024"
                        >
                            <path
                                d="M549.044706 512l166.189176-166.249412a26.383059 26.383059 0 0 0 0-36.98447 26.383059 26.383059 0 0 0-37.044706 0L512 475.015529l-166.249412-166.249411a26.383059 26.383059 0 0 0-36.98447 0 26.383059 26.383059 0 0 0 0 37.044706L475.015529 512l-166.249411 166.249412a26.383059 26.383059 0 0 0 0 36.98447 26.383059 26.383059 0 0 0 37.044706 0L512 548.984471l166.249412 166.249411a26.383059 26.383059 0 0 0 36.98447 0 26.383059 26.383059 0 0 0 0-37.044706L548.984471 512zM512 1024a512 512 0 1 1 0-1024 512 512 0 0 1 0 1024z"
                                fill="#E84335"
                            />
                        </svg>

                        <h3 className="text-2xl font-semibold text-gray-900">
                            Oops!! Payment Failed!
                        </h3>
                        <p className="text-gray-600 mt-2">Please try again or after some time.</p>
                        <p className="text-gray-600">Have a great day!</p>

                        <div className="mt-8">
                            <Link
                                to="/"
                                className="px-6 py-3 bg-BRAND-900 hover:bg-BRAND-800 text-white font-semibold rounded-md transition"
                            >
                                Go Back
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PaymentFailed
