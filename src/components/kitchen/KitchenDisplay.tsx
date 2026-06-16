import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../utils/AxiosInstance';
import { capitalized, playBeep } from '../../utils/utility';
import { ProductStatus } from '../../utils/common/constant';
import dayjs from 'dayjs';
import { useSocket } from '../../context/SocketProvider';
import { Button, Dropdown, DropdownItem } from 'flowbite-react';
import { TbPackageExport } from "react-icons/tb";
import { IoMdRefresh } from 'react-icons/io';
import { useLanguage } from '../../context/LanguageContext';
import { ITranslation } from '../products/ProductForm';
import { ProjectName } from '../../environment/env';

// Interfaces
interface OrderItem {
  productId: string;
  productName: string;
  productNameMl: ITranslation;
  quantity: number;
  status: ProductStatus;
  note: string;
  unit?: string;
  position?: number;
  updatedAt?: string;
}

interface Order {
  _id: string;
  orderName: string;
  orderType: string;
  productOrderType?: string;
  server?: { name?: string };
  tableName?: string;
  orderDate?: string;
  updatedAt?: string;
  cartItems: OrderItem[];
  guestCount?: number;
}

const KitchenDisplay: React.FC = () => {
  document.title = `${ProjectName} : Kitchen's View`;
  const socket = useSocket();
  const { languageCode } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/order/kitchen/recall');
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  useEffect(() => {
    const changeProductStatus = (socketData: any[]) => {
      const statusMap = new Map(
        socketData.map((item) => [`${item.product}-${item.position}`, item])
      );

      const allReady = socketData.every(
        (item: any) => item.status?.toLowerCase() === ProductStatus.READY
      );
      if (allReady) {
        playBeep('productStatus');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) => ({
          ...order,
          cartItems: order.cartItems.map((item) => {
            const key = `${item.productId}-${item.position}`;
            const update = statusMap.get(key);
            return update && update.order === order._id && item.status !== update.status
              ? { ...item, status: update.status, updatedAt: update.updatedAt }
              : item;
          }),
        }))
      );
    };

    const deleteProduct = (socketData: any) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === socketData.order
            ? {
              ...order, cartItems: order.cartItems.filter(item =>
                item.productId !== socketData.product || item.position !== socketData.position)
            }
            : order
        )
      );
    };

    const saveOrder = (socketData: any) => {
      if (socketData.orderType !== 'product') return;

      const {
        _id, orderName, orderType, productOrderType,
        server, orderDate, updatedAt, cartItems,
      } = socketData;

      const transformedItems = cartItems.map((item: any) => ({
        productId: item.product._id,
        productName: item.product.name,
        productNameMl: item.product?.nameMl,
        note: item.note,
        quantity: item.quantity,
        status: item.status,
        unit: item.product.modifiers?.[0]?.name || 'Unit',
        position: item.position,
      }));

      const sortedItems = transformedItems.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

      setOrders((prev) => {
        const orderExists = prev.some((o) => o._id === _id);
        if (orderExists) {
          return prev.map((o) =>
            o._id === _id ? { ...o, cartItems: sortedItems } : o
          );
        } else {
          playBeep('newOrder');
          return [
            {
              _id, orderName, orderType, productOrderType,
              server, orderDate, updatedAt, cartItems: sortedItems,
            },
            ...prev,
          ];
        }
      });
    };

    socket.on('newOrder', saveOrder);
    socket.on('updatedCart', deleteProduct);
    socket.on('changeProductStatus', changeProductStatus);

    return () => {
      socket.off('newOrder', saveOrder);
      socket.off('updatedCart', deleteProduct);
      socket.off('changeProductStatus', changeProductStatus);
    };
  }, [socket]);

  const getStatusColor = (status: ProductStatus): string => {
    const styles: Record<ProductStatus, string> = {
      [ProductStatus.NEW]: 'bg-blue-600 hover:bg-blue-700 text-white',
      [ProductStatus.ACKNOWLEDGED]: 'bg-indigo-700 hover:bg-indigo-800 text-white',
      [ProductStatus.PREPARING]: 'bg-amber-500 hover:bg-amber-600 text-white',
      [ProductStatus.READY]: 'bg-green-500 hover:bg-green-600 text-white',
      [ProductStatus.SERVED]: 'bg-green-700 hover:bg-green-800 text-white',
      [ProductStatus.HOLD]: 'bg-DARK-500 hover:bg-DARK-600 text-white',
      [ProductStatus.CANCELLED]: 'bg-red-500 hover:bg-red-600 text-white',
    };
    return styles[status] ?? 'bg-DARK-200 text-DARK-800';
  };

  const changeStatus = async (singleOrder: any) => {
    try {
      const payload = {
        order: singleOrder?.order,
        products: [
          {
            product: singleOrder?.productId,
            position: singleOrder?.position,
            status: singleOrder?.status?.toLowerCase(),
          },
        ]
      }
      await apiClient.post('/order/kitchen/change-product-status', payload);

      /* const matchedOrder = orders.find(order => order._id === singleOrder?.order);
      if (!matchedOrder) return;
      
      const allReady = matchedOrder.cartItems.every(
        (item: any) => item.status?.toLowerCase() === 'ready'
      );

      if (allReady) {
        playBeep();
      } */

    } catch (error: any) {
      console.error('Error changing status:', error.message);
    }
  };

  const renderDropdown = (singleOrder: any) => (
    <Dropdown
      label=""
      dismissOnClick={true}
      renderTrigger={() => (
        <span
          className={`ml-4 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
            singleOrder?.status
          )} cursor-pointer`}
        >
          {capitalized(singleOrder?.status)}
        </span>
      )}
      className="bg-white shadow-lg border border-DARK-200 rounded-lg p-2 w-44"
    >
      {Object.keys(ProductStatus).map((key) => (
        <DropdownItem key={key} onClick={() => changeStatus({ ...singleOrder, status: key })}>
          {capitalized(key)}
        </DropdownItem>
      ))}
    </Dropdown>
  );

  const bumpOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order._id !== orderId));
  };

  const handleRefresh = () => window.location.reload();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-DARK-200 dark:from-DARK-950 dark:to-DARK-950 p-6">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <Button
          onClick={handleRefresh}
          className="group rounded-full bg-slate-800 hover:!bg-slate-900 dark:bg-DARK-700 dark:hover:!bg-DARK-600 px-2 shadow-md focus:!ring-0 active:scale-95"
        >
          <IoMdRefresh className="h-5 w-5 my-auto mr-2 group-hover:animate-spin" />
          Refresh
        </Button>
      </div>
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-center mt-6 text-DARK-900 dark:text-white">
          🍽️ Kitchen's View
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-DARK-700 rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-16 bg-DARK-200 dark:bg-DARK-700 rounded mb-4 w-3/4"></div>
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-12 bg-DARK-200 dark:bg-DARK-700 rounded mb-2 w-full"></div>
              ))}
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20">
          <h2 className="text-2xl font-semibold text-DARK-700 dark:text-DARK-300 mb-2">No Orders Yet!</h2>
          <p className="text-DARK-500 dark:text-DARK-400 mb-6 text-center max-w-md">
            It looks like there are no orders at the moment. Grab a coffee and check back later!
          </p>
          <div className="flex gap-4">
            <Link to="/" className="px-6 py-3 bg-PRIMARY text-white rounded-full hover:bg-PRIMARY_HOVER transition">
              Go to Dashboard
            </Link>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 border-2 border-PRIMARY text-PRIMARY rounded-full hover:bg-PRIMARY hover:text-white transition"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => {
            const allServed = order.cartItems.every(item => item.status === ProductStatus.SERVED);
            return (
              <motion.div
                key={order._id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-DARK-900 rounded-2xl shadow-md p-6 flex flex-col h-full transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-DARK-800 dark:text-white truncate">{order.orderName}</h2>
                    <p className="text-xs text-DARK-500 dark:text-DARK-300 font-semibold mt-1">
                      Server: {capitalized(order?.server?.name ?? 'Unknown')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold bg-DARK-100 dark:bg-DARK-800 text-DARK-700 dark:text-DARK-300 px-3 py-1 rounded-full">
                      {capitalized(order.orderType === 'table' ? order.orderType : order.productOrderType || '')}
                    </span>
                    {order.tableName && (
                      <p className="text-xs mt-1 text-DARK-500 dark:text-DARK-300">
                        Table: {capitalized(order.tableName)}
                      </p>
                    )}
                  </div>
                </div>

                <hr className="border-DARK-200 dark:border-DARK-600 mb-4" />

                <ul className="space-y-4 overflow-y-auto scrollbar-hide flex-grow max-h-72">
                  {order.cartItems.map((item, idx) => (
                    <li key={`${item.productId}-${idx}`} className="flex items-center justify-between bg-slate-100 dark:bg-DARK-800 rounded-lg p-3 hover:bg-slate-200 dark:hover:bg-DARK-700 transition">
                      <div className="flex-1">
                        <p className="text-DARK-800 dark:text-white font-medium truncate">{item.productNameMl?.[languageCode] ? item.productNameMl?.[languageCode] : capitalized(item.productName)} × {item.quantity}</p>
                        {item.note && (
                          <p className="text-xs text-yellow-500 dark:text-yellow-400/90">Note: {item.note}</p>
                        )}
                      </div>
                      {renderDropdown({ ...item, order: order._id })}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-DARK-200 dark:border-DARK-600 flex justify-between items-center">
                  <div className="text-xs text-DARK-500 dark:text-DARK-400">
                    <p className='font-semibold'>Date: {dayjs(order.orderDate).format('MM/DD/YYYY, hh:mm A')}</p>
                    {order.guestCount ? <p>Guest(s): {order.guestCount}</p> : null}
                  </div>

                  <Button
                    onClick={() => bumpOrder(order._id)}
                    disabled={!allServed}
                    className={`flex items-center gap-3 rounded-full text-sm ${allServed ? '!bg-green-600 hover:!bg-green-700' : '!bg-DARK-400 cursor-not-allowed'
                      }`}
                  >
                    <TbPackageExport className="w-4 h-4 mr-1 my-auto" />
                    Bump
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
