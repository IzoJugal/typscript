import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiInfo } from 'react-icons/fi';
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../utils/AxiosInstance";
import { Button } from "flowbite-react";
import { MdPrint } from "react-icons/md";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { capitalized, formatDate, labelLayout, setTitle } from "../../utils/utility";
import { IModifier, IOrder } from "../../utils/common/Interface/OrderInterface";
import { useSocket } from "../../context/SocketProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import ViewStaff from "../staff/ViewStaff";
import TransactionsTable from "./TransactionsTable";
import { useLanguage } from "../../context/LanguageContext";
import { IoMdOpen } from "react-icons/io";
import { useConfigs } from "../../context/SiteConfigsProvider";
import PrintableReceipt from "../../utils/common/PrintableReceipt";

const OrderView = () => {
    const socket = useSocket();
    const { languageCode } = useLanguage();
      const { configData } = useConfigs();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<IOrder | any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();
    const [isLoadingBtn, setIsLoadingBtn] = useState(false);
    const [serverModal, setServerModal] = useState(false);
    const [openTransaction, setOpenTransaction] = useState(false);
    const [orderTransactions, setOrderTransactions] = useState<any>([]);
    const [serverId, setServerId] = useState("");
    const [isConfirmUndo, setIsConfirmUndo] = useState(false);

    const hideSidebarRoutes = [`/order/app/${id}`];
    const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

    const currencySymbol = order?.company?.currency?.symbol || "$";

    useEffect(() => {
        const saveOrder = (orderData: any) => {
            setOrder(orderData);
        }

        const changeProductStatus = (socketData: any[]) => {
            const statusMap = new Map(
                socketData.map((item) => [`${item.product}-${item.position}`, item])
            );

            setOrder((prevOrder: any) => {
                const cartItems = prevOrder?.orderType === 'table'
                    ? prevOrder.cartItems[0].products
                    : prevOrder.cartItems;

                const updatedItems = cartItems.map((item: any) => {
                    const key = `${item.product._id}-${item.position}`;
                    const update = statusMap.get(key);
                    return update && update.order === prevOrder._id && item.status !== update.status
                        ? { ...item, status: update.status, updatedAt: update.updatedAt }
                        : item;
                });

                return prevOrder.orderType === 'table'
                    ? {
                        ...prevOrder,
                        cartItems: [{ ...prevOrder.cartItems[0], products: updatedItems }],
                    }
                    : { ...prevOrder, cartItems: updatedItems };
            });
        };


        socket.on("saveOrder", saveOrder);
        socket.on('changeProductStatus', changeProductStatus);
        return () => {
            socket.off("saveOrder");
            socket.off('changeProductStatus', changeProductStatus);
        };
    }, [socket]);

    const getOrder = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/order/${id}`);
            const { success, order } = response?.data;
            if (success) {
                let title = `${order?.orderName}` || 'Order Details';
                (!order?.splitOrderId && order?.isSplitOrder) ? (
                    title = `${title} - Main Order`
                ) : order?.splitOrderId && (
                    title = `${title} - Split #${order.splitCount}`
                )
                setTitle(title);
                setOrder(order);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("~ getOrder error :-", error);
            setIsLoading(false);
        }
    }, [id, setIsLoading]);

    useEffect(() => {
        if (id) {
            getOrder();
        }

    }, [id]);

    const handleCancelOrder = async () => {
        try {
            setIsLoadingBtn(true);
            const response: any = await apiClient.patch(`/order/cancel-order/${order?._id}`);
            const { success, order: updatedOrder, message } = response.data;
            if (success) {
                setOrder(updatedOrder);
                toast.success(message);
            } else {
                toast.warning(message);
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast.error(error.message)
        } finally {
            setIsLoadingBtn(false);
            setIsModalOpen(false);
        }
    };

    const tableNames =
        order?.cartItems?.[0]?.table?.mergedTables?.length > 0
            ? order.cartItems[0].table.mergedTables.map((t: any) => t?.name)
            : order?.cartItems
                ?.map((item: any) => item?.table?.table?.name);

    const validTables = tableNames?.filter(Boolean);

    const ProductTableByOrder = ({ order }: any) => {
        const groupedProducts: { product: any; groupIndex: number; tableName: string | null }[] = [];
        if (order.orderType === 'table') {
            let groupIndex = 0;
            for (const item of order.cartItems) {
                const tableName = item?.table?.table?.name ?? null;

                for (const product of (item.products || [])) {
                    groupedProducts.push({ product, groupIndex, tableName });
                }

                groupIndex++;
            }
        } else {
            order.cartItems.forEach((product: any, i: number) => {
                groupedProducts.push({ product, groupIndex: i, tableName: null });
            });
        }

        return (
            <table className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-lg sm:rounded-xl shadow-sm">
                <thead>
                    <tr className="bg-gradient-to-r from-DARK-50 to-DARK-100 dark:from-DARK-700 dark:to-DARK-600 text-DARK-700 dark:text-DARK-200 text-left text-sm uppercase tracking-wide">
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b w-[94px]">Sr. No</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Name</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Table</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Unit Price</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b min-w-6">Qty</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Note</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Status</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Discount</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Tax</th>
                        <th className="px-3 py-1 sm:px-3 sm:py-2 border-b">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedProducts?.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-3 py-2 text-center text-DARK-700 dark:text-DARK-300 text-sm">
                                No Products Available
                            </td>
                        </tr>
                    ) : (
                        groupedProducts.map(({ product: cart, tableName }, index) => {
                            const hasModifiers = Array.isArray(cart?.modifiers) && cart.modifiers.length > 0;
                            const itemTax = typeof cart?.tax === "number" ? cart.tax : null;
                            return (
                                <tr key={index} className={`bg-white dark:bg-DARK-900 text-DARK-700 dark:text-DARK-300 hover:bg-opacity-80 transition-colors duration-200`}>
                                    <td className="px-3 py-2 border-b text-sm align-center">{index + 1}</td>

                                    <td className="px-3 py-2 border-b text-sm">
                                        <span className="font-medium">
                                            {capitalized(
                                                cart?.product?.nameMl?.[languageCode] ||
                                                cart?.product?.name ||
                                                "Unnamed Product"
                                            )}
                                        </span>

                                        {hasModifiers && cart.modifiers?.length > 0 && (
                                            <div
                                                className="flex flex-wrap gap-1 mt-1.5"
                                                title={
                                                    cart.modifiers.length > 1
                                                        ? `Modifiers:\n${cart.modifiers
                                                            .map(
                                                                (m: IModifier) =>
                                                                    `${m.name} — ${currencySymbol}${(m.price || 0)}`
                                                            )
                                                            .join("\n")}`
                                                        : `Modifier: ${cart.modifiers[0]?.name} — ${currencySymbol}${(cart.modifiers[0]?.price || 0)}`
                                                }
                                            >
                                                {/* Show ONLY first modifier */}
                                                <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full text-BRAND-700 dark:text-BRAND-300 border border-BRAND-200 dark:border-BRAND-700/50 whitespace-nowrap">
                                                    {capitalized(cart.modifiers[0]?.name)}
                                                </span>

                                                {/* +N badge (for 2 or more) */}
                                                {cart.modifiers.length > 1 && (
                                                    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-DARK-700 text-gray-600 dark:text-gray-300">
                                                        +{cart.modifiers.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center">
                                        {tableName ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-DARK-100 dark:bg-DARK-700 text-DARK-700 dark:text-DARK-200 border border-DARK-200 dark:border-DARK-600 whitespace-nowrap">
                                                {capitalized(tableName)}
                                            </span>
                                        ) : (
                                            <span className="text-DARK-400 dark:text-DARK-500">–</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center">
                                        {currencySymbol}{(cart?.unitPrice || 0)}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center">
                                        {cart?.quantity || 0} {capitalized(cart?.product?.unit)}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm text-justify align-center">
                                        {cart?.note && <span className="bg-yellow-200/80 text-black px-1 rounded" title={capitalized(cart?.note)}> {capitalized(cart?.note)} </span>}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center">
                                        {labelLayout(cart?.status)}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center">
                                        {cart?.discountAmount ? (
                                            <span className="font-semibold">
                                                {cart.discountType === "percentage" ? `${(cart?.discountAmount || 0)}%` : `${currencySymbol}${(cart?.discountAmount || 0)}`}
                                            </span>
                                        ) : (
                                            <span className="text-DARK-400 dark:text-DARK-500">–</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center">
                                        {itemTax !== null ? `${currencySymbol}${itemTax}` : "-"}
                                    </td>
                                    <td className="px-3 py-2 border-b text-sm align-center font-semibold text-DARK-900 dark:text-DARK-100">
                                        {currencySymbol}{cart?.totalPrice}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        );
    };


    const SectionHeader = ({ title, className = "" }: { title: string; className?: string }) => (
        <h5 className={`text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-2 sm:mb-3 ${className}`}>{title}
            {validTables?.length > 0 && (
                <span className="text-sm text-DARK-500 dark:text-DARK-400">
                    ({validTables.length > 1 ? "Tables" : "Table"}: {validTables.join(", ")})
                </span>
            )}
        </h5>
    );

    const TotalAmount = ({ amount }: { amount: number }) => {
        const hasCoupon = order?.couponId;
        const hashDiscount = order?.orderDiscountAmount;
        const tipAmount = typeof order?.tip === "number" && order.tip > 0 ? order.tip : 0;
        const couponAmount = order?.couponAmount ? parseFloat(order.couponAmount) : 0;
        const totalTax = order?.tax;
        // const totalTax = order?.cartItems?.reduce((sum: number, item: any) => {
        //     const itemTax = (item?.products || []).reduce((pSum: number, product: any) => {
        //         return pSum + (Number(product?.tax) || 0);
        //     }, 0);

        //     return sum + itemTax;
        // }, 0) || 0;
        return (
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                {/* Combined Card Section - Spans 2 columns on extra large screens */}
                <div className="xl:col-span-2 flex flex-col space-y-4 w-full xl:order-1 order-2">
                    {/* Section Header */}
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs uppercase tracking-[0.15em] font-black text-DARK-500 dark:text-DARK-400">
                            Badge Guide
                        </h3>
                        <div className="h-px flex-1 bg-DARK-100 dark:bg-DARK-700/50"></div>
                    </div>

                    {/* Dynamic Badge Examples Card */}
                    <div className="bg-white dark:bg-DARK-800/60 rounded-xl p-5 border border-DARK-100 dark:border-DARK-700 shadow-sm h-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                            {/* Kitchen Status Section - 2 Rows of 3 */}
                            <div className="space-y-4">
                                <h4 className="text-[12px] font-bold text-DARK-800 dark:text-DARK-200 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-BRAND-500 rounded-full"></span>
                                    Kitchen Status
                                </h4>

                                <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                                    {[
                                        { label: "Ready", desc: "Ready to serve", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-700/20 dark:text-green-400" },
                                        { label: "Hold", desc: "On hold", color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-300" },
                                        { label: "Cancelled", desc: "Cancelled", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-500" },
                                        { label: "New", desc: "New order", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-800/20 dark:text-blue-500" },
                                        { label: "Processing", desc: "Preparing", color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-500" },
                                        { label: "Served", desc: "Item served", color: "bg-lime-200 text-lime-700 border-lime-200 dark:bg-lime-900/20 dark:text-lime-500" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex flex-col items-center text-center">
                                            <span className={`w-full py-1 rounded-full text-[10px] font-bold border ${item.color} dark:border-white/5`}>
                                                {item.label}
                                            </span>
                                            <span className="text-[9px] font-medium text-DARK-500 dark:text-DARK-400 mt-1 leading-tight">
                                                {item.desc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Table & Modifiers Stacked */}
                            <div className="flex flex-col justify-between">
                                {/* Table Assignment */}
                                <div className="space-y-3">
                                    <h4 className="text-[12px] font-bold text-DARK-800 dark:text-DARK-200 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-DARK-400 rounded-full"></span>
                                        Table Assignment
                                    </h4>
                                    <div className="flex gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="px-3 py-0.5 rounded-md text-[11px] font-semibold bg-DARK-100 dark:bg-DARK-700 text-DARK-700 dark:text-DARK-200 border border-DARK-200 dark:border-DARK-600">
                                                table 7
                                            </span>
                                            <span className="text-[9px] font-medium text-DARK-500 mt-1">Assigned</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-DARK-400 dark:text-DARK-500 text-[11px] font-bold">-</span>
                                            <span className="text-[9px] font-medium text-DARK-500 mt-1">None</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Modifiers */}
                                <div className="space-y-3 pt-4 border-t border-DARK-100 dark:border-DARK-700/50 mt-4">
                                    <h4 className="text-[12px] font-bold text-DARK-800 dark:text-DARK-200 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-BRAND-500 rounded-full"></span>
                                        Product Modifiers
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {["Extra Cheese", "No Onion", "Spicy"].map((mod) => (
                                            <span key={mod} className="text-[10px] font-medium px-2 py-0.5 rounded-full text-BRAND-700 dark:text-BRAND-300 border border-BRAND-200 dark:border-BRAND-700/50">
                                                {mod}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary - Now occupies the "third" column space */}
                <div className="flex flex-col space-y-4 xl:order-2 order-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs uppercase tracking-[0.15em] font-black text-DARK-500 dark:text-DARK-400">
                            Summary
                        </h3>
                        <div className="h-px flex-1 bg-DARK-100 dark:bg-DARK-700/50"></div>
                    </div>

                    <div className="bg-white dark:bg-DARK-800/60 rounded-xl p-5 border border-DARK-100 dark:border-DARK-700 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-DARK-600 dark:text-DARK-400">Tip <p className="text-[10px] text-DARK-500 dark:text-DARK-400">Tip is excluded from the total amount</p></span>
                            <span className="text-sm font-semibold text-DARK-900 dark:text-DARK-100">
                                {currencySymbol}{tipAmount}
                            </span>
                        </div>

                        {couponAmount > 0 && (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-400">Coupon</span>
                                    {hasCoupon && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-BRAND-100 text-BRAND-700 font-bold">
                                            {order?.couponId?.code}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-BRAND-600">
                                    -{currencySymbol}{couponAmount}
                                </span>
                            </div>
                        )}


                        {hashDiscount > 0 && (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-400">Discount</span>
                                </div>
                                <span className="text-sm font-semibold text-BRAND-600">
                                    -{currencySymbol}{hashDiscount}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-DARK-600 dark:text-DARK-400">Tax</span>
                            <span className="text-sm font-semibold text-DARK-900 dark:text-DARK-100">
                                {
                                    !totalTax
                                        ? "-"
                                        : `${currencySymbol}${totalTax}`
                                }
                            </span>
                        </div>

                        <div className="border-t border-DARK-100 dark:border-DARK-700 my-2"></div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xl font-bold text-DARK-900 dark:text-DARK-100">Grand Total</span>
                            <span className="text-2xl font-black text-BRAND-600">
                                {currencySymbol}{(amount ?? 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const undoSplit = async () => {
        try {
            const splitOrderId = order.splitOrderId || order?._id;
            const { data } = await apiClient.post(`/order/undo-split-order`, { order: splitOrderId });
            if (data.success) {
                navigate(-1);
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    }

    const getStatusStyles = (status: string) => {
        const baseStyles = "w-28 text-center inline-flex items-center justify-center px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full border shadow-sm transition-all duration-300";
        switch (status?.toLowerCase()) {
            case "completed":
                return `${baseStyles} bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-400/30`;
            case "hold":
                return `${baseStyles} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-400/30`;
            case "cancelled":
                return `${baseStyles} bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-400/30`;
            default:
                return `${baseStyles} bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-400/30`;
        }
    };

    return (
        <>
            {/* Header Section */}
            {!shouldHideSidebar ? (
                <FormHeaderPaths page="Order Details" prevLink="/order/1" prevPage="Orders" />
            ) : (
                <Link
                    to="/order/app"
                    className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-DARK-700 to-DARK-800 dark:from-DARK-800 dark:to-DARK-900 text-white rounded-xl hover:from-DARK-800 hover:to-DARK-900 dark:hover:from-DARK-900 dark:hover:to-DARK-950 transition-all duration-300 shadow-md hover:shadow-lg w-fit"
                >
                    <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Orders
                </Link>
            )}
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mt-2 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between hide-on-print">
                    <div className="flex justify-start mt-2 sm:mt-0 items-center">

                        {!shouldHideSidebar && (
                            <Button
                                onClick={() => navigate(-1)}
                                className="!bg-gradient-to-r !from-DARK-800 !to-DARK-900 dark:!from-DARK-900 dark:!to-DARK-900 text-white rounded-xl font-medium shadow-lg hover:!from-DARK-800 hover:!to-DARK-900 dark:hover:!from-DARK-700 dark:hover:!to-DARK-700 transition-all duration-300 flex items-center justify-center w-full sm:w-auto border-0"
                            >
                                <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                Back to Orders
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className={`!bg-gradient-to-r !from-red-600 !to-red-700 text-white rounded-xl font-medium shadow-lg hover:!from-red-700 hover:!to-red-800 transition-all duration-300 flex items-center justify-center w-full sm:w-auto border-0
                                        ${(order?.status === "cancelled" || order?.status === "completed") ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                            disabled={order?.status === "cancelled" || order?.status === "completed"}
                            title="Cancel Order"
                        >
                            Cancel Order
                        </Button>
                        <Button
                            onClick={() => {
                                const receiptEl = document.getElementById('print-receipt');
                                if (!receiptEl) return;

                                // Remove old iframe if exists
                                const oldFrame = document.getElementById('print-frame');
                                if (oldFrame) oldFrame.remove();

                                // Create hidden iframe
                                const iframe = document.createElement('iframe');
                                iframe.id = 'print-frame';
                                iframe.style.position = 'fixed';
                                iframe.style.right = '0';
                                iframe.style.bottom = '0';
                                iframe.style.width = '0';
                                iframe.style.height = '0';
                                iframe.style.border = '0';

                                document.body.appendChild(iframe);

                                const doc =
                                    iframe.contentWindow?.document ||
                                    iframe.contentDocument;

                                if (!doc) return;

                                doc.open();
                                doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: 'Courier New', Courier, monospace;
                        width: 80mm;
                        margin: 0 auto;
                        padding: 5mm;
                        color: #000;
                        background: #fff;
                        font-size: 12px;
                        line-height: 1.5;
                    }

                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }

                    hr {
                        border: none;
                        border-top: 1px dashed #000;
                        margin: 6px 0;
                    }
                </style>
            </head>
            <body>
                ${receiptEl.innerHTML}
            </body>
            </html>
        `);

                                doc.close();

                                iframe.onload = () => {
                                    iframe.contentWindow?.focus();
                                    iframe.contentWindow?.print();

                                    setTimeout(() => {
                                        iframe.remove();
                                    }, 1000);
                                };
                            }}
                            className="!bg-gradient-to-r !from-BRAND-600 !to-BRAND-700 text-white rounded-xl font-medium shadow-lg hover:!from-BRAND-700 hover:!to-BRAND-800 transition-all duration-300 flex items-center justify-center w-full sm:w-auto border-0"
                        >
                            <MdPrint className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                            Print Receipt
                        </Button>
                    </div>
                </div>
                <div className="my-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-DARK-50 dark:from-DARK-800 dark:to-DARK-800 shadow-xl rounded-2xl sm:rounded-2xl">
                    {isLoading ? (
                        // Skeleton Loader
                        <div className="animate-pulse space-y-6 sm:space-y-8">
                            {/* Header Skeleton */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-DARK-900/50 p-4 sm:p-5 rounded-2xl border border-DARK-100 dark:border-DARK-700 shadow-sm transition-all duration-300 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1.5 sm:h-10 sm:w-2 bg-DARK-200 dark:bg-DARK-700 rounded-full"></div>
                                    <div className="h-8 sm:h-10 w-48 sm:w-64 bg-DARK-200 dark:bg-DARK-700 rounded-lg"></div>
                                </div>
                                <div className="flex gap-2 sm:gap-3">
                                    <div className="h-8 w-24 bg-DARK-200 dark:bg-DARK-700 rounded-full"></div>
                                    <div className="h-8 w-24 bg-DARK-200 dark:bg-DARK-700 rounded-full hidden sm:block"></div>
                                </div>
                            </div>

                            {/* Order Details Grid Skeleton */}
                            <section className="border dark:border-DARK-600 rounded-xl p-4">
                                <div className="h-6 sm:h-8 w-40 bg-DARK-200 dark:bg-DARK-700 rounded-lg mb-4"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex flex-col bg-DARK-50/50 dark:bg-DARK-800/30 p-3 sm:p-4 rounded-xl border border-DARK-100 dark:border-DARK-700">
                                            <div className="h-3 w-16 bg-DARK-200 dark:bg-DARK-600 rounded mb-2"></div>
                                            <div className="h-5 w-28 bg-DARK-200 dark:bg-DARK-600 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Customer Information Skeleton */}
                            <section className="border dark:border-DARK-600 p-4 rounded-xl">
                                <div className="h-6 sm:h-8 w-56 bg-DARK-200 dark:bg-DARK-700 rounded-lg mb-4"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex flex-col">
                                            <div className="h-3 w-12 bg-DARK-200 dark:bg-DARK-700 rounded mb-1.5"></div>
                                            <div className="h-5 w-32 bg-DARK-200 dark:bg-DARK-700 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Table Skeleton */}
                            <section>
                                <div className="p-3 sm:p-4 bg-white dark:bg-DARK-900 rounded-xl sm:rounded-2xl border-t-4 border-t-DARK-200 dark:border-t-DARK-700 shadow-md">
                                    <div className="h-6 sm:h-8 w-32 bg-DARK-200 dark:bg-DARK-700 rounded-lg mb-4"></div>
                                    <div className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-xl overflow-hidden">
                                        <div className="h-10 bg-DARK-50 dark:bg-DARK-700 border-b border-DARK-200 dark:border-DARK-600"></div>
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-12 border-b border-DARK-100 dark:border-DARK-700 px-4 py-2 flex items-center gap-4">
                                                <div className="h-4 w-8 bg-DARK-200 dark:bg-DARK-600 rounded"></div>
                                                <div className="h-4 w-32 bg-DARK-200 dark:bg-DARK-600 rounded"></div>
                                                <div className="h-4 w-20 bg-DARK-200 dark:bg-DARK-600 rounded"></div>
                                                <div className="h-4 w-12 bg-DARK-200 dark:bg-DARK-600 rounded"></div>
                                                <div className="h-4 w-24 bg-DARK-200 dark:bg-DARK-600 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-DARK-200 dark:border-DARK-700">
                                        <div className="h-6 sm:h-8 w-32 bg-DARK-200 dark:bg-DARK-700 rounded-lg"></div>
                                        <div className="h-8 sm:h-10 w-24 bg-DARK-200 dark:bg-DARK-700 rounded-lg"></div>
                                    </div>
                                </div>
                            </section>

                            {/* Action Buttons Skeleton */}
                            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-between">
                                <div className="h-10 sm:h-12 w-full sm:w-32 bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="h-10 sm:h-12 w-full sm:w-40 bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
                                    <div className="h-10 sm:h-12 w-full sm:w-36 bg-DARK-200 dark:bg-DARK-700 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-DARK-900 dark:text-DARK-100 tracking-tight mb-2 sm:mb-0">
                                    {order?.orderName || "Order"}
                                </h1>
                                <div className="flex flex-col sm:items-center gap-2">
                                    <span className={getStatusStyles(order?.status)}>
                                        {order?.status?.toUpperCase() || "-"}
                                    </span>

                                    <div className="flex flex-wrap gap-2">
                                        {order?.canceledType?.toLowerCase() === "void" && (
                                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200 shadow-sm dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-400/30">
                                                VOIDED
                                            </span>
                                        )}

                                        {order?.canceledType?.toLowerCase() === "return" && (
                                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-sm dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-400/30">
                                                RETURNED
                                            </span>
                                        )}
                                    </div>

                                </div>
                            </div>
                            {/* <hr className="mb-2 dark:border-slate-500" /> */}

                            <section className="mb-6 sm:mb-8 border dark:border-DARK-600 rounded-xl p-4">
                                <h2 className="text-xl sm:text-2xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">
                                    <div className="flex justify-between items-center">
                                        <span>Order Details</span>

                                        <div className="flex items-center space-x-2">
                                            {/* Main Order Label */}
                                            {(!order?.splitOrderId && order?.isSplitOrder) ? (
                                                <span className="text-sm sm:text-base font-medium text-DARK-500 dark:text-DARK-300 bg-DARK-100 dark:bg-DARK-700 px-3 py-1 rounded-full border border-DARK-300 dark:border-DARK-600">
                                                    Main Order
                                                </span>
                                            ) : order?.splitOrderId && (
                                                /* Split Order Label */
                                                <span className="text-sm sm:text-base font-medium text-PRIMARY-700 dark:text-PRIMARY-300 border border-PRIMARY-500 dark:border-PRIMARY-400 bg-PRIMARY-50 dark:bg-PRIMARY-900 px-3 py-1 rounded-full">
                                                    Split #{order.splitCount}
                                                </span>
                                            )}

                                            {/* Undo Split Button */}
                                            {(order?.splitOrderId || order?.isSplitOrder) && order.status !== 'completed' && (
                                                <Button onClick={() => setIsConfirmUndo(true)} size="xs" className="text-sm sm:text-base font-medium text-PRIMARY-700 dark:text-PRIMARY-300 border border-PRIMARY-500 dark:border-PRIMARY-400 bg-PRIMARY-50  dark:bg-PRIMARY-900 dark:hover:!bg-DARK-600 px-3 py-1 rounded-full">
                                                    Undo Split
                                                </Button>
                                            )}
                                        </div>

                                    </div>
                                </h2>
                                {/* Order Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-4 text-DARK-700 dark:text-DARK-300" style={{ fontSize: '14px' }}>
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Date</span>
                                        <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                            {/* {dayjs(order?.orderDate).format("DD/MM/YYYY, hh:mm A")} */}
                                            {order?.orderDate ? formatDate(order?.orderDate,configData?.dateFormat) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Server</span>
                                        <div className="flex items-center gap-1">
                                            <span
                                                className={`mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100 ${order?.server?.name ? "hover:!text-BRAND-500 cursor-pointer" : ""} `}
                                                onClick={() => { if (order?.server?._id) { setServerModal(true); setServerId(order?.server?._id) } }}>
                                                {order?.server?.name?.length > 0
                                                    ? `${capitalized(order?.server?.name)} ${order?.server?.role?.name ? `(${order?.server?.role?.name})` : ""}`
                                                    : "No server assigned"}
                                            </span>
                                            {order?.server?.name && (
                                                <FiInfo
                                                    className="mt-1 w-4 h-4 text-DARK-400 hover:text-BRAND-500 cursor-pointer transition-colors"
                                                    onClick={() => { if (order?.server?._id) { setServerModal(true); setServerId(order?.server?._id) } }}
                                                    title="View Server Details"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Type</span>
                                        <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                            {order?.orderType?.length > 0 ? capitalized(order?.orderType) : "Unknown Type"}
                                        </span>
                                    </div>
                                    {order?.orderType === "product" && (
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Service Type</span>
                                            <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                {order?.productOrderType?.length > 0 ? capitalized(order?.productOrderType) : "No Service Type"}
                                            </span>
                                        </div>
                                    )}
                                    {order?.orderType === "table" && (
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Room</span>
                                            <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                {order?.cartItems?.length > 0 && order?.cartItems[0]?.table?.room?.name?.length > 0
                                                    ? `${capitalized(order?.cartItems[0]?.table?.room?.name)} ${order?.cartItems[0]?.table?.room?.size ? `(${order?.cartItems[0]?.table?.room?.size} SQFT)` : ""}`
                                                    : "No Room Assigned"}
                                            </span>
                                        </div>
                                    )}
                                    {/* <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Tip</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                            {typeof order?.tip === "number" && order.tip > 0 ? `${currencySymbol}${order.tip.toFixed(2)}` : `${currencySymbol}0.00`}
                                        </span>
                                    </div> */}
                                    {/* <div className="flex flex-col space-y-1">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Tax</span>

                                        {order.isTaxExemption ? (
                                            <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded-md space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="line-through text-gray-500 text-sm">{currencySymbol}{order?.tax}</span>
                                                    <span className="text-green-600 font-semibold text-sm">Tax Free</span>
                                                </div>

                                                <div className="flex flex-col text-sm">
                                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Reason</span>
                                                    <p className="text-DARK-900 text-justify dark:text-DARK-100">{order?.taxExemptionReason || "N/A"}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                                {typeof order?.tax === "number" && order.tax > 0 ? `${currencySymbol}${order.tax.toFixed(2)}` : `${currencySymbol}0.00`}
                                            </span>
                                        )}
                                    </div> */}

                                    {order?.orderNote && <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Order Note</span>
                                        <span className="mt-0.5 text-sm ssm:text-sm font-normal text-DARK-800 dark:text-DARK-100 text-justify">
                                            {capitalized(order?.orderNote)}
                                        </span>
                                    </div>}
                                    {/* {order?.couponId ? (
                                        <>
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Coupon</span>
                                                <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                                    {order?.couponId?.code?.length > 0 ? order?.couponId?.code : "No Code"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Coupon Amount</span>
                                                <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                                    {currencySymbol}{order?.couponAmount ? parseFloat(order?.couponAmount).toFixed(2) : `${currencySymbol}0.00`}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Coupon</span>
                                            <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">Not Applied</span>
                                        </div>
                                    )} */}
                                    {order?.status === "hold" && (
                                        <>
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Paid</span>
                                                <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                    {order?.amount && order.amount !== 0 ? `${currencySymbol}${order?.amount}` : `${currencySymbol}0.00`}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Due</span>
                                                <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                    {order?.change && order.change !== 0 ? `${currencySymbol}${order?.change}` : `${currencySymbol}0.00`}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Total Amount</span>
                                        <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                            {currencySymbol}{order?.orderTotalAmount || 0}
                                        </span>
                                    </div>
                                    {Number(order?.gratuity) > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">
                                                Gratuity ({order?.gratuity}%)
                                            </span>
                                            <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">{currencySymbol}{order?.gratuityAmount}</span>
                                        </div>
                                    )}
                                    {Array.isArray(order?.multipleMethods) && order.multipleMethods.length > 0 && (
                                        <div className="flex flex-col items-start">
                                            <button
                                                onClick={() => { setOpenTransaction(true); setOrderTransactions(order?.multipleMethods); }}
                                                className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide
                                                        underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 
                                                        flex items-center gap-1"
                                                type="button"
                                            >
                                                Payment Methods <IoMdOpen className="h-4 w-5" />
                                            </button>
                                        </div>
                                    )}


                                    {/* {Array.isArray(order?.multipleMethods) && order.multipleMethods.length > 0 && (
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">
                                            Payment Methods
                                        </span>
                                        <button
                                            className=""
                                            onClick={() => { setOpenTransaction(true); setOrderTransactions(order?.multipleMethods) }}>
                                            Transactions
                                        </button>
                                        <div className="mt-0.5 space-y-0.5">
                                            {order.multipleMethods.map((method: any, index: number) => (
                                                <>
                                                    <span
                                                        key={method._id || index}
                                                        className="block text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100"
                                                    >
                                                        {method.method}: ${method.amount.toFixed(2)}
                                                    </span>
                                                    {method.method === 'CASH' && <span className="text-sm">Change: ${order.change}</span>}
                                                </>
                                            ))}
                                        </div>
                                    </div>
                                )} */}


                                </div>

                                {(order?.customerId || order?.customerId?.billingAddress) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                        {/* Customer Information */}
                                        {order?.customerId && (
                                            <section className="border dark:border-DARK-600 p-4 rounded-xl">
                                                <h3 className="text-xl sm:text-xl font-semibold text-DARK-800 dark:text-DARK-200 mb-4">Customer Information</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-DARK-700 dark:text-DARK-300">

                                                    {/* Name */}
                                                    <div className="flex flex-col sm:col-span-2">
                                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">
                                                            Name
                                                        </span>
                                                        <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                            {order?.customerId?.firstName?.length > 0 || order?.customerId?.lastName?.length > 0
                                                                ? `${capitalized(order?.customerId?.firstName) || ""} ${order?.customerId?.lastName || ""}`.trim()
                                                                : "Unnamed Customer"}
                                                        </span>
                                                    </div>

                                                    {/* Email */}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">
                                                            Email
                                                        </span>
                                                        <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                            {order?.customerId?.email?.length > 0 ? order?.customerId?.email : "No Email"}
                                                        </span>
                                                    </div>

                                                    {/* Phone */}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">
                                                            Phone
                                                        </span>
                                                        <span className="mt-0.5 text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100">
                                                            {order?.customerId?.phoneNumber?.length > 0 ? order?.customerId?.phoneNumber : "No Phone"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {/* Billing Address */}
                                        {order?.customerId?.billingAddress && (
                                            <section className="border dark:border-DARK-600 p-4 rounded-xl">
                                                <h3 className="text-xl sm:text-xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">Billing Address</h3>
                                                <p className="text-sm sm:text-sm font-medium text-DARK-900 dark:text-DARK-100 leading-relaxed">
                                                    {[
                                                        order.customerId.billingAddress.address1,
                                                        order.customerId.billingAddress.address2,
                                                        order.customerId.billingAddress.city,
                                                        order.customerId.billingAddress.state,
                                                        order.customerId.billingAddress.country,
                                                        order.customerId.billingAddress.postalCode,
                                                    ]
                                                        .filter((item) => item?.length > 0)
                                                        .join(", ") || "No Address Provided"}
                                                </p>
                                            </section>
                                        )}
                                    </div>
                                )}

                            </section>



                            {/* Items Ordered */}
                            {order?.cartItems?.length > 0 && (
                                <section className="mb-6 sm:mb-8">
                                    {/* <h3 className="text-xl sm:text-2xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">Items Ordered</h3> */}

                                    {order.orderType === "table" ? (
                                        order.cartItems.map((_: any, itemIndex: number) => {

                                            return (
                                                <div
                                                    key={itemIndex}
                                                    className="p-3 sm:p-4 mb-3 sm:mb-4 bg-white dark:bg-DARK-900 rounded-xl sm:rounded-2xl border-t-4 border-t-BRAND-600 dark:border-t-DARK-400 shadow-md transition-all duration-300 hover:shadow-lg"
                                                >
                                                    <SectionHeader title="Product" />
                                                    <div className="overflow-x-auto">
                                                        <ProductTableByOrder order={order} />
                                                    </div>
                                                    <TotalAmount amount={order?.orderTotalAmount} />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-3 sm:p-4 bg-white dark:bg-DARK-900 rounded-xl sm:rounded-2xl border-t-4 border-t-BRAND-600 dark:border-t-DARK-400 shadow-md transition-all duration-300 hover:shadow-lg">
                                            <SectionHeader title="Product" />
                                            <div className="overflow-x-auto">
                                                <ProductTableByOrder order={order} />
                                            </div>

                                            <TotalAmount amount={order?.orderTotalAmount} />
                                        </div>
                                    )}
                                </section>
                            )}



                        </>
                    )}
                    <ConfirmModal
                        isOpen={isModalOpen}
                        message="Are you sure you want to cancel this order?"
                        onConfirm={handleCancelOrder}
                        onCancel={() => setIsModalOpen(false)}
                        isLoadingBtn={isLoadingBtn}
                    />
                    <ViewStaff
                        id={serverId}
                        setId={setServerId}
                        open={serverModal}
                        setOpen={setServerModal}
                        permission={false}
                    />
                </div>
            </div>
            <PrintableReceipt order={order} />

            <TransactionsTable {...{ openTransaction, setOpenTransaction, orderTransactions, setOrderTransactions, orderData: order }} />
            <ConfirmModal
                isOpen={isConfirmUndo}
                message="Are you sure you want to undo split?"
                subText="Note: This will remove split orders."
                onConfirm={undoSplit}
                onCancel={() => setIsConfirmUndo(false)}
            />
        </>
    );

};

export default OrderView;
