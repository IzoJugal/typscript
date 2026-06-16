import { Link } from "react-router-dom"

function BusinessSuccess() {
    const isWebView = /webview/i.test(window.navigator.userAgent);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-BRAND-200 to-BRAND-300 px-4">
            <div className="bg-white shadow-xl rounded-3xl p-8 sm:p-10 md:p-12 max-w-2xl w-full text-center">
                <div className="flex flex-col items-center">
                    {/* Success Icon */}
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-green-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-DARK-800 mb-2">Registration Successful</h2>

                    {/* Description */}
                    <p className="text-DARK-600 mb-2">
                        Thank you for registering your business with us.
                    </p>
                    <p className="text-DARK-500 mb-6">
                        A confirmation email has been sent to your registered address. Please check your inbox.
                    </p>

                    {/* Call to Action */}
                    <Link
                        to={isWebView ? "/" : "/"}
                        className="inline-block px-6 py-2 text-white bg-gradient-to-r from-BRAND-500 to-BRAND-600 rounded-lg shadow hover:shadow-lg hover:brightness-110 transition duration-300"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );

}

export default BusinessSuccess