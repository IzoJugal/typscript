import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

const DashboardSkeleton: React.FC = () => {
  const skeletonCard = () => {
    return (
      <SkeletonTheme
        baseColor="#f5ede1"
        highlightColor="#fff"
        borderRadius={20}
      >
        <Skeleton count={1} height={175} className="my-1" />
      </SkeletonTheme>
    );
  };

  return (
    <>
      {/* Toggle buttons skeleton */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        <SkeletonTheme
          baseColor="#f5ede1"
          highlightColor="#fff"
          borderRadius={10}
        >
          <Skeleton count={1} height={40} width={200} />
        </SkeletonTheme>
      </div>

      {/* Cards grid skeleton */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index}>
            {skeletonCard()}
          </div>
        ))}
      </div>

      {/* Bottom sections skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4 col-span-1 mb-2 py-2 px-2 md:col-span-2">
        <SkeletonTheme
          baseColor="#f5ede1"
          highlightColor="#fff"
          borderRadius={20}
        >
          <Skeleton count={1} height={380} className="my-1" />
        </SkeletonTheme>
        <SkeletonTheme
          baseColor="#f5ede1"
          highlightColor="#fff"
          borderRadius={20}
        >
          <Skeleton count={1} height={380} className="my-1" />
        </SkeletonTheme>
      </div>
    </>
  );
};

export default DashboardSkeleton;