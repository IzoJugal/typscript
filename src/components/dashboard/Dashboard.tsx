import { useCallback, useEffect, useState, useMemo } from "react";
import { FaInbox, FaShoppingCart } from "react-icons/fa";
import { TbTransactionDollar } from "react-icons/tb";
import { MdOutlineCancel } from "react-icons/md";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Bar } from "react-chartjs-2";
import { Dropdown } from "flowbite-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

import ModernStatCard from "../../utils/Dashboard/ModernStatCard";
import TopSellingDishes from "../../utils/Dashboard/TopSellingDishes";
import TopCustomersCard from "../../utils/Dashboard/TopCustomersCard";
import apiClient from "../../utils/AxiosInstance";
import { checkAccess, setTitle } from "../../utils/utility";
import { ModuleName, SKELETON_THEME } from "../../utils/common/constant";
import { useDarkMode } from "../../context/DarkModeProvider";
import NewDateRangePicker from "../../utils/common/NewDateRangePicker";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { useAuth } from "../../context/AuthProvider";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

// Global unified helper
const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Dashboard() {
  setTitle("Dashboard");
  const { isDarkMode } = useDarkMode();
  const { configData } = useConfigs();
  const { userData } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [revenueFilter, setRevenueFilter] = useState<'weekly' | 'monthly'>('monthly');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(),
    endDate: new Date(),
  });

  const calculateDateRange = useCallback((selectedPeriod: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let start: Date;
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (selectedPeriod === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (selectedPeriod === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === 'month') {
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === 'year') {
      start = new Date(now);
      start.setDate(now.getDate() - 364);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now);
    }

    return { startDate: start, endDate: end };
  }, []);

  const initialData = useMemo(() => ({
    totalOrders: { count: 0, growthRate: 0, trend: "same" },
    totalSales: {
      amount: 0,
      currency: { _id: "", code: configData?.currency?.code, symbol: configData?.currency?.symbol || "₹" },
      growthRate: 0,
      trend: "same",
    },
    cancelledOrders: { count: 0, growthRate: 0, trend: "same" },
    totalRevenue: {
      amount: 0,
      currency: { _id: "", code: configData?.currency?.code, symbol: configData?.currency?.symbol || "$" },
      growthRate: 0,
      trend: "same",
    },
    revenues: {
      month: { chart: [], total: 0, average: 0, growth: 0, trend: "same" },
      week: { chart: [], total: 0, average: 0, growth: 0, trend: "same" },
    },
    topDishes: { items: [], overall: { overallGrowthRate: 0, overallTrend: "same" } },
    topCustomers: { items: [], overall: null }
  }), []);

  const [dashboardDetail, setDashboardDetail] = useState<any>(initialData);
  const currencySymbol = dashboardDetail?.totalRevenue?.currency?.symbol || "₹";

  const handlePeriodChange = (selectedPeriod: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    setPeriod(selectedPeriod);
    if (selectedPeriod !== 'custom') {
      const newRange = calculateDateRange(selectedPeriod);
      setDateRange(newRange);
    }
  };

  const getDashboardDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const paramsBase: any = {};

      if (period !== "custom") {
        paramsBase.period = period;
      }

      if (dateRange.startDate && dateRange.endDate) {
        paramsBase.startDate = toLocalYMD(dateRange.startDate);
        paramsBase.endDate = toLocalYMD(dateRange.endDate);
      }

      // Execute network requests in parallel
     const res = await apiClient.get("/dashboard/new", {
  params: paramsBase
});

