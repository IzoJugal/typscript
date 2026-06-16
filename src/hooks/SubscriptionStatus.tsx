import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthProvider';
import apiClient from '../utils/AxiosInstance';

export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  loading: boolean;
  error: string | null;
}

interface UseSubscriptionStatusReturn extends SubscriptionStatus {
  refreshStatus: () => Promise<void>;
}

export const useSubscriptionStatus = (): UseSubscriptionStatusReturn => {
  const { userData } = useAuth();

  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isExpired: false,
    loading: true,
    error: null,
  });

  const checkSubscriptionStatus = useCallback(async () => {
    setStatus((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    const roleName = userData?.staffMember?.role?.name;
    const isSuperAdmin =
      roleName?.toLowerCase()?.trim() === 'super admin';

    if (isSuperAdmin) {
      setStatus({
        isActive: true,
        isExpired: false,
        loading: false,
        error: null,
      });
      return;
    }

    const companyId =
      userData?.companyId ||
      userData?.staffMember?.company?._id;

    if (!companyId) {
      setStatus({
        isActive: false,
        isExpired: true,
        loading: false,
        error: 'No company ID available',
      });
      return;
    }

    try {
      const response = await apiClient.get(
        `/subscription/active/${companyId}`
      );

      if (response.data.success) {
        const plan = response.data.data.plan;

        if (!plan) {
          setStatus({
            isActive: false,
            isExpired: true,
            loading: false,
            error: null,
          });
          return;
        }

        const isExpired =
          plan.subscriptionEnd &&
          new Date(plan.subscriptionEnd) < new Date();

        setStatus({
          isActive: !isExpired,
          isExpired: !!isExpired,
          loading: false,
          error: null,
        });
      } else {
        setStatus({
          isActive: false,
          isExpired: true,
          loading: false,
          error: 'Failed to fetch subscription data',
        });
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);

      setStatus({
        isActive: false,
        isExpired: true,
        loading: false,
        error: 'Error fetching subscription status',
      });
    }
  }, [
    userData?.companyId,
    userData?.staffMember?.company?._id,
    userData?.staffMember?.role?.name,
  ]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [
    checkSubscriptionStatus,
    userData?.activePlan,
    userData?.updatedAt,
    location.pathname,
  ]);

  return {
    ...status,
    refreshStatus: checkSubscriptionStatus,
  };
};