/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import FormLoader from "../../utils/common/FormLoader";
import { Button, Label, Modal } from "flowbite-react";
import NewSingleDate from "../../utils/common/NewSingleDate";
import {
    MANAGER_ROLES,
    OWNER_ROLES,
    SUPER_ADMIN,
} from "../../utils/common/constant";
import { CompanyField, RestaurantField } from "../../utils/functions";
import { useAuth } from "../../context/AuthProvider";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface IDiscount {
    _id: string;
    discountAmount: number;
    discountType: "" | "percentage" | "fixed";
    startDate: string;
    endDate: string;
    company?: string;
    restaurant?: string;
}

interface ErrorState {
    discountAmount?: string;
    discountType?: string;
    startDate?: string;
    endDate?: string;
    company?: string;
    restaurant?: string;
}

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    discountId?: string | null;
    onSuccess?: () => void;
}

const DiscountFormModal = ({ isOpen, onClose, discountId, onSuccess }: DiscountModalProps) => {
    const [formData, setFormData] = useState<IDiscount | any>({
        _id: "",
        discountAmount: 0,
        discountType: "",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        company: "",
        restaurant: "",
    });
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);

    const [errors, setErrors] = useState<ErrorState>({});
    const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
    const companyFetchedRef = useRef(false);
    const restaurantFetchedRef = useRef<string | null>(null);

    const [selectedStartdate, setSelectedStartdate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({ startDate: null, endDate: null });

    const [selectedEnddate, setSelectedEnddate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({ startDate: null, endDate: null });

    // Reset states when modal closes or opens
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                _id: "",
                discountAmount: 0,
                discountType: "percentage",
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                company: "",
                restaurant: "",
            });
            setSelectedStartdate({ startDate: null, endDate: null });
            setSelectedEnddate({ startDate: null, endDate: null });
            setRestaurant([]);
            setErrors({});
        }
    }, [isOpen]);

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies);
                return response.data.companies;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    };

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant);
                return response.data.restaurant;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            companyFetchedRef.current = false;
            restaurantFetchedRef.current = null;
            return;
        }

        if (loginRole === SUPER_ADMIN && !companyFetchedRef.current) {
            companyFetchedRef.current = true;
            getCompany().then((companies) => {
                if (companies && companies.length === 1 && !formData.company) {
                    setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
                    setErrors((prev) => ({ ...prev, company: "" }));
                }
            });
        }

        const companyId = loginRole === SUPER_ADMIN ? formData?.company : userData?.staffMember?.company?._id;

        if (!companyId) return;
        if (restaurantFetchedRef.current === companyId) return;

        restaurantFetchedRef.current = companyId;
        getRestaurant(companyId).then((restaurants) => {
            if (restaurants && restaurants.length === 1 && !formData.restaurant) {
                setFormData((prev: any) => ({ ...prev, restaurant: restaurants[0]._id }));
                setErrors((prev) => ({ ...prev, restaurant: "" }));
            }
        });
    }, [loginRole, isOpen, formData?.company, userData?.staffMember?.company?._id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        setFormData((prev: any) => {
            if (name === "discountAmount") {
                return {
                    ...prev,
                    discountAmount: value === "" ? "" : Number(value),
                };
            }

            return {
                ...prev,
                [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
            };
        });

        if (name === 'company') {
            if (value === '') {
                setRestaurant([]);
            }
        }

        if (errors[name as keyof ErrorState]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleStartDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        if (value?.startDate) {
            setSelectedStartdate(value);
            setFormData((prev: any) => ({ ...prev, startDate: value?.startDate }));
            if (errors.startDate) {
                setErrors((prev) => ({ ...prev, startDate: "" }));
            }
        }
    };

    const handleEndDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        if (value?.startDate) {
            setSelectedEnddate(value);
            setFormData((prev: any) => ({ ...prev, endDate: value?.startDate }));
            if (errors.endDate) {
                setErrors((prev) => ({ ...prev, endDate: "" }));
            }
        }
    };

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<ErrorState> = {};

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!formData.discountType) {
            errorMsg.discountType = "Please select a discount type.";
            isValid = false;
        }

        const amount = Number(formData.discountAmount);

        if (formData.discountAmount === "" || isNaN(amount)) {
            errorMsg.discountAmount = "Please enter a valid discount.";
            isValid = false;
        } else if (amount < 0) {
            errorMsg.discountAmount = "Discount cannot be negative.";
            isValid = false;
        } else if (amount === 0) {
            errorMsg.discountAmount = "Discount must be greater than 0.";
            isValid = false;
        }

        if (!formData.discountAmount || Number(formData.discountAmount) <= 0) {
            errorMsg.discountAmount = "Please enter a valid discount.";
            isValid = false;
        }

        if (formData.discountType === "percentage" && Number(formData.discountAmount) > 100) {
            errorMsg.discountAmount = "Discount percentage cannot exceed 100%.";
            isValid = false;
        }

        if (formData.discountType === "fixed") {
            const amount = Number(formData.discountAmount);

            if (!formData.discountAmount || amount <= 0) {
                errorMsg.discountAmount = "Please enter a valid amount.";
                isValid = false;
            } else if (amount > 999999) {
                errorMsg.discountAmount = "Amount is too large.";
                isValid = false;
            }
        }

        if (!startDate) {
            errorMsg.startDate = "Please select a start date.";
            isValid = false;
        } else if (!discountId && startDate < today) {
            errorMsg.startDate = "Start date cannot be in past.";
            isValid = false;
        }

        if (!endDate) {
            errorMsg.endDate = "Please select an end date.";
            isValid = false;
        } else if (endDate < startDate) {
            errorMsg.endDate = "End date cannot be before the start date.";
            isValid = false;
        }

        if (loginRole === SUPER_ADMIN) {
            if (!formData?.company) {
                errorMsg.company = "Please select business.";
                isValid = false;
            }
        }
        if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
            if (!formData?.restaurant) {
                errorMsg.restaurant = "Please select restaurant.";
                isValid = false;
            }
        }

        setErrors((prev) => ({ ...prev, ...errorMsg }));
        return isValid;
    };

    const getDiscount = useCallback(async () => {
        if (!discountId) return;
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/discount/${discountId}`);
            const discount = response.data?.discount;

            setFormData((prev: any) => ({
                ...prev,
                ...discount,
            }));
            if (discount?.startDate) {
                setSelectedStartdate({
                    startDate: new Date(discount.startDate),
                    endDate: new Date(discount.startDate),
                });
            }
            if (discount?.endDate) {
                setSelectedEnddate({
                    startDate: new Date(discount.endDate),
                    endDate: new Date(discount.endDate),
                });
            }
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
            console.error("~ getDiscount error :-", error);
        }
    }, [discountId, setIsLoading]);

    useEffect(() => {
        if (discountId && isOpen) {
            getDiscount();
        }
    }, [discountId, getDiscount, isOpen]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid()) {
            try {
                let response;
                if (discountId) {
                    setIsButtonLoading(true);
                    response = await apiClient.patch(`/discount/${discountId}`, formData);
                    toast.success(response?.data?.message || "Discount updated successfully!");
                } else {
                    setIsButtonLoading(true);
                    response = await apiClient.post("/discount/add", formData);
                    toast.success("Discount added successfully!");
                }
                if (onSuccess) onSuccess();
                onClose();
                setIsButtonLoading(false);
            } catch (error: any) {
                setIsButtonLoading(false);
                console.log("Error during form submission:", error);
                toast.error(error?.response?.data?.message || "There was an issue with the request.");
            }
        }
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            popup
            className="backdrop-blur-sm dark:bg-DARK-950 !w-full !max-w-full"
        >
            <div className="relative w-full max-w-2xl mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
                <Modal.Header className="dark:bg-DARK-800 border-b border-DARK-200 dark:border-DARK-700 px-4 sm:px-6 py-4">
                    <span className="text-lg sm:text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                        {isLoading ? (
                            <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                        ) : (
                            discountId ? "Edit Discount" : "Add Discount"
                        )}
                    </span>
                </Modal.Header>

                <Modal.Body className="dark:bg-DARK-800 max-h-[calc(100vh-220px)] overflow-y-auto px-4 sm:px-6 py-4">
                    {isLoading ? (
                        <FormLoader count={1} />
                    ) : (
                        <form id="discount-modal-form" onSubmit={handleFormSubmit} className="flex max-w-full flex-col gap-4">
                            <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-3 sm:gap-4`}>
                                {loginRole === SUPER_ADMIN && (
                                    <div className="flex flex-col">
                                        <CompanyField
                                            companies={companies}
                                            selectedCompanyId={formData?.company ?? ""}
                                            handleChange={handleChange}
                                            error={errors.company}
                                        />
                                    </div>
                                )}
                                {OWNER_ROLES.includes(loginRole) && (
                                    <div className="flex flex-col">
                                        <RestaurantField
                                            restaurants={restaurant}
                                            selectedRestaurantId={formData?.restaurant?._id || formData?.restaurant || ""}
                                            handleChange={handleChange}
                                            error={errors.restaurant}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Discount Type Select */}
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="discountType" value="Discount Type" />
                                </div>
                                <select
                                    id="discountType"
                                    name="discountType"
                                    value={formData?.discountType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm font-medium dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                >
                                    <option value="">Select Discount Type</option>
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                                {errors?.discountType && (
                                    <span className="text-ERROR_HOVER text-sm">{errors.discountType}</span>
                                )}
                            </div>

                            {/* Discount Value Input */}
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="discountAmount" value="Discount Value" />
                                    <span className="text-ERROR_HOVER">*</span>
                                </div>
                                <NumberInputPOS
                                    id="discountAmount"
                                    name="discountAmount"
                                    value={formData.discountAmount === 0 ? "" : formData.discountAmount}
                                    maxDecimalPlaces={2}
                                    allowDecimal={true}
                                    allowNegative={false}
                                    onChange={(value) => {
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            discountAmount: value,
                                        }));

                                        if (errors.discountAmount) {
                                            setErrors((prev) => ({ ...prev, discountAmount: "" }));
                                        }
                                    }}
                                    placeholder={formData.discountType === "percentage" ? "Enter Percentage" : "Enter Fixed Amount"}
                                //   className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400 outline-none transition"
                                />
                                {errors.discountAmount && (
                                    <span className="text-ERROR_HOVER text-sm">{errors.discountAmount}</span>
                                )}
                            </div>

                            {/* Start Date */}
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="startDate" value="Start Date" />
                                </div>
                                <NewSingleDate value={selectedStartdate} onChange={handleStartDate} label="Start Date" />
                                {errors.startDate && (
                                    <span className="text-ERROR_HOVER text-sm">{errors.startDate}</span>
                                )}
                            </div>

                            {/* End Date */}
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="endDate" value="End Date" />
                                </div>
                                <NewSingleDate value={selectedEnddate} onChange={handleEndDate} label="End Date" />
                                {errors.endDate && (
                                    <span className="text-ERROR_HOVER text-sm">{errors.endDate}</span>
                                )}
                            </div>
                        </form>
                    )}
                </Modal.Body>

                <Modal.Footer className="justify-end dark:bg-DARK-800 border-t border-DARK-200 dark:border-DARK-700 px-4 sm:px-6 py-4 gap-3 flex flex-col sm:flex-row">
                    <Button
                        type="button"
                        onClick={onClose}
                        disabled={isButtonLoading}
                        className="group relative flex items-stretch justify-center p-0.5 text-center focus:z-10 focus:outline-none border border-transparent  w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="discount-modal-form"
                        disabled={isButtonLoading}
                        isProcessing={isButtonLoading}
                        processingSpinner={<AiOutlineLoading className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />}
                        className="group flex items-stretch justify-center p-0.5 text-center focus:z-10 focus:outline-none border border-transparent w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        <span className="relative z-10">{isButtonLoading ? "Loading..." : "Submit"}</span>
                        {isButtonLoading && (
                            <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                        )}
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
};

export default DiscountFormModal;