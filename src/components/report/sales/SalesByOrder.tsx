import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import apiClient from '../../../utils/AxiosInstance';
import { useEffect, useState } from 'react';
import { createQueryParams } from '../../../utils/functions';
import { useAuth } from '../../../context/AuthProvider';
import { FormHeaderPaths } from '../../../utils/HeaderPaths';
import ReportLoader from '../../../utils/common/reportLoader';
import NoData from '../../../utils/common/NoData';
import { OWNER_ROLES, SUPER_ADMIN } from '../../../utils/common/constant';
import { useDarkMode } from '../../../context/DarkModeProvider';
import CommonReportFilter from '../../../utils/CommonReportFilter';

ChartJS.register(ArcElement, Tooltip, Legend);

type SummaryData = {
    label: string;
    value: number | string;
};

// Helper function to format JS Date objects to YYYY-MM-DD
const formatDateToString = (date: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

const SalesByOrder = () => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    const [salesData, setSalesData] = useState<any>({});
    const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
    const [isDefaultCompanySet, setIsDefaultCompanySet] = useState(false);

    const todayDate = new Date();
    // Keep a formatted string version for the API payload
    const todayString = formatDateToString(todayDate);

    const [formData, setFormData] = useState({
        fromDate: todayString, // Fixed: Using formatted string instead of raw Date object
        toDate: todayString,   // Fixed: Using formatted string instead of raw Date object
        company: null,
        restaurant: null
    });

    const [selectedRange, setSelectedRange] = useState({
        startDate: todayDate,
        endDate: todayDate
    });

    const [currency, setCurrency] = useState({ symbol: "$" });
    const [showFilters, setShowFilters] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const hasActiveFilters = !!(
        (loginRole === SUPER_ADMIN ? formData.company : false) ||
        formData.restaurant ||
        (formData.fromDate && formData.toDate)
    );

    const shouldShowFilters = hasActiveFilters || summaryData.length > 0;

    const { isDarkMode } = useDarkMode();

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany();
        } else if (OWNER_ROLES.includes(loginRole) && userData?.staffMember?.company?._id) {
            setFormData((prev) => ({
                ...prev,
                company: userData.staffMember.company._id
            }));
            setShowFilters(true);
            setIsDefaultCompanySet(true);
        }
    }, [loginRole]);

    useEffect(() => {
        if (!formData.company) return;
        getRestaurant(formData.company);
    }, [formData.company]);

    useEffect(() => {
        const isSuperAdminReady =
            loginRole !== SUPER_ADMIN ||
            (isDefaultCompanySet && formData.company);

        if (!isSuperAdminReady) return;

        if (restaurant.length === 1 && !formData.restaurant) {
            return;
        }

        getSalesByOrder();
    }, [
        isDefaultCompanySet,
        formData.company,
        formData.restaurant,
        formData.fromDate,
        formData.toDate
    ]);

    const getSalesByOrder = async () => {
        try {
            setIsLoading(true);

            const queryParams = createQueryParams(formData);
            const response = await apiClient.get(`/reports/sales/order${queryParams}`);

            if (response.data.success) {
                setSalesData(response.data);
                processSummaryData(response.data?.summary);
                setCurrency(response?.data?.currency);
            } else {
                setSalesData({});
                setSummaryData([]);
            }
        } catch (error) {
            console.log("error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies);

                setFormData((prev) => ({
                    ...prev,
                    company: prev.company || response.data.companies?.[0]?._id
                }));
                setShowFilters(true);
                setIsDefaultCompanySet(true);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    };

    const getRestaurant = async (companyId?: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant);

                if (response.data.restaurant.length === 1) {
                    setFormData((prev) => ({
                        ...prev,
                        restaurant: response.data.restaurant[0]._id
                    }));
                }
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    };

    const processSummaryData = (summary: any) => {
        setSummaryData([
            { label: "Total Orders", value: summary.totalOrders },
            { label: "Total Amount", value: summary.totalAmount },
            { label: "Total Tips Amount", value: summary.totalTipsAmount },
            { label: "Average Order Value", value: summary.averageOrderValue },
            { label: "Tip Percentage", value: summary.tipPercentage },
            { label: "Total Gratuity Amount", value: summary.totalGratuityAmount },
            { label: "Total Tender Amount", value: summary.totalTenderAmount },
        ]);
    };

    const handleChangeCompany = (value: any) => {
        setFormData((prev) => ({
            ...prev,
            company: value,
            restaurant: null
        }));
    };

    const handleChangeRestaurant = (value: any) => {
        setFormData((prev) => ({
            ...prev,
            restaurant: value
        }));
    };

    const handleDateRangeChange = (value: any) => {
        setSelectedRange(value);
        if (value.startDate && value.endDate) {
            setFormData((prev: any) => ({
                ...prev,
                fromDate: formatDateToString(value.startDate), // Fixed: Format Date string here
                toDate: formatDateToString(value.endDate)     // Fixed: Format Date string here
            }));
        }
    };

    const handleClear = () => {
        setFormData({
            company: null,
            fromDate: todayString, // Fixed: Clear back to standard string format
            toDate: todayString,   // Fixed: Clear back to standard string format
            restaurant: null
        });

        setSelectedRange({
            startDate: todayDate,
            endDate: todayDate
        });

        if (loginRole === SUPER_ADMIN) {
            setRestaurant([]);
            setIsDefaultCompanySet(false);
            getCompany();
        }
    };

    const data = {
        labels: ['Table Order', 'Product Order', 'Completed Orders', 'Total Hold', 'Total Cancelled'],
        datasets: [
            {
                label: '# Orders Breakdown',
                data: [
                    salesData?.breakdown?.orderTypeCounts?.table || 0,
                    salesData?.breakdown?.orderTypeCounts?.product || 0,
                    salesData?.breakdown?.statusCounts?.completed || 0,
                    salesData?.breakdown?.statusCounts?.hold || 0,
                    salesData?.breakdown?.statusCounts?.cancelled || 0,
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options: any = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDarkMode ? '#fff' : '#333',
                },
            },
        },
    };

    return (
        <>
            <FormHeaderPaths page={'Sales By Order'} prevLink='#' prevPage='Sales' />

            <div className="min-h-screen  p-4 sm:px-6 lg:px-8 ">
                <main className="relative max-w-screen-2xl bg-white dark:bg-DARK-800 p-8 shadow-md rounded-lg">
                    <h2 className="text-3xl font-bold mb-6 dark:text-white">Sales By Order</h2>

                    {/* Filters */}
                    {shouldShowFilters && <CommonReportFilter
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        onClear={handleClear}

                        loginRole={loginRole}
                        SUPER_ADMIN={SUPER_ADMIN}
                        MANAGER_ROLES={OWNER_ROLES}

                        company={formData.company}
                        restaurant={formData.restaurant}

                        companyDetails={companies}
                        restaurantDetails={restaurant}

                        handleBusiness={handleChangeCompany}
                        handleRestaurant={handleChangeRestaurant}

                        dateFilter={true}
                        dateValue={selectedRange}
                        onDateChange={handleDateRangeChange}

                        isDropdownOpen={isDropdownOpen}
                        setIsDropdownOpen={setIsDropdownOpen}

                        showClear={true}
                    />}

                    {isLoading ? (
                        <ReportLoader />
                    ) : summaryData.length === 0 ? (
                        <NoData
                            title="No Sales Found"
                            message="No order sales records are available right now. Added order sales records will appear here."
                        />
                    ) : (
                        <>
                            <div className="flex justify-center mb-8">
                                <div className="w-64 h-64">
                                    <Pie data={data} options={options} />
                                </div>
                            </div>
                            <div className="overflow-x-auto px-4 sm:px-0">
                                <h3 className="text-2xl font-bold mb-6 text-DARK-900 dark:text-white">Summary</h3>
                                <div className="shadow-2xl rounded-lg overflow-hidden border">
                                    <table className="min-w-full divide-y divide-DARK-200 dark:divide-DARK-700">
                                        <thead className="bg-BRAND-100 dark:bg-slate-700">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-sm font-bold text-DARK-700 dark:text-white uppercase tracking-wider"
                                                >
                                                    Label
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-sm font-bold text-DARK-700 dark:text-white uppercase tracking-wider"
                                                >
                                                    Value
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-DARK-100 dark:bg-DARK-900 divide-y divide-DARK-200 dark:divide-DARK-600">
                                            {summaryData.map((data: any, index) => (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-DARK-200 dark:hover:bg-DARK-700 transition-colors duration-150"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-DARK-900 dark:text-white">
                                                        {data.label}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-DARK-700 dark:text-DARK-300">
                                                        {data.label === "Tip Percentage"
                                                            ? `${data.value.toFixed(2)}%`
                                                            : data.label === "Total Orders"
                                                                ? data.value
                                                                : `${currency?.symbol || "$"}${data.value.toFixed(2)}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </>
    );
};

export default SalesByOrder;