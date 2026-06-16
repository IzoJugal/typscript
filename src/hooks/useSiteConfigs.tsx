import { useState, useCallback, useEffect } from 'react';
import apiClient from '../utils/AxiosInstance';
import { toast } from 'react-toastify';

export interface ISiteConfig {
    _id: string;
    siteName: string;
    subTitle: string;
    siteURL: string;
    copyright: string;
    year: number;
    mobile: number;
    metaDescription: string;
    metaKeywords: string;
    address: string;
    email: string;
    designBy: string;
    footerText: string;
    headerLogo: string;
    footerLogo: string;
    favicon: string;
    designByUrl: string;
    playStoreUrl: string;
    appleStoreUrl: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    countryCode: string;
    phoneNumber: string;
    currency: {
        id: string;
        name: string;
        symbol: string;
        code: string;
    };
    dateFormat: string;
    androidIcon: string | null;
    iosIcon: string | null;
}

export const useSiteConfig = () => {
    const [configData, setConfigData] = useState<ISiteConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const getConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/siteConfigs`);
            const { success, data } = response.data;
            if (success) {
                setConfigData(data);
            } else {
                  throw new Error("Failed to fetch configuration");
            }
        } catch (err) {
            console.error(err);
            setError(err as any);
            toast.error((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {  
        getConfig();
    }, [getConfig]);

    // Return the data, status states, and the manual trigger function
    return { configData, setConfigData, isLoading, error, refetch: getConfig };
};