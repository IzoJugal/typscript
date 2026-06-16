import { useCallback, useEffect, useState } from "react";
import { Button, Card, Label, Modal, TextInput, Tooltip } from "flowbite-react";
import { QrCodeIcon } from "lucide-react";
import { usePOS } from "../../context/POSProvider";
import { QRCodeSVG } from "qrcode.react";
import { paymentMethods } from "../../utils/common/constant";
import detectIssuer, { generateUpiUrl } from "../../utils/utility";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { FiCreditCard, FiTag, FiGift, FiUsers } from "react-icons/fi";
import SettingsPOS from "./SettingsPOS";
import { MdPayments } from "react-icons/md";
import { TbCreditCardPay } from "react-icons/tb";
import { BiSolidIdCard } from "react-icons/bi";
import { GiMoneyStack } from "react-icons/gi";

const handleAmountInput = (
  value: string,
  setter: React.Dispatch<React.SetStateAction<string>>
) => {
  if (value === "") {
    setter("");
    return;
  }

  const num = Number(value);

  if (num < 0) return;

  setter(value);
};

const PaymentPage = ({ sendOrder, setOpenPayment }: any) => {
  const { rawPayload, setRawPayload, posLocalData, selectedRestaurant, setPosLocalData, currency, selectedCustomer } = usePOS();
  const totalAmount = Number(rawPayload?.orderTotalAmount);
  const [activeTab, setActiveTab] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardType, setCardType] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isCouponOpen, setIsCouponOpen] = useState<boolean>(false);
  const [couponList, setCouponList] = useState<any>([]);
  const [isDiscountOpen, setIsDiscountOpen] = useState<boolean>(false);
  // const [discountList, setDiscountList] = useState<any>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  // const [paidAmount, setPaidAmount] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [tenderAmount, setTenderAmount] = useState(0);
  // const qrValue = "https://admin.firepaypos.com";
  const restaurantUpiId = selectedRestaurant?.paymentCredentials?.upiId;

  useEffect(() => {
    if (!rawPayload) return;
    const order = rawPayload?.isTaxExemption ? Number(rawPayload?.orderTotalAmount) - Number(rawPayload?.totalTax) || 0 : Number(rawPayload?.orderTotalAmount) || 0;
    const due = Number((order - (rawPayload?.paidAmount ?? 0)).toFixed(2));
    // setPaidAmount(rawPayload?.paidAmount);
    setDueAmount(due);
    setTenderAmount(due);
  }, [rawPayload]);

  useEffect(() => {
    if (activeTab === "cash") {
      setCashReceived(dueAmount > 0 ? dueAmount.toString() : "");
    }
  }, [activeTab, dueAmount]);

  const paidAmount = rawPayload?.multipleMethods?.length > 0
    ? rawPayload.multipleMethods.reduce((sum: number, x: any) => {
      const amount = Number(x.amount) || 0;
      if (x.entryType === 'credit') {
        return sum + amount;
      } else if (x.entryType === 'debit') {
        return sum - amount;
      }
      return sum;
    }, 0).toFixed(2)
    : "0.00";


  const calculateChange = useCallback(() => {
    const cash = parseFloat(cashReceived) || 0;
    if (rawPayload?.multipleMethods?.length > 0) {
      return cash >= (Number(rawPayload?.orderTotalAmount) - paidAmount) ? (cash - (Number(rawPayload?.orderTotalAmount) - paidAmount)).toFixed(2) : "0.00";
    }
    return cash >= totalAmount ? (cash - totalAmount).toFixed(2) : "0.00";
  }, [cashReceived]);

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

  const handlePayment = (method: string) => {
    if (!validateInputs()) return;

    setIsLoading(true);
    let updatedPayload: any = {
      ...rawPayload,
      isPay: true,
      paymentMethod: method,
    };

    const methodSpecificData: Record<string, any> = {
      [paymentMethods.CASH]: {
        tenderAmount: cashReceived,
        change: calculateChange(),
        terminalType: 'CASH'
      },
      [paymentMethods.CARD]: {
        tenderAmount: cashReceived,
        cardNumber,
        cardType,
        referenceCode: 'TEST_REF_1234',
        authCode: 'TEST_AUTH_1234',
      },
      [paymentMethods.QR]: {
        // tenderAmount: totalAmount,
      },
      [paymentMethods.PROVIDER]: {
        paymentMethod: paymentMethods.CARD,
        tenderAmount: tenderAmount,
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
      [paymentMethods.HOUSE_ACCOUNT]: {
        paymentMethod: paymentMethods.HOUSE_ACCOUNT,
        tenderAmount: houseAccountPayableAmount,
      },
    };

    updatedPayload = {
      ...updatedPayload,
      ...methodSpecificData[method],
    };

    setRawPayload(updatedPayload);
    sendOrder({ updatedPayload, isPay: true });
    setError("");
    setCashReceived("");
    setTimeout(() => setIsLoading(false), 1000);
    setOpenPayment(false);
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

  const handleCoupon = async () => {
    getCoupons();
    setIsCouponOpen(true);
  }

  // const handleDiscount = async () => {
  //   await getDiscounts();
  //   setIsDiscountOpen(true);
  // }

  const getCoupons = async () => {
    try {
      const { data } = await apiClient.get(`/coupons/?restaurant=${selectedRestaurant?._id}`);
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

  // const getDiscounts = async () => {
  //   try {
  //     const queryParams = `?restaurant=${selectedRestaurant?._id}`;
  //     const { data } = await apiClient.get(`/discount${queryParams}`);
  //     if (data.success) {
  //       const { discounts } = data;
  //       const now = new Date();
  //       const activeDiscounts = discounts.filter((discount: any) => {
  //         const start = new Date(discount.startDate);
  //         const end = new Date(discount.endDate);
  //         return now >= start && now <= end;
  //       });
  //       setDiscountList(activeDiscounts);
  //     } else {
  //       console.log(data?.message);
  //     }
  //   } catch (error: any) {
  //     console.error("Error fetching discounts:", error.message);
  //   }
  // };

  const handleSelectCoupon = (coupon: any) => {
    if (coupon.isExpire || !coupon.isActive) return;
    setPosLocalData((prev: any) => ({ ...prev, selectedCoupon: coupon }));
  };

  const applyCoupon = (coupon: any) => {
    const orderSubTotal = parseFloat(rawPayload?.orderSubTotal) || 0;
    const totalTax = parseFloat(rawPayload?.totalTax) || 0;
    const gratuityAmount = parseFloat(rawPayload?.gratuityAmount) || 0;

    const orderTotal = orderSubTotal + totalTax + gratuityAmount;

    // let orderTotal = rawTotal;
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
    // console.log("finalTotal", finalTotal);

    setPosLocalData((prev: any) => ({ ...prev, selectedCoupon: coupon }));

    // 7. Apply coupon updates
    setRawPayload((prev: any) => ({
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
    const orderSubTotal = parseFloat(rawPayload?.orderSubTotal) || 0;
    const totalTax = parseFloat(rawPayload?.totalTax) || 0;
    const gratuityAmount = parseFloat(rawPayload?.gratuityAmount) || 0;

    const rawTotal = orderSubTotal + totalTax + gratuityAmount;
    setPosLocalData((prev: any) => {
      const { selectedCoupon, ...rest } = prev;
      return rest;
    });

    setRawPayload((prev: any) => {
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
  }

  const applyDiscount = () => {
    if (!selectedDiscount) return;

    const orderSubTotal = parseFloat(rawPayload?.orderSubTotal) || 0;
    const totalTax = parseFloat(rawPayload?.totalTax) || 0;
    const gratuityAmount = parseFloat(rawPayload?.gratuityAmount) || 0;

    const orderTotal = orderSubTotal + totalTax + gratuityAmount;

    let discountAmount = 0;
    const value = selectedDiscount.discountAmount;

    if (selectedDiscount.discountType === "percentage") {
      discountAmount = (value / 100) * orderTotal;
    } else {
      discountAmount = value;
    }

    discountAmount = Math.min(discountAmount, orderTotal);

    const finalTotal = orderTotal - discountAmount;

    setPosLocalData((prev: any) => ({ ...prev, appliedDiscount: { ...selectedDiscount, amount: discountAmount } }));

    setRawPayload((prev: any) => ({
      ...prev,
      discountAmount: discountAmount.toFixed(2),
      orderDiscountAmount: discountAmount.toFixed(2),
      orderTotalAmount: finalTotal.toFixed(2),
    }));

    setIsDiscountOpen(false);
    setSelectedDiscount(null);
  };

  const removeDiscount = () => {
    const orderSubTotal = parseFloat(rawPayload?.orderSubTotal) || 0;
    const totalTax = parseFloat(rawPayload?.totalTax) || 0;
    const gratuityAmount = parseFloat(rawPayload?.gratuityAmount) || 0;

    const rawTotal = orderSubTotal + totalTax + gratuityAmount;
    setPosLocalData((prev: any) => {
      const { appliedDiscount, ...rest } = prev;
      return rest;
    });

    setRawPayload((prev: any) => {
      const { discountAmount, orderDiscountAmount, ...rest } = prev;
      return {
        ...rest,
        orderTotalAmount: rawTotal.toFixed(2),
      };
    });
  }

  const qrValue = generateUpiUrl({
    upiId: restaurantUpiId,
    name: selectedRestaurant?.name,
    amount: Number((rawPayload?.orderTotalAmount - (paidAmount ?? 0)).toFixed(2)),
    txnId: "IZOTXN456",
    refId: rawPayload?.orderName,
    date: rawPayload?.orderDate,
  });

  const customerHasHouseAccount: boolean = selectedCustomer?.hasHouseAccount || false;
  const customerHouseAccountInfo: any = selectedCustomer?.houseAccount;

  const currentBalance = customerHouseAccountInfo?.currentBalance || 0;
  const dueBalance = customerHouseAccountInfo?.dueBalance || 0;
  const creditLimit = customerHouseAccountInfo?.creditlimit || 0;

  const spareCredit = creditLimit - dueBalance;
  const availableHouseAccountAmount = currentBalance + spareCredit;

  const canPayWithHouseAccount = customerHasHouseAccount && availableHouseAccountAmount > 0;

  const orderRemainingAmount = dueAmount ?? 0;
  const houseAccountPayableAmount = Math.min(orderRemainingAmount, availableHouseAccountAmount);

  return (
    <Modal
      show={posLocalData.isOpenPayment}
      onClose={() => {
        setPosLocalData((prev: any) => ({ ...prev, isOpenPayment: false }));
        setCashReceived("");
      }}
      className="bg-black/60 dark:bg-black/70 backdrop-blur-lg backdrop-filter brightness-95 contrast-90 transition-all duration-500 ease-in-out"
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
          <Card className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 transition-opacity duration-300 ${rawPayload?.orderTotalAmount <= paidAmount ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="w-full mx-auto grid md:grid-cols-3 gap-8">

              {/* Payment Methods */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { key: "cash", label: "Cash", icon: <GiMoneyStack className="w-5 h-5" /> },
                    { key: "provider", label: "Provider", icon: <TbCreditCardPay className="w-5 h-5" /> },
                    // { key: "card", label: "Card", icon: <CreditCardIcon className="w-5 h-5" /> },
                    { key: "qr", label: "QR Code", icon: <QrCodeIcon className="w-5 h-5" /> },
                    { key: "house_account", label: "House Account", icon: <BiSolidIdCard className="w-5 h-5" /> },
                  ].filter(({ key }) => {
                    if (key === "house_account") return customerHasHouseAccount;
                    return true;
                  }).map(({ key, label, icon }) => (
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cash Payment</h2>
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
                        value={cashReceived}
                        onChange={(e) => {
                          handleAmountInput(e.target.value, setCashReceived);

                          if (!e.target.value) {
                            setError("Cash Received is required.");
                          } else {
                            setError("");
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
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
                      Change: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currency?.symbol || "$"}{calculateChange()}</span>
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
                        id="cash-received"
                        placeholder="Enter amount (e.g., 50.00)"
                        value={cashReceived || dueAmount}
                        onChange={(e) => {
                          handleAmountInput(e.target.value, setCashReceived);

                          if (!e.target.value) {
                            setError("Amount is required.");
                          } else {
                            setError("");
                          }
                        }}
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                        }}
                        className="mt-2 transition-all duration-300"
                        color={error && !cashReceived ? "failure" : "gray"}
                        type="number"
                        step="0.01"
                        aria-required="true"
                        autoFocus
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
                      {selectedRestaurant?.paymentCredentials?.upiId ? (
                        <>
                          {/* {console.log("✅ QR Code block rendered")} */}
                          <QRCodeSVG
                            value={qrValue || ""}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                            marginSize={2}
                            className="rounded-xl border-4 border-BRAND-100 dark:border-BRAND-900 transition-all duration-300"
                          />
                        </>
                      ) : (
                        <p>UPI payment is not available for this restaurant at the moment.</p>
                      )}
                    </div>
                    <Button
                      color="info"
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1 transition-all duration-300 transform hover:scale-105 focus:!ring-0"
                      onClick={() => handlePayment(paymentMethods.QR)}
                      // disabled={isLoading}
                      disabled
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
                      onClick={() => handlePayment(paymentMethods.PROVIDER)}
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
                        `Confirm payment ${currency?.symbol}${(dueAmount ?? 0).toFixed(2)}`
                      )}
                    </Button>
                  </div>
                )}

                {activeTab === "house_account" && customerHasHouseAccount && (
                  <div className="w-full mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6 text-center animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pay with House Account</h2>
                    {!selectedCustomer ? (
                      <h2 className="text-base font-semibold text-yellow-600 dark:text-yellow-400">
                        Please choose a customer to proceed with House Account payment.
                      </h2>
                    ) : !customerHasHouseAccount ? (
                      <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
                        Selected customer does not have a House Account. Please choose a different method.
                      </h2>
                    ) : !canPayWithHouseAccount ? (
                      <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
                        The customer has insufficient balance and their credit limit would be exceeded. Please choose a different payment method.
                      </h2>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Complete your payment using House Account.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong className="font-medium">Current Balance:</strong> ${currentBalance.toFixed(2)} |{" "}
                          <strong className="font-medium">Due Balance:</strong> ${dueBalance.toFixed(2)} |{" "}
                          <strong className="font-medium">Credit Limit:</strong> ${creditLimit.toFixed(2)}
                        </p>
                        <Button
                          color="info"
                          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-1 transition-all duration-300 transform hover:scale-105 focus:!ring-0"
                          onClick={() => handlePayment(paymentMethods.HOUSE_ACCOUNT)}
                          disabled={!canPayWithHouseAccount}
                          aria-label="Payment by house account"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                              </svg>
                              Paying by house account...
                            </span>
                          ) : (
                            `Confirm payment $${houseAccountPayableAmount.toFixed(2)}`
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}

              </div>

              {/* Order Summary */}
              <div className="space-y-6 border border-gray-200 dark:border-gray-700 p-6 rounded-lg bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-700 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Order Summary</h2>

                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Items Total</span><span>{currency?.symbol || "$"}{rawPayload?.orderSubTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <Tooltip content={rawPayload?.taxExemptionReason || 'Tax Exemption'} placement="top">
                      {rawPayload.isTaxExemption ? (
                        <span className="flex gap-2">
                          <span className="line-through text-gray-500 text-sm">{currency?.symbol || "$"}{rawPayload?.totalTax}</span>
                          <span className="text-green-500 font-semibold">Tax Free</span>
                        </span>
                      ) : (
                        <span>{currency?.symbol}{rawPayload?.totalTax}</span>
                      )}
                    </Tooltip>
                  </div>
                  {/* <div className="flex justify-between">
                    <span>Tax</span><span>${rawPayload?.totalTax}</span>
                  </div> */}
                  {rawPayload?.couponId && (
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
                          Coupon ({rawPayload?.couponCode || ''})
                        </span>
                        <span className="text-green-500">- {currency?.symbol || "$"}{rawPayload?.couponAmount}</span>
                      </div>
                    </div>
                  )}

                  {posLocalData?.appliedDiscount && (
                    <div className="relative group rounded-md -p-3">
                      <button
                        onClick={removeDiscount}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs w-5 h-5 flex items-center justify-center z-10"
                        aria-label="Remove discount"
                        title="Remove discount"
                      >
                        <span className="mb-1">x</span>
                      </button>

                      <div className="flex justify-between text-sm text-gray-800 dark:text-gray-200">
                        <span>
                          Discount ({posLocalData.appliedDiscount.discountType === 'percentage' ? `${posLocalData.appliedDiscount.discountAmount}%` : `${currency?.symbol || "$"}${posLocalData.appliedDiscount.discountAmount}`})
                        </span>
                        <span className="text-green-500">- {currency?.symbol || "$"}{posLocalData.appliedDiscount.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                    {/* <span>Order Total</span><span>${rawPayload?.orderTotalAmount}</span> */}
                    <span>Order Total</span><span>{currency?.symbol || "$"}{rawPayload?.isTaxExemption ? rawPayload?.orderSubTotal : rawPayload?.orderTotalAmount}</span>
                  </div>

                  {(rawPayload?._id && rawPayload?.multipleMethods?.length > 0) &&
                    <div className="flex justify-between -font-semibold ">
                      <span>Paid</span><span>{currency?.symbol || "$"}{paidAmount}</span>
                    </div>
                  }
                  <hr />

                  {<div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                    <span className="text-emerald-500">Payable Amount</span><span className="text-emerald-500 text-lg">{currency?.symbol || "$"}{dueAmount.toFixed(2)}</span>
                  </div>}
                </div>

                <div className="grid grid-cols-2 gap-2 justify-center">
                  <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                    <FiCreditCard className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">Pre Auth</span>
                  </div>

                  <div
                    onClick={handleCoupon}
                    className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400"
                  >
                    <FiTag className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">Coupons</span>
                  </div>

                  {/* <div
                    onClick={handleDiscount}
                    className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400"
                  >
                    <FiPercent className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">Discount</span>
                  </div> */}

                  <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                    <FiGift className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">Gift Card</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                    <FiUsers className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">House Account</span>
                  </div>
                  <div onClick={() => setOpenSettings(true)} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-DARK-700 text-DARK-800 font-semibold dark:text-gray-100 hover:bg-BRAND-500 hover:text-white dark:hover:bg-BRAND-600 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400">
                    <MdPayments className="w-6 h-6 mb-1" />
                    <span className="text-xs text-center">Providers</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Modal.Body>

      <Modal
        show={isCouponOpen}
        onClose={() => setIsCouponOpen(false)}
        className="bg-black/50 dark:bg-black/70 backdrop-blur-md transition-all duration-300 ease-out"
        position="center"
        aria-labelledby="coupon-modal-title"
      >
        {/* Header */}
        <Modal.Header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 xs:px-5 sm:px-6 py-3 sm:py-4">
          <h2
            id="coupon-modal-title"
            className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
          >
            Choose Your Coupon
          </h2>
        </Modal.Header>

        {/* Body */}
        <Modal.Body className="bg-gray-50 dark:bg-gray-950 p-4 xs:p-5 sm:p-6 md:p-8 max-h-[70vh] xs:max-h-[65vh] overflow-y-auto">
          {couponList.length > 0 ? (
            <div className="flex flex-col gap-4 xs:gap-5 sm:gap-6">
              {couponList.map((coupon: any) => {
                const isSelected = posLocalData?.selectedCoupon?._id === coupon._id;
                const isDisabled = coupon.isExpire || !coupon.isActive || coupon.minOrderAmount > rawPayload.orderTotalAmount;

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
                          ? `${currency?.symbol || "$"}${coupon.discountValue} OFF`
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

      <Modal
        show={isDiscountOpen}
        onClose={() => {
          setIsDiscountOpen(false);
          setSelectedDiscount(null);
        }}
        className="bg-black/50 dark:bg-black/70 backdrop-blur-md transition-all duration-300 ease-out"
        position="center"
        aria-labelledby="discount-modal-title"
      >
        <Modal.Header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 xs:px-5 sm:px-6 py-3 sm:py-4">
          <h2
            id="discount-modal-title"
            className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
          >
            Choose Your Discount
          </h2>
        </Modal.Header>

        {/* <Modal.Body className="bg-gray-50 dark:bg-gray-950 p-4 xs:p-5 sm:p-6 md:p-8 max-h-[70vh] xs:max-h-[65vh] overflow-y-auto">
          {discountList.length > 0 ? (
            <div className="flex flex-col gap-4 xs:gap-5 sm:gap-6">
              {discountList.map((discount: any) => {
                const isSelected = selectedDiscount?._id === discount._id;

                return (
                  <div
                    key={discount._id}
                    onClick={() => setSelectedDiscount(discount)}
                    className={`relative p-2 xs:p-2 rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-BRAND-500 dark:ring-BRAND-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md hover:-translate-y-0.5'}`}
                  >
                    <div className="absolute top-2 xs:top-3 left-2 xs:left-3">
                      <span
                        className={`text-[10px] xs:text-xs font-medium uppercase px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full transition-colors ${discount.discountType === 'percentage'
                          ? 'bg-BRAND-100 dark:bg-BRAND-900/50 text-BRAND-700 dark:text-BRAND-300'
                          : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                          }`}
                      >
                        {discount.discountType === 'percentage' ? 'Percent' : 'Fixed'}
                      </span>
                    </div>

                    <div className="absolute top-2 xs:top-3 right-2 xs:right-3">
                      <span
                        className="text-[10px] xs:text-xs font-medium px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                      >
                        Active
                      </span>
                    </div>

                    <div className="flex justify-between mt-8 xs:mt-10">
                      <div>
                        <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                          {discount.discountType === 'percentage' ? 'Percentage Discount' : 'Fixed Discount'}
                        </h2>
                      </div>
                      <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-BRAND-600 dark:text-BRAND-400">
                        {discount.discountType === 'percentage'
                          ? `${discount.discountAmount}% OFF`
                          : `${currency?.symbol || "$"}${discount.discountAmount} OFF`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 xs:py-10 text-gray-500 dark:text-gray-400">
              <p className="text-sm xs:text-base sm:text-lg">No active discounts available at the moment.</p>
            </div>
          )}
        </Modal.Body> */}

        <Modal.Footer className="bg-white dark:bg-gray-900 px-4 xs:px-5 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 xs:gap-3">
          <Button
            onClick={() => {
              setIsDiscountOpen(false);
              setSelectedDiscount(null);
            }}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:!bg-gray-300 dark:hover:bg-gray-700 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg transition-colors focus:!ring-0"
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedDiscount}
            onClick={applyDiscount}
            className="bg-BRAND-500 dark:bg-BRAND-600 text-white dark:text-gray-100 hover:!bg-BRAND-600 dark:hover:!bg-BRAND-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg transition-colors focus:!ring-0"
          >
            Apply Discount
          </Button>
        </Modal.Footer>
      </Modal>

      <SettingsPOS {...{ openSettings, setOpenSettings }} />
    </Modal>
  );
};

export default PaymentPage;