import { useEffect, useState } from "react";

function getSavedValue(key:string, initialValue:any) {
  const savedValue = JSON.parse(localStorage.getItem(key) || "null");
  if (savedValue) return savedValue;

  if (initialValue instanceof Function) return initialValue();

  return initialValue;
}

export const useSessionStorage = (key:string, initialValue:any) => {
  const [isState, setIsState] = useState(() => {
    return getSavedValue(key, initialValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(isState));
  }, [key, isState]);

  const removeItem = (key:string) => {
    if (key) {
      localStorage.removeItem(key);
      setIsState("")
    } 
  };
  return [isState, setIsState,removeItem];
};
