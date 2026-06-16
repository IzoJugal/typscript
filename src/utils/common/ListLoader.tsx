import Skeleton, { SkeletonTheme } from "react-loading-skeleton"
import { useDarkMode } from "../../context/DarkModeProvider";

const ListLoader = () => {
    const { isDarkMode } = useDarkMode();
    return (
        <SkeletonTheme
            baseColor={isDarkMode ? "#212529" : "#F1E9EE"}
            highlightColor={isDarkMode ? "#343A40" : "#F9F5F7"}
            width="100%"
        >
            <Skeleton count={10} height={80} className="mb-2 rounded-xl" />
        </SkeletonTheme>
    )

    /* return (
        [...Array(10)].map((_, j) => (
            <div
                key={j}
                className="h-20 bg-DARK-600 dark:bg-DARK-700 rounded-xl mb-2 w-full animate-pulse"
            ></div>
        ))
    ); */

}

export default ListLoader
