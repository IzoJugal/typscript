import React from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { Link } from 'react-router-dom';
import { SKELETON_THEME } from '../common/constant';

function DashboardCard({ icon: Icon, title, value, to, isLoading, isDarkMode }: Readonly<{ icon: React.ElementType; title: string; value: number, to: string, isLoading: boolean, isDarkMode: boolean }>) {
    const theme = isDarkMode ? SKELETON_THEME.dark : SKELETON_THEME.light;
    return (
        <>
            {isLoading ? (
                <SkeletonTheme
                    baseColor={theme.baseColor}
                    highlightColor={theme.highlightColor}
                    borderRadius={12}
                >
                    <Skeleton count={1} height={175} className="my-1 rounded-xl" />
                </SkeletonTheme>
            ) : (
                <Link to={to} className="block group">
                    <div className="relative bg-white dark:bg-DARK-800 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-DARK-700 rounded-2xl p-6 h-40 overflow-hidden transform transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_-20px_rgba(138,107,138,0.15)] dark:group-hover:border-BRAND-500/20">
                        {/* Decorative Background Elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-BRAND-50 dark:bg-BRAND-900/10 rounded-full blur-3xl opacity-60 group-hover:bg-BRAND-100 transition-colors duration-500"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gray-50 dark:bg-DARK-950/20 rounded-full blur-3xl opacity-60"></div>
                        
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-DARK-400 dark:text-DARK-500">
                                    {title}
                                </h2>
                                <div className="p-3 bg-BRAND-50 dark:bg-DARK-700 rounded-xl text-BRAND-600 group-hover:scale-110 group-hover:bg-BRAND-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <Icon size={22} />
                                </div>
                            </div>
                            
                            <div className="flex items-baseline gap-1">
                                <p className="text-4xl sm:text-5xl font-black text-DARK-900 dark:text-white tracking-tight">
                                    {value}
                                </p>
                                <div className="w-1.5 h-1.5 bg-BRAND-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </Link>
            )}
        </>
    );

}

export default DashboardCard