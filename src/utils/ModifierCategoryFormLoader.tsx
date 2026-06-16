interface FormLoaderProps {
  count?: number;
}

const ModifierCategoryFormLoader = ({ count = 1 }: FormLoaderProps) => {
  return (
    <div className="space-y-6 data-testid-form-loader">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-6">
          {/* Two column grid simulation for Company and Restaurant selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-DARK-700 rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 dark:bg-DARK-700 rounded-xl w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-DARK-700 rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 dark:bg-DARK-700 rounded-xl w-full"></div>
            </div>
          </div>

          {/* Text/Input block simulation for Name Field */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-DARK-700 rounded w-1/6"></div>
            <div className="h-10 bg-slate-200 dark:bg-DARK-700 rounded-md w-full"></div>
          </div>

          {/* Radio status button row simulation */}
          <div className="flex items-center space-x-4 pt-2">
            <div className="h-4 bg-slate-200 dark:bg-DARK-700 rounded w-12"></div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-slate-200 dark:bg-DARK-700 rounded-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-DARK-700 rounded w-16"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-slate-200 dark:bg-DARK-700 rounded-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-DARK-700 rounded w-20"></div>
            </div>
          </div>

          {/* Action buttons footer simulation */}
          <div className="flex justify-end gap-4 pt-4">
            <div className="h-10 bg-slate-200 dark:bg-DARK-700 rounded-lg w-full max-w-[150px]"></div>
            <div className="h-10 bg-slate-200 dark:bg-DARK-700 rounded-lg w-full max-w-[150px]"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModifierCategoryFormLoader;