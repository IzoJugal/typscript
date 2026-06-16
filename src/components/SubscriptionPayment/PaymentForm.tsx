import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/AxiosInstance';
import { IPlan } from '../plans/Plan';
import { toast } from 'react-toastify';


const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#65359C',
            iconColor: '#65359C',
        },
    },
};

const PaymentForm = () => {

    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [cardNumberComplete, setCardNumberComplete] = useState(false);
    const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
    const [cardCvcComplete, setCardCvcComplete] = useState(false);
    const [cardNumberValid, setCardNumberValid] = useState(false);
    const [cardExpiryValid, setCardExpiryValid] = useState(false);
    const [cardCvcValid, setCardCvcValid] = useState(false);

    const [cardNumberError, setCardNumberError] = useState<string | null>(null);
    const [cardExpiryError, setCardExpiryError] = useState<string | null>(null);
    const [cardCvcError, setCardCvcError] = useState<string | null>(null);

    const companyId = localStorage.getItem("companyId");
    const storedPlan = localStorage.getItem("selectedPlan");
    const selectedPlan: IPlan | null = storedPlan ? JSON.parse(storedPlan) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) {
            console.error('Stripe or Elements not initialized');
            return;
        }

        if (
            !cardNumberComplete ||
            !cardExpiryComplete ||
            !cardCvcComplete ||
            !cardNumberValid ||
            !cardExpiryValid ||
            !cardCvcValid
        ) {
            if (!cardNumberComplete) {
                setCardNumberError("Card number is required");
            } else if (!cardNumberValid) {
                setCardNumberError("Please enter a valid card number");
            }

            if (!cardExpiryComplete) {
                setCardExpiryError("Expiry date is required");
            } else if (!cardExpiryValid) {
                setCardExpiryError("Please enter a valid expiry date");
            }

            if (!cardCvcComplete) {
                setCardCvcError("CVC is required");
            } else if (!cardCvcValid) {
                setCardCvcError("Please enter a valid CVC");
            }
            return;
        } else {
            setCardNumberError(null);
            setCardExpiryError(null);
            setCardCvcError(null);
        }

        if (!companyId || !selectedPlan?._id) {
            console.log("Company Id and Plan Id is required");
            localStorage.removeItem("companyId");
            localStorage.removeItem("selectedPlan");
            navigate("/pricing");
            return;
        }

        setLoading(true);
        try {

            const intentRes = await apiClient.post('/subscription/create-payment-intent', {
                companyId,
                planId: selectedPlan?._id
            });

            if (!intentRes?.data?.success) {
                toast.error(intentRes?.data?.message || "There was an issue during payment process");
                console.error("Failed to create PaymentIntent:", intentRes?.data?.message);
                localStorage.removeItem("companyId");
                localStorage.removeItem("selectedPlan");
                setLoading(false);
                return;
            }

            const clientSecret = intentRes?.data?.data?.clientSecret;
            const subscriptionId = intentRes?.data?.data?.subscriptionId;

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardNumberElement)!,
                },
            });

            if (result.error) {
                console.error("Payment failed:", result.error.message);
                localStorage.removeItem("companyId");
                localStorage.removeItem("selectedPlan");
                setLoading(false);
                navigate("/subscription/failed");
                return;
            }

            if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
                const confirmRes = await apiClient.post("/subscription/confirm-payment", {
                    paymentIntentId: result.paymentIntent.id,
                    subscriptionId
                });
                const confirmData = confirmRes?.data;

                if (confirmData.success) {
                    localStorage.removeItem("companyId");
                    localStorage.removeItem("selectedPlan");
                    navigate("/subscription/success");
                } else {
                    toast.error(confirmData?.message || "There was an issue during payment process")
                    localStorage.removeItem("companyId");
                    localStorage.removeItem("selectedPlan");
                    navigate("/subscription/failed");
                }
            }


        } catch (error) {
            console.error('Error during subscription process:', error);
            localStorage.removeItem("companyId");
            localStorage.removeItem("selectedPlan");
            setLoading(false);
        }
    };

    const handleCardNumberChange = (event: any) => {
        setCardNumberComplete(event.complete);
        setCardNumberValid(!event.empty && !event.error);

        if (event.empty) {
            setCardNumberError(null);
        } else {
            setCardNumberError(event.error ? event.error.message : null);
        }
    };

    const handleCardExpiryChange = (event: any) => {
        setCardExpiryComplete(event.complete);
        setCardExpiryValid(!event.empty && !event.error);

        if (event.empty) {
            setCardExpiryError(null);
        } else {
            setCardExpiryError(event.error ? event.error.message : null);
        }
    };

    const handleCardCvcChange = (event: any) => {
        setCardCvcComplete(event.complete);
        setCardCvcValid(!event.empty && !event.error);

        if (event.empty) {
            setCardCvcError(null);
        } else {
            setCardCvcError(event.error ? event.error.message : null);
        }
    };


    return (
        <div className="max-w-[500px] xs:w-full w-[calc(100%-20px)] mx-auto  xs:p-6 p-4 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-center xs:mb-3 mb-2 leading-[1.2]">Purchase a Plan</h2>
            <form onSubmit={handleSubmit} className="">
                <div className="p-4 border rounded-md space-y-4 bg-gray-50 mb-4">
                    {/* <CardElement options={CARD_ELEMENT_OPTIONS}  /> */}
                    <div>
                        <label className='test-[#30313d] text-sm mb-1'>Card Number</label>
                        <div className='border px-3 py-3 rounded-md'>
                            <CardNumberElement options={{ style: CARD_ELEMENT_OPTIONS.style }} onChange={handleCardNumberChange} />
                        </div>
                        {cardNumberError && <p className="text-sm text-red-600 mt-1">{cardNumberError}</p>}
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='test-[#30313d] text-sm mb-1'>Expiry Date</label>
                            <div className='border px-3 py-3 rounded-md'>
                                <CardExpiryElement options={{ style: CARD_ELEMENT_OPTIONS.style }} onChange={handleCardExpiryChange} />
                            </div>
                            {cardExpiryError && <p className="text-sm text-red-600 mt-1">{cardExpiryError}</p>}
                        </div>
                        <div>
                            <label className='test-[#30313d] text-sm mb-1'>CVC</label>
                            <div className='border px-3 py-3 rounded-md'>
                                <CardCvcElement options={{ style: CARD_ELEMENT_OPTIONS.style }} onChange={handleCardCvcChange} />
                            </div>
                            {cardCvcError && <p className="text-sm text-red-600 mt-1">{cardCvcError}</p>}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg
                                className="animate-spin h-5 w-5 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        'Subscribe'
                    )}
                </button>
            </form>
        </div>
    )
}

export default PaymentForm;
