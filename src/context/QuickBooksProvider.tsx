
import { ReactNode, createContext, useContext } from "react";
import { useSessionStorage } from "../hooks/UseSessionStorage";

interface QuickBooksContextType {
  quickBooksData: any;
  setQuickBooksData: React.Dispatch<React.SetStateAction<any>> | undefined;
  removeQuickBooksData: () => void;
}

interface ProviderType {
  children: ReactNode;
}

const QuickBooksContext = createContext<QuickBooksContextType | null>(null);

export const QuickBooksProvider: React.FC<ProviderType> = ({ children }) => {
  const [quickBooksData, setQuickBooksData, removeQuickBooksData] = useSessionStorage("quickBooks", "");
  return (
    <QuickBooksContext.Provider value={{ quickBooksData, setQuickBooksData, removeQuickBooksData }}>
      {children}
    </QuickBooksContext.Provider>
  );
};

export const useQuickBooks = () => {
  const QuickBooks: any = useContext(QuickBooksContext);
  return QuickBooks;
};