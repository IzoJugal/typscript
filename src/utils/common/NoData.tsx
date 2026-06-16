interface NoDataProps {
    title?: string;
    message?: string;
}

const NoData = ({
    title = "No data is available to display at the moment",
    message = "We couldn’t find any data to display right now.",
}: NoDataProps) => {
    return (
        <div className="flex justify-center items-center min-h-[50vh] px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md rounded-xl p-8 text-center">
                <div className="flex justify-center mb-4">
                    <svg
                        className="w-12 h-12 text-yellow-500 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7.5A1.5 1.5 0 014.5 6h3.379a1.5 1.5 0 001.06-.44l1.121-1.12A1.5 1.5 0 0110.621 4H19.5A1.5 1.5 0 0121 5.5v13A1.5 1.5 0 0119.5 20h-15A1.5 1.5 0 013 18.5v-11z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 10v3m0 3h.01"
                        />
                    </svg>
                </div>

                <h2 className="text-xl font-semibold text-DARK-700 dark:text-DARK-200">
                    {title}
                </h2>

                <p className="mt-2 text-sm text-DARK-500 dark:text-DARK-400">
                    {message}
                </p>
            </div>
        </div>
    );
};

export default NoData;