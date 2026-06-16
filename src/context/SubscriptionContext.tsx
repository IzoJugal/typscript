import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useSubscriptionStatus } from '../hooks/SubscriptionStatus';

export interface SubscriptionStatus {
    isActive: boolean;
    isExpired: boolean;
    loading: boolean;
    error: string | null;
}

interface SubscriptionContextType extends SubscriptionStatus {
    refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userData } = useAuth();
    const {
        isActive,
        isExpired,
        refreshStatus,
        loading,
        error,
    } = useSubscriptionStatus();

    useEffect(() => {
        refreshStatus();
    }, [
        refreshStatus,
        userData?.activePlan,
        userData?.updatedAt,
        location.pathname,
    ]);

    return (
        <SubscriptionContext.Provider
            value={{
                isActive,
                isExpired,
                refreshStatus,
                loading,
                error,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = (): SubscriptionContextType => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};