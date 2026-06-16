import React from "react";

interface FormLoaderProps {
  count?: number;
}

const TenderFormLoader: React.FC<FormLoaderProps> = ({ count = 1 }) => {
  return (
    <div className="p-6 space-y-6 animate-pulse dark:bg-DARK-800">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-5">
          {/* Title */}
          <div className="h-6 w-40 rounded-md bg-DARK-200 dark:bg-DARK-700" />

          {/* Input Fields */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <div className="h-4 w-28 rounded bg-DARK-200 dark:bg-DARK-700" />
                <div className="h-11 w-full rounded-lg bg-DARK-100 dark:bg-DARK-700" />
              </div>
            ))}
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded bg-DARK-200 dark:bg-DARK-700" />
            <div className="h-4 w-40 rounded bg-DARK-200 dark:bg-DARK-700" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <div className="h-10 w-28 rounded-lg bg-DARK-200 dark:bg-DARK-700" />
            <div className="h-10 w-28 rounded-lg bg-DARK-300 dark:bg-DARK-600" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TenderFormLoader;