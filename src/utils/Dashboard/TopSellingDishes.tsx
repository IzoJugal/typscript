import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { SKELETON_THEME } from '../common/constant';
import { BsArrowUpRight } from 'react-icons/bs';
import { LuTrendingUp, LuTrendingDown, LuMinus } from 'react-icons/lu';
import { FaUtensils } from 'react-icons/fa';

interface Dish {
    name: string;
    price: string | number;
    image?: string;
    percentage: number;
    trendDirection: 'up' | 'down';
}

interface TopSellingDishesProps {
    dishes: Dish[];
    isLoading: boolean;
    isDarkMode: boolean;
    currencySymbol: string;
    overall: number;
    overallTrend?: string;
}

const TopSellingDishes: React.FC<TopSellingDishesProps> = ({
    dishes,
    isLoading,
    isDarkMode,
    currencySymbol,
    overall,
    overallTrend
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

    return (
        <div className="bg-white dark:bg-DARK-800 border border-gray-100 dark:border-DARK-700 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-DARK-900 dark:text-white tracking-tight">Top selling dishes</h2>
                     <div className={`flex items-center gap-1.5 mt-0.5 font-bold ${
                         overallTrend === 'up' ? 'text-emerald-500' :
                         overallTrend === 'down' ? 'text-red-500' :
                         'text-gray-500'
                     }`}>
                         {overallTrend === 'up' ? <LuTrendingUp size={14} /> :
                          overallTrend === 'down' ? <LuTrendingDown size={14} /> :
                          <LuMinus size={14} />}
                         <span className="text-xs">{overall}</span>
                         <span className="text-[11px] text-DARK-400 dark:text-DARK-500 font-medium ml-0.5 whitespace-nowrap">more frequent orders</span>
                     </div>
                </div>
                <div className="p-2 sm:p-3 bg-BRAND-50 dark:bg-DARK-700/50 rounded-full text-BRAND-600 shadow-sm shrink-0">
                    <BsArrowUpRight size={18} className="sm:w-5 sm:h-5" strokeWidth={0.5} />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {dishes.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center py-8">
                        <div>
                            <FaUtensils size={24} className="text-DARK-300 dark:text-DARK-500 mx-auto mb-2" />
                            <p className="text-sm text-DARK-500 dark:text-DARK-400">No dishes sold in this period</p>
                        </div>
                    </div>
                ) : (
                dishes.map((dish, i) => (
                    <div
                        key={i}
                        className="group flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-DARK-900/40 border border-transparent hover:border-BRAND-500/20 hover:bg-white dark:hover:bg-DARK-800 transition-all duration-300"
                    >
                        {/* Dish Image */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-DARK-700 border border-gray-100 dark:border-DARK-600 flex items-center justify-center shrink-0">
                            {dish.image !=null && dish.image !="" ? (
                                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                            ) : (
                                <FaUtensils size={16} className="text-DARK-300 dark:text-DARK-500" />
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-DARK-900 dark:text-white truncate">
                                {dish.name}
                            </h3>
                        </div>

                        {/* Price & Trend */}
                        <div className="flex flex-col items-end shrink-0">
                            <p className="text-sm sm:text-base font-black text-DARK-900 dark:text-white whitespace-nowrap">
                                {currencySymbol}{Number(dish.price).toLocaleString()}
                            </p>

                             <div
                                 className={`flex items-center gap-1 font-bold mt-1 ${
                                     dish.trendDirection === 'up' ? 'text-emerald-500' :
                                     dish.trendDirection === 'down' ? 'text-red-500' :
                                     'text-gray-500'
                                 }`}
                             >
                                 {dish.trendDirection === 'up' ? (
                                     <LuTrendingUp size={12} />
                                 ) : dish.trendDirection === 'down' ? (
                                     <LuTrendingDown size={12} />
                                 ) : (
                                     <LuMinus size={12} />
                                 )}

                                 <span className="text-[10px] sm:text-xs">
                                     {dish.percentage}%
                                 </span>
                             </div>
                         </div>
                     </div>
                 ))
                )}
            </div>
        </div>
    );
};

export default TopSellingDishes;
