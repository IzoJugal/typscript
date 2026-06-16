import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import html2pdf from "html2pdf.js";

const OrderInvoice = () => {
    const { orderId } = useParams();
    const [orderData, setOrderData] = useState<any>(null);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const printRef = useRef<HTMLDivElement>(null);
    const currenycSymbol = orderData?.company?.currency?.symbol;

    const mergeItemsOptimized = (items: any[]) => {
        const map = new Map();

        for (const item of items) {
            const key = `${item.product._id}_${JSON.stringify(
                [...(item.modifiers || [])].sort()
            )}`;

            if (map.has(key)) {
                const existing = map.get(key);
                existing.quantity += item.quantity;
                existing.totalPrice += item.totalPrice;
            } else {
                map.set(key, { ...item });
            }
        }

        return Array.from(map.values());
    };

    const fetchOrderInvoice = useCallback(async () => {
        try {
            const response = await apiClient.get(`/order/invoice/${orderId}`);
            const { success, message, data } = response.data;

            if (success) {
                let items = [];
                if (data?.orderType === "table") {
                    items = data?.cartItems?.[0]?.products;
                } else {
                    items = data?.cartItems;
                }

                const subTotal = items?.reduce(
                    (acc: number, item: any) =>
                        // acc + Number(item?.product?.price) * Number(item?.quantity),
                        acc + Number(item?.baseProductAmount) * Number(item?.quantity),
                    0
                );

                const mergedItems = mergeItemsOptimized(items);

                setCartItems(mergedItems);
                setOrderData({ ...data, subTotal });
            } else {
                toast.error(message);
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to load invoice");
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderInvoice();
    }, [fetchOrderInvoice]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        if (!printRef.current) return;

        html2pdf()
            .set({
                margin: 5,
                filename: `invoice_${orderId}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            })
            .from(printRef.current)
            .save();
    };

    if (!orderData) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Loading invoice...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">

            {/* ACTION BUTTONS */}
            <div className="max-w-md mx-auto mb-6 flex gap-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="group flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-zinc-900 to-black text-white py-3 px-4 font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                    <span className="flex items-center justify-center gap-2">
                        Print
                    </span>

                    {/* subtle shine effect */}
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition duration-300"></span>
                </button>

                <button
                    onClick={handleDownloadPDF}
                    className="group flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 px-4 font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
                >
                    <span className="flex items-center justify-center gap-2">
                        Download PDF
                    </span>

                    {/* subtle shine effect */}
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition duration-300"></span>
                </button>
            </div>

            {/* THERMAL RECEIPT */}
            <div
                ref={printRef}
                className="max-w-md mx-auto bg-white p-6 shadow-md text-sm font-mono rounded-lg"
            >
                {/* HEADER */}
                <div className="text-center border-b pb-4">
                    <h1 className="text-lg font-bold">{orderData?.company?.name}</h1>
                    <p className="text-xs text-gray-500">Invoice Receipt</p>
                    {orderData?.restaurant?.fssNo && <p className="text-xs text-gray-500">FSS No.: {orderData?.restaurant?.fssNo}</p>}
                </div>

                {/* ORDER INFO */}
                <div className="mt-4 space-y-1 text-xs">
                    <p>Order: {orderData.orderName}</p>
                    <p>
                        Date:{" "}
                        {new Date(orderData.createdAt).toLocaleString()}
                    </p>
                    {/* <p>Status: {capitalized(orderData.status)}</p> */}
                </div>

                {/* CUSTOMER */}
                <div className="mt-4 border-t pt-3 text-xs">
                    <p className="font-semibold mb-1">Customer</p>
                    {orderData.customerId ? (
                        <>
                            <p>
                                {orderData.customerId?.firstName}{" "}
                                {orderData.customerId?.lastName}
                            </p>
                            {orderData.customerId?.phoneNumber && <p>{orderData.customerId?.phoneNumber}</p>}
                        </>
                    ) : (
                        <p>Guest</p>
                    )}
                </div>

                {/* ITEMS */}
                <div className="mt-4 border-t pt-3">
                    {cartItems?.map((item: any, index: number) => (
                        <div
                            key={index}
                            className={`p-2 ${index !== cartItems.length - 1 ? "border-b border-gray-200 mb-2 pb-2" : ""
                                }`}
                        >
                            <div className="flex justify-between">
                                <span className="font-medium">
                                    {item?.product?.name}
                                </span>
                                <span>
                                    {currenycSymbol}{item.quantity * item.baseProductAmount}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>
                                    {item.quantity} × {currenycSymbol}{item.baseProductAmount}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SUMMARY */}
                <div className="mt-4 border-t pt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{currenycSymbol}{orderData.subTotal}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{currenycSymbol}{orderData.tax || 0}</span>
                    </div>

                    <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total</span>
                        <span>{currenycSymbol}{orderData.orderTotalAmount}</span>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-6 text-center text-xs text-gray-500 border-t pt-3">
                    <p>Thank you for your purchase!</p>
                    <p>Visit again</p>
                </div>
            </div>

            {/* PRINT STYLES */}
            <style>
                {`
                @media print {
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default OrderInvoice;