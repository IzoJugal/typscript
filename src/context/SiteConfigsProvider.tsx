import React, { createContext, useContext } from 'react';
import { useSiteConfig, ISiteConfig } from '../hooks/useSiteConfigs';

interface ContextType {
    configData: ISiteConfig | null;
    setConfigData: React.Dispatch<React.SetStateAction<ISiteConfig | null>>;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const SiteConfigContext = createContext<ContextType | undefined>(undefined);

export const ConfigsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // The hook runs here, once, at the very top of your app
    const siteConfigValues = useSiteConfig();

    return (
        <SiteConfigContext.Provider value={siteConfigValues}>
            {children}
        </SiteConfigContext.Provider>
    );
};

// Custom hook to consume the global config data easily
export const useConfigs = () => {
    const context = useContext(SiteConfigContext);
    if (!context) {
        throw new Error("useConfigs must be used within a SiteConfigProvider");
    }
    return context;
};