//@ts-nocheck
import { Button, Checkbox, Label, Modal, } from "flowbite-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { useAuth } from "../../context/AuthProvider";
import { CompanyField, phoneNumberLength, RestaurantField } from "../../utils/functions";
import FormLoader from "../../utils/common/FormLoader";
import NewSingleDate from "../../utils/common/NewSingleDate";
import { MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"
import { apiUrl, siteUrl } from "../../environment/env";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiPencil } from "react-icons/hi";

interface IBillingAddress {
    address1: string;
    address2: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
}

interface IShippingAddress {
    address1: string;
    address2: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
}

interface IHouseAccount {
    creditlimit: number;
    openingBalance: number;
    currentBalance: number;
}
interface ICustomer {
    _id: string;
    customerID: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    mainPhone: string;
    homePhone: string;
    company: string;
    restaurant: string;
    salutation: string;
    spouse: string;
    dateofBirth: string;
    dateofMarriage: string;
    fax: string;
    billingAddress: IBillingAddress;
    shippingAddress: IShippingAddress;
    taxExempt: boolean;
    taxId: string;
    priceLevel: string;
    storeCredit: number;
    pointsEarned: number;
    crmParameters: object;
    houseAccount: IHouseAccount;
}

interface ErrorState {
    firstName?: string;
    // lastName?: string;
    email?: string;
    phoneNumber?: string;
    mainPhone: string;
    homePhone: string;
    billingAddress?: {
        address1?: string;
        address2?: string;
        city?: string;
        postalCode?: string;
        country?: string;
        state?: string;
    };
    company?: string;
    restaurant?: string;
}

