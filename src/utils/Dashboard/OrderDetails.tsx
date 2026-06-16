import { Button } from 'flowbite-react';
import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';

import { FaShoppingCart } from 'react-icons/fa';
import { checkAccess, formatDate } from '../utility';
import { ModuleName, SKELETON_THEME } from '../common/constant';
import { useConfigs } from "../../context/SiteConfigsProvider";
import { useAuth } from "../../context/AuthProvider";

interface Table {
  _id: string;
  room: string;
  name: string;
  number: number;
  capacity: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Room {
  _id: string;
  name: string;
  size: number;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Modifier {
  _id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  category: string;
}
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string | null;
  applicableTax: string | null;
  sellingPriceTaxType: string | null;
  type: string | null;
  sku: string;
  stock: number;
  isAvailable: boolean;
  modifiers: Modifier[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  _id: string;
  table: {
    table: Table;
    room: Room;
    mergedTables: Table[];
  };
  products: Product[];
  totalPrice: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface Order {
  _id: string;
  amount: number;
  orderTotalAmount: number;
  paymentMethod: string;
  orderName: string;
  paymentType: string;
  status: string;
  customerId: User;
  cartItems: CartItem[];
  orderDate: string;
  company?: {
    name?: string;
    currency?: {
      symbol?: string;
      code?: string;
      label?: string;
    }
  }
}
interface OrderDetailsProps {
  orders: Order[];
  isLoading: boolean,
  isDarkMode: boolean
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orders, isLoading, isDarkMode }) => {
  const navigate = useNavigate();
    const { configData } = useConfigs();
  const { userData } = useAuth();

  const hasAccess = checkAccess(ModuleName.ORDERS, userData);
  const handleOrder = () => {
    if (hasAccess) {
      navigate('/order/1');
    } else {
      navigate('#');
    }
  }

  return (
    <>
      {isLoading ? (
        <SkeletonTheme
          baseColor={isDarkMode ? SKELETON_THEME.dark.baseColor : SKELETON_THEME.light.baseColor}
          highlightColor={isDarkMode ? SKELETON_THEME.dark.highlightColor : SKELETON_THEME.light.highlightColor}
          borderRadius={12}
        >
          <Skeleton count={1} height={394} className="my-1 rounded-xl" />
        </SkeletonTheme>
      ) : (
        <div className="bg-white dark:bg-DARK-800 border border-gray-100 dark:border-DARK-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-base font-bold text-DARK-900 dark:text-white flex items-center gap-2">
                <FaShoppingCart className="text-BRAND-600" /> Orders
              </h2>
              <p className="text-[10px] text-DARK-400 dark:text-DARK-500 font-medium">Recent transactions overview</p>
            </div>
            <Button
              onClick={handleOrder}
              className="!bg-BRAND-50 hover:!bg-BRAND-100 dark:!bg-BRAND-950/40 dark:hover:!bg-BRAND-900/30 !text-BRAND-700 dark:!text-BRAND-400 !border-BRAND-100/50 dark:!border-BRAND-800/30 !ring-0 rounded-xl px-2"
              size="xs"
            >
              <span className="text-[12px] font-bold">View All</span>
            </Button>
          </div>
          <div className="p-6 pt-0 flex-1 overflow-hidden flex flex-col">
            {orders?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-DARK-900 rounded-lg shadow-md">
                  <thead className="bg-gradient-to-r from-BRAND-50 to-BRAND-100 dark:from-DARK-700 dark:to-DARK-700 text-DARK-600 dark:text-DARK-300 uppercase text-[12px] font-medium">
                    <tr>
                      <th className="py-3 px-4 text-left">#</th>
                      <th className="py-3 px-4 text-left">Order Id</th>
                      <th className="py-3 px-4 text-left">Order Status</th>
                      <th className="py-3 px-4 text-left">Order Date</th>
                      <th className="py-3 px-4 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr
                        key={order._id}
                        className="hover:bg-BRAND-50 dark:hover:bg-DARK-700 even:bg-DARK-50 dark:even:bg-DARK-800 odd:bg-white dark:odd:bg-DARK-900 transition-colors duration-300"
                      >
                        <td className="p-3 text-sm text-DARK-800 dark:text-DARK-200">{index + 1}</td>
                        <td
                          className="p-3 text-sm text-DARK-700 dark:text-DARK-300 truncate max-w-[120px]"
                          title={order?.orderName}
                        >
                          {order?.orderName || "-"}
                        </td>
                        <td className="p-3 text-sm flex px-5">
                          <div
                            className={`flex justify-center px-2 py-1 w-20 text-xs font-medium rounded-full
                              ${order?.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-200/20 dark:text-green-400 border border-green-800 dark:border-green-500"
                                : order?.status === "hold"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-200/20 dark:text-yellow-300 border border-yellow-800 dark:border-yellow-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-200/20 dark:text-red-400 border border-red-800 dark:border-red-500"
                              }`}
                          >
                            {order?.status?.toUpperCase() || "-"}
                          </div>
                        </td>
                        <td className="p-3 text-DARK-700 dark:text-DARK-300">
                          {order?.orderDate ? formatDate(order.orderDate,configData?.dateFormat) : "-"}
                        </td>
                        <td className="p-3 text-sm text-DARK-700 dark:text-DARK-300">
                          {order?.orderTotalAmount ? `${order?.company?.currency?.symbol || "$"}${order.orderTotalAmount.toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-DARK-500 dark:text-DARK-400 font-medium">No orders available.</p>
            )}
          </div>
        </div>
      )}
    </>
  );

};

export default OrderDetails;
