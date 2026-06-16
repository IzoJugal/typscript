import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useDarkMode } from '../../context/DarkModeProvider';

const ReportLoader = () => {
    const { isDarkMode } = useDarkMode();
    return (
        <div className="p-8">
            <SkeletonTheme baseColor={isDarkMode ? "#212529" : "#F1E9EE"}
                highlightColor={isDarkMode ? "#343A40" : "#F9F5F7"} width="100%">
                {/* Header Skeleton */}
                <Skeleton height={40} className="mb-6" />

                {/* Filters Section Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Skeleton height={40} />
                    <Skeleton height={40} />
                    <Skeleton height={40} />
                    <Skeleton height={40} />
                </div>

                {/* Pie Chart Skeleton */}
                <div className="flex justify-center mb-8">
                    <Skeleton circle={true} height={256} width={256} />
                </div>

                {/* Summary Table Skeleton */}
                <Skeleton height={40} className="mb-4" />
                <Skeleton count={5} height={60} className="my-1" />
            </SkeletonTheme>
        </div>
    );
};

export default ReportLoader;
