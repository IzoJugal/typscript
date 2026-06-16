import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { SKELETON_THEME } from '../common/constant';
import { BsArrowUpRight } from 'react-icons/bs';
import { LuTrendingUp, LuTrendingDown, LuMinus } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';

interface Customer {
    _id: string;
    userName: string;
    image?: string;
}

interface TopCustomersCardProps {
    customers: Customer[];
    isLoading: boolean;
    isDarkMode: boolean;
    overall: {
        overallGrowthRate: number;
    };
    currency: string;
}

const TopCustomersCard: React.FC<TopCustomersCardProps> = ({
    customers,
    isLoading,
    isDarkMode,
    overall
}) => {
    const theme = isDarkMode ? SKELETON_THEME.dark : SKELETON_THEME.light;

    if (isLoading) {
        return (
            <SkeletonTheme
                baseColor={theme.baseColor}
                highlightColor={theme.highlightColor}
                borderRadius={24}
            >
                <Skeleton count={1} height={424} className="rounded-[2.5rem]" />
            </SkeletonTheme>
        );
    }

    // Mock data for the customer list as seen in the mockup
    const customerList =
        customers?.map((item: any) => ({
            id: item.customerId,
            name: item.name,
            spent: item.totalSpent ?? 0,
            percentage: item.growthRate ?? 0,
            currency: item.currency || "$", // fallback since API doesn't send it
            image: item.image ?? null
        })) || [];

    return (
        <div className="bg-white dark:bg-DARK-800 border border-gray-100 dark:border-DARK-700 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full relative overflow-hidden group">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-DARK-900 dark:text-white tracking-tight">Top customers</h2>
                    <div className="flex items-center gap-1.5 mt-0.5 text-emerald-500 font-bold">
                        <LuTrendingUp size={14} />
                        <span className="text-xs">{overall?.overallGrowthRate ?? 0}%</span>
                        <span className="text-[11px] text-DARK-400 dark:text-DARK-500 font-medium ml-0.5">
                            more spending
                        </span>
                    </div>
                </div>
                <div className="p-2 sm:p-3 bg-BRAND-50 dark:bg-DARK-700/50 rounded-full text-BRAND-600 shadow-sm shrink-0">
                    <BsArrowUpRight size={18} className="sm:w-5 sm:h-5" strokeWidth={0.5} />
                </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {customerList.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center py-8">
                        <div>
                            <FaUserCircle size={24} className="text-DARK-300 dark:text-DARK-500 mx-auto mb-2" />
                            <p className="text-sm text-DARK-500 dark:text-DARK-400">No customers in this period</p>
                        </div>
                    </div>
                ) : (
                customerList.map((customer, i) => (
                    <div
                        key={i}
                        className="group flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/50 dark:bg-DARK-900/40 border border-transparent hover:border-BRAND-500/20 hover:bg-white dark:hover:bg-DARK-800 transition-all duration-300"
                    >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white dark:bg-DARK-700 border border-gray-100 dark:border-DARK-600 flex items-center justify-center shrink-0">
                            {customer?.image != null ? (
                                <img src={customer?.image} alt={customer.name} className="w-full h-full object-cover" />
                            ) : (
                                <FaUserCircle size={24} className="text-DARK-300 dark:text-DARK-500" />
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-DARK-900 dark:text-white truncate">
                                {customer.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-DARK-900 dark:text-white leading-none whitespace-nowrap">{customer.currency}{customer.spent.toLocaleString()}</span>
                                <div className={`flex items-center gap-0.5 font-bold ${
                                    customer.percentage > 0 ? 'text-emerald-500' :
                                    customer.percentage < 0 ? 'text-red-500' :
                                    'text-gray-500'
                                }`}>
                                    {customer.percentage > 0 ? <LuTrendingUp size={10} /> :
                                     customer.percentage < 0 ? <LuTrendingDown size={10} /> :
                                     <LuMinus size={10} />}
                                    <span className="text-[9px] leading-none">{Math.abs(customer.percentage)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* <div className="p-1.5 bg-gray-100 dark:bg-DARK-700 rounded-lg group-hover:bg-BRAND-500 group-hover:text-white transition-colors duration-300">
                             <BsArrowUpRight size={12} />
                         </div> */}
                    </div>
                ))
                )}
            </div>
        </div>
    );
};

export default TopCustomersCard;
