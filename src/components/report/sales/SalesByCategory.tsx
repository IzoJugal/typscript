import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import apiClient from '../../../utils/AxiosInstance';
import { useAuth } from '../../../context/AuthProvider';
import { createQueryParams } from '../../../utils/functions';
import { FormHeaderPaths } from '../../../utils/HeaderPaths';
import ReportLoader from '../../../utils/common/reportLoader';
import NoData from '../../../utils/common/NoData';
import { OWNER_ROLES, SUPER_ADMIN } from '../../../utils/common/constant';
import { useDarkMode } from '../../../context/DarkModeProvider';
import { capitalized } from '../../../utils/utility';
import CommonReportFilter from '../../../utils/CommonReportFilter';

ChartJS.register(ArcElement, Tooltip, Legend);

const SalesByCategory = () => {
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);

  const todayDateRef = useRef(new Date());

  const [formData, setFormData] = useState({
    fromDate: todayDateRef.current,
    toDate: todayDateRef.current,
    company: null,
    restaurant: null
  });
  const [selectedRange, setSelectedRange] = useState({
    startDate: todayDateRef.current,
    endDate: todayDateRef.current
  });

  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [isDefaultCompanySet, setIsDefaultCompanySet] = useState(false);
  const [currency, setCurrency] = useState({ symbol: "$" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await apiClient.get('/business');

      if (response.data.success) {
        const firstCompany = response?.data?.companies?.[0]?._id;
        setCompanies(response.data.companies);

        if (firstCompany) {
          setFormData((prev) => ({
            ...prev,
            company: prev.company || firstCompany,
          }));
        }

        setIsDefaultCompanySet(true);
        setShowFilters(true);
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error.message);
    }
  }, []);

  const getRestaurant = useCallback(async (companyId: string) => {
    if (!companyId) return;
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant);
        if (response.data.restaurant.length === 1) {
          setFormData((prev) => ({
            ...prev,
            restaurant: response.data.restaurant[0]._id,
          }));
        }
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }, []);

  const fetchSalesCategory = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = createQueryParams(formData);
      const response = await apiClient.get(`/reports/sales/category${queryParams}`);
      if (response?.data?.success) {
        setCategoriesData(response.data.data || []);
        setCurrency(response?.data?.currency || { symbol: "$" });
      } else {
        setCategoriesData([]);
        setCurrency(response?.data?.currency || { symbol: "$" });
      }
    } catch (error: any) {
      console.error('Error fetching sales categories:', error.message);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  }, [formData]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      fetchCompanies();
    }
  }, [loginRole, fetchCompanies]);

  useEffect(() => {
    if (formData.company) {
      getRestaurant(formData.company);
    } else if (
      OWNER_ROLES.includes(loginRole) &&
      userData?.staffMember?.company?._id
    ) {
      const companyId = userData.staffMember.company._id;
      setFormData((prev) => ({
        ...prev,
        company: companyId,
      }));
      setShowFilters(true);
    }
  }, [formData.company, loginRole, userData?.staffMember?.company?._id, getRestaurant]);

  const initialLoad = useRef(false);

  useEffect(() => {
    const isSuperAdminReady =
      loginRole === SUPER_ADMIN &&
      isDefaultCompanySet &&
      formData.company;

    const isOwnerReady = loginRole !== SUPER_ADMIN;

    if ((isSuperAdminReady || isOwnerReady) && !initialLoad.current) {
      initialLoad.current = true;
      fetchSalesCategory();
    }
  }, [isDefaultCompanySet, formData.company]);


  const handleChangeCompany = (value: any) => {
    setFormData((prev) => ({
      ...prev,
      company: value,
      restaurant: null,
    }));
  };

  const handleChangeRestaurant = (value: any) => {
    setFormData((prev) => ({ ...prev, restaurant: value }));
  };

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    if (value?.startDate && value?.endDate) {
      // Check if time has actually moved forward or changed before refreshing state tree
      const startChanged = value.startDate.getTime() !== selectedRange.startDate?.getTime();
      const endChanged = value.endDate.getTime() !== selectedRange.endDate?.getTime();

      if (startChanged || endChanged) {
        setSelectedRange(value);
        setFormData((prev) => ({
          ...prev,
          fromDate: value.startDate,
          toDate: value.endDate
        }));
      }
    }
  };

  const { isDarkMode } = useDarkMode();

  const generateColorFromString = (str: any, alpha = 0.6) => {
    const hash = [...str].reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const r = (hash >> 16) & 0xff;
    const g = (hash >> 8) & 0xff;
    const b = hash & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const labels = categoriesData.map((category: any) => category.name);
  const dataValues = categoriesData.map((category: any) => category.sellCount);

  const chartData = {
    labels,
    datasets: [
      {
        label: '# of Sales',
        data: dataValues,
        backgroundColor: labels.map((name) => generateColorFromString(name)),
        borderColor: labels.map((name) => generateColorFromString(name, 1)),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 20,
          padding: 8,
          usePointStyle: true,
          color: isDarkMode ? '#fff' : '#333',
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.label}: ${tooltipItem.raw}`,
        },
      },
    },
    animation: { animateScale: true, animateRotate: true },
  };

  const totalSellAmount = categoriesData.reduce((sum, category: any) => sum + category.totalAmount, 0);

  const handleClear = () => {
    const freshToday = new Date();
    setFormData({
      company: null,
      fromDate: freshToday,
      toDate: freshToday,
      restaurant: null,
    });

    setSelectedRange({
      startDate: freshToday,
      endDate: freshToday,
    });

    setRestaurant([]);

    if (loginRole === SUPER_ADMIN) {
      setIsDefaultCompanySet(false);
      fetchCompanies();
    }
  };

  return (
    <>
      <FormHeaderPaths page={'Category Sales Details'} prevLink='#' prevPage='Sales' />
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-4">
        <main className="relative bg-white dark:bg-DARK-800 p-8 shadow-md rounded-lg">
          <h2 className="text-3xl font-bold mb-6 dark:text-white">Category Sales Details</h2>

          <CommonReportFilter
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
          />

          {isLoading ? (
            <ReportLoader />
          ) : (
            <>
              {categoriesData.length ? (
                <>
                  <div className="flex justify-center mb-10 h-full">
                    <div className="w-64 h-full">
                      <Pie data={chartData} options={chartOptions} />
                    </div>
                  </div>

                  <div className="overflow-x-auto px-4 sm:px-0">
                    <div className="shadow-md border rounded-lg overflow-hidden">
                      <table className="w-full text-sm divide-y divide-DARK-200 dark:divide-DARK-700">
                        <thead className="bg-BRAND-100 dark:bg-slate-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-DARK-700 dark:text-white uppercase tracking-wider">
                              Category
                            </th>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-DARK-700 dark:text-white uppercase tracking-wider">
                              Sell Count
                            </th>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-DARK-700 dark:text-white uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left font-bold text-DARK-700 dark:text-white uppercase tracking-wider">
                              Order Type
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-DARK-100 dark:bg-DARK-900 divide-y divide-DARK-200 dark:divide-DARK-700">
                          {categoriesData.map((category: any) => (
                            <tr key={category?._id} className="hover:bg-DARK-200 dark:hover:bg-DARK-700 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-DARK-900 dark:text-white font-medium">
                                {category?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-DARK-700 dark:text-DARK-300">
                                {category?.sellCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-DARK-700 dark:text-DARK-300">
                                {currency?.symbol || "Rs"}{category?.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-DARK-700 dark:text-DARK-300">
                                {capitalized(category?.orderType)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-DARK-50 dark:bg-DARK-800 font-bold text-DARK-900 dark:text-white">
                            <td colSpan={2} className="px-6 py-4 text-right">
                              Total Sell Amount:
                            </td>
                            <td colSpan={2} className="px-6 py-4">
                              {currency?.symbol || "$"}{totalSellAmount.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <NoData
                  title="No Sales Found"
                  message="No category sales records are available right now. Added category sales records will appear here."
                />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default SalesByCategory;