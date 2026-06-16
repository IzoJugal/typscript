/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError } from "axios";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { CountryData } from "react-phone-input-2";
import { useLocation, } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import { phoneNumberLength } from "../../utils/functions";

interface IFormData {
    name: string;
    email: string;
    message: string;
    phone: string;
    countryCode: string;
}
interface IError {
    name?: string;
    email?: string;
    message?: string;
    phone?: string;
}

const ContactUs = () => {

    const location = useLocation();

    const [selectedPlan, setSelectedPlan] = useState<any | null>(location.state?.selectedPlan ?? null);

    const [formData, setFormData] = useState<IFormData>({
        name: "",
        email: "",
        message: "",
        phone: "",
        countryCode: "",
    });
    const [error, setError] = useState<IError>({});
    const [isLoading, setIsLoading] = useState(false);
    const [phoneInputData, setPhoneInputData] = useState<any>();
    const phoneRef = useRef<HTMLDivElement>(null);

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<IError> = {};

        if (!formData.name) {
            errorMsg.name = "Please enter name.";
            isValid = false;
        }

        if (!formData.email) {
            errorMsg.email = "Please enter email.";
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errorMsg.email = "Please enter a valid email address.";
                isValid = false;
            }
        }

        if (!formData.phone) {
            errorMsg.phone = "Please enter phone.";
            isValid = false;
            if (phoneRef.current) {
                phoneRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }

        if (!formData.message) {
            errorMsg.message = "Please enter message.";
            isValid = false;
        }

        setError((prev) => ({ ...prev, ...errorMsg }));

        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevAuth) => ({
            ...prevAuth,
            [name]: value,
        }));
        if (error[name as keyof IError]) {
            setError((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handlePhoneNumberLength = (data: any, value: any, key: any) => {
        if (value < data) {
            setError((pre: any) => ({
                ...pre,
                [key]: `Please enter a valid ${data}-digit phone number`,
            }));
        }
        if (value === data) {
            setError((pre: any) => ({ ...pre, [key]: true }));
        }
    };

    const handlePhoneNumber = (phone: any, country: any) => {
        setPhoneInputData(phone);
        const phoneWithoutDialCode = phone.replace(country.dialCode || "", "");
        setFormData((prevFormData: any) => ({
            ...prevFormData,
            phone: phoneWithoutDialCode,
            countryCode: `+${country.dialCode}`,
        }));
        const countryData = phoneNumberLength(country);
        handlePhoneNumberLength(
            countryData,
            phoneWithoutDialCode.length,
            "phone"
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                setIsLoading(true)
                const response = await apiClient.post('/contactUs', formData);

                if (response?.data?.success) {
                    toast.success(response?.data?.message);
                    setFormData({ name: "", email: "", message: "", phone: "", countryCode: "" });
                    setPhoneInputData('91');
                    setError({ name: "", email: "", message: "", phone: "" });
                    setIsLoading(false);

                    setSelectedPlan(null);
                } else {
                    toast.error(response?.data?.message);
                    setIsLoading(false);
                }
            } catch (error: any) {
                setIsLoading(false);
                if (error instanceof AxiosError) {
                    if (error.response) {
                        if (error.response.status === 200) {
                            toast.error(error.response.data.message);
                            setError({ email: "", name: "", message: "", phone: "" });
                        }
                    } else {
                        toast.error("No response from server");
                    }
                } else {
                    console.log("~ contactUs.tsx ~ handleSubmit ~ Unexpected error:", error);
                }
            }
        }
    };

    const posImage = `/pos-tab.jpg`;

    return (
        <div className="bg-white dark:bg-DARK-900 min-h-screen flex justify-center items-center py-10">
            <div className="w-full max-w-7xl mx-6">
                <div className="my-[35px]">
                    <h2 className="mb-8 font-bold text-3xl text-left text-black dark:text-white">
                        We're happy to assist you! Contact us today.
                    </h2>
                    {selectedPlan && (
                        <div className="mb-4 bg-BRAND-50 text-BRAND-500 p-3 rounded">
                            You’re contacting us about the <strong>{selectedPlan.name}</strong> plan
                            {selectedPlan.isCustomPrice
                                ? " with a custom price."
                                : `, priced at $${selectedPlan.price}.`}
                        </div>
                    )}

                    <div className="lg:grid lg:grid-cols-2 gap-6 bg-white dark:bg-DARK-900 rounded-md overflow-hidden shadow-lg">
                        {/* Left Form Section */}
                        <div className="flex flex-col justify-center px-8 py-10 bg-white dark:bg-gray-800 transition-colors duration-300">
                            <form className="space-y-5">
                                <div>
                                    <input
                                        className="px-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 rounded-xl h-[55px] w-full transition-colors duration-300"
                                        type="text"
                                        placeholder="Name"
                                        name="name"
                                        value={formData?.name}
                                        onChange={handleChange}
                                    />
                                    {error.name && (
                                        <p className="text-ERROR text-sm mt-1">{error.name}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        className="px-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 rounded-xl h-[55px] w-full transition-colors duration-300"
                                        type="text"
                                        placeholder="Email"
                                        name="email"
                                        value={formData?.email}
                                        onChange={handleChange}
                                    />
                                    {error.email && (
                                        <p className="text-ERROR text-sm mt-1">{error.email}</p>
                                    )}
                                </div>

                                <div>
                                    <PhoneInput
                                        inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-100"
                                        buttonStyle={{ backgroundColor: "white" }}
                                        countryCodeEditable={false}
                                        enableSearch={true}
                                        country={"in"}
                                        placeholder="Enter phone number"
                                        value={phoneInputData || ""}
                                        onChange={(phone, country: CountryData) => {
                                            handlePhoneNumber(phone, country);
                                        }}
                                    />
                                    {error.phone && <p className="text-sm text-ERROR mt-1">{error.phone}</p>}
                                </div>

                                <div>
                                    <textarea
                                        className="px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 rounded-xl h-[155px] w-full transition-colors duration-300"
                                        placeholder="Message"
                                        name="message"
                                        value={formData?.message}
                                        onChange={handleChange}
                                    />

                                    {error.message && (
                                        <p className="text-ERROR text-sm mt-0">
                                            {error.message}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full !py-3 !bg-BRAND-600 hover:!bg-BRAND-700 !text-white font-bold !rounded-xl shadow-lg shadow-BRAND-500/20 transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center border-none focus:!ring-0"
                                        onClick={(e) => {
                                            handleSubmit(e);
                                        }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending..." : "Send Message"}
                                    </button>
                                </div>
                            </form>
                        </div>
                        {/* Right Image Section */}
                        <div className="flex justify-center">
                            <img
                                src={posImage}
                                alt="POS System"
                                className="rounded-md  w-full"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default ContactUs
