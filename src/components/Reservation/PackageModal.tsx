import { Button, Label, Modal, Checkbox } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { useAuth } from "../../context/AuthProvider";
import { CompanyField, RestaurantField } from "../../utils/functions";
import CommonInput from "../../utils/common/CommonInput";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface PackageModalProps {
    openPackageModal: boolean;
    setOpenPackageModal: React.Dispatch<React.SetStateAction<boolean>>;
    submitHandler: (packageData: any) => Promise<void>;
    selectedPackage?: any;
    companyData?: any;
    restaurantData?: any;
}

interface ErrorState {
    name?: string;
    description?: string;
    price?: string;
    maxGuests?: string;
    duration?: string;
    facilities?: string;
    company?: string;
}

const PackageModal: React.FC<PackageModalProps> = ({ openPackageModal, setOpenPackageModal, submitHandler, selectedPackage = null, companyData, restaurantData }: any) => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const initialPackage = selectedPackage || {
        name: "",
        price: "",
        facilities: [],
        duration: "",
        maxGuests: "",
        description: "",
        company: companyData?._id || companyData,
        restaurant: restaurantData?._id || restaurantData,
    };
    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);

    useEffect(() => {
        if (selectedPackage) {
            setPackageData(selectedPackage);
        }
    }, [selectedPackage]);

    // Set company for non-SUPER_ADMIN
    useEffect(() => {
        if (loginRole !== SUPER_ADMIN) {
            setPackageData((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
        }
    }, [loginRole, userData]);
    const [packageData, setPackageData] = useState(initialPackage);
    const [errors, setErrors] = useState<any>({});
    const [isPackageLoading, setIsPackageLoading] = useState(false);

    const handlePackageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setPackageData((prev: any) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));

        if (errors[name as keyof ErrorState]) {
            setErrors((prev: any) => ({ ...prev, [name]: "" }));
        }
    };

    const handleFacilityChange = (facility: string) => {
        setPackageData((prev: any) => ({
            ...prev,
            facilities: prev.facilities.includes(facility)
                ? prev.facilities.filter((item: any) => item !== facility)
                : [...prev.facilities, facility],
        }));
        setErrors((pre: any) => ({ ...pre, facilities: "" }))
    };
    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: any = {};


        if (loginRole === SUPER_ADMIN) {
            if (!packageData.company) {
                errorMsg.company = "Please select business.";
                isValid = false;
            }
        }
        if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
            if (!packageData.restaurant) {
                errorMsg.restaurant = "Please select restaurant.";
                isValid = false;
            }
        }

        if (!packageData.name) {
            errors.name = 'Package name is required';
            isValid = false;
        }
        if (packageData.price <= 0) {
            errors.price = 'Price must be greater than 0';
            isValid = false;
        }
        if (packageData.facilities.length === 0) {
            errors.facilities = 'Facilities are required';
            isValid = false;
        }
        if (packageData.duration <= 0) {
            errors.duration = 'Duration must be greater than 0';
            isValid = false;
        }
        if (packageData.maxGuests <= 0) {
            errors.maxGuests = 'Max guests must be greater than 0';
            isValid = false;
        }

        setErrors((prev: any) => ({ ...prev, ...errorMsg }));
        return isValid;
    };
    const submitPackage = () => {
        // if (!packageData.name || packageData.price <= 0) {
        //     setErrors({
        //         name: !packageData.name ? "Package name is required" : "",
        //         company: (loginRole === SUPER_ADMIN) ? (!packageData.company ? "Company name is required" : "") : "",
        //         restaurant: (MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) ? (!packageData.restaurant ? "Restaurant name is required" : "") : "",
        //         price: packageData.price <= 0 ? "Price must be greater than zero" : "",
        //         facilities: packageData.facilities.length === 0 ? "Facilities are required" : "",
        //         duration: packageData.duration <= 0 ? "Duration must be greater than zero" : "",
        //         maxGuests: packageData.maxGuests <= 0 ? "Max guests must be greater than zero" : "",
        //     });
        //     return;
        // }
        if (isValid()) {
            packageSubmitAPI(packageData);
        }

    };
    const packageSubmitAPI = async (packageData: any) => {
        try {
            setIsPackageLoading(true);
            let response;
            if (selectedPackage?._id) {
                response = await apiClient.patch(`/packages/${selectedPackage?._id}`, packageData);
            } else {
                response = await apiClient.post('/packages', packageData);
            }

            if (response.data.success) {
                const newPackage = response.data.package;
                submitHandler(newPackage);
                setPackageData(initialPackage);
                setErrors({});
                toast.success(response.data.message);
                setOpenPackageModal(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong");
        } finally {
            setTimeout(() => {
                setIsPackageLoading(false);
            }, 500);
        }
    };

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
                setRestaurant(response.data.restaurant);
                return response.data.restaurant;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
        return [];
    }, []);

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany()
        }
        if (MANAGER_ROLES.includes(loginRole)) {
            getRestaurant(userData?.staffMember?.company?._id)
        }
        if (selectedPackage) {
            getRestaurant(selectedPackage?.company?._id || selectedPackage?.company)
        }
    }, [selectedPackage?.company?._id])

    useEffect(() => {
        if (packageData?.company && loginRole === SUPER_ADMIN) {
            getRestaurant(packageData.company);
        }
    }, [packageData?.company, loginRole]);

    // Auto-select company if single
    useEffect(() => {
        if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
            setPackageData((prev: any) => ({ ...prev, company: companies[0]._id }));
            setErrors((prev: any) => ({ ...prev, company: "" }));
        }
    }, [companies, loginRole]);

    // Auto-select restaurant if single
    useEffect(() => {
        if (restaurant?.length === 1) {
            setPackageData((prev: any) => ({ ...prev, restaurant: restaurant[0]._id }));
            setErrors((prev: any) => ({ ...prev, restaurant: "" }));
        }
    }, [restaurant]);

    return (
        <Modal show={openPackageModal} onClose={() => setOpenPackageModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="bg-BRAND-100 dark:bg-DARK-800 text-white">
                <span className="text-2xl font-bold text-DARK-900 dark:text-white text-left">
                    {packageData._id ? "Update Package" : "Add Package"}
                </span>
            </Modal.Header>
            <Modal.Body className="dark:bg-DARK-800">
                {(!restaurantData) && <div className={`grid grid-cols-1 ${loginRole === SUPER_ADMIN ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4 mb-4`}>
                    {loginRole === SUPER_ADMIN && <div className="flex flex-col">
                        <CompanyField
                            companies={companies}
                            selectedCompanyId={packageData?.company?._id || packageData?.company}
                            handleChange={handlePackageChange}
                            error={errors.company}
                        />
                    </div>}
                    {(MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) && <div className="flex flex-col" >
                        <RestaurantField
                            restaurants={restaurant}
                            selectedRestaurantId={packageData?.restaurant?._id || packageData?.restaurant}
                            handleChange={handlePackageChange}
                            error={errors.restaurant}
                        />
                    </div>}
                </div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full">
                        <Label value="Name" className="text-DARK-700" />
                        <span className="text-red-500">*</span>
                        <CommonInput
                            type="text"
                            name="name"
                            value={packageData.name}
                            onChange={handlePackageChange}
                            placeholder="Enter Package Name"
                        // className="w-full border-DARK-300 focus:!border-BRAND-500 focus:!ring-2 focus:!ring-BRAND-500  px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border rounded-xl"
                        />
                        {errors?.name && <p className="text-red-500">{errors.name}</p>}
                    </div>
                    <div className="w-full">
                        <Label value="Price" className="text-DARK-700" />
                        <span className="text-red-500">*</span>
                        <NumberInputPOS
                            name="price"
                            value={packageData.price}
                            allowDecimal={true}
                            maxDecimalPlaces={2}
                            onChange={(value) => {
                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                    const numValue =
                                        value === "" || value === "."
                                            ? ""
                                            : value
                                                .replace(/^0+(?=\d)/, "")
                                                .replace(/^0\.(\d)/, "0.$1");

                                    setPackageData((prev: any) => ({
                                        ...prev,
                                        price: numValue,
                                    }));

                                    if (numValue && Number(numValue) > 0 && errors.price) {
                                        setErrors((prev: any) => ({
                                            ...prev,
                                            price: "",
                                        }));
                                    }
                                }
                            }}
                            placeholder="Enter Package Price"
                        // className="w-full border-DARK-300 focus:!border-BRAND-500 focus:!ring-BRAND-500 px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border rounded-xl"
                        />
                        {errors?.price && <p className="text-red-500">{errors.price}</p>}
                    </div>

                    <div className="col-span-1 sm:col-span-2 w-full">
                        <Label value="Facilities" className="text-DARK-700" />
                        <span className="text-red-500">*</span>
                        <div className="flex flex-wrap gap-2">
                            {["Music", "Decoration", "Catering", "Parking", "WiFi"].map((facility) => (
                                <label key={facility} className="flex items-center dark:text-DARK-200 space-x-2">
                                    <Checkbox
                                        name="facilities"
                                        value={facility}
                                        checked={packageData.facilities.includes(facility)}
                                        onChange={() => handleFacilityChange(facility)}
                                        className="checked:!bg-BRAND-500 focus:!ring-0"
                                    />
                                    <span>{facility}</span>
                                </label>
                            ))}
                        </div>
                        {errors?.facilities && <p className="text-red-500">{errors.facilities}</p>}
                    </div>

                    <div className="w-full">
                        <Label value="Duration (in hours) (Max 24 hours)" className="text-DARK-700" />
                        <span className="text-red-500">*</span>
                        <NumberInputPOS
                            name="duration"
                            value={packageData.duration}
                            allowDecimal={false}
                            onChange={(value) => {
                                const numValue =
                                    value === "" ? "" : String(Number(value));

                                const parsedNum = numValue
                                    ? parseInt(numValue, 10)
                                    : 0;

                                if (parsedNum > 24) {
                                    return;
                                }

                                setPackageData((prev: any) => ({
                                    ...prev,
                                    duration: numValue,
                                }));

                                if (
                                    numValue &&
                                    Number(numValue) > 0 &&
                                    errors.duration
                                ) {
                                    setErrors((prev: any) => ({
                                        ...prev,
                                        duration: "",
                                    }));
                                }
                            }}
                            placeholder="Enter Package Duration"
                            className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500"
                        />
                        {errors?.duration && <p className="text-red-500">{errors.duration}</p>}
                    </div>
                    <div className="w-full">
                        <Label value="Max Guests" className="text-DARK-700" />
                        <span className="text-red-500">*</span>
                        <NumberInputPOS
                            name="maxGuests"
                            value={packageData.maxGuests}
                            allowDecimal={false}
                            onChange={(value) => {
                                const numValue =
                                    value === "" ? "" : String(Number(value));

                                setPackageData((prev: any) => ({
                                    ...prev,
                                    maxGuests: numValue,
                                }));

                                if (
                                    numValue &&
                                    Number(numValue) > 0 &&
                                    errors.maxGuests
                                ) {
                                    setErrors((prev: any) => ({
                                        ...prev,
                                        maxGuests: "",
                                    }));
                                }
                            }}
                            placeholder="Enter Package Max Guests"
                            className="border-DARK-300 focus:!border-BRAND-500 focus:!ring-BRAND-500"
                        />
                        {errors?.maxGuests && <p className="text-red-500">{errors.maxGuests}</p>}
                    </div>

                    <div className="col-span-1 sm:col-span-2 w-full">
                        <Label value="Description" className="text-DARK-700" />
                        <textarea
                            name="description"
                            value={packageData.description}
                            onChange={handlePackageChange}
                            placeholder="Enter Package Description"
                            rows={5}
                            className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                            // className="w-full border-DARK-300 focus:!border-BRAND-500 focus:!ring-BRAND-500  px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border rounded-xl"
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="dark:bg-DARK-800">
                <div className="flex justify-end gap-3 w-full">
                    <Button color="gray" className="!ring-0 bg-SECONDARY dark:bg-DARK-700 hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 text-white hover:!text-white w-32"
                        disabled={isPackageLoading}
                        onClick={() => setOpenPackageModal(false)}>
                        Cancel
                    </Button>
                    <Button color="BRAND" className="!ring-0 bg-BRAND-500 hover:!bg-BRAND-600 text-white w-32"
                        onClick={submitPackage}
                        disabled={isPackageLoading}>
                        {isPackageLoading ? "Loading..." : selectedPackage ? "Save" : "Add Package"}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default PackageModal;