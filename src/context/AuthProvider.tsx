/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
} from "react";
import { useSessionStorage } from "../hooks/UseSessionStorage";

interface AuthContextType {
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>> | undefined;
  activePlan: any;
  setActivePlan: React.Dispatch<React.SetStateAction<any>> | undefined;
  removeItem: () => void;
}

interface AuthProviderType {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderType> = ({ children }) => {
  const [userData, setUserData, removeItem] = useSessionStorage("user", "");
  const [activePlan, setActivePlan] = useSessionStorage("activePlan", "");
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ userData, setUserData, removeItem, activePlan, setActivePlan }),
    [userData, setUserData, removeItem, activePlan, setActivePlan]
  );
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const Auth: any = useContext(AuthContext);
  return Auth;
};
