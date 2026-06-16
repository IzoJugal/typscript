import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useDarkMode } from "../../context/DarkModeProvider";

const CardLoader = ({ count = 3, rows = 3 }: { count?: number; rows?: number }) => {
    const { isDarkMode } = useDarkMode();
    return (
        <SkeletonTheme baseColor={isDarkMode ? "#212529" : "#F1E9EE"}
            highlightColor={isDarkMode ? "#343A40" : "#F9F5F7"} borderRadius={20} >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="w-full grid grid-cols-1 gap-0">
                        {Array.from({ length: count }).map((_, cardIndex) => (
                            <div
                                key={cardIndex}
                                className="relative p-4"
                            >
                                {/* Skeleton for the entire card */}
                                <Skeleton height={200} width="100%" className="mb-4" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </SkeletonTheme>
    );
};

export default CardLoader;
