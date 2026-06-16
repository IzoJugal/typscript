import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { languages } from '../utils/common/constant';

export type LanguageCode = typeof languages[number]['code'];

export interface LanguageContextType {
    languageCode: LanguageCode;
    setLanguage: (langCode: LanguageCode) => void;
    toggleLanguage: () => void;
    languageObject: (typeof languages)[number];
    allLanguages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const defaultLanguage = localStorage.getItem('language') as LanguageCode | null;
    const [languageCode, setLanguageCode] = useState<LanguageCode>(defaultLanguage || 'en');

    useEffect(() => {
        localStorage.setItem('language', languageCode);
    }, [languageCode]);

    const setLanguage = (langCode: LanguageCode) => {
        setLanguageCode(langCode);
    };

    const toggleLanguage = () => {
        // Rotate through the list instead of just EN <-> ES
        const currentIndex = languages.findIndex(l => l.code === languageCode);
        const nextIndex = (currentIndex + 1) % languages.length;
        setLanguageCode(languages[nextIndex].code);
    };

    const languageObject = languages.find(l => l.code === languageCode)!;

    return (
        <LanguageContext.Provider
            value={{
                languageCode,
                setLanguage,
                toggleLanguage,
                languageObject,
                allLanguages: languages,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
