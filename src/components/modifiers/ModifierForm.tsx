
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { Button, Label, } from "flowbite-react";
import { useAuth } from "../../context/AuthProvider";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import FormLoader from "../../utils/common/FormLoader";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { setTitle } from "../../utils/utility";
import IngredientTable from "../products/IngredientTable";
import IngredientsForm from "../products/IngredientsForm";
import NumberInputPOS from "../../utils/common/NumberInputPOS";
import CommonInput from "../../utils/common/CommonInput";

interface ICategorys {
    _id: string;
    name: string;
    description: string;
}

interface IIngredient {
    _id: string;
    quantity: number;
    name?: string;
    unit?: string;
}

interface IModifier {
    _id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    modifierCategory: string;
    isAvailable: boolean;
    company?: string;
    restaurant?: string;
    ingredients?: IIngredient[];
}

interface ErrorState {
    name?: string;
    description?: string;
    price?: string;
    category?: string;
    modifierCategory?: string;
    isAvailable?: string;
    company?: string;
    restaurant?: string;
}

function ModifierForm() {
    setTitle("Modifier Form");
    const { id } = useParams()
    const navigate = useNavigate()
    const [categorys, setCategorys] = useState<ICategorys[]>([]);
    const [modifierCategories, setModifierCategories] = useState<any[]>([]);
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [formData, setFormData] = useState<IModifier>({
        _id: '',
        name: '',
        description: '',
        price: "",
        category: '',
        modifierCategory: '',
        isAvailable: true,
        company: '',
        restaurant: '',
        ingredients: []
    });
    const [errors, setErrors] = useState<ErrorState>({} as ErrorState);
    const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
    const [companies, setCompanies] = useState<any[]>([]);
    const [restaurant, setRestaurant] = useState<any[]>([]);

    const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [currentIngredientIndex, setCurrentIngredientIndex] = useState<number | null>(null);

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

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(
                    Array.isArray(response.data.restaurant)
                        ? response.data.restaurant
                        : []
                );
                return response.data.restaurant;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
        return [];
    }

    const getCategory = useCallback(async (company?: string, restaurant?: string) => {
        try {
            const queryParams = createQueryParams({ company: company, restaurant: restaurant })
            const response = await apiClient.get(`/category${queryParams}`,);
            setCategorys(Array.isArray(response.data?.categories)
                ? response.data.categories
                : []);
        } catch (error) {
            console.error("~ get category error :-", error);
        }
    }, []);

    const getModifierCategory = useCallback(async (company?: string, restaurant?: string) => {
        try {
            const queryParams = createQueryParams({ company: company, restaurant: restaurant })
            const response = await apiClient.get(`/modifier/category/all${queryParams}`,);
            setModifierCategories(
                Array.isArray(response?.data?.categories)
                    ? response.data.categories
                    : []
            );
        } catch (error) {
            console.error("~ get category error :-", error);
        }
    }, []);

    // const modifier = useCallback(async () => {
    //     try {
    //         setIsLoading(true)
    //         const response = await apiClient.get(`/modifier/${id}`);
    //         const modifier = response?.data?.modifier || {};
    //         setFormData(prev => ({
    //             ...prev,
    //             ...modifier,
    //             company: modifier?.company?._id ?? modifier?.company ?? '',
    //             restaurant: modifier?.restaurant?._id ?? modifier?.restaurant ?? '',
    //             category: modifier?.category?._id ?? modifier?.category ?? '',
    //             modifierCategory: modifier?.modifierCategory?._id ?? modifier?.modifierCategory ?? '',
    //         }));

    //         if (loginRole === SUPER_ADMIN) {
    //             await getRestaurant(modifier?.company)
    //         }
    //         if (modifier?.ingredients) {
    //             setIngredients(
    //                 Array.isArray(modifier?.ingredients)
    //                     ? modifier.ingredients
    //                     : []
    //             );
    //         }
    //         setIsLoading(false);

    //     } catch (error) {
    //         setIsLoading(false);
    //         console.error('~ getProduct error :-', error);
    //     }
    // }, [id, setIsLoading]);

    const modifier = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/modifier/${id}`);
            const modifier = response?.data?.modifier || {};

            setFormData(prev => ({
                ...prev,
                ...modifier,
                company: modifier?.company?._id ?? modifier?.company ?? '',
                restaurant: modifier?.restaurant?._id ?? modifier?.restaurant ?? '',
                category: modifier?.category?._id ?? modifier?.category ?? '',
                modifierCategory: modifier?.modifierCategory?._id ?? modifier?.modifierCategory ?? '',
            }));

            if (loginRole === SUPER_ADMIN && (modifier?.company?._id ?? modifier?.company)) {
                await getRestaurant(modifier?.company?._id ?? modifier?.company);
            }

            setIngredients(Array.isArray(modifier?.ingredients) ? modifier.ingredients : []);
        } catch (error) {
            console.error('~ getProduct error :-', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, loginRole, setIsLoading]);

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany();
        }
    }, [loginRole])

    useEffect(() => {
        if (OWNER_ROLES.includes(loginRole) && formData?.restaurant) {
            getCategory(formData?.company, formData?.restaurant);
            getModifierCategory(formData?.company, formData?.restaurant);
        } else if (loginRole !== SUPER_ADMIN && !OWNER_ROLES.includes(loginRole)
        ) {
            getModifierCategory()
            getCategory()
        }
    }, [loginRole, formData?.restaurant]);

    useEffect(() => {
        if (id) {
            modifier()
        }
    }, [id]);

    useEffect(() => {
        if (OWNER_ROLES.includes(loginRole) && loginRole !== SUPER_ADMIN) {
            getRestaurant(userData?.staffMember?.company?._id);
        }
    }, [loginRole]);

    useEffect(() => {
        if (formData?.company && loginRole === SUPER_ADMIN) {
            getRestaurant(formData.company);
        }
    }, [formData?.company, loginRole]);

    // Auto-select company if single
    useEffect(() => {
        if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
            setFormData(prev => ({ ...prev, company: companies[0]._id }));
            setErrors(prev => ({ ...prev, company: "" }));
        }
    }, [companies, loginRole]);

    // Auto-select modifier category if single
    useEffect(() => {
        if (modifierCategories?.length === 1 && !formData.modifierCategory) {
            setFormData(prev => ({ ...prev, modifierCategory: modifierCategories[0]._id }));
            setErrors(prev => ({ ...prev, modifierCategory: "" }));
        }
    }, [modifierCategories]);

    // Set company for non-SUPER_ADMIN
    useEffect(() => {
        if (loginRole !== SUPER_ADMIN) {
            setFormData(prev => ({ ...prev, company: userData?.staffMember?.company?._id }));
        }
    }, [loginRole, userData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));

        if (errors[name as keyof ErrorState]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }

    }

   useEffect(() => {
    if (
        restaurant?.length === 1 &&
        formData.restaurant !== restaurant[0]._id
    ) {
        setFormData(prev => ({
            ...prev,
            restaurant: restaurant[0]._id,
        }));

        setErrors(prev => ({
            ...prev,
            restaurant: "",
        }));
    }
}, [restaurant]);

    useEffect(() => {
        if (categorys?.length === 1 && !formData.category) {
            setFormData(prev => ({
                ...prev,
                category: categorys[0]._id,
            }));

            setErrors(prev => ({
                ...prev,
                category: "",
            }));
        }
    }, [categorys]);

    const companyRef = useRef<HTMLInputElement | any>(null);
    const restaurantRef = useRef<HTMLInputElement | any>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const categoryRef = useRef<HTMLSelectElement>(null);
    const modifierCategoryRef = useRef<HTMLSelectElement>(null);

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<ErrorState> = {};
        let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | null = null;

        if (!formData.name) {
            errorMsg.name = "Please enter name.";
            if (!firstErrorRef) {
                firstErrorRef = nameRef;
            };
            isValid = false;
        }
        const finalPrice = formData.price === "" ? "0" : formData.price;

        if (isNaN(Number(finalPrice))) {
            errorMsg.price = "Price must be a valid number.";
            isValid = false;
        } else if (Number(finalPrice) < 0) {
            errorMsg.price = "Price must be 0 or greater.";
            isValid = false;
        }

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

        if (!String(formData.category || '').trim()) {
            errorMsg.category = "Please select a category.";
            if (!firstErrorRef) {
                firstErrorRef = categoryRef;
            };
            isValid = false;
        }

        if (!String(formData.modifierCategory || '').trim()) {
            errorMsg.modifierCategory = "Please select a modifier category.";
            if (!firstErrorRef) {
                firstErrorRef = modifierCategoryRef;
            };
            isValid = false;
        }

        setErrors(prev => ({ ...prev, ...errorMsg }));
        if (firstErrorRef && firstErrorRef.current) {
            firstErrorRef.current.focus();
            firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                let response
                const completeFormData = {
                    ...formData,
                    price: formData.price === "" ? "0" : formData.price,
                    ingredients,
                };
                if (id) {
                    setIsButtonLoading(true)
                    response = await apiClient.patch(`/modifier/${id}`, completeFormData);
                    toast.success(response?.data?.message || 'Modifier updated successfully!');
                } else {
                    setIsButtonLoading(true)
                    response = await apiClient.post('/modifier/add', completeFormData,)
                    if (response?.data?.success) {
                        toast.success('Modifier added successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the product.');
                        return;
                    }
                }
                navigate(-1);
                // setFormData({
                //     _id: '',
                //     name: '',
                //     description: '',
                //     price: '',
                //     category: '',
                //     modifierCategory: '',
                //     isAvailable: true,
                //     company: '',
                //     restaurant: '',
                //     ingredients: []
                // })
                // setIngredients([]);
                // setErrors({ restaurant: "" });
                // setIsButtonLoading(false);
            } catch (error: any) {
                setIsButtonLoading(false);
                toast.error(error?.response?.data?.message || error?.message);
            } finally {
                setIsButtonLoading(false)
            }
        }
    }

    // const [visibleCategory, setVisibleCategory] = useState<string | null>(null);
    // const [visibleModifierCategory, setVisibleModifierCategory] = useState<string | null>(null);
    // const [searchTerm, setSearchTerm] = useState<string>("");

    // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setSearchTerm(e.target.value.toLowerCase());
    // };
    const handleSetCategory = (id: any) => {
        setFormData(prev => ({ ...prev, category: id }));
        // setVisibleCategory(null);
        // setVisibleModifierCategory(null);
        // setSearchTerm("");
        setErrors(prev => ({ ...prev, category: "" }));
    };

    // const handleCategory = () => {
    //     if (visibleCategory) {
    //         setVisibleCategory(null);
    //     } else {
    //         setVisibleCategory('categories')
    //     }
    //     if (searchTerm) {
    //         setSearchTerm("");
    //     }
    // }

    // const handleModifierCategory = () => {
    //     if (visibleModifierCategory) {
    //         setVisibleCategory(null);
    //     } else {
    //         setVisibleCategory('modifiercategories')
    //     }
    //     if (searchTerm) {
    //         setSearchTerm("");
    //     }
    // }
    const handleModifier = (id: any) => {
        setFormData(prev => ({ ...prev, modifierCategory: id }));
        setErrors(prev => ({ ...prev, modifierCategory: "" }));
    }

    // const handleIngredientSubmit = async (ingredient: any): Promise<void> => {
    //     const minimalIngredient = {
    //         _id: ingredient._id,
    //         quantity: Number(ingredient.quantity),
    //         name: ingredient?.name,
    //         unit: ingredient?.unit
    //     };

    //     if (currentIngredientIndex !== null) {
    //         setIngredients((prev: any) => {
    //             const newIngredients = [...prev];
    //             newIngredients[currentIngredientIndex] = minimalIngredient;
    //             return newIngredients;
    //         });
    //     } else {
    //         setIngredients((prev: any) => [...prev, minimalIngredient]);
    //     }

    //     setIngredientModalOpen(false);
    //     setCurrentIngredientIndex(null);
    // };

    const handleIngredientSubmit = async (ingredient: any): Promise<void> => {
        const minimalIngredient = {
            _id: ingredient._id,
            quantity: Number(ingredient.quantity),
            name: ingredient?.name,
            unit: ingredient?.unit
        };

        if (currentIngredientIndex !== null) {
            setIngredients((prev: any) => {
                const newIngredients = Array.isArray(prev) ? [...prev] : [];
                newIngredients[currentIngredientIndex] = minimalIngredient;
                return newIngredients;
            });
        } else {
            setIngredients((prev: any) => [
                ...(Array.isArray(prev) ? prev : []),
                minimalIngredient
            ]);
        }

        setIngredientModalOpen(false);
        setCurrentIngredientIndex(null);
    };

    const handleDeleteIngredient = (index: any) => {
        setIngredients((prev: any) =>
            Array.isArray(prev) ? prev.filter((_: any, i: any) => i !== index) : []
        );
    };


    const onIngredientFormClose = () => {
        setIngredientModalOpen(false);
        setCurrentIngredientIndex(null);
    };

    const handleEditIngredient = (index: any) => {
        setCurrentIngredientIndex(index);
        setIngredientModalOpen(true);
    };

    // const handleDeleteIngredient = (index: any) => {
    //     setIngredients((prev: any) => prev.filter((_: any, i: any) => i !== index));
    // }

    return (
        <>
            <FormHeaderPaths page={id ? 'Edit modifier' : 'Add modifier'} prevLink='/modifier/1/' prevPage='Modifiers' />
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="relative p-4 my-6 md:p-6 lg:p-8 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
                    <h2 className="text-2xl md:text-3xl font-bold sm:mb-8 mb-4 text-gray-800 dark:text-DARK-100">Modifier Form</h2>
                    {isLoading && <FormLoader count={2} />}
                    {!isLoading && <form onSubmit={handleSubmit} className="relative bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
                            {/* Company and Restaurant Selection */}
                            {loginRole === SUPER_ADMIN && (
                                <div className="flex flex-col lg:col-span-2" ref={companyRef}>
                                    <CompanyField
                                        companies={companies}
                                        selectedCompanyId={formData?.company as string}
                                        handleChange={handleChange}
                                        error={errors.company}
                                    />
                                </div>
                            )}
                            {(loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole)) && (<div className="flex flex-col" ref={restaurantRef}>
                                <RestaurantField
                                    restaurants={restaurant}
                                    selectedRestaurantId={formData?.restaurant as string}
                                    handleChange={handleChange}
                                    error={errors.restaurant}
                                />
                            </div>)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name, Price, Category, and Modifier Category - One Row on Large Screens */}
                            <div className="flex flex-col">
                                <div className="flex items-center mb-1">
                                    <Label htmlFor="name" value="Modifier Name" />
                                    <span className="text-ERROR_HOVER ml-1">*</span>
                                </div>
                                <CommonInput
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    ref={nameRef}
                                    placeholder="Enter name"
                                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                                />
                                {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-center mb-1">
                                    <Label htmlFor="price" value="Price" className="mb-1" />
                                </div>
                                <NumberInputPOS
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={(value) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            price: value,
                                        }));

                                        if (errors.price) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                price: "",
                                            }));
                                        }
                                    }}
                                    allowDecimal
                                    maxDecimalPlaces={2}
                                    placeholder="0.00"
                                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                                />
                                {errors.price && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.price}</p>}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-center mb-1">
                                    <Label htmlFor="category" value="Category" />
                                    <span className="text-ERROR_HOVER ml-1">*</span>
                                </div>
                                <DropdownWithSearch
                                    setSelectedItem={setFormData}
                                    selectedItem={categorys?.find((c: any) => c._id === formData?.category)?.name || ''}
                                    items={Array.isArray(categorys) ? categorys : []}
                                    title="Category"
                                    handleFilter={handleSetCategory}
                                    fieldKey="category"
                                />
                                {errors?.category && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.category}</p>}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-center mb-1">
                                    <Label htmlFor="modifierCategories" value="Modifier Category" />
                                    <span className="text-ERROR_HOVER ml-1">*</span>
                                </div>
                                <DropdownWithSearch
                                    setSelectedItem={setFormData}
                                    selectedItem={modifierCategories?.find((c: any) => c._id === formData?.modifierCategory)?.name || ''}
                                    items={Array.isArray(modifierCategories) ? modifierCategories : []}
                                    title="Modifier Category"
                                    handleFilter={handleModifier}
                                    fieldKey="modifierCategory"
                                />
                                {errors?.modifierCategory && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.modifierCategory}</p>}
                            </div>

                            {/* Description - Spans Full Width */}
                            <div className="flex flex-col md:col-span-2 lg:col-span-4">
                                <Label htmlFor="description" value="Description" className="mb-1" />
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Write a short description..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-lg focus:ring-BRAND-500 focus:border-BRAND-500 transition-all duration-200"
                                />
                                {errors.description && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.description}</p>}
                            </div>

                            {/* Availability and Ingredients Header - Spans Full Width */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between md:col-span-2 lg:col-span-4 pt-2 pb-1 bg-white/50 dark:bg-DARK-700/30 p-4 rounded-xl border border-gray-100 dark:border-DARK-600">
                                <div className="flex items-center space-x-6 mb-4 md:mb-0">
                                    <span className="text-sm font-semibold text-DARK-700 dark:text-DARK-100">Is Available?</span>
                                    <div className="flex items-center space-x-6">
                                        <label className="inline-flex items-center cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="isAvailable"
                                                checked={formData.isAvailable === true}
                                                onChange={() => setFormData(prev => ({ ...prev, isAvailable: true }))}
                                                className="w-5 h-5 text-BRAND-500 bg-gray-100 border-gray-300 focus:ring-BRAND-500 dark:focus:ring-BRAND-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-DARK-700 dark:border-DARK-600 transition-all duration-200"
                                            />
                                            <span className="ml-3 text-sm font-medium text-DARK-700 dark:text-DARK-100 group-hover:text-BRAND-500 transition-colors">Yes</span>
                                        </label>
                                        <label className="inline-flex items-center cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="isAvailable"
                                                checked={formData.isAvailable === false}
                                                onChange={() => setFormData(prev => ({ ...prev, isAvailable: false }))}
                                                className="w-5 h-5 text-BRAND-500 bg-gray-100 border-gray-300 focus:ring-BRAND-500 dark:focus:ring-BRAND-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-DARK-700 dark:border-DARK-600 transition-all duration-200"
                                            />
                                            <span className="ml-3 text-sm font-medium text-DARK-700 dark:text-DARK-100 group-hover:text-BRAND-500 transition-colors">No</span>
                                        </label>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setIngredientModalOpen(true)}
                                    className="!bg-BRAND-500 hover:!bg-BRAND-600 !ring-0 text-white rounded-lg px-2 transition-all duration-300 transform hover:scale-[1.02]"
                                >
                                    <span className="flex items-center font-semibold">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                        Add Ingredients
                                    </span>
                                </Button>
                            </div>

                            {/* Ingredients Table - Spans Full Width */}
                            <div className="md:col-span-2 lg:col-span-4">
                                <div className="mb-3 flex items-center">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-DARK-100">Ingredients List</span>
                                    <div className="h-px bg-gray-200 dark:bg-DARK-600 flex-grow ml-4"></div>
                                </div>
                                <IngredientTable
                                    ingredients={Array.isArray(ingredients) ? ingredients : []}
                                    onEdit={handleEditIngredient}
                                    onDelete={handleDeleteIngredient}
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-DARK-700">
                            <Button
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={!!isButtonLoading}
                                className="px-8 bg-white dark:bg-DARK-700 text-gray-700 dark:text-DARK-200 hover:!bg-gray-200 dark:hover:bg-DARK-600 border border-gray-200 dark:border-DARK-600 !ring-0 transition-all duration-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!!isButtonLoading}
                                className="px-12 !bg-BRAND-500 text-white hover:!bg-BRAND-600 !ring-0 relative overflow-hidden shadow-lg shadow-BRAND-500/20 transition-all duration-300 transform"
                            >
                                <span className="relative z-10 font-bold tracking-wide">
                                    {isButtonLoading ? 'Processing...' : (id ? 'Update Modifier' : 'Create Modifier')}
                                </span>
                                {isButtonLoading && (
                                    <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                                )}
                            </Button>
                        </div>
                    </form>}
                </div>
            </div>
            <IngredientsForm
                open={ingredientModalOpen}
                setOpen={setIngredientModalOpen}
                ingredients={ingredients}
                setIngredients={setIngredients}
                company={formData?.company}
                restaurant={formData?.restaurant}
                onclose={onIngredientFormClose}
                onSubmit={handleIngredientSubmit}
                currentIngredientIndex={currentIngredientIndex}
            />
        </>
    )
}

export default ModifierForm