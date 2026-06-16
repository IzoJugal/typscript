import { Button, Card, Label, Modal, TextInput } from "flowbite-react";
import { CreditCardIcon, QrCodeIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { paymentMethods } from "../../utils/common/constant";
import detectIssuer, { generateUpiUrl } from "../../utils/utility";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { GiMoneyStack } from "react-icons/gi";
// import { FiCreditCard, FiTag, FiGift, FiUsers } from "react-icons/fi";
// import apiClient from "../../utils/AxiosInstance";
// import { toast } from "react-toastify";

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    formData?: any;
    onPaymentSubmit?: (paymentData: any) => Promise<void>; // Parent handles API call
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    title?: string;
    selectedPackage?: any;
    currency?: string;
}

const PaymentModal = ({ open, onClose, formData, setFormData, onPaymentSubmit, selectedPackage, currency = "$" }: PaymentModalProps) => {
    // const [paymentObj, setPaymentObj] = useState<any>({ paymentMethod: "", amount: formData?.amount });
    const [activeTab, setActiveTab] = useState("cash");
    const [cashReceived, setCashReceived] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardType, setCardType] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    // const [isCouponOpen, setIsCouponOpen] = useState<boolean>(false);
    // const [couponList, setCouponList] = useState<any>([]);
    const [cvv, setCvv] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const totalAmount = formData?._id ? Number(formData?.package?.price) : Number(formData?.amount);

    const paidAmount = formData?.payment?.multipleMethods?.length > 0
        ? formData.payment?.multipleMethods.reduce((sum: number, x: any) => {
            const amount = Number(x.amount) || 0;
            if (x.entryType === 'credit') {
                return sum + amount;
            } else if (x.entryType === 'debit') {
                return sum - amount;
            }
            return sum;
        }, 0).toFixed(2)
        : "0.00";


    /* const handleChange = (e: any) => {
        const { name, value } = e.target;
        setPaymentObj((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    }; */

    /* const handlePaymentMethod = (method: string) => {
        setPaymentObj((prev: any) => ({ ...prev, paymentMethod: method }));
    }; */

    /* const handleSubmit = async () => {
        setLoading(true);
        try {
            await onPaymentSubmit(paymentObj);
            onClose();
        } catch (error) {
            console.error("Payment failed:", error);
        } finally {
            setLoading(false);
        }
    }; */

    const validateInputs = () => {
        if (activeTab === "cash" && !cashReceived) {
            setError("Cash Received is required.");
            return false;
        }
        if (activeTab === "card" && (!cardNumber || !cardHolder || !expiryDate || !cvv)) {
            setError("Fill required fields.");
            return false;
        }
        return true;
    };

    const calculateChange = () => {
        const cash = parseFloat(cashReceived) || 0;
        if (formData?.payment?.multipleMethods?.length > 0) {
            return cash >= (Number(totalAmount) - paidAmount) ? (cash - (Number(totalAmount) - paidAmount)).toFixed(2) : "0.00";
        }
        return cash >= totalAmount ? (cash - totalAmount).toFixed(2) : "0.00";
    };

    const handlePayment = (method: string) => {
        if (!validateInputs()) return;

        setIsLoading(true);

        const basePayload = {
            ...formData,
            isPay: true,
            paymentMethod: method,
        };

        const methodSpecificData: Record<string, any> = {
            [paymentMethods.CASH]: {
                tenderAmount: cashReceived,
                change: calculateChange(),
            },
            [paymentMethods.CARD]: {
                tenderAmount: cashReceived,
                cardNumber,
                cardType,
                referenceCode: "TEST_REF_1234",
                authCode: "TEST_AUTH_1234",
            },
            [paymentMethods.QR]: {
                // Future support if needed
            },
        };

        const methodData = methodSpecificData[method] || {};
        const updatedPayload = {
            ...basePayload,
            ...methodData,
        };

        if (formData?._id) {
            const params = {
                // amount: cashReceived,
                paymentMethod: method,
                ...methodData,
            };
            tablePackagePayment(params);
        } else {
            onPaymentSubmit?.(updatedPayload);
            onClose();
        }
        setIsLoading(false);
    };


    const tablePackagePayment = async (params: any) => {
        try {
            const response = await apiClient.post(`/reservations/make-package-payment/${formData?._id}`, params);
            const { success, message } = response.data;
            if (success) {
                toast.success(message);
            } else {
                toast.error(message);
            }
        } catch (error: any) {
            console.log(error);
            toast.error(error?.message);
        } finally {
            onClose();
        }
    };

    const handleCardNumber = (e: any) => {
        setCardNumber(e.target.value);
        const detectedCardName: string | undefined = detectIssuer(e.target.value);
        if (!e.target.value || !cardHolder) {
            setError("Card Number and Card Holder are required.");
        } else if (!detectedCardName) {
            setError("Currently card type not allowed.");
        }
        setError("");
        setCardType(detectedCardName ?? '');
    };

    const handleExpiryChange = (e: any) => {
        let input = e.target.value.replace(/\D/g, '');
        if (input.length > 4) {
            input = input.slice(0, 4);
        }
        if (input.length >= 3) {
            input = `${input.slice(0, 2)}/${input.slice(2)}`;
        }
        setExpiryDate(input);
    };

    const removeCoupon = () => {
        const orderSubTotal = parseFloat(formData?.orderSubTotal) || 0;
        const totalTax = parseFloat(formData?.totalTax) || 0;
        const gratuityAmount = parseFloat(formData?.gratuityAmount) || 0;

        const rawTotal = orderSubTotal + totalTax + gratuityAmount;
        setFormData((prev: any) => ({
            ...prev,
            couponId: null,
            orderTotalAmount: rawTotal,
            orderDiscountAmount: 0,
            couponAmount: 0,
        }))
    }

    /* const handleCoupon = async () => {
        getCoupons();
        setIsCouponOpen(true);
    } */

    /* const getCoupons = async () => {
        try {
            const { data } = await apiClient.get(`/coupons/?restaurant=${formData?._id}`);
            if (data.success) {
                const { coupons } = data;
                setCouponList(coupons);
            } else {
                console.log(data?.message);
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    }; */

    /* const handleSelectCoupon = (coupon: any) => {
        if (coupon.isExpire || !coupon.isActive) return;
        setPaymentObj((prev: any) => ({ ...prev, selectedCoupon: coupon }));
    }; */

    /* const applyCoupon = (coupon: any) => {
        const orderSubTotal = parseFloat(formData?.orderSubTotal) || 0;
        const totalTax = parseFloat(formData?.totalTax) || 0;
        const gratuityAmount = parseFloat(formData?.gratuityAmount) || 0;

        const rawTotal = orderSubTotal + totalTax + gratuityAmount;

        let orderTotal = rawTotal;
        let discountAmount = 0;

        if (!coupon?.isActive || coupon?.isExpire) {
            toast.error("This coupon is no longer active.");
            return;
        }

        const minOrder = Number(coupon?.minOrderAmount ?? 0);
        if (orderTotal < minOrder) {
            toast.error(`Minimum order amount for this coupon is $${minOrder}.`);
            return;
        }

        if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
            toast.error("This coupon has reached its usage limit.");
            return;
        }

        const discountValue = Number(coupon?.discountValue ?? 0);

        if (coupon.discountType === "percentage") {
            discountAmount = (discountValue / 100) * orderTotal;
        } else {
            discountAmount = discountValue;
        }

        const maxDiscount = Number(coupon?.maxDiscountAmount ?? discountAmount);
        discountAmount = Math.min(discountAmount, maxDiscount);

        const finalTotal = orderTotal - discountAmount;

        // 7. Apply coupon updates
        setPaymentObj((prev: any) => ({
            ...prev,
            couponAmount: discountAmount.toFixed(2),
            orderDiscountAmount: discountAmount.toFixed(2),
            orderTotalAmount: finalTotal.toFixed(2),
            couponId: coupon._id,
            couponCode: coupon.code,
        }));

        setIsCouponOpen(false);
    }; */

    const qrValue = generateUpiUrl({
        upiId: formData?.restaurant?.paymentCredentials?.upiId,
        name: formData?.restaurant?.name,
        amount: Number((totalAmount - (paidAmount ?? 0)).toFixed(2)),
        txnId: "IZOTXN456",
        refId: formData?.room?.name,
        date: formData?.date,
    });

    return (
        <Modal
            show={open} onClose={onClose}
            className="bg-black/70 dark:bg-black/85 backdrop-blur-md transition-all duration-500 ease-in-out"
            size="6xl"
            aria-labelledby="payment-modal-title"
        >
            <Modal.Header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <span
                    id="payment-modal-title"
                    className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide"
                >
                    Complete Payment
                </span>
            </Modal.Header>

            <Modal.Body className="bg-gray-50 dark:bg-gray-900 p-6 sm:p-8">
                <div className="space-y-6 mx-auto">
                    {/* Order Details Card */}
                    <Card className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 transition-opacity duration-300 ${totalAmount <= paidAmount ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="w-full mx-auto grid md:grid-cols-3 gap-8">

                            {/* Payment Methods */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[
                                        { key: "cash", label: "Cash", icon: <GiMoneyStack className="w-5 h-5" /> },
                                        { key: "card", label: "Card", icon: <CreditCardIcon className="w-5 h-5" /> },
                                        { key: "qr", label: "QR Code", icon: <QrCodeIcon className="w-5 h-5" /> },
                                    ].map(({ key, label, icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setActiveTab(key);
                                                setError("");
                                            }}
                                            className={`flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ease-in-out transform hover:scale-105 focus:!ring-0 ${activeTab === key
                                                ? "bg-gradient-to-r from-BRAND-500 to-BRAND-500 text-white shadow-lg"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                }`}
                                            aria-pressed={activeTab === key}
                                        >
                                            {icon}
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Cash Form */}
                                {activeTab === "cash" && (
                                    <div className="w-full mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Deposit Payment</h2>
                                        <div>
                                            <Label
                                                htmlFor="cash-received"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Cash Received <span className="text-red-500">*</span>
                                            </Label>
                                            <TextInput
                                                id="cash-received"
                                                placeholder="Enter amount (e.g., 50.00)"
                                                value={cashReceived ?? formData.orderTotalAmount}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, "");
                                                    const dotCount = (val.match(/\./g) || []).length;
                                                    if (dotCount > 1) return;
                                                    if (val.includes(".")) {
                                                        const [, decimal] = val.split(".");
                                                        if (decimal.length > 2) return;
                                                    }
                                                    if (val !== "" && Number(val) < 0) return;
                                                    setCashReceived(val);
                                                    if (!val) {
                                                        setError("Cash Received is required.");
                                                    } else {
                                                        setError("");
                                                    }
                                                }}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onKeyDown={(e) => {
                                                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="mt-2 transition-all duration-300"
                                                color={error && !cashReceived ? "failure" : "gray"}
                                                type="text"
                                                inputMode="decimal"
                                                step="0.01"
                                                aria-required="true"
                                                autoFocus
                                                min={0}
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm text-red-500 dark:text-red-400 animate-pulse">{error}</p>
                                        )}
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            Change: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currency}{calculateChange()}</span>
                                        </div>
                                        <Button
                                            color="success"
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1 transition-all duration-300 transform hover:scale-105 focus:!ring-0"
                                            onClick={() => handlePayment(paymentMethods.CASH)}
                                            disabled={isLoading}
                                            aria-label="Confirm Cash Payment"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Confirm Payment"
                                            )}
                                        </Button>
                                    </div>
                                )}
                                {/* Card Form */}
                                {activeTab === "card" && (
                                    <div className="w-full mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Card Details</h2>
                                        <div>
                                            <Label
                                                htmlFor="card-number"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Amount <span className="text-red-500">*</span>
                                            </Label>
                                            <TextInput
                                                id="card-amount"
                                                placeholder="Enter amount (e.g., 50.00)"
                                                value={cashReceived ?? formData.amount}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, "");
                                                    const dotCount = (val.match(/\./g) || []).length;
                                                    if (dotCount > 1) return;
                                                    if (val.includes(".")) {
                                                        const [, decimal] = val.split(".");
                                                        if (decimal.length > 2) return;
                                                    }
                                                    if (val !== "" && Number(val) < 0) return;
                                                    setCashReceived(val);
                                                    if (!val) {
                                                        setError("Cash Received is required.");
                                                    } else {
                                                        setError("");
                                                    }
                                                }}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onKeyDown={(e) => {
                                                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="mt-2 transition-all duration-300"
                                                color={error && !cashReceived ? "failure" : "gray"}
                                                type="text"
                                                inputMode="decimal"
                                                step="0.01"
                                                aria-required="true"
                                                autoFocus
                                                min={0}
                                            />
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor="card-number"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Card Number <span className="text-red-500">*</span>
                                            </Label>
                                            <TextInput
                                                id="card-number"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardNumber}
                                                maxLength={16}
                                                onChange={(e) => handleCardNumber(e)}
                                                className="mt-2 transition-all duration-300"
                                                color={error && !cardNumber ? "failure" : "gray"}
                                                aria-required="true"
                                                autoFocus
                                            />
                                            <Label
                                                value={cardType}
                                                className="text-xs mt-1 text-gray-500 dark:text-gray-400 transition-opacity duration-300"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label
                                                    htmlFor="expiry-date"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    Expiry Date <span className="text-red-500">*</span>
                                                </Label>
                                                <TextInput
                                                    id="expiry-date"
                                                    placeholder="MM/YY"
                                                    value={expiryDate}
                                                    maxLength={5}
                                                    onChange={(e) => handleExpiryChange(e)}
                                                    className="mt-2 transition-all duration-300"
                                                    color={error && !expiryDate ? "failure" : "gray"}
                                                    aria-required="true"
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="cvv"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    CVV <span className="text-red-500">*</span>
                                                </Label>
                                                <TextInput
                                                    id="cvv"
                                                    placeholder="123"
                                                    type="password"
                                                    value={cvv}
                                                    maxLength={3}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                    className="mt-2 transition-all duration-300"
                                                    color={error && !cvv ? "failure" : "gray"}
                                                    aria-required="true"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor="card-holder"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Card Holder <span className="text-red-500">*</span>
                                            </Label>
                                            <TextInput
                                                id="card-holder"
                                                placeholder="Full Name"
                                                value={cardHolder}
                                                onChange={(e) => {
                                                    setCardHolder(e.target.value);
                                                    if (!cardNumber || !e.target.value) {
                                                        setError("Card Number and Card Holder are required.");
                                                    } else {
                                                        setError("");
                                                    }
                                                }}
                                                className="mt-2 transition-all duration-300"
                                                color={error && !cardHolder ? "failure" : "gray"}
                                                aria-required="true"
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm text-red-500 dark:text-red-400 animate-pulse">{error}</p>
                                        )}
                                        <Button
                                            color="purple"
                                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1 transition-all duration-300 transform hover:scale-105 focus:!ring-0"
                                            onClick={() => handlePayment(paymentMethods.CARD)}
                                            disabled={isLoading}
                                            aria-label="Process Card Payment"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Process Payment"
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {/* QR Payment */}
                                {activeTab === "qr" && (
                                    <div className="w-full mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 text-center animate-fade-in">
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">QR Payment</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Scan the QR code below to complete your payment
                                        </p>
                                        <div className="flex justify-center">
                                            {formData?.restaurant?.paymentCredentials?.upiId ? (
                                                <QRCodeSVG
                                                    value={qrValue || ""}
                                                    size={200}
                                                    bgColor="#ffffff"
                                                    fgColor="#000000"
                                                    level="H"
                                                    marginSize={2}
                                                    className="rounded-xl border-4 border-BRAND-100 dark:border-BRAND-900 transition-all duration-300"
                                                />
                                            ) : (
                                                <p>UPI payment is not available for this restaurant at the moment.</p>
                                            )
                                            }
                                        </div>
                                        <Button
                                            color="info"
                                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1 transition-all duration-300 transform hover:scale-105 focus:!ring-0"
                                            onClick={() => handlePayment(paymentMethods.QR)}
                                            disabled={isLoading}
                                            aria-label="Mark QR Payment as Paid"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Mark as Paid"
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-6 border border-gray-200 dark:border-gray-700 p-6 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Payment Summary</h2>
                                {selectedPackage && <div>
                                    <h2 className="text-sm text-gray-800 dark:text-gray-100">{selectedPackage?.name}</h2>
                                </div>}

                                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Items Total</span><span>{currency}{totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        {/* <span>Tax</span><span>${formData?.totalTax || 0}</span> */}
                                        <span>Paid</span><span>{currency}{paidAmount || 0}</span>
                                    </div>
                                    {formData?.couponId && (
                                        <div className="relative group rounded-md -p-3">
                                            {/* Close Button - Overlaid Top Right */}
                                            <button
                                                onClick={removeCoupon}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs w-5 h-5 flex items-center justify-center z-10"
                                                aria-label="Remove coupon"
                                                title="Remove coupon"
                                            >
                                                <span className="mb-1">x</span>
                                            </button>

                                            {/* Coupon Content */}
                                            <div className="flex justify-between text-sm text-gray-800 dark:text-gray-200">
                                                <span>
                                                    Coupon ({formData?.couponCode || ''})
                                                </span>
                                                <span className="text-green-500">- {currency}{formData?.couponAmount}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                                        <span>Order Total</span><span>{currency}{totalAmount}</span>
                                    </div>

                                    {(formData?._id && formData?.multipleMethods?.length > 0) &&
                                        <div className="flex justify-between -font-semibold ">
                                            <span>Paid</span><span>${paidAmount}</span>
                                        </div>
                                    }
                                    <hr />

                                    {<div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                                        <span className="text-emerald-500">Payable Amount</span><span className="text-emerald-500 text-lg">{currency}{(totalAmount - (paidAmount ?? 0)).toFixed(2)}</span>
                                    </div>}
                                </div>

                                {/* <div className="grid grid-cols-2 gap-2 justify-center">
                                    <div className="flex flex-col items-center justify-center p-3 bg-DARK-800 dark:bg-DARK-700 text-white dark:text-gray-100 hover:bg-BRAND-700 dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                                        <FiCreditCard className="w-6 h-6 mb-1" />
                                        <span className="text-xs text-center">Pre Auth</span>
                                    </div>

                                    <div
                                        onClick={handleCoupon}
                                        className="flex flex-col items-center justify-center p-3 bg-DARK-800 dark:bg-DARK-700 text-white dark:text-gray-100 hover:bg-BRAND-700 dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400"
                                    >
                                        <FiTag className="w-6 h-6 mb-1" />
                                        <span className="text-xs text-center">Coupons</span>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-3 bg-DARK-800 dark:bg-DARK-700 text-white dark:text-gray-100 hover:bg-BRAND-700 dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                                        <FiGift className="w-6 h-6 mb-1" />
                                        <span className="text-xs text-center">Gift Card</span>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-3 bg-DARK-800 dark:bg-DARK-700 text-white dark:text-gray-100 hover:bg-BRAND-700 dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                                        <FiUsers className="w-6 h-6 mb-1" />
                                        <span className="text-xs text-center">House Account</span>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </Card>
                </div>
            </Modal.Body>

            {/* <Modal
                show={isCouponOpen}
                onClose={() => setIsCouponOpen(false)}
                className="bg-black/50 dark:bg-black/70 backdrop-blur-md transition-all duration-300 ease-out"
                position="center"
                aria-labelledby="coupon-modal-title"
            >
                <Modal.Header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 xs:px-5 sm:px-6 py-3 sm:py-4">
                    <h1
                        id="coupon-modal-title"
                        className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
                    >
                        Choose Your Coupon
                    </h1>
                </Modal.Header>

                <Modal.Body className="bg-gray-50 dark:bg-gray-950 p-4 xs:p-5 sm:p-6 md:p-8 max-h-[70vh] xs:max-h-[65vh] overflow-y-auto">
                    {couponList.length > 0 ? (
                        <div className="flex flex-col gap-4 xs:gap-5 sm:gap-6">
                            {couponList.map((coupon: any) => {
                                const isSelected = paymentObj?.selectedCoupon?._id === coupon._id;
                                const isDisabled = coupon.isExpire || !coupon.isActive || coupon.minOrderAmount > formData.orderTotalAmount;

                                return (
                                    <div
                                        key={coupon._id}
                                        onClick={() => !isDisabled && handleSelectCoupon(coupon)}
                                        className={`relative p-2 xs:p-2 rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer ${isDisabled
                                            ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md hover:-translate-y-0.5'
                                            } ${isSelected ? 'ring-2 ring-BRAND-500 dark:ring-BRAND-400' : ''}`}
                                    >
                                        <div className="absolute top-2 xs:top-3 left-2 xs:left-3">
                                            <span
                                                className={`text-[10px] xs:text-xs font-medium uppercase px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full transition-colors ${coupon.discountType === 'fixed'
                                                    ? 'bg-BRAND-100 dark:bg-BRAND-900/50 text-BRAND-700 dark:text-BRAND-300'
                                                    : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                                                    }`}
                                            >
                                                {coupon.discountType === 'fixed' ? 'Flat' : 'Percent'}
                                            </span>
                                        </div>

                                        <div className="absolute top-2 xs:top-3 right-2 xs:right-3">
                                            <span
                                                className={`text-[10px] xs:text-xs font-medium px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full ${coupon.isExpire
                                                    ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                                                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                                    }`}
                                            >
                                                {coupon.isExpire ? 'Expired' : 'Active'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between mt-8 xs:mt-10">
                                            <div>
                                                <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                                    {coupon.code}
                                                </h2>
                                            </div>
                                            <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-BRAND-600 dark:text-BRAND-400">
                                                {coupon.discountType === 'fixed'
                                                    ? `$${coupon.discountValue} OFF`
                                                    : `${coupon.discountValue}% OFF`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 xs:py-10 text-gray-500 dark:text-gray-400">
                            <p className="text-sm xs:text-base sm:text-lg">No coupons available at the moment.</p>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="bg-white dark:bg-gray-900 px-4 xs:px-5 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 xs:gap-3">
                    <Button
                        onClick={() => setIsCouponOpen(false)}
                        className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:!bg-gray-300 dark:hover:bg-gray-700 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg transition-colors focus:!ring-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!paymentObj?.selectedCoupon}
                        onClick={() => applyCoupon(paymentObj?.selectedCoupon)}
                        className="bg-BRAND-500 dark:bg-BRAND-600 text-white dark:text-gray-100 hover:!bg-BRAND-600 dark:hover:!bg-BRAND-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg transition-colors focus:!ring-0"
                    >
                        Apply Coupon
                    </Button>
                </Modal.Footer>
            </Modal> */}
        </Modal>
    );
};

export default PaymentModal;