setDashboardDetail(res.data.data);

      const completedData = (res?.data?.success || res?.data?.status) ? res.data.data : null;
      const cancelledData = (res?.data?.success || res?.data?.status) ? res.data.data : null;
      const baseData = (res?.data?.success || res?.data?.status) ? res.data.data : null;

      // Merge data properties cleanly
      const merged: any = {
        // Total Orders, Revenue charts, Top Dishes and Customers now safely fall back to the statusless base data query
        totalOrders: baseData?.totalOrders || { count: 0, growthRate: 0, trend: "same" },
        cancelledOrders: cancelledData?.cancelledOrders || baseData?.cancelledOrders || { count: 0, growthRate: 0, trend: "same" },
        totalSales: completedData?.totalSales || baseData?.totalSales || { amount: 0, growthRate: 0, trend: "same" },
        totalRevenue: baseData?.totalRevenue || completedData?.totalRevenue || { amount: 0, growthRate: 0, trend: "same" },
        revenues: baseData?.revenues || completedData?.revenues || { month: { chart: [] }, week: { chart: [] } },
        topDishes: baseData?.topDishes || completedData?.topDishes || { items: [] },
        topCustomers: baseData?.topCustomers || completedData?.topCustomers || { items: [] }
      };

      setDashboardDetail(merged);
    } catch (error) {
      console.error("Dashboard Fetch Error: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [period, dateRange]);

  useEffect(() => {
    getDashboardDetail();
  }, [getDashboardDetail]);

  const effectiveRange = useMemo(() => {
    return period === "custom" ? dateRange : calculateDateRange(period as any);
  }, [period, dateRange, calculateDateRange]);

  const LINKS = useMemo(() => {
    const hasOrderAccess = checkAccess(ModuleName.ORDERS, userData);
    let baseOrdersLink = "#";

    if (hasOrderAccess && effectiveRange?.startDate && effectiveRange?.endDate) {
      const startYMD = toLocalYMD(effectiveRange.startDate);
      const endYMD = toLocalYMD(effectiveRange.endDate);
      baseOrdersLink = `/order/1?fromDate=${startYMD}&toDate=${endYMD}`;
    } else if (hasOrderAccess) {
      baseOrdersLink = "/order";
    }

    return {
      ordersBase: baseOrdersLink,
      ordersCompleted: baseOrdersLink !== "#" ? `${baseOrdersLink}&status=completed` : "#",
      ordersCancelled: baseOrdersLink !== "#" ? `${baseOrdersLink}&status=cancelled` : "#",
      ordersCompletedHold: baseOrdersLink !== "#" ? `${baseOrdersLink}&status=cancelled,completed,hold` : "#",
    };
  }, [effectiveRange, userData]);

  // Memoized Chart Data Mappings
  const weeklyRevenueData = useMemo(() => {
    const chartData = dashboardDetail?.revenues?.week?.chart || [];
    return {
      labels: chartData.map((item: any) => item.label),
      datasets: [{
        label: "Weekly Revenue",
        data: chartData.map((item: any) => item.revenue),
        backgroundColor: "#8A6B8A",
        borderRadius: 12,
        hoverBackgroundColor: "#6D516D",
      }],
    };
  }, [dashboardDetail]);

  const monthlyRevenueData = useMemo(() => {
    const chartData = dashboardDetail?.revenues?.month?.chart || [];
    return {
      labels: chartData.map((item: any) => item.label),
      datasets: [{
        label: "Monthly Revenue",
        data: chartData.map((item: any) => item.revenue),
        backgroundColor: "#8A6B8A",
        borderRadius: 12,
        hoverBackgroundColor: "#6D516D",
      }],
    };
  }, [dashboardDetail]);

  const currentRevenueData = revenueFilter === 'weekly' ? weeklyRevenueData : monthlyRevenueData;
  const revenueStats = revenueFilter === "weekly" ? dashboardDetail?.revenues?.week : dashboardDetail?.revenues?.month;
  const chartDataList = revenueStats?.chart || [];

  const current = chartDataList[chartDataList.length - 1]?.revenue || 0;
  const prev = chartDataList[chartDataList.length - 2]?.revenue || 0;

  const displayGrowth = useMemo(() => {
    if (prev > 0 && current === 0) return "No Sales";
    if (prev === 0 && current > 0) return "New Sales";
    return `${revenueStats?.growth ?? 0}%`;
  }, [prev, current, revenueStats?.growth]);

  const barOptions: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        appendTo: document.body,
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        titleColor: isDarkMode ? '#FFFFFF' : '#111827',
        bodyColor: isDarkMode ? '#D1D5DB' : '#4B5563',
        padding: 12,
        cornerRadius: 12,
        font: { family: "'Outfit', 'Inter', sans-serif" },
        boxPadding: 6,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += `${currencySymbol}${Number(context.parsed.y).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
        border: { display: false },
        ticks: {
          color: isDarkMode ? '#71717A' : '#94A3B8',
          font: { family: "'Outfit', 'Inter', sans-serif", size: 11, weight: '600' },
          padding: 10
        }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: isDarkMode ? '#A1A1AA' : '#64748B',
          font: { family: "'Outfit', 'Inter', sans-serif", size: 11, weight: '700' },
          padding: 10
        }
      }
    }
  }), [isDarkMode, currencySymbol]);

  const topCustomers = useMemo(() => {
    return (dashboardDetail?.topCustomers?.items ?? []).map((item: any) => ({
      id: item.customerId,
      name: item.customerName,
      image: item.image,
      currency: item?.currency?.symbol,
      orders: item.orderCount,
      totalSpent: item.totalSpent,
      growthRate: item.growthRate,
      trend: item.trend,
    }));
  }, [dashboardDetail]);

  return (
    <div className="p-4 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
        <div>
          <h1 className="text-3xl font-black text-DARK-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-DARK-400 dark:text-DARK-500 font-medium">Monitoring your business performance</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-3">
          {period === "custom" && (
            <NewDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full sm:w-auto"
            />
          )}

          <Dropdown
            label=""
            dismissOnClick={true}
            renderTrigger={() => (
              <button className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-DARK-600 shadow-sm transition-all duration-200 hover:border-BRAND-500 focus:border-BRAND-500 focus:ring-1 focus:ring-BRAND-500 dark:border-DARK-600 dark:bg-DARK-800 dark:text-DARK-200">
                <span className="capitalize">{period}</span>
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          >
            <Dropdown.Item onClick={() => handlePeriodChange("today")}>Today</Dropdown.Item>
            <Dropdown.Item onClick={() => handlePeriodChange("week")}>Last Week</Dropdown.Item>
            <Dropdown.Item onClick={() => handlePeriodChange("month")}>Last Month</Dropdown.Item>
            <Dropdown.Item onClick={() => handlePeriodChange("year")}>Last Year</Dropdown.Item>
            <Dropdown.Item onClick={() => handlePeriodChange("custom")}>Custom</Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(275px,1fr))] gap-4 px-4">
        <ModernStatCard
          isLoading={isLoading}
          icon={FaShoppingCart}
          title="Total Sales"
          value={
            Number(dashboardDetail?.totalSales?.amount ?? 0) > 0
              ? `${dashboardDetail?.totalSales?.currency?.symbol}${Number(dashboardDetail?.totalSales?.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${dashboardDetail?.totalSales?.currency?.symbol} 0.00`
          }
          trendValue={dashboardDetail?.totalSales?.growthRate ?? 0}
          trendDirection={dashboardDetail?.totalSales?.trend ?? "same"}
          to={LINKS.ordersCompleted}
          isDarkMode={isDarkMode}
        />
        <ModernStatCard
          isLoading={isLoading}
          icon={FaInbox}
          title="Total Order"
          value={dashboardDetail?.totalOrders?.count ?? 0}
          trendValue={dashboardDetail?.totalOrders?.growthRate ?? 0}
          trendDirection={dashboardDetail?.totalOrders?.trend ?? "same"}
          to={LINKS.ordersBase}
          isDarkMode={isDarkMode}
        />
        <ModernStatCard
          isLoading={isLoading}
          icon={TbTransactionDollar}
          title="Total Revenue"
          value={`${dashboardDetail?.totalRevenue?.currency?.symbol} ${Number(dashboardDetail?.totalRevenue?.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trendValue={dashboardDetail?.totalRevenue?.growthRate ?? 0}
          trendDirection={dashboardDetail?.totalRevenue?.trend ?? "same"}
          to={LINKS.ordersCompleted}
          isDarkMode={isDarkMode}
        />
        <ModernStatCard
          isLoading={isLoading}
          icon={MdOutlineCancel}
          title="Cancelled Orders"
          value={dashboardDetail?.cancelledOrders?.count ?? 0}
          trendValue={dashboardDetail?.cancelledOrders?.growthRate ?? 0}
          trendDirection={dashboardDetail?.cancelledOrders?.trend ?? "down"}
          to={LINKS.ordersCancelled}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4">
        <div className="min-w-[275px] xl:order-1 md:order-1">
          <TopCustomersCard
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            customers={topCustomers}
            currency=""
            overall={dashboardDetail?.topCustomers?.overall}
          />
        </div>

        <div className="min-w-0 xl:order-2 md:order-3 xl:col-span-1 md:col-span-2">
          {isLoading ? (
            <SkeletonTheme
              baseColor={isDarkMode ? SKELETON_THEME.dark.baseColor : SKELETON_THEME.light.baseColor}
              highlightColor={isDarkMode ? SKELETON_THEME.dark.highlightColor : SKELETON_THEME.light.highlightColor}
              borderRadius={24}
            >
              <Skeleton count={1} height={424} className="rounded-[2.5rem]" />
            </SkeletonTheme>
          ) : (
            <div className="bg-white dark:bg-DARK-800 border border-gray-100 dark:border-DARK-700 rounded-2xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-DARK-900 dark:text-white tracking-tight">Revenue</h2>
                  <p className="text-xs text-DARK-400 dark:text-DARK-500 font-medium mt-0.5">Business growth analytics</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-DARK-700/50 rounded-2xl border border-gray-100 dark:border-DARK-600/50 backdrop-blur-sm">
                  <button
                    onClick={() => setRevenueFilter('weekly')}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-300 cursor-pointer ${revenueFilter === 'weekly'
                      ? "bg-white dark:bg-DARK-600 text-BRAND-600 dark:text-white shadow-md border border-gray-100"
                      : "text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-DARK-700"
                      }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setRevenueFilter('monthly')}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-300 cursor-pointer ${revenueFilter === 'monthly'
                      ? "bg-white dark:bg-DARK-600 text-BRAND-600 dark:text-white shadow-md border border-gray-100"
                      : "text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-DARK-700"
                      }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* AFTER */}
              <div className="flex-1 min-h-[200px] relative pointer-events-auto" style={{ zIndex: 1 }}>
                <Bar data={currentRevenueData} options={barOptions} />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 dark:border-DARK-700/50 grid grid-cols-3 gap-4">
                <div className="flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-DARK-400 dark:text-DARK-500 uppercase tracking-widest mb-1.5">Total got</span>
                  <span
                    className="text-lg sm:text-xl font-black text-DARK-900 dark:text-white truncate tracking-tight"
                    title={`${currencySymbol}${Number(revenueStats?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  >
                    {currencySymbol}{Number(revenueStats?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-DARK-400 dark:text-DARK-500 uppercase tracking-widest mb-1.5">
                    {revenueFilter === 'weekly' ? 'Avg. Weekly' : 'Avg. Monthly'}
                  </span>
                  <span
                    className="text-lg sm:text-xl font-black text-DARK-900 dark:text-white truncate tracking-tight"
                    title={`${currencySymbol}${Number(revenueStats?.average || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  >
                    {currencySymbol}{Number(revenueStats?.average || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-DARK-400 dark:text-DARK-500 uppercase tracking-widest mb-1.5">Growth</span>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <span className="text-lg sm:text-xl font-black truncate tracking-tight" title={displayGrowth}>
                      {displayGrowth}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-[275px] xl:order-3 md:order-2">
          <TopSellingDishes
            currencySymbol={currencySymbol}
            isDarkMode={isDarkMode}
            isLoading={isLoading}
            dishes={dashboardDetail?.topDishes?.items?.map((item: any) => ({
              id: item.productId,
              name: item.productName,
              category: item.categoryName,
              image: item.image,
              quantity: item.totalQuantity,
              price: item.totalAmount,
              percentage: item.quantityGrowthRate,
              trendDirection: item.quantityTrend,
              revenueGrowth: item.revenueGrowthRate,
            })) || []}
            overall={dashboardDetail?.topDishes?.overall?.overallGrowthRate ?? 0}
            overallTrend={dashboardDetail?.topDishes?.overall?.overallTrend}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;