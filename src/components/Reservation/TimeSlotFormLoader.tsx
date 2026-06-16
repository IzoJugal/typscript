import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { useDarkMode } from "../../context/DarkModeProvider";

const TimeSlotFormLoader = () => {
    const { isDarkMode } = useDarkMode();

    const baseColor = isDarkMode ? "#1C1C1E" : "#F3F4F6";
    const highlightColor = isDarkMode ? "#2C2C2E" : "#E5E7EB";

    return (
        <SkeletonTheme
            baseColor={baseColor}
            highlightColor={highlightColor}
            borderRadius={12}
            duration={1.5}
        >
            <div className="bg-white dark:bg-DARK-800 border-0 dark:border-0 rounded-2xl shadow-sm p-8 space-y-10 animate-in fade-in duration-500">
                <div className="space-y-6">
                    {/* Hero Section */}
                    <div className="space-y-4">
                        <Skeleton height={100} width="100%" className="rounded-2xl" />
                        <Skeleton height={28} width="30%" className="rounded-lg" />
                    </div>

                    {/* Setting Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-4 p-5 bg-gray-50/50 dark:bg-DARK-950/20 rounded-2xl border border-gray-100 dark:border-DARK-700/50">
                                <Skeleton height={16} width="60%" className="rounded" />
                                <Skeleton height={48} width="100%" className="rounded-xl" />
                            </div>
                        ))}
                    </div>

                    {/* Sub-sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="space-y-5 p-6 bg-white dark:bg-DARK-800 rounded-2xl border border-gray-100 dark:border-DARK-700 shadow-sm">
                                <div className="space-y-2">
                                    <Skeleton height={22} width="40%" className="rounded-lg" />
                                    <Skeleton height={12} width="80%" className="rounded" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[...Array(i === 0 ? 3 : 2)].map((__, j) => (
                                        <Skeleton key={j} height={48} className="rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Interactive List Section */}
                    <div className="p-6 bg-gray-50/30 dark:bg-DARK-950/20 rounded-2xl border border-gray-100 dark:border-DARK-700/50 space-y-5">
                        <Skeleton height={24} width="20%" className="rounded-lg" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex flex-col space-y-3 bg-white dark:bg-DARK-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-DARK-700/40">
                                    <Skeleton height={32} width="50%" className="rounded-lg" />
                                    <Skeleton height={14} width="30%" className="rounded" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Long Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-DARK-800 rounded-2xl border border-gray-100 dark:border-DARK-700 shadow-sm space-y-4">
                                <Skeleton height={22} width="35%" className="rounded-lg" />
                                <div className="space-y-3">
                                    {[...Array(3)].map((__, j) => (
                                        <Skeleton key={j} height={44} className="rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Area */}
                    <div className="pt-6 border-t border-gray-50 dark:border-DARK-700/50">
                        <Skeleton height={48} width="160px" className="rounded-xl shadow-sm" />
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
}

export default TimeSlotFormLoader;

