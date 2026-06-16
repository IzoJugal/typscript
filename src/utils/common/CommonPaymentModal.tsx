import { Button, Card, Label, Modal, TextInput } from "flowbite-react";
import { CreditCardIcon, DollarSignIcon, QrCodeIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { paymentMethods as paymentTypes } from "../../utils/common/constant";
import { MdCardGiftcard, MdPayments } from "react-icons/md";
import { TbCreditCardPay } from "react-icons/tb";
import { FaCreditCard } from "react-icons/fa";
import { BiSolidIdCard } from "react-icons/bi";
import { usePOS } from "../../context/POSProvider";
import apiClient from "../AxiosInstance";
import { useAuth } from "../../context/AuthProvider";
import { FiCreditCard, FiGift, FiTag, FiUsers } from "react-icons/fi";
import { toast } from "react-toastify";
import SettingsPOS from "../../components/pos-app/SettingsPOS";
import NumberInputPOS from "./NumberInputPOS";


// Utility to access nested keys like "package.price"
const getValueByKey = (obj: any, path: string): any =>
    path.split('.').reduce((acc, key) => acc?.[key], obj);

export type PayTypes = Lowercase<`${paymentTypes}`>;
export interface PaymentMethodConfig {
    key: string;
    label: string;
    icon: React.ReactNode;
    fields: PayTypes;
}


// export type PayTypes = "cash" | "card" | "qr" | "gift_card" | "house_account" | "netbanking" | "provider";

// interface IFormData {
//     customer?: string;
//     company?: string;
//     restaurant?: string;
//     amount?: number;
//     change?: number
//     paymentMethod?: {
//         method: string;
//         amount?: number;
//         cardNumber?: string;
//         cardType?: string;
//     }
// }

interface CommonPaymentModalProps {
    open: boolean;
    onClose: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;

    amountKey: string;
    paymentDataKey?: string;
    changeAmountKey?: string;

    paymentMethods?: string[];

    onSubmit: (payload: any, method?: string) => Promise<void>;

    title?: string;
    summaryTitle?: string;

    visibleOptions?: string[];
}

const createPaymentMethod = (
    method: paymentTypes,
    label: string,
    icon: React.ReactNode
): PaymentMethodConfig => ({
    key: method.toLowerCase(),
    label,
    icon,
    fields: method.toLowerCase() as PayTypes,
});


const defaultPaymentMethods: PaymentMethodConfig[] = [
    createPaymentMethod(paymentTypes.CASH, "Cash", <DollarSignIcon className="w-5 h-5" />),
    createPaymentMethod(paymentTypes.CARD, "Card", <CreditCardIcon className="w-5 h-5" />),
    createPaymentMethod(paymentTypes.QR, "QR", <QrCodeIcon className="w-5 h-5" />),
    createPaymentMethod(paymentTypes.PROVIDER, "Provider", <TbCreditCardPay className="w-5 h-5" />),
    createPaymentMethod(paymentTypes.HOUSE_ACCOUNT, "House Account", <BiSolidIdCard className="w-5 h-5" />),
    createPaymentMethod(paymentTypes.NETBANKING, "Net Banking", <FaCreditCard className="w-5 h-5" />),
    createPaymentMethod(paymentTypes.GIFT_CARD, "Gift Card", <MdCardGiftcard className="w-5 h-5" />),
];

const CommonPaymentModal = ({
    open,
    onClose,
    formData,
    setFormData,
    amountKey,
    paymentDataKey = "",
    paymentMethods,
    changeAmountKey,
    onSubmit,
    title = "Complete Payment",
    summaryTitle = "Payment Summary",
    visibleOptions = []
}: CommonPaymentModalProps) => {

    let payMethods;

    if (paymentMethods && paymentMethods?.length > 0) {
        const allowed = paymentMethods.map((type) => type.toLowerCase());

        payMethods = defaultPaymentMethods.filter(method =>
            allowed.includes(method.key.toLowerCase())
        );
    } else {
        payMethods = defaultPaymentMethods;
    };

    const { posLocalData, setPosLocalData, posDeviceId } = usePOS();

    const [activeTab, setActiveTab] = useState(payMethods[0]?.key || "cash");
    const [cashReceived, setCashReceived] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [cardType, setCardType] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);
    const qrValue = "https://admin.firepaypos.com";
    const [isCouponOpen, setIsCouponOpen] = useState<boolean>(false);
    const [couponList, setCouponList] = useState<any>([]);

    const { userData } = useAuth();
    const restaurantId = userData?.staffMember?.restaurant?._id || '';

    const fetchPaymentTerminals = useCallback(async () => {
        try {
            const response = await apiClient.get(`payment/device-list/${restaurantId}/${posDeviceId}`);
            const { success, devices } = response.data;
            if (success) {
                setPosLocalData((prev: any) => ({
                    ...prev,
                    allPaymentProviders: devices,
                }));
            }
        } catch (error: any) {
            console.error("Error fetching payment terminals:", error?.message);
        }
    }, []);

    const getPosDeviceDetails = useCallback(async () => {
        try {
            const response = await apiClient.get(`/device/app/${posDeviceId}`);
            const { success, data: posDevice } = response.data;
            if (success) {
                setPosLocalData((prev: any) => ({
                    ...prev,
                    posDeviceDetails: posDevice,
                    selectedPaymentProvider: {
                        provider: posDevice.defaultProvider,
                        terminal: posDevice.defaultTerminal
                    }
                }));
            }
        } catch (error: any) {
            console.error("Failed to fetch POS device details:", error.message);
        }
    }, []);

    useEffect(() => {
        fetchPaymentTerminals();
        getPosDeviceDetails();
    }, [fetchPaymentTerminals, getPosDeviceDetails]);

    const totalAmount = Number(getValueByKey(formData, amountKey) || 0);

    const multipleMethods = paymentDataKey
        ? getValueByKey(formData, `${paymentDataKey}`) || []
        : formData?.multipleMethods || [];

    const normalizeToArray = (input: any): any[] => {
        if (!input) return [];
        return Array.isArray(input) ? input : [input];
    };

    const methods = normalizeToArray(multipleMethods);

    const paidAmount = methods.reduce((sum: number, x: any) => {
        const amount = Number(x.amount) || 0;
        return x.entryType === 'credit'
            ? sum + amount
            : x.entryType === 'debit'
                ? sum - amount
                : sum;
    }, 0);


    const setValueByKey = (obj: any, path: string, value: any): any => {
        const keys = path.split(".");
        const lastKey = keys.pop();
        const nested = keys.reduce((acc, key) => {
            if (!acc[key]) acc[key] = {};
            return acc[key];
        }, obj);
        if (lastKey) nested[lastKey] = value;
        return { ...obj };
    };


    const calculateChange = () => {
        const cash = parseFloat(cashReceived) || 0;

        const comparisonAmount = totalAmount;
        const remainingAmount = Math.max(comparisonAmount - paidAmount, 0);

        return cash >= remainingAmount
            ? (cash - remainingAmount).toFixed(2)
            : "0.00";
    };

    const validateInputs = () => {
        if (activeTab === "cash" && !cashReceived) {
            setError("Cash Received is required.");
            return false;
        }
        if (activeTab === "card" && (!cardNumber || !cardHolder || !expiryDate || !cvv)) {
            setError("Fill required card fields.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (type?: string) => {
        if (!validateInputs()) return;

        setIsLoading(true);
        const method = activeTab;

        const methodPayloads: Record<string, any> = {
            cash: {
                method: paymentTypes.CASH,
                tenderAmount: cashReceived,
                change: calculateChange(),
            },
            card: {
                method: paymentTypes.CARD,
                amount: formData?.[amountKey],
                cardNumber,
                cardType,
                referenceCode: "TEST_REF_1234",
                authCode: "TEST_AUTH_1234",
            },
            qr: {
                scanned: true,
            },
            provider: {
                method: paymentTypes.PROVIDER,
                amount: formData?.[amountKey],
                terminalType: posLocalData?.selectedPaymentProvider?.provider,
                ...(posLocalData?.selectedPaymentProvider?.provider?.toLowerCase() === 'pax' && {
                    referenceCode: 'TEST_REF_1234',
                    authCode: 'TEST_AUTH_1234',
                }),
                ...(posLocalData?.selectedPaymentProvider?.provider?.toLowerCase() === 'dejavoo' && {
                    dejavoo_tpn: posLocalData?.selectedPaymentProvider?.terminal?.dejavoo_tpn,
                    dejavoo_auth_key: posLocalData?.selectedPaymentProvider?.terminal?.dejavoo_auth_key,
                }),
            },
        };

        const methodData = methodPayloads[method];

        let updatedFormData = formData;

        // Set tenderAmount
        if (paymentDataKey) {
            updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.amount`, methodData.tenderAmount || "");
            updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.method`, methodData.method);
            updatedFormData = setValueByKey(updatedFormData, `${changeAmountKey}`, methodData.change || "0.00");

            // Set additional card fields if method is card
            if (type === "CARD") {
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.amount`, methodData.amount);
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.cardNumber`, methodData.cardNumber);
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.cardType`, methodData.cardType);
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.referenceCode`, methodData.referenceCode);
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.authCode`, methodData.authCode);
            }

            // set additional provider fields if method is provider
            if (type === "PROVIDER") {
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.amount`, methodData.amount);
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.method`, methodData.method);
                updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.terminalType`, methodData.terminalType);

                if (methodData.referenceCode) {
                    updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.referenceCode`, methodData.referenceCode);
                }

                if (methodData.authCode) {
                    updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.authCode`, methodData.authCode);
                }

                if (methodData.dejavoo_tpn) {
                    updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.dejavoo_tpn`, methodData.dejavoo_tpn);
                }

                if (methodData.dejavoo_auth_key) {
                    updatedFormData = setValueByKey(updatedFormData, `${paymentDataKey}.dejavoo_auth_key`, methodData.dejavoo_auth_key);
                }
            }
        }

        setFormData((prev: any) => ({
            ...prev,
            ...updatedFormData,
        }));

        try {
            await onSubmit(updatedFormData);
            // onClose();
            handleModalClose();
        } catch (err: any) {
            console.log(" Common Payment Modal handleSubmit error : ", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExpiryChange = (e: any) => {
        let input = e.target.value.replace(/\D/g, '');
        if (input.length > 4) input = input.slice(0, 4);
        if (input.length >= 3) input = `${input.slice(0, 2)}/${input.slice(2)}`;
        setExpiryDate(input);
    };

    const handleModalClose = () => {
        setError("");
        onClose();
        setActiveTab('cash');
        setCashReceived('');
        setCardNumber('');
        setCardHolder('');
        setExpiryDate('');
        setCvv('');
        setCardType('');
    };

    const getCoupons = async () => {
        try {
            const { data } = await apiClient.get(`/coupons/?restaurant=${restaurantId}`);
            if (data.success) {
                const { coupons } = data;
                setCouponList(coupons);
            } else {
                console.log(data?.message);
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    };

    const handleCoupon = async () => {
        getCoupons();
        setIsCouponOpen(true);
    };

    const handleSelectCoupon = (coupon: any) => {
        if (coupon.isExpire || !coupon.isActive) return;
        setPosLocalData((prev: any) => ({ ...prev, selectedCoupon: coupon }));
    };

    const applyCoupon = (coupon: any) => {
        const subTotal = parseFloat(formData?.[amountKey]) || 0;
        const totalTax = parseFloat(formData?.totalTax) || 0;
        const gratuityAmount = parseFloat(formData?.gratuityAmount) || 0;

        const rawTotal = subTotal + totalTax + gratuityAmount;

        const total = rawTotal;
        let discountAmount = 0;

        if (!coupon?.isActive || coupon?.isExpire) {
            toast.error("This coupon is no longer active.");
            return;
        }

        const minOrder = Number(coupon?.minOrderAmount ?? 0);
        if (total < minOrder) {
            toast.error(`Minimum order amount for this coupon is $${minOrder}.`);
            return;
        }

        if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
            toast.error("This coupon has reached its usage limit.");
            return;
        }

        const discountValue = Number(coupon?.discountValue ?? 0);

        if (coupon.discountType === "percentage") {
            discountAmount = (discountValue / 100) * total;
        } else {
            discountAmount = discountValue;
        }

        const maxDiscount = Number(coupon?.maxDiscountAmount ?? discountAmount);
        discountAmount = Math.min(discountAmount, maxDiscount);

        const finalTotal = total - discountAmount;
        setPosLocalData((prev: any) => ({ ...prev, selectedCoupon: coupon }));

        // 7. Apply coupon updates
        setFormData((prev: any) => ({
            ...prev,
            couponAmount: discountAmount.toFixed(2),
            orderDiscountAmount: discountAmount.toFixed(2),
            orderTotalAmount: finalTotal.toFixed(2),
            couponId: coupon._id,
            couponCode: coupon.code,
            coupon
        }));

        setIsCouponOpen(false);
    };


    const removeCoupon = () => {
        const subTotal = parseFloat(formData?.[amountKey]) || 0;
        const totalTax = parseFloat(formData?.totalTax) || 0;
        const gratuityAmount = parseFloat(formData?.gratuityAmount) || 0;

        const rawTotal = subTotal + totalTax + gratuityAmount;
        setPosLocalData((prev: any) => {
            const { selectedCoupon, ...rest } = prev;
            return rest;
        });

        setFormData((prev: any) => {
            const { coupon, ...rest } = prev;
            return {
                ...rest,
                couponId: null,
                orderTotalAmount: rawTotal,
                orderDiscountAmount: 0,
                couponAmount: 0,
            };
        });

        setPosLocalData((prev: any) => ({ ...prev, selectedCoupon: null }));
    };

    const optionsMap: any = {
        "Pre Auth": {
            icon: <FiCreditCard className="w-6 h-6 mb-1" />,
            onClick: null,
        },
        "Coupons": {
            icon: <FiTag className="w-6 h-6 mb-1" />,
            onClick: handleCoupon,
        },
        "Gift Card": {
            icon: <FiGift className="w-6 h-6 mb-1" />,
            onClick: null,
        },
        "House Account": {
            icon: <FiUsers className="w-6 h-6 mb-1" />,
            onClick: null,
        },
        "Providers": {
            icon: <MdPayments className="w-6 h-6 mb-1" />,
            onClick: () => setOpenSettings(true),
        },
    };

    if ((payMethods?.some(method => method?.key.toLowerCase() === 'provider')) && !visibleOptions.includes('Providers')) {
        visibleOptions.push('Providers');
    };

    return (
        <>
            <Modal
                show={open}
                onClose={handleModalClose}
                size="6xl"
                className="bg-black/70 dark:bg-black/85 backdrop-blur-md transition-all duration-500 ease-in-out"
                aria-labelledby="payment-modal-title"
            >
                <Modal.Header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <span
                        id="payment-modal-title"
                        className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide"
                    >
                        {title}
                    </span>
                </Modal.Header>
                <Modal.Body className="bg-gray-50 dark:bg-gray-900 p-6 sm:p-8">
                    <div className="space-y-6 mx-auto">
                        <Card className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 transition-opacity duration-300 ${totalAmount <= paidAmount ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="w-full mx-auto grid md:grid-cols-3 gap-8">

                                {/* Payment Tabs and Forms */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Tabs */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {payMethods.map(({ key, label, icon }) => (
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

                                    {/* CASH Form */}
                                    {activeTab === "cash" && (
                                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Deposit Payment</h2>
                                            <div>
                                                <Label htmlFor="cash-received" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Cash Received <span className="text-red-500">*</span>
                                                </Label>
                                                <NumberInputPOS
                                                    id="cash-received"
                                                    value={cashReceived}
                                                    allowDecimal
                                                    maxDecimalPlaces={2}
                                                    placeholder="Enter amount received"
                                                    onChange={(value) => {
                                                        setCashReceived(value);
                                                        setError(value ? "" : "Cash Received is required.");
                                                    }}
                                                />
                                            </div>
                                            {error && <p className="text-sm text-red-500 animate-pulse">{error}</p>}
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                Change: <span className="font-semibold text-emerald-600">${calculateChange()}</span>
                                            </div>
                                            <Button
                                                onClick={() => handleSubmit(paymentTypes.CASH)}
                                                disabled={isLoading}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1"
                                            >
                                                {isLoading ? "Processing..." : "Confirm Payment"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* CARD Form */}
                                    {activeTab === "card" && (
                                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Card Payment</h2>

                                            <TextInput
                                                placeholder="Amount"
                                                type="number"
                                                value={cashReceived}
                                                onChange={(e) => setCashReceived(e.target.value)}
                                            />

                                            <TextInput
                                                placeholder="Card Number"
                                                maxLength={16}
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                            />

                                            <TextInput
                                                placeholder="Card Holder"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />

                                            <div className="flex gap-4">
                                                <TextInput
                                                    placeholder="MM/YY"
                                                    value={expiryDate}
                                                    maxLength={5}
                                                    onChange={handleExpiryChange}
                                                />
                                                <TextInput
                                                    placeholder="CVV"
                                                    type="password"
                                                    maxLength={3}
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                />
                                            </div>

                                            {error && <p className="text-sm text-red-500 animate-pulse">{error}</p>}

                                            <Button
                                                onClick={() => handleSubmit(paymentTypes.CARD)}
                                                disabled={isLoading}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1"
                                            >
                                                {isLoading ? "Processing..." : "Process Payment"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* QR Form */}
                                    {activeTab === "qr" && (
                                        <div className="text-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">QR Payment</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Scan the QR code below to complete your payment
                                            </p>
                                            <div className="flex justify-center">
                                                <QRCodeSVG value={qrValue} size={200} />
                                            </div>
                                            <Button
                                                onClick={() => handleSubmit(paymentTypes.QR)}
                                                disabled={isLoading}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1"
                                            >
                                                {isLoading ? "Processing..." : "Mark as Paid"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Provider Form */}
                                    {activeTab === "provider" && (
                                        <div className="w-full mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 text-center animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pay with {posLocalData?.selectedPaymentProvider?.provider?.toUpperCase()}</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Complete your payment via <span className="font-semibold">{posLocalData?.selectedPaymentProvider?.provider}</span>,
                                                Terminal is <span className="font-semibold">{posLocalData?.selectedPaymentProvider?.terminal?.name}</span>
                                            </p>

                                            {!posLocalData?.selectedPaymentProvider?.provider && <div onClick={() => setOpenSettings(true)} className="flex flex-col items-center justify-center p-3 bg-gray-100 dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-DARK-800 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                                                <MdPayments className="w-6 h-6 mb-1" />
                                                <span className="text-xs text-center">Choose payment provider</span>
                                            </div>}

                                            <Button
                                                color="info"
                                                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1 transition-all duration-300 transform hover:scale-105 focus:!ring-0"
                                                onClick={() => handleSubmit(paymentTypes.PROVIDER)}
                                                disabled={isLoading || (!posLocalData?.selectedPaymentProvider?.provider && !posLocalData?.selectedPaymentProvider?.terminal?.name)}
                                                aria-label="Payment by providers"
                                            >
                                                {isLoading ? (
                                                    <span className="flex items-center justify-center">
                                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                                                        </svg>
                                                        Paying by {posLocalData?.selectedPaymentProvider?.provider?.toUpperCase()}...
                                                    </span>
                                                ) : (
                                                    `Confirm payment $${(totalAmount - paidAmount).toFixed(2)}`
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {/* House Account Form */}
                                    {activeTab === "house_account" && (
                                        <div className="text-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pay With House Account</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                This payment service is currently inactive. Please choose a different payment method or contact support for assistance.
                                            </p>
                                        </div>
                                    )}

                                    {/* Gift card Form */}
                                    {activeTab === "gift_card" && (
                                        <div className="text-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pay With Gift card</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                This payment service is currently inactive. Please choose a different payment method or contact support for assistance.
                                            </p>
                                        </div>
                                    )}

                                    {/* Net Banking Form */}
                                    {activeTab === "netbanking" && (
                                        <div className="text-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pay With Net Banking</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                This payment service is currently inactive. Please choose a different payment method or contact support for assistance.
                                            </p>
                                        </div>
                                    )}

                                </div>

                                {/* Payment Summary */}
                                <div className="space-y-6 border border-gray-200 dark:border-gray-700 p-6 rounded-lg bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-700 shadow-sm">
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{summaryTitle}</h2>

                                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex justify-between">
                                            <span>Total</span><span>${totalAmount.toFixed(2)}</span>
                                        </div>
                                        {formData?.totalTax && (
                                            <div className="flex justify-between">
                                                <span>Tax</span><span>${formData?.totalTax?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {formData?.couponId && (
                                            <div className="relative group rounded-md -p-3">
                                                <button
                                                    onClick={removeCoupon}
                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs w-5 h-5 flex items-center justify-center z-10"
                                                    aria-label="Remove coupon"
                                                    title="Remove coupon"
                                                >
                                                    <span className="mb-1">x</span>
                                                </button>

                                                <div className="flex justify-between text-sm text-gray-800 dark:text-gray-200">
                                                    <span>
                                                        Coupon ({formData?.couponCode || ''})
                                                    </span>
                                                    <span className="text-green-500">- ${formData?.couponAmount}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Paid</span><span>${paidAmount.toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between font-semibold text-emerald-500 text-lg">
                                            <span>Payable Amount</span><span>${(totalAmount - paidAmount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 justify-center">
                                        {visibleOptions.map((name) => {
                                            const option = optionsMap[name];
                                            if (!option) return null; // skip invalid names

                                            return (
                                                <div
                                                    key={name}
                                                    onClick={option.onClick || undefined}
                                                    className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400"
                                                >
                                                    {option.icon}
                                                    <span className="text-xs text-center">{name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Modal.Body>

            </Modal>

            {/* Coupon modal */}
            <Modal
                show={isCouponOpen}
                onClose={() => setIsCouponOpen(false)}
                className="bg-black/50 dark:bg-black/70 backdrop-blur-md transition-all duration-300 ease-out"
                position="center"
                aria-labelledby="coupon-modal-title"
            >
                {/* Header */}
                <Modal.Header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 xs:px-5 sm:px-6 py-3 sm:py-4">
                    <h1
                        id="coupon-modal-title"
                        className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
                    >
                        Choose Your Coupon
                    </h1>
                </Modal.Header>

                {/* Body */}
                <Modal.Body className="bg-gray-50 dark:bg-gray-950 p-4 xs:p-5 sm:p-6 md:p-8 max-h-[70vh] xs:max-h-[65vh] overflow-y-auto">
                    {couponList.length > 0 ? (
                        <div className="flex flex-col gap-4 xs:gap-5 sm:gap-6">
                            {couponList.map((coupon: any) => {
                                const isSelected = posLocalData?.selectedCoupon?._id === coupon._id;
                                const isDisabled = coupon.isExpire || !coupon.isActive || coupon.minOrderAmount > (totalAmount - paidAmount);

                                return (
                                    <div
                                        key={coupon._id}
                                        onClick={() => !isDisabled && handleSelectCoupon(coupon)}
                                        className={`relative p-2 xs:p-2 rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer ${isDisabled
                                            ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md hover:-translate-y-0.5'
                                            } ${isSelected ? 'ring-2 ring-BRAND-500 dark:ring-BRAND-400' : ''}`}
                                    >
                                        {/* Ribbon Tag */}
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

                                        {/* Status Badge */}
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

                                        {/* Main content */}
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

                {/* Footer */}
                <Modal.Footer className="bg-white dark:bg-gray-900 px-4 xs:px-5 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 xs:gap-3">
                    <Button
                        onClick={() => setIsCouponOpen(false)}
                        className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:!bg-gray-300 dark:hover:bg-gray-700 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg transition-colors focus:!ring-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!posLocalData?.selectedCoupon}
                        onClick={() => applyCoupon(posLocalData?.selectedCoupon)}
                        className="bg-BRAND-500 dark:bg-BRAND-600 text-white dark:text-gray-100 hover:!bg-BRAND-600 dark:hover:!bg-BRAND-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg transition-colors focus:!ring-0"
                    >
                        Apply Coupon
                    </Button>
                </Modal.Footer>
            </Modal>

            <SettingsPOS {...{ openSettings, setOpenSettings }} />
        </>
    )
}

export default CommonPaymentModal;
