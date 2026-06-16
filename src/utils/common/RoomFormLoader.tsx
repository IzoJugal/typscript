// utils/common/RoomFormLoader.tsx

import React from "react";

interface FormLoaderProps {
  count?: number;
}

const RoomFormLoader: React.FC<FormLoaderProps> = ({ count = 1 }) => {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-5">
          {/* Top Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-24 bg-DARK-200 dark:bg-DARK-600 rounded mb-2"></div>
              <div className="h-11 w-full bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
            </div>

            <div>
              <div className="h-4 w-24 bg-DARK-200 dark:bg-DARK-600 rounded mb-2"></div>
              <div className="h-11 w-full bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
            </div>
          </div>

          {/* Name + Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-20 bg-DARK-200 dark:bg-DARK-600 rounded mb-2"></div>
              <div className="h-11 w-full bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
            </div>

            <div>
              <div className="h-4 w-28 bg-DARK-200 dark:bg-DARK-600 rounded mb-2"></div>
              <div className="h-11 w-full bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <div className="h-4 w-24 bg-DARK-200 dark:bg-DARK-600 rounded mb-2"></div>
            <div className="h-11 w-full bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>

            <div className="flex flex-wrap gap-2 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-24 bg-DARK-200 dark:bg-DARK-600 rounded-full"
                ></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomFormLoader;