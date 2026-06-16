import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useDarkMode } from "../../context/DarkModeProvider";

interface FormLoaderProps {
  count?: number;
}

const FormLoader: React.FC<FormLoaderProps> = ({ count = 1 }) => {
  const { isDarkMode } = useDarkMode();

  const renderFormBlock = (index: number): JSX.Element => (
    <div
      key={`form-block-${index}`}
      className="w-full bg-white dark:bg-DARK-800 dark:border-DARK-700 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 mb-6 last:mb-0"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-2 w-full">
          <Skeleton height={24} width="40%" className="rounded-lg" />
          <Skeleton height={12} width="60%" className="rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Full-width Section */}
        <div className="space-y-3">
          <Skeleton height={14} width="20%" className="rounded opacity-60" />
          <Skeleton height={44} width="100%" className="rounded-xl shadow-inner" />
        </div>

        {/* Dual Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton height={14} width="35%" className="rounded opacity-60" />
            <Skeleton height={44} width="100%" className="rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton height={14} width="30%" className="rounded opacity-60" />
            <Skeleton height={44} width="100%" className="rounded-xl" />
          </div>
        </div>

        {/* Triple Column Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Skeleton height={14} width="40%" className="rounded opacity-60" />
            <Skeleton height={44} width="100%" className="rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton height={14} width="35%" className="rounded opacity-60" />
            <Skeleton height={44} width="100%" className="rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton height={14} width="25%" className="rounded opacity-60" />
            <Skeleton height={44} width="100%" className="rounded-xl" />
          </div>
        </div>

        {/* Large Content Section */}
        <div className="space-y-3">
          <Skeleton height={14} width="25%" className="rounded opacity-60" />
          <Skeleton height={120} width="100%" className="rounded-2xl" />
        </div>

        {/* Controls Section */}
        <div className="pt-4 border-t border-gray-50 dark:border-DARK-700/50">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Skeleton circle height={20} width={20} />
              <Skeleton height={14} width={80} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton circle height={20} width={20} />
              <Skeleton height={14} width={100} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton circle height={20} width={20} />
              <Skeleton height={14} width={70} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton height={44} width={120} className="rounded-xl" />
          <Skeleton height={44} width={140} className="rounded-xl" />
        </div>
      </div>
    </div>
  );

  const blocks: JSX.Element[] = Array.from({ length: count }, (_, index) =>
    renderFormBlock(index)
  );

  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1C1C1E" : "#F3F4F6"}
      highlightColor={isDarkMode ? "#2C2C2E" : "#E5E7EB"}
      borderRadius={12}
      duration={1.5}
    >
      <div className="w-full animate-in fade-in duration-500">
        {blocks}
      </div>
    </SkeletonTheme>
  );
};

export default FormLoader;
