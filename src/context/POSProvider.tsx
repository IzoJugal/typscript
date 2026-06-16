import React, { ReactNode, createContext, useContext, useState } from "react";
import { useIndexedDB } from "../hooks/useIndexedDB";
import { useSessionStorage } from "../hooks/UseSessionStorage";

interface PosRawPayloadType {
  rawPayload: any;
  setRawPayload: React.Dispatch<React.SetStateAction<any>>;
  cart: any;
  setCart: React.Dispatch<React.SetStateAction<any>>;
  tables: any;
  setTables: React.Dispatch<React.SetStateAction<any>>;
  selectedRestaurant: any;
  setSelectedRestaurant: React.Dispatch<React.SetStateAction<any>>;
  selectedCustomer: any;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<any>>;
  posLocalData: any;
  setPosLocalData: React.Dispatch<React.SetStateAction<any>>;
  localApiData: any;
  setLocalApiData: React.Dispatch<React.SetStateAction<any>>;
  searchMenu: any;
  setSearchMenu: React.Dispatch<React.SetStateAction<any>>;
  posDeviceId: any;
  setPosDeviceId: React.Dispatch<React.SetStateAction<any>>;
  currency: any;
  setCurrency: React.Dispatch<React.SetStateAction<any>>;

  clearPOS: () => void;
}

interface POSProviderProps {
  children: ReactNode;
}

const INITIAL_RAW_PAYLOAD = {
  orderType: 'product',
  productOrderType: 'quickService',
  isPay: false,
};
const INITIAL_CART: any[] = [];
const INITIAL_TABLES: any[] = [];
const INITIAL_SELECTED_RESTAURANT = {};
const INITIAL_SELECTED_CUSTOMER = null;
const INITIAL_POS_DATA = {
  customerList: [],
  categories: [],
  products: [],
  subCategories: [],
  selectedCategory: {},
  selectedSubCategory: {},
  recalledOrder: null,
  isCartSummaryExpand: true,
  isOpenPayment: false,
  posDeviceDetails: {},
  allPaymentProviders: [],
  selectedPaymentProvider: { provider: '', terminal: '' },
};

const INITIAL_LOCAL_API_DATA: any[] = [];

const PosRawPayloadContext = createContext<PosRawPayloadType | undefined>(undefined);

export const POSProvider: React.FC<POSProviderProps> = ({ children }) => {
  const [rawPayload, setRawPayload] = useIndexedDB("pos_raw_payload", INITIAL_RAW_PAYLOAD);
  const [cart, setCart] = useIndexedDB("pos_cart", INITIAL_CART);
  const [tables, setTables] = useIndexedDB("pos_tables", INITIAL_TABLES);
  const [selectedRestaurant, setSelectedRestaurant] = useIndexedDB("pos_restaurant", INITIAL_SELECTED_RESTAURANT);
  const [selectedCustomer, setSelectedCustomer] = useIndexedDB("pos_customer", INITIAL_SELECTED_CUSTOMER);
  const [posLocalData, setPosLocalData] = useIndexedDB("pos_data", INITIAL_POS_DATA);
  const [localApiData, setLocalApiData] = useIndexedDB("pos_localApiData", INITIAL_LOCAL_API_DATA);
  const [searchMenu, setSearchMenu] = useIndexedDB("search_menu", '');
  const [posDeviceId, setPosDeviceId] = useSessionStorage("device_id", '');
    const [currency, setCurrency] = useState({
    symbol: "$"
  });

  const clearPOS = () => {
    setRawPayload(INITIAL_RAW_PAYLOAD);
    setCart(INITIAL_CART);
    setTables(INITIAL_TABLES);
    setSelectedCustomer(INITIAL_SELECTED_CUSTOMER);
    setPosLocalData((prev) => ({
      ...INITIAL_POS_DATA,
      selectedPaymentProvider: prev.selectedPaymentProvider,
      allPaymentProviders: prev.allPaymentProviders,
      posDeviceDetails: prev.posDeviceDetails,
    }));
    setSearchMenu('');
  };

  return (
    <PosRawPayloadContext.Provider
      value={{
        rawPayload,
        setRawPayload,
        cart,
        setCart,
        tables,
        setTables,
        selectedRestaurant,
        setSelectedRestaurant,
        selectedCustomer,
        setSelectedCustomer,
        posLocalData,
        setPosLocalData,
        localApiData,
        setLocalApiData,
        searchMenu,
        setSearchMenu,
        posDeviceId,
        setPosDeviceId,
        clearPOS,
        currency,
        setCurrency,
      }}
    >
      {children}
    </PosRawPayloadContext.Provider>
  );
};

export const usePOS = (): PosRawPayloadType => {
  const context = useContext(PosRawPayloadContext);
  if (!context) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
};
