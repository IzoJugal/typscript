import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isButtonLoading: boolean;
  setIsButtonLoading: (loading: boolean) => void;
  saveAnswer: boolean;
  setSaveAnswer: (loading: boolean) => void;
  addQuestion: boolean;
  setAddQuestion: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [saveAnswer, setSaveAnswer] = useState(false);
  const [addQuestion, setAddQuestion] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, isButtonLoading, setIsButtonLoading, saveAnswer, setSaveAnswer, addQuestion, setAddQuestion }}>
      {children}
    </LoadingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
