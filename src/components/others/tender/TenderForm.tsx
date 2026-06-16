
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../utils/AxiosInstance';
import { Label, Modal } from 'flowbite-react';
import { useAuth } from '../../../context/AuthProvider';
import { Button } from 'flowbite-react'
import { DropdownWithSearch } from '../../../utils/common/Filters';
import { MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from '../../../utils/common/constant';
import { AiOutlineLoading } from "react-icons/ai";
import TenderFormLoader from '../../../utils/common/TenderFormLoader';
import NumberInputPOS from '../../../utils/common/NumberInputPOS';
import CommonInput from '../../../utils/common/CommonInput';


interface ITenderForm {
    name: string;
    displayName: string;
    isCash: boolean;
    isSurcharge: boolean;
    surchargeAmount: number | "";
    amount: number | "";
    type: '' | 'percentage' | 'fixed';
    isActive: boolean;
    company: string,
    restaurant: string,
}

interface ErrorState {
    name?: string;
    displayName?: string;
    surchargeAmount?: string;
    amount?: string;
    type?: string;
    company: string,
    restaurant: string,
}

const tenderTypes = [
    { _id: "Cash", name: "Cash", value: "Cash" },
    { _id: "Check", name: "Check", value: "Check" },
    { _id: "Debit Card", name: "Debit Card", value: "Debit Card" },
    { _id: "Gift Certificate", name: "Gift Certificate", value: "Gift Certificate" },
    { _id: "Store Credit", name: "Store Credit", value: "Store Credit" },
    { _id: "House Account", name: "House Account", value: "House Account" },
    { _id: "Food Stamps", name: "Food Stamps", value: "Food Stamps" },
    { _id: "Datacap Gift Card", name: "Datacap Gift Card", value: "Datacap Gift Card" },
    { _id: "Poslink Gift Card", name: "PosLink Gift Card", value: "Poslink Gift Card" },
];



const TenderForm = ({ openModal, tenderId, setTenderId, setOpenModal, setTenderData, setTenderDetail, setIsLoading }: { openModal: boolean, tenderId: string, setTenderId: React.Dispatch<React.SetStateAction<string>>, setOpenModal: React.Dispatch<React.SetStateAction<boolean>>; setTenderDetail: React.Dispatch<React.SetStateAction<any>>; setTenderData: any, setIsLoading: React.Dispatch<React.SetStateAction<any>> }) => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    let companyId = ""
    if (loginRole !== SUPER_ADMIN) {
        companyId = `${userData?.staffMember?.company?._id}`
    }
    const [formData, setFormData] = useState<ITenderForm | any>({
        name: "",
        displayName: '',
        isCash: false,
        isSurcharge: false,
        surchargeAmount: "",
        amount: "",
        type: '',
        isActive: true,
        company: companyId,
        restaurant: '',
    });
    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
    const [errors, setErrors] = useState<ErrorState | any>({});
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const companyFetchedRef = useRef(false);
    const restaurantFetchedRef = useRef(false);

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies)
                return response.data.companies;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant)
                return response.data.restaurant;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    const getTenderData = useCallback(async () => {
        if (!tenderId) return;

        setLoadingData(true);

        try {
            const response = await apiClient.get(`/tender/${tenderId}`);
            setFormData(response.data.tender);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingData(false);
        }
    }, [tenderId]);

    useEffect(() => {
        getTenderData();
    }, [getTenderData]);

    useEffect(() => {
        if (!openModal) {
            companyFetchedRef.current = false;
            restaurantFetchedRef.current = false;
            return;
        }

        if (loginRole === SUPER_ADMIN && !companyFetchedRef.current) {
            companyFetchedRef.current = true;
            getCompany().then((companies) => {
                if (companies && companies.length === 1 && !formData.company) {
                    setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
                    setErrors((prev: any) => ({ ...prev, company: "" }));
                }
            });
        }

        const companyId = loginRole === SUPER_ADMIN ? formData?.company : userData?.staffMember?.company?._id;

        if (!companyId) {
            if (formData?.company === "") setRestaurant([]);
            return;
        }
        if (restaurantFetchedRef.current) return;

        restaurantFetchedRef.current = true;
        getRestaurant(companyId).then((restaurants) => {
            if (restaurants && restaurants.length === 1 && !formData.restaurant) {
                setFormData((prev: any) => ({ ...prev, restaurant: restaurants[0]._id }));
                setErrors((prev: any) => ({ ...prev, restaurant: "" }));
            }
        });
    }, [loginRole, openModal, formData?.company, formData?.restaurant, userData]);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;

        if (["surchargeAmount", "amount"].includes(name)) {
            if (value === "") {
                setFormData((prev: any) => ({
                    ...prev,
                    [name]: "",
                }));
                return;
            }

            // Enforce at most 2 decimal places
            let processedValue = value;
            if (processedValue.includes('.')) {
                const parts = processedValue.split('.');
                if (parts[1].length > 2) {
                    processedValue = parts[0] + '.' + parts[1].substring(0, 2);
                }
            }

            const num = Number(processedValue);

            if (isNaN(num) || num < 0) return;

            setFormData((prev: any) => ({
                ...prev,
                [name]: processedValue,
            }));
        } else {
            setFormData((prev: any) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }

        if (name === "type") {
            setErrors((prev: any) => ({
                ...prev,
                surchargeAmount: "",
            }));
        }

        if (errors[name as keyof ErrorState]) {
            setErrors((prev: any) => ({ ...prev, [name]: "" }));
        }
    };

    const handleNumberChange = (
        name: string,
        value: string
    ) => {
        setFormData((prev: any) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleCompany = (id: any) => {
        setFormData((prev: any) => ({
            ...prev,
            company: id,
        }));
        if (id === '') {
            setRestaurant([]);
        }
        setErrors((prev: any) => ({ ...prev, company: "" }));
    }

    const handleRestaurant = (id: any) => {
        setFormData((prev: any) => ({
            ...prev,
            restaurant: id,
        }));
        setErrors((prev: any) => ({ ...prev, restaurant: "" }));
    }

    const handleTenderName = (id: any) => {
        setFormData((prev: any) => ({
            ...prev,
            name: id,
        }));
        setErrors((prev: any) => ({ ...prev, name: "" }));
    }

    const isValid = (): boolean => {
        let valid = true;
        const errorMsg: ErrorState | any = {};

        if (!formData.displayName) {
            errorMsg.displayName = "Please enter a display name.";
            valid = false;
        }
        if (!formData.name) {
            errorMsg.name = "Please select a tender type.";
            valid = false;
        }
        if (loginRole === SUPER_ADMIN) {
            if (!formData.company) {
                errorMsg.company = "Please select business.";
                valid = false;
            }
        }
        if (MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) {
            if (!formData.restaurant) {
                errorMsg.restaurant = "Please select restaurant.";
                valid = false;
            }
        }
        if (formData.isSurcharge) {
            const surchargeValue = String(formData.surchargeAmount);
            const amountValue = String(formData.amount);

            if (!formData.type) {
                errorMsg.type = "Please select surcharge type.";
                valid = false;
            }

            if (
                formData.surchargeAmount === "" ||
                Number(formData.surchargeAmount) < 0 ||
                isNaN(Number(formData.surchargeAmount))
            ) {
                errorMsg.surchargeAmount = "Enter valid surcharge value.";
                valid = false;
            }
            else if (
                formData.type === "percentage" &&
                Number(formData.surchargeAmount) > 100
            ) {
                errorMsg.surchargeAmount = "Percentage surcharge cannot exceed 100%.";
                valid = false;
            }
            else if (
                surchargeValue.includes(".") &&
                surchargeValue.split(".")[1].length > 2
            ) {
                errorMsg.surchargeAmount =
                    "Surcharge can have up to 2 decimal places.";
                valid = false;
            }

            if (formData.amount === "" || Number(formData.amount) < 0 || isNaN(Number(formData.amount))) {
                errorMsg.amount = "Enter valid amount.";
                valid = false;
            } else if (amountValue.includes(".") && amountValue.split(".")[1].length > 2) {
                errorMsg.amount = "Amount can have up to 2 decimal places.";
                valid = false;
            }
        }

        setErrors(errorMsg);
        return valid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            setSubmitting(true);
            try {
                const submissionData: any = { ...formData };
                if (!submissionData.isSurcharge) {
                    delete submissionData.type;
                    delete submissionData.surchargeAmount;
                    delete submissionData.amount;
                }
                if (loginRole !== SUPER_ADMIN) {
                    submissionData.company = `${userData?.staffMember?.company?._id}`
                }
                let response: any = {};
                if (tenderId) {
                    response = await apiClient.patch(`/tender/${tenderId}`, submissionData);
                    if (response?.data?.success === true) {
                        setIsLoading(true);
                        setTimeout(() => {
                            setTenderDetail((prevTender: any) =>
                                prevTender.map((tender: any) => (tender._id === submissionData?._id ? response.data.tender : tender))
                            );
                            toast.success(response.data.message || 'Tender updated successfully!');
                        }, 500);
                    } else {
                        setTimeout(() => {
                            setSubmitting(false)
                            setIsLoading(false)
                            toast.error(response?.data?.message || 'Failed to update tender!');
                        }, 500);
                    }
                } else {
                    response = await apiClient.post('/tender', submissionData);
                    if (response?.data?.success === true) {
                        setIsLoading(true);
                        // setTenderDetail((prevTender: any) => [...prevTender, response.data.tender]);
                        setTimeout(() => {
                            toast.success(response.data.message || 'Tender added successfully!');
                        }, 500);
                    } else {
                        setTimeout(() => {
                            setSubmitting(false)
                            setIsLoading(false)
                            toast.error(response?.data?.message || 'Failed to create tender');
                        }, 500);
                    }
                }
                if (response?.data?.success === true) {
                    setOpenModal(false)
                    setTimeout(() => {
                        setFormData({
                            name: "",
                            displayName: '',
                            isCash: false,
                            isSurcharge: false,
                            surchargeAmount: "",
                            amount: "",
                            type: '',
                            isActive: true,
                            company: companyId,
                            restaurant: '',
                        })
                        setTenderId("")
                        setIsLoading(false)
                        setTenderData(response.data)
                        setSubmitting(false);
                    }, 500);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Error processing request.');
                setSubmitting(false);
                setIsLoading(false);
            }
        }
    };

    const handleModalClose = () => {
        setFormData({
            name: "",
            displayName: '',
            isCash: false,
            isSurcharge: false,
            surchargeAmount: "",
            amount: "",
            type: '',
            isActive: true,
            company: companyId,
            restaurant: '',
        })
        setTenderId("")
        setOpenModal(false)
        setErrors({})
    }

    return (
        <Modal show={openModal} onClose={() => { handleModalClose() }} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">{tenderId ? "Edit" : "Add"} Tender</Modal.Header>
            {loadingData ? (
                <Modal.Body className="dark:bg-DARK-800">
                    <TenderFormLoader count={1} />
                </Modal.Body>
            ) : (
                <Modal.Body className="dark:bg-DARK-800">
                    <div className="p-0">
                        <main className="max-w-2xl mx-auto">
                            <form>
                                <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
                                    {loginRole === SUPER_ADMIN &&
                                        <div className='flex flex-col'>
                                            <Label value="Business" className="block text-DARK-700 text-sm font-bold mb-2" />
                                            <DropdownWithSearch
                                                setSelectedItem={setFormData}
                                                selectedItem={companies?.find((c: any) => c._id === (formData?.company))?.name || ''}
                                                items={companies}
                                                title="Business"
                                                handleFilter={handleCompany}
                                                fieldKey="company"
                                            />
                                            {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
                                        </div>
                                    }
                                    {OWNER_ROLES.includes(loginRole) && (
                                        <div className="flex flex-col mb-4">
                                            <Label value="Restaurant" className="block text-DARK-700 text-sm font-bold mb-2" />
                                            <DropdownWithSearch
                                                setSelectedItem={setFormData}
                                                selectedItem={restaurant?.find((c: any) => c._id === (formData?.restaurant))?.name || ''}
                                                items={restaurant}
                                                title="Restaurant"
                                                handleFilter={handleRestaurant}
                                                fieldKey="restaurant"
                                            />
                                            {errors.restaurant && <p className="mt-1 text-sm text-red-600">{errors.restaurant}</p>}
                                        </div>)}
                                </div>
                                <div className="mb-4">
                                    <Label value="Tender Name" className="block text-DARK-700 text-sm font-bold mb-2" htmlFor="name" />
                                    {/* <select
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={tenderId ? true : false}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-DARK-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    
                                    {tenderTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select> */}
                                    <div style={tenderId ? { pointerEvents: "none", opacity: 0.5 } : {}}>
                                        <DropdownWithSearch
                                            setSelectedItem={setFormData}
                                            selectedItem={tenderTypes?.find((c: any) => c._id === (formData?.name))?.name || ''}
                                            items={tenderTypes}
                                            title="Tender Types"
                                            handleFilter={handleTenderName}
                                            fieldKey="tenderTypes"
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div className="mb-4">
                                    <Label value='Display As' className="block text-DARK-700 text-sm font-bold mb-2" htmlFor="displayName" />
                                    <CommonInput
                                        type="text"
                                        id="displayName"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        placeholder='Display Name'
                                    // className="w-full px-3 py-2 text-sm border-2 border-DARK-300 bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl"
                                    />
                                    {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>}
                                </div>
                                <div className="mb-4">
                                    {/* <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        // className="form-checkbox h-5 w-5 text-DARK-600"
                                        className="checked:bg-BRAND-500 !ring-0"
                                    />
                                    <span className="ml-2 text-DARK-700">Enabled?</span>
                                </label> */}
                                    <div className="flex items-center space-x-2">
                                        <Label
                                            value="Status"
                                            htmlFor="isAvailable"
                                            className="text-sm font-medium text-DARK-700 dark:text-DARK-200"
                                        />

                                        <input
                                            type="radio"
                                            id="Activated"
                                            name="isActive"
                                            value="true"
                                            checked={formData.isActive === true}
                                            onChange={() => setFormData((prev: any) => ({ ...prev, isActive: true }))}
                                            className="h-4 w-4 checked:text-BRAND-500 !ring-0 border-DARK-300 dark:border-DARK-600 rounded"
                                        />
                                        <Label
                                            value="Activated"
                                            htmlFor="Activated"
                                            className="text-sm font-medium text-DARK-700 dark:text-DARK-200"
                                        />

                                        <input
                                            type="radio"
                                            id="DeActivated"
                                            name="isActive"
                                            value="false"
                                            checked={formData.isActive === false}
                                            onChange={() => setFormData((prev: any) => ({ ...prev, isActive: false }))}
                                            className="h-4 w-4 checked:text-BRAND-500 !ring-0 border-DARK-300 dark:border-DARK-600 rounded"
                                        />
                                        <Label
                                            value="DeActivated"
                                            htmlFor="DeActivated"
                                            className="text-sm font-medium text-DARK-700 dark:text-DARK-200"
                                        />
                                    </div>

                                </div>

                                <div className="mb-4">
                                    <label className="inline-flex items-center text-DARK-700 dark:text-DARK-200">
                                        <input
                                            type="checkbox"
                                            name="isCash"
                                            checked={formData.isCash}
                                            onChange={handleChange}
                                            className="checked:bg-BRAND-500 !ring-0 dark:checked:bg-BRAND-400"
                                        />
                                        <span className="ml-2">Open Cash Drawer?</span>
                                    </label>
                                </div>

                                <div className="mb-4">
                                    <label className="inline-flex items-center text-DARK-700 dark:text-DARK-200">
                                        <input
                                            type="checkbox"
                                            name="isSurcharge"
                                            checked={formData.isSurcharge}
                                            onChange={handleChange}
                                            className="checked:bg-BRAND-500 !ring-0 dark:checked:bg-BRAND-400"
                                        />
                                        <span className="ml-2">Apply Threshold Surcharge</span>
                                    </label>
                                </div>

                                {formData.isSurcharge && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-DARK-700 dark:text-DARK-200 text-sm font-bold mb-2" htmlFor="type">
                                                Surcharge Type
                                            </label>
                                            <select
                                                id="name"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                            // className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-DARK-700 dark:text-DARK-200  dark:border-none border rounded-xl"
                                            >
                                                <option value="">Select Surcharge Type</option>
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Amount</option>
                                            </select>
                                            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-DARK-700 dark:text-DARK-200 text-sm font-bold mb-2" htmlFor="surchargeAmount">
                                                Surcharge Value
                                            </label>
                                            <NumberInputPOS
                                                id="surchargeAmount"
                                                name="surchargeAmount"
                                                placeholder='Enter surcharge amount'
                                                value={formData.surchargeAmount || ""}
                                                onChange={(value) =>
                                                    handleNumberChange("surchargeAmount", value)
                                                }
                                                allowDecimal={true}
                                                maxDecimalPlaces={2}
                                            //     className="w-full px-3 py-2 text-sm bg-slate-50 dark:text-DARK-200 dark:border-none border rounded-md
                                            // [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            {errors.surchargeAmount && <p className="mt-1 text-sm text-red-600">{errors.surchargeAmount}</p>}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-DARK-700 dark:text-DARK-200 text-sm font-bold mb-2" htmlFor="amount">
                                                Apply if Tender Amount less than
                                            </label>
                                            <NumberInputPOS
                                                id="amount"
                                                name="amount"
                                                placeholder='Enter amount threshold'
                                                value={formData.amount || ""}
                                                onChange={(value) =>
                                                    handleNumberChange("amount", value)
                                                }
                                                allowDecimal={true}
                                                maxDecimalPlaces={2}
                                            //     className="w-full px-3 py-2 text-sm bg-slate-50 dark:text-DARK-200 dark:border-none border rounded-md
                                            // [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                        </div>
                                    </>

                                )}
                            </form>
                        </main>
                    </div>
                </Modal.Body>
            )}
            <Modal.Footer className="justify-end dark:bg-DARK-800">
                <Button
                    type="button"
                    onClick={() => handleModalClose()}
                    disabled={submitting}
                    className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY text-white dark:bg-DARK-700 dark:hover:!bg-DARK-600 rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    onClick={(e: any) => handleSubmit(e)}
                    disabled={submitting}
                    isProcessing={submitting}
                    processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                    className="w-full max-w-[150px] px-2 py-1 bg-BRAND-500 text-white dark:bg-BRAND-500 rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    <span className="relative z-10">
                        {submitting ? "Loading..." : "Submit"}
                    </span>
                </Button>
            </Modal.Footer>
        </Modal >
    );
};

export default TenderForm;
