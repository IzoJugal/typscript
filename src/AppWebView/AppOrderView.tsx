import { FiArrowLeft } from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import FormLoader from "../utils/common/FormLoader";
import { capitalized, formatDate, formatTime } from "../utils/utility";
import { Button } from "flowbite-react";
import { MdPrint } from "react-icons/md";
import { useCallback, useEffect, useState } from "react";
import { IModifier, IOrder, IProduct } from "../utils/common/Interface/OrderInterface";
import axios from "axios";
import { apiUrl } from "../environment/env";
import { useConfigs } from "../context/SiteConfigsProvider";

const AppOrderView = () => {

    const { search } = useLocation();

    const { configData } = useConfigs();
    const urlParams = new URLSearchParams(search);
    const token = urlParams.get("token");

    useEffect(() => {
        if (token) {
            localStorage.setItem("webView", `${token}`)
        }
    }, [search]);


    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<IOrder | any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const getOrder = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${apiUrl}/order/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Time-Zone': timeZone,
                    'Authorization': `Bearer ${token}`
                }
            });
            setTimeout(() => {
                setOrder(response.data.order);
                setIsLoading(false);
            }, 500);

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

    return (
        <div className="bg-slate-200 p-5">
            {/* Header Section */}
            <Link
                to={`/order/app/1?token=${token}`}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-DARK-700 to-DARK-800 dark:from-DARK-800 dark:to-DARK-900 text-white rounded-xl hover:from-DARK-800 hover:to-DARK-900 dark:hover:from-DARK-900 dark:hover:to-DARK-950 transition-all duration-300 shadow-md hover:shadow-lg w-fit"
            >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Orders
            </Link>

            {/* Main Content */}
            <div className="max-w-4xl mt-3 mx-auto p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-DARK-50 dark:from-DARK-900 dark:to-DARK-800 shadow-xl rounded-2xl sm:rounded-3xl border border-DARK-100 dark:border-DARK-700">
                {isLoading ? (
                    <FormLoader count={1} />
                ) : (
                    <>
                        {/* Order Title and Status */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-DARK-900 dark:text-DARK-100 tracking-tight mb-2 sm:mb-0">
                                {order?.orderName || "Order"}
                            </h1>
                            <span
                                className={`inline-flex items-center px-2 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full shadow-md transition-all duration-300 ${order?.status === "completed"
                                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-700 dark:border-green-800"
                                    : order?.status === "hold"
                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-700 dark:border-yellow-800"
                                        : "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-700 dark:border-red-800"
                                    }`}
                            >
                                {order?.status?.toUpperCase() || "-"}
                            </span>
                        </div>

                        {/* Order Information */}
                        <section className="mb-6 sm:mb-8">
                            <h2 className="text-xl sm:text-2xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">Order Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 md:gap-6 text-DARK-700 dark:text-DARK-300">
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Date</span>
                                    <span>
                                        {formatDate(order?.orderDate, configData?.dateFormat)}, {formatTime(order?.orderDate)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Server</span>
                                    <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                        {order?.server?.name?.length > 0
                                            ? `${capitalized(order?.server?.name)} ${order?.server?.role?.name ? `(${order?.server?.role?.name})` : ""}`
                                            : "No server assigned"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Type</span>
                                    <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                        {order?.orderType?.length > 0 ? capitalized(order?.orderType) : "Unknown Type"}
                                    </span>
                                </div>
                                {order?.orderType === "product" && (
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Service Type</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                            {order?.productOrderType?.length > 0 ? capitalized(order?.productOrderType) : "No Service Type"}
                                        </span>
                                    </div>
                                )}
                                {order?.orderType === "table" && (
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Room</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                            {order?.cartItems?.length > 0 && order?.cartItems[0]?.table?.room?.name?.length > 0
                                                ? `${capitalized(order?.cartItems[0]?.table?.room?.name)} ${order?.cartItems[0]?.table?.room?.size ? `(${order?.cartItems[0]?.table?.room?.size} SQFT)` : ""}`
                                                : "No Room Assigned"}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Tip</span>
                                    <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                        {typeof order?.tip === "number" && order.tip > 0 ? `$${order.tip.toFixed(2)}` : "$0.00"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Tax</span>
                                    <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                        {typeof order?.tax === "number" && order.tax > 0 ? `$${order.tax.toFixed(2)}` : "$0.00"}
                                    </span>
                                </div>
                                {order?.couponId ? (
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
                                                ${order?.couponAmount ? parseFloat(order?.couponAmount.toFixed(2)) : 0}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Coupon</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">None Applied</span>
                                    </div>
                                )}
                                {order?.status === "hold" && (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Paid</span>
                                            <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                                {order?.amount && order.amount !== 0 ? `$${order.amount.toFixed(2)}` : "$0.00"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Due</span>
                                            <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                                {order?.change && order.change !== 0 ? `$${order.change.toFixed(2)}` : "$0.00"}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Total Amount</span>
                                    <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                        ${order?.orderTotalAmount?.toFixed(2) || 0}
                                    </span>
                                </div>
                                {Number(order?.gratuity) > 0 && (
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">
                                            Gratuity ({order?.gratuity}%)
                                        </span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">${order?.gratuityAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Payment Methods</span>
                                    <div className="mt-0.5 space-y-0.5">
                                        {order?.multipleMethods && order?.multipleMethods?.length > 0 ? (
                                            order?.multipleMethods.map((method: any, index: number) => (
                                                <span key={method._id || index} className="block text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                                    {method.method}: ${method.amount.toFixed(2)}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">None Specified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Customer Information */}
                        {order?.customerId && (
                            <section className="mb-6 sm:mb-8">
                                <h3 className="text-xl sm:text-2xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">Customer Information</h3>
                                <div className="space-y-2 sm:space-y-3 text-DARK-700 dark:text-DARK-300">
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Name</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                            {order?.customerId?.firstName?.length > 0 || order?.customerId?.lastName?.length > 0
                                                ? `${order?.customerId?.firstName || ""} ${order?.customerId?.lastName || ""}`.trim()
                                                : "Unnamed Customer"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Email</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                            {order?.customerId?.email?.length > 0 ? order?.customerId?.email : "No Email"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-DARK-500 dark:text-DARK-400 uppercase tracking-wide">Phone</span>
                                        <span className="mt-0.5 text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100">
                                            {order?.customerId?.phoneNumber?.length > 0 ? order?.customerId?.phoneNumber : "No Phone"}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Billing Address */}
                        {order?.customerId?.billingAddress && (
                            <section className="mb-6 sm:mb-8">
                                <h3 className="text-xl sm:text-2xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">Billing Address</h3>
                                <p className="text-sm sm:text-base font-medium text-DARK-900 dark:text-DARK-100 leading-relaxed">
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

                        {/* Items Ordered */}
                        {order?.cartItems && order?.cartItems.length > 0 && (
                            <section className="mb-6 sm:mb-8">
                                <h3 className="text-xl sm:text-2xl font-semibold text-DARK-800 dark:text-DARK-200 mb-3 sm:mb-4">Items Ordered</h3>
                                {order?.orderType === "table" ? (
                                    order.cartItems.map((item: any, itemIndex: any) => (
                                        <div
                                            key={itemIndex}
                                            className="p-3 sm:p-4 mb-3 sm:mb-4 bg-white dark:bg-DARK-800 rounded-xl sm:rounded-2xl border-t-4 border-t-BRAND-600 dark:border-t-DARK-400 shadow-md transition-all duration-300 hover:shadow-lg"
                                        >
                                            <h5 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-2 sm:mb-3">Product</h5>
                                            <div className="overflow-x-auto">
                                                <table className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-lg sm:rounded-xl shadow-sm">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-DARK-50 to-DARK-100 dark:from-DARK-700 dark:to-DARK-600 text-DARK-700 dark:text-DARK-200 text-left text-xs sm:text-sm uppercase tracking-wide">
                                                            <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Sr. No</th>
                                                            <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Name</th>
                                                            <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Quantity</th>
                                                            <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Price</th>
                                                            <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Discount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(order?.orderType === "table" ? item.products : [item])?.length > 0 ? (
                                                            (order?.orderType === "table" ? item.products : [item]).map((product: any, productIndex: number) => (
                                                                <tr
                                                                    key={productIndex}
                                                                    className="text-DARK-700 dark:text-DARK-300 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-200"
                                                                >
                                                                    <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{productIndex + 1}</td>
                                                                    <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">
                                                                        {product?.product?.name?.length > 0 ? product?.product?.name : "Unnamed Product"}
                                                                    </td>
                                                                    <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{product?.quantity || 0}</td>
                                                                    <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">
                                                                        ${product?.product?.price?.toFixed(2) || "0.00"}
                                                                    </td>
                                                                    <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{product?.discountAmount || "-"}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} className="px-3 py-1 sm:px-4 sm:py-2 text-center text-DARK-700 dark:text-DARK-300 text-sm sm:text-base">
                                                                    No Products Available
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Modifiers */}
                                            {(order?.orderType === "table" ? item.products : [item])?.some((product: IProduct) => product?.modifiers?.length > 0) && (
                                                <div className="mt-3 sm:mt-4">
                                                    <h5 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-2 sm:mb-3">Modifiers</h5>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-lg sm:rounded-xl shadow-sm">
                                                            <thead>
                                                                <tr className="bg-gradient-to-r from-DARK-50 to-DARK-100 dark:from-DARK-700 dark:to-DARK-600 text-DARK-700 dark:text-DARK-200 text-left text-xs sm:text-sm uppercase tracking-wide">
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Sr. No.</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Name</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Price</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(() => {
                                                                    let globalIndex = 1;
                                                                    return (order?.orderType === "table" ? item.products : [item])
                                                                        ?.flatMap((product: IProduct) =>
                                                                            product?.modifiers?.map((modifier: IModifier) => ({
                                                                                id: globalIndex++,
                                                                                modifier,
                                                                            })) || []
                                                                        )
                                                                        .map(({ id, modifier }: any) => (
                                                                            <tr
                                                                                key={id}
                                                                                className="text-DARK-700 dark:text-DARK-300 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-200"
                                                                            >
                                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{id}</td>
                                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">
                                                                                    {modifier?.name?.length > 0 ? modifier?.name : "Unnamed Modifier"}
                                                                                </td>
                                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">${modifier?.price?.toFixed(2) || "0.00"}</td>
                                                                            </tr>
                                                                        ));
                                                                })()}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Table Information */}
                                            {order?.orderType === "table" && item?.table?.mergedTables?.length > 0 && (
                                                <div className="mt-3 sm:mt-4">
                                                    <h5 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-2 sm:mb-3">Tables</h5>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-lg sm:rounded-xl shadow-sm">
                                                            <thead>
                                                                <tr className="bg-gradient-to-r from-DARK-50 to-DARK-100 dark:from-DARK-700 dark:to-DARK-600 text-DARK-700 dark:text-DARK-200 text-left text-xs sm:text-sm uppercase tracking-wide">
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Sr. No.</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Name</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Number</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Capacity</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {item?.table?.mergedTables.map((mergedTable: any, index: number) => (
                                                                    <tr
                                                                        key={mergedTable?._id}
                                                                        className="text-DARK-700 dark:text-DARK-300 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-200"
                                                                    >
                                                                        <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{index + 1}</td>
                                                                        <td className="px-3 py-1 sm:px-4 sm:py-2 border-b truncate max-w-[8rem] sm:max-w-36 text-sm sm:text-base">
                                                                            {mergedTable?.name?.length > 0 ? capitalized(mergedTable?.name) : "Unnamed Table"}
                                                                        </td>
                                                                        <td className="px-3 py-1 sm:px-4 sm:py-2 border-b truncate max-w-[8rem] sm:max-w-36 text-sm sm:text-base">
                                                                            {mergedTable?.number?.length > 0 ? mergedTable?.number : "-"}
                                                                        </td>
                                                                        <td className="px-3 py-1 sm:px-4 sm:py-2 border-b truncate max-w-[8rem] sm:max-w-36 text-sm sm:text-base">
                                                                            {mergedTable?.capacity || 0}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Total Amount */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 sm:mt-4 border-t border-DARK-200 dark:border-DARK-700 pt-2 sm:pt-3">
                                                <h3 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-1 sm:mb-0">Total Amount</h3>
                                                <p className="text-xl sm:text-2xl font-bold text-DARK-900 dark:text-DARK-100">${order?.orderTotalAmount.toFixed(2) || 0}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 sm:p-4 bg-white dark:bg-DARK-800 rounded-xl sm:rounded-2xl border-t-4 border-t-BRAND-600 shadow-md transition-all duration-300 hover:shadow-lg">
                                        <h5 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-2 sm:mb-3">Product</h5>
                                        <div className="overflow-x-auto">
                                            <table className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-lg sm:rounded-xl shadow-sm">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-DARK-50 to-DARK-100 dark:from-DARK-700 dark:to-DARK-600 text-DARK-700 dark:text-DARK-200 text-left text-xs sm:text-sm uppercase tracking-wide">
                                                        <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Sr. No</th>
                                                        <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Name</th>
                                                        <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Price</th>
                                                        <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Quantity</th>
                                                        <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Discount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.isArray(order?.cartItems) && order?.cartItems.length > 0 ? (
                                                        order.cartItems.map((item: any, itemIndex: number) => (
                                                            <tr
                                                                key={itemIndex}
                                                                className="text-DARK-700 dark:text-DARK-300 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-200"
                                                            >
                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{itemIndex + 1}</td>
                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">
                                                                    {item.product?.name?.length > 0 ? item.product?.name : "Unnamed Product"}
                                                                </td>
                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">${(item.product?.price || 0).toFixed(2)}</td>
                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{item.quantity || 0}</td>
                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{item.discountAmount || "-"}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="px-3 py-1 sm:px-4 sm:py-2 text-center text-DARK-700 dark:text-DARK-300 text-sm sm:text-base">
                                                                No Products Available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Modifiers */}
                                        {order?.orderType === "product" &&
                                            Array.isArray(order?.cartItems) &&
                                            order.cartItems.some((item: any) => Array.isArray(item.modifiers) && item.modifiers.length > 0) && (
                                                <div className="mt-3 sm:mt-4">
                                                    <h5 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-2 sm:mb-3">Modifiers</h5>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full bg-white dark:bg-DARK-800 border border-DARK-100 dark:border-DARK-700 rounded-lg sm:rounded-xl shadow-sm">
                                                            <thead>
                                                                <tr className="bg-gradient-to-r from-DARK-50 to-DARK-100 dark:from-DARK-700 dark:to-DARK-600 text-DARK-700 dark:text-DARK-200 text-left text-xs sm:text-sm uppercase tracking-wide">
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Sr. No.</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Name</th>
                                                                    <th className="px-3 py-1 sm:px-4 sm:py-2 border-b">Price</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {order.cartItems
                                                                    .filter((item: any) => Array.isArray(item.modifiers) && item.modifiers.length > 0)
                                                                    .flatMap((item: any, itemIndex: number) =>
                                                                        item.modifiers.map((modifier: any, modIndex: number) => (
                                                                            <tr
                                                                                key={`${itemIndex}-${modIndex}`}
                                                                                className="text-DARK-700 dark:text-DARK-300 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-200"
                                                                            >
                                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">{itemIndex + modIndex + 1}</td>
                                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">
                                                                                    {modifier.name?.length > 0 ? modifier.name : "Unnamed Modifier"}
                                                                                </td>
                                                                                <td className="px-3 py-1 sm:px-4 sm:py-2 border-b text-sm sm:text-base">${modifier.price?.toFixed(2) || "0.00"}</td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                        {/* Total Amount */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 sm:mt-4 border-t border-DARK-200 dark:border-DARK-700 pt-2 sm:pt-3">
                                            <h3 className="text-lg sm:text-xl font-semibold text-DARK-900 dark:text-DARK-100 mb-1 sm:mb-0">Total Amount</h3>
                                            <p className="text-xl sm:text-2xl font-bold text-DARK-900 dark:text-DARK-100">${order?.orderTotalAmount.toFixed(2) || 0}</p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end hide-on-print">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.print()}
                                    className="px-4 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-BRAND-600 to-BRAND-700 text-white rounded-xl font-medium shadow-lg hover:from-BRAND-700 hover:to-BRAND-800 transition-all duration-300 flex items-center justify-center w-full sm:w-auto"
                                >
                                    <MdPrint className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                    Print Order
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default AppOrderView
