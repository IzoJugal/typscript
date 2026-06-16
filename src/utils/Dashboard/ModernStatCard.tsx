import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { Link } from 'react-router-dom';
import { SKELETON_THEME } from '../common/constant';
import { IconType } from 'react-icons';
import { BsArrowUpRight } from 'react-icons/bs';
import { LuTrendingUp, LuTrendingDown } from 'react-icons/lu';

interface ModernStatCardProps {
    title: string;
    value: string | number;
    icon: IconType;
    trendValue?: string | number;
    trendLabel?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    to: string;
    isLoading: boolean;
    isDarkMode: boolean;
}

const ModernStatCard: React.FC<ModernStatCardProps> = ({
    title,
    value,
    icon: Icon,
    trendValue,
    trendLabel = "from last month",
    trendDirection = "up",
    to,
    isLoading,
    isDarkMode,
}) => {
    const theme = isDarkMode ? SKELETON_THEME.dark : SKELETON_THEME.light;

    if (isLoading) {
        return (
            <SkeletonTheme
                baseColor={theme.baseColor}
                highlightColor={theme.highlightColor}
                borderRadius={24}
            >
                <Skeleton count={1} height={160} className="my-1 rounded-3xl" />
            </SkeletonTheme>
        );
    }

    const TrendIcon = trendDirection === 'up' ? LuTrendingUp : LuTrendingDown;
    const trendColorClass = trendDirection === 'up' ? 'text-emerald-500' : trendDirection === 'down' ? 'text-red-500' : 'text-gray-400';

    return (
        <Link to={to} className="block">
            <div className="relative bg-white dark:bg-DARK-800 border border-gray-100 dark:border-DARK-700 rounded-2xl p-5 sm:p-6 h-full flex flex-col justify-between overflow-hidden transition-all duration-300">
                {/* Top Section */}
                <div className="flex items-start gap-3 sm:gap-4 mb-2">
                    {/* Icon Container */}
                    <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-DARK-700 rounded-2xl text-DARK-400 dark:text-white transition-colors duration-300 shrink-0">
                        <Icon size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    
                    {/* Title and Trend */}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-base font-bold text-DARK-900 dark:text-white leading-tight">
                            {title}
                        </h2>
                        {trendValue && (
                            <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 ${trendColorClass}`}>
                                <TrendIcon size={14} className="font-bold shrink-0" />
                                <span className="text-[11px] sm:text-[12px] font-bold">{trendValue}%</span>
                                <span className="text-[10px] sm:text-[11px] text-DARK-400 dark:text-DARK-500 font-medium whitespace-nowrap">
                                    {trendLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex items-end justify-between gap-2 z-5">
                    <p className="text-3xl sm:text-3xl font-black text-DARK-900 dark:text-white tracking-tight truncate leading-none break-all">
                        {value}
                    </p>
                    
                    {/* Action Arrow Button */}
                   <div className="p-2 sm:p-3 bg-BRAND-50 dark:bg-DARK-700/50 rounded-full text-BRAND-600 shadow-sm shrink-0">
                                      <BsArrowUpRight size={18} className="sm:w-5 sm:h-5" strokeWidth={0.5} />
                                  </div>
                </div>

                {/* Decorative Background Glow */}
                {/* <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-BRAND-500/5 rounded-full blur-2xl transition-colors duration-500 pointer-events-none"></div> */}
            </div>
        </Link>
    );
};

export default ModernStatCard;
