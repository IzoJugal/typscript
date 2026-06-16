import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { CompanyField, RestaurantField } from "../../utils/functions";
import { Button, Label, Modal } from "flowbite-react";
import { MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { setTitle } from "../../utils/utility";
import ModifierCategoryFormLoader from "../../utils/ModifierCategoryFormLoader";
import { AiOutlineLoading } from "react-icons/ai";
import CommonInput from "../../utils/common/CommonInput";

interface ICategory {
    _id: string;
    name: string;
    isActive: boolean;
    company?: string;
    restaurant?: string;
}

interface ErrorState {
    name?: string;
    company?: string;
    restaurant?: string;
}

interface ModifierCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryId?: string;
}

const ModifierCategoryModal = ({ isOpen, onClose, categoryId }: ModifierCategoryModalProps) => {
    setTitle("Modifier Category Form");
    const { userData } = useAuth();
    const routeParams = useParams();

    const id = categoryId || routeParams.id;

    const [formData, setFormData] = useState<ICategory | any>({
        _id: '',
        name: '',
        isActive: true,
        company: '',
        restaurant: '',
    });

    const [errors, setErrors] = useState<ErrorState>({});
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
    const [companies, setCompanies] = useState<any>([]);
    const [restaurants, setRestaurants] = useState<any>([]);

    const companyRef = useRef<HTMLDivElement>(null);
    const restaurantRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                _id: '',
                name: '',
                isActive: true,
                company: loginRole === SUPER_ADMIN ? '' : userData?.staffMember?.company?._id || '',
                restaurant: '',
            });
            setRestaurants([]);
            setErrors({});
        }
    }, [isOpen, loginRole, userData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));

        if (errors[name as keyof ErrorState]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const isValid = (): boolean => {
        let valid = true;
        const errorMsg: Partial<ErrorState> = {};
        let firstErrorRef: React.RefObject<any> | null = null;

        if (!formData?.name) {
            errorMsg.name = "Please enter name.";
            if (!firstErrorRef) firstErrorRef = nameRef;
            valid = false;
        }

        if (loginRole === SUPER_ADMIN) {
            if (!formData?.company) {
                errorMsg.company = "Please select business.";
                if (!firstErrorRef) firstErrorRef = companyRef;
                valid = false;
            }
        }

        if (MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) {
            if (!formData?.restaurant) {
                errorMsg.restaurant = "Please select restaurant.";
                if (!firstErrorRef) firstErrorRef = restaurantRef;
                valid = false;
            }
        }

        setErrors(prev => ({ ...prev, ...errorMsg }));
        if (firstErrorRef && firstErrorRef.current) {
            firstErrorRef.current.focus();
            firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return valid;
    };

    const getCategory = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/modifier/category/${id}`);
            const category = response.data?.category;
            setFormData((prev: any) => ({
                ...prev,
                ...category,
            }));
            if (loginRole === SUPER_ADMIN) {
                getRestaurant(category?.company);
            }
        } catch (error) {
            console.error('~ getCategory error :-', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, setIsLoading, loginRole]);

    useEffect(() => {
        if (isOpen) {
            if (id) {
                getCategory();
            }
            if (loginRole === SUPER_ADMIN) {
                getCompany();
            }
        }
    }, [id, getCategory, isOpen, loginRole]);

    useEffect(() => {
        if (isOpen && OWNER_ROLES.includes(loginRole) && loginRole !== SUPER_ADMIN) {
            getRestaurant(userData?.staffMember?.company?._id);
        }
    }, [loginRole, isOpen, userData]);

    useEffect(() => {
        if (isOpen && formData?.company && loginRole === SUPER_ADMIN) {
            getRestaurant(formData.company);
        }
    }, [formData?.company, loginRole, isOpen]);

    useEffect(() => {
        if (isOpen && companies?.length === 1 && loginRole === SUPER_ADMIN) {
            setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
            setErrors(prev => ({ ...prev, company: "" }));
        }
    }, [companies, loginRole, isOpen]);

    useEffect(() => {
        if (
            isOpen &&
            restaurants?.length === 1 &&
            !formData?.restaurant
        ) {
            setFormData((prev: any) => ({
                ...prev,
                restaurant: restaurants[0]._id
            }));
        }
    }, [restaurants, isOpen, formData?.restaurant]);

    useEffect(() => {
        if (isOpen && loginRole !== SUPER_ADMIN) {
            setFormData((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
        }
    }, [loginRole, userData, isOpen]);

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                // setCompanies(response.data.companies);
                setCompanies(Array.isArray(response.data?.companies)
                    ? response.data.companies
                    : []);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    };

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                // setRestaurant(response.data.restaurant);
                // return response.data.restaurant;
                const restaurants = Array.isArray(response.data?.restaurant)
                    ? response.data.restaurant
                    : [];

                setRestaurants(restaurants);
                return restaurants;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
        return [];
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                let response;
                if (id) {
                    setIsButtonLoading(true);
                    response = await apiClient.patch(`/modifier/category/${id}`, formData);
                    setIsButtonLoading(false);
                    toast.success(response?.data?.message || 'Category updated successfully!');
                } else {
                    setIsButtonLoading(true);
                    response = await apiClient.post('/modifier/category/add', formData);
                    if (response?.data?.success) {
                        toast.success('Category added successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the category.');
                        setIsButtonLoading(false);
                        return;
                    }
                }
                setIsButtonLoading(false);
                onClose();
            } catch (error: any) {
                setIsButtonLoading(false);
                console.log('Error during form submission:', error);
                toast.error(error?.response?.data?.message || error?.message);
            }
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} popup className="backdrop-blur-sm dark:bg-DARK-950 !w-full !max-w-full">
            <div className="relative w-full max-w-2xl mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
                <Modal.Header className="dark:bg-DARK-800 border-b border-DARK-200 dark:border-DARK-700 px-4 sm:px-6 py-4">
                    <span className="text-lg sm:text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                        {isLoading ? (
                            <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                        ) : (
                            id ? 'Edit Modifier Category' : 'Add Modifier Category'
                        )}
                    </span>
                </Modal.Header>
                <Modal.Body className="dark:bg-DARK-800 max-h-[calc(100vh-220px)] overflow-y-auto px-4 sm:px-6 py-4">
                    {isLoading ? (
                        <ModifierCategoryFormLoader count={1} />
                    ) : (

                        <form id="modifier-category-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-3 sm:gap-4`}>
                                {loginRole === SUPER_ADMIN && (
                                    <div className="flex flex-col" ref={companyRef}>
                                        <CompanyField
                                            companies={companies || []}
                                            selectedCompanyId={formData?.company}
                                            handleChange={handleChange}
                                            error={errors.company}
                                        />
                                    </div>
                                )}
                                {(loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole)) && (
                                    <div className="flex flex-col" ref={restaurantRef}>
                                        <RestaurantField
                                            restaurants={restaurants || []}
                                            selectedRestaurantId={formData?.restaurant}
                                            handleChange={handleChange}
                                            error={errors.restaurant}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label htmlFor="name" value="Name" />
                                    <span className="text-ERROR_HOVER">*</span>
                                    <CommonInput
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="Enter category name"
                                        value={formData?.name}
                                        onChange={handleChange}
                                        ref={nameRef}
                                        // className="w-full mt-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-BRAND-500 dark:focus:ring-BRAND-400 outline-none transition"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <label htmlFor="isAvailable" className="text-sm sm:text-base font-medium text-DARK-700 dark:text-DARK-100">
                                        Status
                                    </label>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                id="Activated"
                                                name="isActive"
                                                value="true"
                                                checked={formData?.isActive === true}
                                                onChange={() => setFormData((prev: any) => ({ ...prev, isActive: true }))}
                                                className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded cursor-pointer"
                                            />
                                            <label htmlFor="Activated" className="text-sm sm:text-base font-medium text-DARK-700 dark:text-DARK-100 cursor-pointer">
                                                Activated
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                id="DeActivated"
                                                name="isActive"
                                                value="false"
                                                checked={formData?.isActive === false}
                                                onChange={() => setFormData((prev: any) => ({ ...prev, isActive: false }))}
                                                className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded cursor-pointer"
                                            />
                                            <label htmlFor="DeActivated" className="text-sm sm:text-base font-medium text-DARK-700 dark:text-DARK-100 cursor-pointer">
                                                Deactivated
                                            </label>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </form>
                    )}
                </Modal.Body>
                <Modal.Footer className="justify-end dark:bg-DARK-800 border-t border-DARK-200 dark:border-DARK-700 px-4 sm:px-6 py-4 gap-3 flex flex-col sm:flex-row">
                    <Button
                        type="button"
                        onClick={onClose}
                        disabled={!!isButtonLoading}
                        className="group relative flex items-stretch justify-center p-0.5 text-center focus:z-10 focus:outline-none border border-transparent focus:ring-4 focus:ring-cyan-300 enabled:hover:bg-cyan-800 dark:focus:ring-cyan-800 dark:enabled:hover:bg-cyan-700 w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="modifier-category-form"
                        disabled={!!isButtonLoading}
                        isProcessing={isButtonLoading}
                        processingSpinner={<AiOutlineLoading className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />}
                        className="group flex items-stretch justify-center p-0.5 text-center focus:z-10 focus:outline-none border border-transparent focus:ring-4 focus:ring-cyan-300 enabled:hover:bg-cyan-800 dark:bg-cyan-600 dark:focus:ring-cyan-800 dark:enabled:hover:bg-cyan-700 w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                        {isButtonLoading && (
                            <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                        )}
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
};

export default ModifierCategoryModal;