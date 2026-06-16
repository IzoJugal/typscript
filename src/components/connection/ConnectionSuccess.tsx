import { Link, useSearchParams } from "react-router-dom"


const ConnectionSuccess = () => {
    const [searchParams] = useSearchParams()

    const connection = searchParams.get("connection")

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-BRAND-200 to-BRAND-300">
            {/* Successful Registration */}
            <div className="mx-auto p-6 bg-white shadow-2xl rounded-3xl m-6 sm:m-8 md:m-12 lg:m-16 xl:m-20 max-w-6xl w-full-">
                <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 ${connection === "true" ? "bg-green-100" : "bg-red-100"} rounded-full flex items-center justify-center`}>
                        {connection === "true" ?
                            <svg className="w-8 h-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            :
                            <svg className="w-8 h-8 text-ERROR" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        }
                    </div>
                    <h2 className="text-lg font-bold mt-4">QuickBook Connection {connection === "true" ? "Successful!" : "Failed"}</h2>
                    <p className="text-DARK-600 text-justify mt-2">
                        {connection === "true" ? "Your QuickBooks account has been successfully connected."
                            : "Your QuickBooks connection was unsuccessful."}
                    </p>
                    <p className="text-DARK-700 mb-6 text-justify">
                        {connection === "true" ?
                         "You can now start managing your finances seamlessly."
                        :
                        "Please verify your credentials and try again."
                        }
                    </p>

                    <Link
                        to={"/connection/1"}
                        className="inline-block px-6 py-2 text-white bg-gradient-to-r from-BRAND-400 to-BRAND-500 rounded-lg shadow-md transition duration-300"
                    >
                        Go Back
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ConnectionSuccess