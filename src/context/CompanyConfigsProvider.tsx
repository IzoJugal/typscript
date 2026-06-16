
import { ReactNode, createContext, useContext } from "react";
import { useSessionStorage } from "../hooks/UseSessionStorage";

interface companyConfigContextType {
  companyConfigs: any;
  setCompanyConfigs: React.Dispatch<React.SetStateAction<any>> | undefined;
  removeCompanyConfig: () => void; 
}

interface SiteConfigsProviderType {
  children: ReactNode;
}

const CompanyConfigsContext = createContext<companyConfigContextType | null>(null);

export const CompanyConfigsProvider: React.FC<SiteConfigsProviderType> = ({ children }) => {
  const [companyConfigs, setCompanyConfigs,removeCompanyConfig] = useSessionStorage("companyConfigs", "");
  return (
    <CompanyConfigsContext.Provider value={{ companyConfigs, setCompanyConfigs,removeCompanyConfig }}>
      {children}
    </CompanyConfigsContext.Provider>
  );
};

export const useCompanyConfigs = () => {
    const CompanyConfigs:any = useContext(CompanyConfigsContext);
    return CompanyConfigs;
  };