function CustomerFormModal({ openCustomerForm, setOpenCustomerForm }: any) {
    const { userData } = useAuth();
    const NoImage = `${siteUrl}/images/download.png`;
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    let companyID = ""
    let restaurantID = ""
    if (loginRole !== SUPER_ADMIN) {
        companyID = `${userData?.staffMember?.company?._id}`
    } else if (!OWNER_ROLES.includes(loginRole)) {
        restaurantID = `${userData?.staffMember?.restaurant?._id}`
    }
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ICustomer | any>({
        _id: '',
        customerID: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        mainPhone: '',
        homePhone: '',
        company: companyID,
        restaurant: restaurantID,
        salutation: '',
        spouse: '',
        dateofBirth: '',
        dateofMarriage: '',
        fax: '',
        billingAddress: {
            address1: '',
            address2: '',
            city: '',
            postalCode: '',
            state: '',
            country: '',
        },
        shippingAddress: {
            address1: '',
            address2: '',
            city: '',
            postalCode: '',
            state: '',
            country: '',
        },
        taxExempt: false,
        taxId: '',
        priceLevel: 'a',
        storeCredit: 0,
        pointsEarned: 0,
        crmParameters: {},
        houseAccount: {
            creditlimit: 0,
            openingBalance: 0,
            currentBalance: 0,
        },
    });
    const [selectedFile, setSelectedFile] = useState<File | any>("");
    const [errors, setErrors] = useState<ErrorState | any>({});
    const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();

    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
    const [selectedBirthdate, setSelectedBirthdate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: null,
        endDate: null,
    });

    const [selectedMarriagedate, setSelectedMarriagedate] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: null,
        endDate: null,
    });
    const [phoneInputData, setPhoneInputData] = useState<any>()
    const [mainPhoneInputData, setMainPhoneInputData] = useState<any>()
    const [homePhoneInputData, setHomePhoneInputData] = useState<any>()

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }
    const getRestaurant = useCallback(async (companyId?: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}?`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }, []);

    const getCustomer = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await apiClient.get(`/customer/${id}`);
            const customer = response.data.data;
            setPhoneInputData(`1${response.data.data?.phoneNumber}`)
            setMainPhoneInputData(`1${response.data.data?.mainPhone}`)
            setHomePhoneInputData(`1${response.data.data?.homePhone}`)
            setFormData((prev: any) => ({
                ...prev,
                ...customer,
            }));

            setFormData((pre: any) => ({
                ...pre, company: customer?.company?._id, restaurant: customer.restaurant?._id
            }))
            if (customer?.dateofBirth) {
                setSelectedBirthdate({
                    startDate: new Date(customer.dateofBirth),
                    endDate: new Date(customer.dateofBirth),
                });
            }
            if (customer?.dateofMarriage) {
                setSelectedMarriagedate({
                    startDate: new Date(customer.dateofMarriage),
                    endDate: new Date(customer.dateofMarriage),
                });
            }
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
            console.error('~ getCustomer error :-', error);
        }
    }, [id, setIsLoading,]);

    useEffect(() => {
        if (id) {
            getCustomer();
        }
        if (loginRole === SUPER_ADMIN) {
            getCompany();
        }
    }, [id, getCustomer, loginRole, getRestaurant]);

    useEffect(() => {
        if (formData?.company) {
            getRestaurant(formData?.company);

        }
    }, [formData?.company]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, } = e.target;

        const isCheckbox = type === 'checkbox';
        const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

        if (name === 'company') {
            if (value === '') {
                setRestaurant([]);
            } else {
                getRestaurant(value);
            }
        }

        setFormData((prev: any) => {
            if (name.includes('.')) {
                const [parentKey, childKey] = name.split('.');

                return {
                    ...prev,
                    [parentKey]: {
                        ...((prev[parentKey as keyof typeof prev] as Record<string, any>) || {}),
                        [childKey]: inputValue
                    }
                };
            } else {
                return {
                    ...prev,
                    [name]: inputValue
                };
            }
        });

        setErrors((prev: any) => {
            if (name.includes('.')) {
                const [parentKey, childKey] = name.split('.') as [keyof ErrorState, string];

                if (prev[parentKey] && typeof prev[parentKey] === 'object') {
                    return {
                        ...prev,
                        [parentKey]: {
                            ...(prev[parentKey] as Record<string, string>),
                            [childKey]: ""
                        }
                    };
                }
            } else if (prev[name as keyof ErrorState]) {
                return { ...prev, [name]: "" };
            }
            return prev;
        });
    };

    const handleBirthDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        if (value?.startDate) {
            const formattedDate = new Date(value.startDate)
                .toISOString()
                .split("T")[0];
            setSelectedBirthdate(value);
            setFormData((prev: any) => ({
                ...prev,
                dateofBirth: formattedDate,
            }));
        }
    };
    const handleMarriageDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        if (value?.startDate) {
            const formattedDate = new Date(value.startDate)
                .toISOString()
                .split("T")[0];
            setSelectedMarriagedate(value);
            setFormData((prev: any) => ({
                ...prev,
                dateofMarriage: formattedDate,
            }));
        }
    };

    const nameRef = useRef<HTMLInputElement>(null);
    const companyRef = useRef<HTMLDivElement>(null);
    const restaurantRef = useRef<HTMLDivElement>(null);

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<ErrorState> = {};
        let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement> | null = null;

        if (!formData.firstName) {
            errorMsg.firstName = "Please enter first name.";
            if (!firstErrorRef) {
                firstErrorRef = nameRef;
            };
            isValid = false;
        }

        /* if (!formData.lastName) {
            errorMsg.lastName = "Please enter last name.";
            isValid = false;
        } */

        if (!formData.phoneNumber) {
            errorMsg.phoneNumber = "Please enter phone number.";
            isValid = false;
        }

        /*
          if (!formData.email) {
            errorMsg.email = "Please enter email.";
            isValid = false;
        }
        if (!formData.billingAddress.address1) {
            if (!errorMsg.billingAddress) {
                errorMsg.billingAddress = {};
            }
            errorMsg.billingAddress.address1 = "Please enter address.";
            isValid = false;
        }
        if (!formData.billingAddress.city) {
            if (!errorMsg.billingAddress) {
                errorMsg.billingAddress = {};
            }
            errorMsg.billingAddress.city = "Please enter city.";
            isValid = false;
        }
        if (!formData.billingAddress.postalCode) {
            if (!errorMsg.billingAddress) {
                errorMsg.billingAddress = {};
            }
            errorMsg.billingAddress.postalCode = "Please enter postal code.";
            isValid = false;
        }
        if (!formData.billingAddress.country) {
            if (!errorMsg.billingAddress) {
                errorMsg.billingAddress = {};
            }
            errorMsg.billingAddress.country = "Please enter country.";
            isValid = false;
        }
        if (!formData.billingAddress.state) {
            if (!errorMsg.billingAddress) {
                errorMsg.billingAddress = {};
            }
            errorMsg.billingAddress.state = "Please enter state.";
            isValid = false;
        }*/

        if (loginRole === SUPER_ADMIN) {
            if (!formData.company) {
                errorMsg.company = "Please select business.";
                if (!firstErrorRef) {
                    firstErrorRef = companyRef;
                };
                isValid = false;
            }
        }
        if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
            if (!formData.restaurant) {
                errorMsg.restaurant = "Please select restaurant.";
                if (!firstErrorRef) {
                    firstErrorRef = restaurantRef;
                };
                isValid = false;
            }
        }


        setErrors((prev: any) => ({ ...prev, ...errorMsg }));
        if (firstErrorRef && firstErrorRef.current) {
            firstErrorRef.current.focus();
            firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        return isValid;
    };

    const prepareFormData = (): FormData => {
        // if (loginRole !== SUPER_ADMIN) {
        //     formData.company = `${userData?.staffMember?.company?._id}`
        // } else if (!MANAGER_ROLES.includes(loginRole)) {
        //     formData.restaurant = `${userData?.staffMember?.restaurant?._id}`
        // }
        if (loginRole !== SUPER_ADMIN) {
            if (MANAGER_ROLES.includes(loginRole)) {
                formData.restaurant = `${userData?.staffMember?.restaurant?._id}`;
            } else {
                formData.company = `${userData?.staffMember?.company?._id}`;
            }
        }

        const formDataToSend = new FormData();

        const simpleFields = [
            'firstName', 'lastName', 'email', 'phoneNumber', 'mainPhone', 'homePhone',
            'company', 'restaurant', 'salutation', 'spouse', 'dateofBirth', 'dateofMarriage',
            'fax', 'taxExempt', 'taxId', 'priceLevel', 'storeCredit', 'pointsEarned'
        ];

        simpleFields.forEach(field => {
            if (formData[field as keyof ICustomer]) {
                formDataToSend.append(field, String(formData[field as keyof ICustomer]));
            }
        });

        formDataToSend.append('customerProfile', selectedFile);

        if (formData.billingAddress) {
            const billing = formData.billingAddress;
            formDataToSend.append('billingAddress[address1]', billing.address1 || '');
            formDataToSend.append('billingAddress[address2]', billing.address2 || '');
            formDataToSend.append('billingAddress[city]', billing.city || '');
            formDataToSend.append('billingAddress[postalCode]', billing.postalCode || '');
            formDataToSend.append('billingAddress[state]', billing.state || '');
            formDataToSend.append('billingAddress[country]', billing.country || '');
        }

        if (formData.shippingAddress) {
            const shipping = formData.shippingAddress;
            formDataToSend.append('shippingAddress[address1]', shipping.address1 || '');
            formDataToSend.append('shippingAddress[address2]', shipping.address2 || '');
            formDataToSend.append('shippingAddress[city]', shipping.city || '');
            formDataToSend.append('shippingAddress[postalCode]', shipping.postalCode || '');
            formDataToSend.append('shippingAddress[state]', shipping.state || '');
            formDataToSend.append('shippingAddress[country]', shipping.country || '');
        }

        if (formData.houseAccount) {
            const house = formData.houseAccount;
            formDataToSend.append('houseAccount[creditlimit]', house.creditlimit != null ? String(house.creditlimit) : '');
            formDataToSend.append('houseAccount[openingBalance]', house.openingBalance != null ? String(house.openingBalance) : '');
            formDataToSend.append('houseAccount[currentBalance]', house.currentBalance != null ? String(house.currentBalance) : '');
        }

        return formDataToSend;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                let response;
                const formDataToSend = prepareFormData()

                if (id) {
                    setIsButtonLoading(true)
                    response = await apiClient.patch(`/customer/${id}`, formDataToSend, {
                        headers: { 'Content-Type': 'multipart/form-data', }
                    })
                    if (response.data.status) {
                        toast.success(response?.data?.message || 'Customer updated successfully!');
                    } else {
                        toast.error(response?.data?.message || 'Failed to update customer.');
                        setIsButtonLoading(false)
                        return
                    }
                } else {
                    setIsButtonLoading(true)
                    response = await apiClient.post('/customer/add', formDataToSend, {
                        headers: { 'Content-Type': 'multipart/form-data', }
                    })
                    if (response?.status === 201) {
                        toast.success('Customer added successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the customer.');
                        setIsButtonLoading(false)
                        return;
                    }
                }
                navigate(-1);
                setFormData({
                    _id: '',
                    customerID: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phoneNumber: '',
                    mainPhone: '',
                    homePhone: '',
                    company: '',
                    restaurant: '',
                    salutation: '',
                    spouse: '',
                    dateofBirth: '',
                    dateofMarriage: '',
                    fax: '',
                    billingAddress: {
                        address1: '',
                        address2: '',
                        city: '',
                        postalCode: '',
                        state: '',
                        country: '',
                    },
                    shippingAddress: {
                        address1: '',
                        address2: '',
                        city: '',
                        postalCode: '',
                        state: '',
                        country: '',
                    },
                    taxExempt: false,
                    taxId: '',
                    priceLevel: 'a',
                    storeCredit: 0,
                    pointsEarned: 0,
                    crmParameters: {},
                    houseAccount: {
                        creditlimit: 0,
                        openingBalance: 0,
                        currentBalance: 0,
                    },
                });
                setErrors({});
                setIsButtonLoading(false)
            } catch (error: any) {
                setIsButtonLoading(false)
                toast.error(error?.response?.data?.message);
            }
        }
    };


    const [isFileEdit, setIsFileEdit] = useState(false)

    const profilePhoto = useMemo(() => {
        if (selectedFile) {
            return URL.createObjectURL(selectedFile);
        }
        if (formData?.customerProfile) {
            return `${apiUrl}/${formData.customerProfile}`;
        }
        return NoImage;
    }, [selectedFile, formData?.customerProfile]);

    const handlePreviousFile = () => {
        setIsFileEdit(false);
        setSelectedFile(null);
    };

    const handleDeletePhoto = () => {
        setIsFileEdit(false);
        setSelectedFile(null);
        setFormData((pre: any) => ({ ...pre, customerProfile: "" }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setIsFileEdit(true)
        }
    };


    const handlePhoneNumberLength = (data: any, value: any, key: any) => {
        if (value < data) {
            setErrors((pre: any) => ({
                ...pre,
                [key]: `Please enter a valid ${data}-digit phone number`,
            }));
        }
        if (value === data) {
            setErrors((pre: any) => ({ ...pre, [key]: true }));
        }
    };

    const handlePhoneNumber = (phone: any, country: any) => {
        setPhoneInputData(phone)
        const phoneWithoutDialCode = phone.replace(country.dialCode || "", "")
        setFormData((prevFormData: any) => ({
            ...prevFormData,
            phoneNumber: phoneWithoutDialCode
        }));
        const countryData = phoneNumberLength(country);
        handlePhoneNumberLength(countryData, phoneWithoutDialCode.length, "phoneNumber");
    }

    const handleMainPhoneNumber = (phone: any, country: any) => {
        setMainPhoneInputData(phone)
        const phoneWithoutDialCode = phone.replace(country.dialCode || "", "")
        setFormData((prevFormData: any) => ({
            ...prevFormData,
            mainPhone: phoneWithoutDialCode
        }));
        const countryData = phoneNumberLength(country);
        handlePhoneNumberLength(countryData, phoneWithoutDialCode.length, "mainPhone");
    }

    const handleHomePhoneNumber = (phone: any, country: any) => {
        setHomePhoneInputData(phone)
        const phoneWithoutDialCode = phone.replace(country.dialCode || "", "")
        setFormData((prevFormData: any) => ({
            ...prevFormData,
            homePhone: phoneWithoutDialCode
        }));
        const countryData = phoneNumberLength(country);
        handlePhoneNumberLength(countryData, phoneWithoutDialCode.length, "homePhone");
    };

    return (
        <Modal
            show={openCustomerForm}
            onClose={() => setOpenCustomerForm(false)}
            className="backdrop-blur-sm dark:bg-DARK-950"
            size="4xl"
        >
            <Modal.Header className="dark:bg-DARK-800">
                <div className="flex gap-2 items-center">
                    <img
                        src={profilePhoto || "images/download.png"}
                        alt="Profile Preview"
                        className="w-14 h-14 object-cover rounded-full border-2 border-DARK-300 shadow-2xl"
                        onError={(e) => (e.currentTarget.src = NoImage)}
                    />
                    {/* <h2>{customer?.firstName} {customer?.lastName || ''}</h2> */}
                </div>
            </Modal.Header>
            <Modal.Body className="dark:bg-DARK-800">
                <FormHeaderPaths page={id ? 'Edit Customer' : 'Add Customer'} prevLink='/customer/1/' prevPage='Customers' />
                <div className="relative mx-auto p-6 bg-white dark:bg-DARK-800 shadow-md rounded-2xl max-w-4xl">
                    <h2 className="text-2xl font-bold mb-8 text-center dark:text-DARK-100">Customer Form</h2>
                    {isLoading && <FormLoader count={2} />}
                    {!isLoading && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Profile Photo Section */}
                            <div className="flex justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <img
                                        src={profilePhoto || "images/download.png"}
                                        alt="Profile Preview"
                                        className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300 shadow-2xl"
                                        onError={(e) => (e.currentTarget.src = NoImage)}
                                    />
                                    <input
                                        type="file"
                                        id="customerProfile"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex gap-2">
                                        {isFileEdit ? (
                                            <div
                                                title="Click to switch back to your previous picture"
                                                onClick={handlePreviousFile}
                                                className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                            >
                                                <RxCross2 className="font-extrabold" />
                                            </div>
                                        ) : (
                                            <label htmlFor="customerProfile" className="cursor-pointer">
                                                <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                    <HiPencil />
                                                </div>
                                            </label>
                                        )}
                                        <button
                                            className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                            type="button"
                                            title={!formData?.customerProfile ? "Picture not stored – can't delete" : "Delete picture"}
                                            onClick={handleDeletePhoto}
                                            disabled={!formData?.customerProfile}
                                        >
                                            <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Company and Restaurant Fields */}
                            {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {loginRole === SUPER_ADMIN && (
                                        <div ref={companyRef}>
                                            <CompanyField
                                                companies={companies}
                                                selectedCompanyId={formData?.company}
                                                handleChange={handleChange}
                                                error={errors.company}
                                            />
                                        </div>
                                    )}
                                    <div ref={restaurantRef}>
                                        <RestaurantField
                                            restaurants={restaurant}
                                            selectedRestaurantId={formData?.restaurant}
                                            handleChange={handleChange}
                                            error={errors.restaurant}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Personal Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="firstName" value="First Name" />
                                        <span className="text-ERROR_HOVER">*</span>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            placeholder="Enter First Name"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            ref={nameRef}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.firstName && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.firstName}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName" value="Last Name" />
                                        <span className="text-ERROR_HOVER">*</span>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            placeholder="Enter Last Name"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {/* {errors.lastName && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.lastName}</p>} */}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Enter Email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="salutation" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Salutation</label>
                                        <input
                                            type="text"
                                            id="salutation"
                                            name="salutation"
                                            placeholder="Enter Salutation"
                                            value={formData.salutation}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Phone Number</label>
                                        <PhoneInput
                                            inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-500"
                                            countryCodeEditable={false}
                                            disableDropdown={true}
                                            country="us"
                                            placeholder="Enter phone number"
                                            value={phoneInputData || ""}
                                            onChange={(phone, country) => handlePhoneNumber(phone, country)}
                                        />
                                        {errors.phoneNumber && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.phoneNumber}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="mainPhone" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Main Phone</label>
                                        <PhoneInput
                                            inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-500"
                                            countryCodeEditable={false}
                                            disableDropdown={true}
                                            country="us"
                                            placeholder="Enter phone number"
                                            value={mainPhoneInputData || ""}
                                            onChange={(phone, country) => handleMainPhoneNumber(phone, country)}
                                        />
                                        {errors.mainPhone && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.mainPhone}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="homePhone" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Home Phone</label>
                                        <PhoneInput
                                            inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-500"
                                            countryCodeEditable={false}
                                            disableDropdown={true}
                                            country="us"
                                            placeholder="Enter phone number"
                                            value={homePhoneInputData || ""}
                                            onChange={(phone, country) => handleHomePhoneNumber(phone, country)}
                                        />
                                        {errors.homePhone && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.homePhone}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="fax" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Fax</label>
                                        <input
                                            type="text"
                                            id="fax"
                                            name="fax"
                                            placeholder="Enter Fax"
                                            value={formData.fax}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dates and Family */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">Dates and Family</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="dateofBirth" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Date of Birth</label>
                                        <NewSingleDate
                                            value={selectedBirthdate}
                                            onChange={handleBirthDate}
                                            allowPastDates={true}
                                            label="Date of Birth"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="dateofMarriage" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Date of Marriage</label>
                                        <NewSingleDate
                                            value={selectedMarriagedate}
                                            onChange={handleMarriageDate}
                                            allowPastDates={true}
                                            label="Date of Marriage"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="spouse" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Spouse</label>
                                        <input
                                            type="text"
                                            id="spouse"
                                            name="spouse"
                                            placeholder="Enter Spouse"
                                            value={formData.spouse}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">Billing Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="billingaddress1" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Address 1</label>
                                        <input
                                            type="text"
                                            id="billingaddress1"
                                            name="billingAddress.address1"
                                            placeholder="Enter Address 1"
                                            value={formData.billingAddress.address1}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.billingAddress?.address1 && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.billingAddress?.address1}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="billingaddress2" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Address 2</label>
                                        <input
                                            type="text"
                                            id="billingaddress2"
                                            name="billingAddress.address2"
                                            placeholder="Enter Address 2"
                                            value={formData.billingAddress.address2}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="billingcity" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">City</label>
                                        <input
                                            type="text"
                                            id="billingcity"
                                            name="billingAddress.city"
                                            placeholder="Enter City"
                                            value={formData.billingAddress.city}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.billingAddress?.city && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.billingAddress?.city}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="billingpostalCode" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Postal Code</label>
                                        <input
                                            type="text"
                                            id="billingpostalCode"
                                            name="billingAddress.postalCode"
                                            placeholder="Enter Postal Code"
                                            value={formData.billingAddress.postalCode}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.billingAddress?.postalCode && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.billingAddress?.postalCode}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="billingstate" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">State</label>
                                        <input
                                            type="text"
                                            id="billingstate"
                                            name="billingAddress.state"
                                            placeholder="Enter State"
                                            value={formData.billingAddress.state}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.billingAddress?.state && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.billingAddress?.state}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="billingcountry" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Country</label>
                                        <input
                                            type="text"
                                            id="billingcountry"
                                            name="billingAddress.country"
                                            placeholder="Enter Country"
                                            value={formData.billingAddress.country}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                        {errors.billingAddress?.country && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.billingAddress?.country}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">Shipping Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="shippingaddress1" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Address 1</label>
                                        <input
                                            type="text"
                                            id="shippingaddress1"
                                            name="shippingAddress.address1"
                                            placeholder="Enter Address 1"
                                            value={formData.shippingAddress.address1}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shippingaddress2" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Address 2</label>
                                        <input
                                            type="text"
                                            id="shippingaddress2"
                                            name="shippingAddress.address2"
                                            placeholder="Enter Address 2"
                                            value={formData.shippingAddress.address2}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shippingcity" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">City</label>
                                        <input
                                            type="text"
                                            id="shippingcity"
                                            name="shippingAddress.city"
                                            placeholder="Enter City"
                                            value={formData.shippingAddress.city}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shippingpostalCode" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Postal Code</label>
                                        <input
                                            type="text"
                                            id="shippingpostalCode"
                                            name="shippingAddress.postalCode"
                                            placeholder="Enter Postal Code"
                                            value={formData.shippingAddress.postalCode}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shippingstate" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">State</label>
                                        <input
                                            type="text"
                                            id="shippingstate"
                                            name="shippingAddress.state"
                                            placeholder="Enter State"
                                            value={formData.shippingAddress.state}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shippingcountry" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Country</label>
                                        <input
                                            type="text"
                                            id="shippingcountry"
                                            name="shippingAddress.country"
                                            placeholder="Enter Country"
                                            value={formData.shippingAddress.country}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">Account Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="taxId" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Tax ID</label>
                                        <input
                                            type="text"
                                            id="taxId"
                                            name="taxId"
                                            placeholder="Enter Tax ID"
                                            value={formData.taxId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="priceLevel" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Price Level</label>
                                        <select
                                            id="priceLevel"
                                            name="priceLevel"
                                            value={formData?.priceLevel}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        >
                                            <option className="dark:text-DARK-100" value="a">A</option>
                                            <option className="dark:text-DARK-100" value="b">B</option>
                                            <option className="dark:text-DARK-100" value="c">C</option>
                                            <option className="dark:text-DARK-100" value="d">D</option>
                                            <option className="dark:text-DARK-100" value="e">E</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="storeCredit" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Store Credit</label>
                                        <input
                                            type="number"
                                            id="storeCredit"
                                            name="storeCredit"
                                            value={formData?.storeCredit}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="pointsEarned" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Points Earned</label>
                                        <input
                                            type="number"
                                            id="pointsEarned"
                                            name="pointsEarned"
                                            value={formData.pointsEarned}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                <div className="flex max-w-md flex-col gap-4">
                                    <Label htmlFor="taxExempt" className="flex gap-3">
                                        <Checkbox
                                            className="checked:!bg-BRAND-500 !ring-0"
                                            id="taxExempt"
                                            name="taxExempt"
                                            checked={formData.taxExempt}
                                            onChange={handleChange}
                                        />
                                        Tax Exempt
                                    </Label>
                                </div>
                            </div>

                            {/* House Account */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold dark:text-DARK-100">House Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label htmlFor="creditlimit" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Credit Limit</label>
                                        <input
                                            type="number"
                                            id="creditlimit"
                                            name="houseAccount.creditlimit"
                                            value={formData.houseAccount.creditlimit}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="openingBalance" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Opening Balance</label>
                                        <input
                                            type="number"
                                            id="openingBalance"
                                            name="houseAccount.openingBalance"
                                            value={formData.houseAccount.openingBalance}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="currentBalance" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Current Balance</label>
                                        <input
                                            type="number"
                                            id="currentBalance"
                                            name="houseAccount.currentBalance"
                                            value={formData.houseAccount.currentBalance}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    disabled={!!isButtonLoading}
                                    className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 dark:hover:!bg-DARK-600 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!!isButtonLoading}
                                    className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                >
                                    <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                                    {isButtonLoading && (
                                        <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal.Body>.
        </Modal>

    );
}

export default CustomerFormModal;
