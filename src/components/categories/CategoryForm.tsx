
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { Button, Label, Radio, Select, } from "flowbite-react";
import { useAuth } from "../../context/AuthProvider";
import { HiX } from "react-icons/hi";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import FormLoader from "../../utils/common/FormLoader";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { setTitle } from "../../utils/utility";
import CommonInput from "../../utils/common/CommonInput";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface ICategory {
  _id: string;
  name: string;
  description: string;
  listingOrder: number | null;
  isActive: boolean;
  isBarItem: boolean;
  parent: string | null;
  isMeal: boolean;
  mealPeriod: string | null;
  background: string | null;
  fontType: string | null;
  fontSize: string | null;
  fontColor: string | null;
  itemColor: string | null;
  company: string | null;
  restaurant: string | null;
  taxes: string[] | null;
}

interface ErrorState {
  name?: string;
  description?: string;
  meal?: string;
  company?: string;
  restaurant?: string;
}

const CategoryForm = () => {
  setTitle("Category Form");
  const { id } = useParams()
  const navigate = useNavigate()
  const { userData } = useAuth()
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [formData, setFormData] = useState<ICategory | any>({
    _id: '',
    name: '',
    description: '',
    listingOrder: null,
    parent: null,
    isActive: true,
    isMeal: true,
    mealPeriod: null,
    isBarItem: false,
    background: '',
    fontType: '',
    fontSize: '',
    fontColor: '',
    itemColor: '',
    company: '',
    restaurant: '',
    taxes: [],
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
  const [parentCategories, setParentCategories] = useState<any>([]);
  // const [selectedParent, setSelectedParent] = useState<any>(null);
  const [company, setCompany] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [mealPeriods, setMealPeriods] = useState<any>([]);
  const [selectedTax, setSelectedTax] = useState<any>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [allTaxes, setAllTaxes] = useState<any>([]);
  const didFetchRestaurants = useRef(false);

  const restaurantData = restaurant?.[0];
  const currencySymbol =
    restaurantData?.company?.currency?.symbol ||
    userData?.staffMember?.company?.currency?.symbol ||
    "$";

  const getCompany = async () => {
    try {

      const response = await apiClient.get('/business');
      if (response?.data?.success === true) {
        setCompany(response?.data?.companies)
      }
    } catch (error: any) {
      console.log("error", error);
    }
  }

  const getAllTax = async (company?: string, restaurant?: string) => {
    try {
      const queryParam = createQueryParams({ company, restaurant })
      const response = await apiClient.get(`/tax${queryParam}`);
      if (response?.data?.data) {
        setAllTaxes(response?.data?.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getRestaurantByCompanyId = async (id: string) => {
    try {

      const response = await apiClient.get(`/restaurant/company/${id}`);
      if (response?.data?.success === true) {
        setRestaurant(response?.data?.restaurant);
        return response?.data?.restaurant;
      }
    } catch (error: any) {
      console.log("error", error);
    }
    return [];
  }

  const getMealPeriods = async (companyId?: string, restaurant?: string) => {
    try {
      const queryParam = createQueryParams({ restaurant })
      const response = await apiClient.get(`/meal/company/${companyId}${queryParam}`);
      if (response?.data?.success) {
        setMealPeriods(response.data.data);
      } else {
        setMealPeriods([]);
      }
    } catch (error: any) {
      console.log("error", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'company') {
      // getCategoryWithoutParents(value);
    }
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear the error for the field being changed
    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    if (name === 'restaurant') {
      setSelectedTax([]);
      setFormData((prev: any) => ({ ...prev, mealPeriod: null, parent: null }));
      getMealPeriods(formData?.company, value);
    }
  };

  const handleValueChange = (name: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value === "" ? null : Number(value),
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const nameRef = useRef<HTMLInputElement | any>(null);
  // const mealRef = useRef<HTMLSelectElement | any>(null);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | null = null;

    if (!formData?.name) {
      errorMsg.name = "Please enter name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      };
      isValid = false;
    }
    // if (formData?.isMeal && !formData?.mealPeriod) {
    //   errorMsg.meal = "Please select meal period.";
    //   if (!firstErrorRef) {
    //     firstErrorRef = mealRef;
    //   };
    //   isValid = false;
    // }
    if (loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole)) {
      if (loginRole === SUPER_ADMIN) {
        if (!formData?.company) {
          errorMsg.company = "Please select business.";
          isValid = false;
        }
      }
      if (!formData?.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    return isValid;
  };

  const getCategory = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/category/${id}`);
      const category = response.data?.category;
      // console.log("category", category);
      getMealPeriods(response?.data?.category?.company, response?.data?.category?.restaurant)
      getCategoryWithoutParents(response?.data?.category?.company, response?.data?.category?.restaurant)
      getAllTax(response?.data?.category?.company, response?.data?.category?.restaurant)
      // setSelectedParent(response.data?.category?.parent || null);
      setFormData((prev: any) => ({
        ...prev,
        ...category,
      }));

      setSelectedTax(category?.taxes || []);
      const initialSelectedIds = (category?.taxes || []).map((tax: any) => tax._id);
      setSelectedTaxIds(initialSelectedIds);

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [id, setIsLoading]);

  useEffect(() => {
    const companyId = formData?.company || userData?.staffMember?.company?._id;

    if (!OWNER_ROLES.includes(loginRole) && companyId) {
      getMealPeriods(companyId);
      getCategoryWithoutParents(companyId);
      getAllTax(companyId)
    }

    if (OWNER_ROLES.includes(loginRole) && companyId) {
      if (didFetchRestaurants.current) return;

      didFetchRestaurants.current = true;
      getRestaurantByCompanyId(companyId);
    }

    if (loginRole !== SUPER_ADMIN && userData?.staffMember?.company?._id) {
      setFormData((prev: any) => ({
        ...prev,
        company: userData?.staffMember?.company?._id,
      }));
    }
  }, [formData?.company, loginRole, userData?.staffMember?.company?._id]);

  // Auto-select company if single
  useEffect(() => {
    if (company?.length === 1 && loginRole === SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: company[0]._id }));
      setErrors(prev => ({ ...prev, company: "" }));
    }
  }, [company, loginRole]);

  // Auto-select restaurant if single
  useEffect(() => {
    if (restaurant?.length === 1) {
      setFormData((prev: any) => ({ ...prev, restaurant: restaurant[0]._id }));
      setErrors(prev => ({ ...prev, restaurant: "" }));
    }
  }, [restaurant]);

  // Set company for non-SUPER_ADMIN
  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
    }
  }, [loginRole, userData]);

  // Load parent categories and taxes when restaurant changes
  useEffect(() => {
    if (formData?.restaurant) {
      getCategoryWithoutParents(formData?.company, formData?.restaurant);
      getAllTax(formData?.company, formData?.restaurant);
    }
  }, [formData?.restaurant]);

  const handleTaxToggle = (tax: any) => {
    const updatedTaxes = selectedTax.filter((m: any) => m?._id !== tax?._id);
    // console.log("updatedTaxes", updatedTaxes);

    const initialSelectedIds = updatedTaxes.map((tax: any) => tax._id);
    setSelectedTaxIds(initialSelectedIds);
    setSelectedTax(updatedTaxes);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setSelectedTaxIds(selectedOptions);
    const selected = allTaxes.filter((tax: any) => selectedOptions.includes(tax._id));
    setSelectedTax((prevSelected: any) => {
      const existingTaxIds = new Set(prevSelected ? prevSelected.map((tax: any) => tax._id) : []);
      const newSelected = selected.filter((tax: any) => !existingTaxIds.has(tax._id));
      return [...(prevSelected || []), ...newSelected];
    });
  };

  useEffect(() => {
    if (id) {
      getCategory();
    }
    // getAllTax();
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }
  }, [id, getCategory, loginRole]);



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid()) {
      try {
        let response;
        formData.taxes = selectedTax;
        if (id) {
          setIsButtonLoading(true)
          response = await apiClient.patch(`/category/${id}`, formData);
          setIsButtonLoading(false)
          toast.success(response?.data?.message || 'Category updated successfully!');
        } else {
          setIsButtonLoading(true)
          response = await apiClient.post('/category/add', formData);
          if (response?.data?.success) {
            toast.success('Category added successfully!');
          } else {
            toast.error(response?.data?.message || 'There was an issue adding the category.');
            return;
          }
        }
        navigate(-1);
        setFormData({
          _id: '',
          name: '',
          description: '',
          listingOrder: null,
          isActive: true,
          isBarItem: false,
          parent: null,
          isMeal: true,
          mealPeriod: null,
          background: '',
          fontType: '',
          fontSize: '',
          fontColor: '',
          itemColor: '',
          company: loginRole === SUPER_ADMIN ? '' : userData?.staffMember?.company?._id || '',
          restaurant: '',
          taxes: [],
        });
        setErrors({ restaurant: "" });
      } catch (error: any) {
        console.log('Error during form submission:', error);
        toast.error(error?.response?.data?.message);
      } finally {
        setIsButtonLoading(false)
      }
    }
  };


  const getCategoryWithoutParents = async (company?: string, restaurant?: string) => {
    try {
      const cat_id = id ? `/${id}` : '';
      const queryParam = createQueryParams({ company, restaurant })
      const response = await apiClient.get('/category/without/parents' + cat_id + queryParam);
      if (response?.data?.categories) {
        setParentCategories(response?.data?.categories);
      }
    } catch (error: any) {
      console.log("error", error);
    }
  }

  const handleChangeParentCat = (value: any) => {
    setFormData((prev: any) => ({ ...prev, parent: value }));
    setErrors((pre: any) => ({ ...pre, parent: null }))
  }
  const handleMealPeriod = (value: any) => {
    setFormData((prev: any) => ({ ...prev, mealPeriod: value }));
    setErrors((pre: any) => ({ ...pre, meal: "" }))
  }

  const removeParentCategory = () => {
    setFormData((prev: any) => ({ ...prev, parent: null }));
  }

  return (
    <>
      <FormHeaderPaths page={id ? 'Edit category' : 'Add category'} prevLink='/category/1/' prevPage='Categories' />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative my-6 p-4 md:p-6 lg:p-8 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-bold sm:mb-8 mb-4 text-gray-800 dark:text-DARK-100">Category Form</h2>
          {isLoading && <FormLoader count={2} />}
          {!isLoading && <form onSubmit={handleSubmit} className="relative bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
            {OWNER_ROLES.includes(loginRole) &&
              <div className={`grid gap-6 mb-2 ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {loginRole === SUPER_ADMIN && (
                  <div className="flex flex-col">
                    <CompanyField
                      companies={company}
                      selectedCompanyId={formData?.company}
                      handleChange={handleChange}
                      error={errors?.company as string}
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <RestaurantField
                    restaurants={restaurant}
                    selectedRestaurantId={formData?.restaurant}
                    handleChange={handleChange}
                    error={errors.restaurant as any}
                  />
                </div>
              </div>
            }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Name */}
              <div className="flex flex-col">
                <div className="mb-1">
                  <Label htmlFor="name" value="Name" /><span className="text-ERROR_HOVER">*</span>
                </div>
                <CommonInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData?.name ?? ''}
                  onChange={handleChange}
                  placeholder="Enter Name"
                  ref={nameRef}
                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                />
                {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
              </div>

              {/* Parent Category */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <Label htmlFor="item" value="Parent Category" />
                    {formData?.parent && (
                      <button type="button" onClick={removeParentCategory} className="text-xs bg-red-50 text-red-600 rounded px-2 py-0.5 hover:bg-red-100" title="Remove parent category">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <DropdownWithSearch
                  setSelectedItem={setFormData}
                  selectedItem={parentCategories?.find((c: any) => c._id === formData?.parent)?.name || ''}
                  items={parentCategories}
                  title="Parent Category"
                  handleFilter={handleChangeParentCat}
                  fieldKey="parent"
                  isManual={true}
                />
              </div>

              {/* Listing Order */}
              <div className="flex flex-col">
                <div className="mb-1">
                  <Label htmlFor="listingOrder" value="Listing Order" />
                </div>
                <NumberInputPOS
                  allowDecimal={false}
                  id="listingOrder"
                  name="listingOrder"
                  value={formData?.listingOrder ?? ''}
                  onChange={(value) => handleValueChange("listingOrder", value)}
                  placeholder="Please enter listing order number"
                  className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col justify-center">
                <div className="mb-2">
                  <Label htmlFor="isActive" value="Status" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Radio
                      id="Activated"
                      name="isActive"
                      value="true"
                      checked={formData?.isActive === true}
                      onChange={() => setFormData((prev: any) => ({ ...prev, isActive: true }))}
                      className="checked:!bg-BRAND-500 !ring-0 cursor-pointer"
                    />
                    <Label htmlFor="Activated" value="Active" className="cursor-pointer text-sm font-medium" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Radio
                      id="DeActivated"
                      name="isActive"
                      value="false"
                      checked={formData?.isActive === false}
                      onChange={() => setFormData((prev: any) => ({ ...prev, isActive: false }))}
                      className="checked:!bg-BRAND-500 !ring-0 cursor-pointer"
                    />
                    <Label htmlFor="DeActivated" value="Deactive" className="cursor-pointer text-sm font-medium" />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col justify-center">
                <div className="mb-2">
                  <Label htmlFor="isBarItem" value="Category" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Radio
                      id="isBarItem"
                      name="isBarItem"
                      value="true"
                      checked={formData?.isBarItem === true}
                      onChange={() => setFormData((prev: any) => ({ ...prev, isBarItem: true }))}
                      className="checked:!bg-BRAND-500 !ring-0 cursor-pointer"
                    />
                    <Label htmlFor="isBarItem" value="Bar" className="cursor-pointer text-sm font-medium" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Radio
                      id="isBarItemNo"
                      name="isBarItem"
                      value="false"
                      checked={formData?.isBarItem === false}
                      onChange={() => setFormData((prev: any) => ({ ...prev, isBarItem: false }))}
                      className="checked:!bg-BRAND-500 !ring-0 cursor-pointer"
                    />
                    <Label htmlFor="isBarItemNo" value="Kitchen" className="cursor-pointer text-sm font-medium" />
                  </div>
                </div>
              </div>

              {/* is Meal */}
              <div className="flex flex-col justify-center">
                <div className="mb-2">
                  <Label htmlFor="isMeal" value="is Meal?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Radio
                      id="Yes"
                      name="isMeal"
                      value="true"
                      checked={formData?.isMeal === true}
                      onChange={() => setFormData((prev: any) => ({ ...prev, isMeal: true }))}
                      className="checked:!bg-BRAND-500 !ring-0 cursor-pointer"
                    />
                    <Label htmlFor="Yes" value="Yes" className="cursor-pointer text-sm font-medium" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Radio
                      id="No"
                      name="isMeal"
                      value="false"
                      checked={formData?.isMeal === false}
                      onChange={() => setFormData((prev: any) => ({ ...prev, isMeal: false }))}
                      className="checked:!bg-BRAND-500 !ring-0 cursor-pointer"
                    />
                    <Label htmlFor="No" value="No" className="cursor-pointer text-sm font-medium" />
                  </div>
                </div>
              </div>

              {/* Meal Period */}
              {formData?.isMeal && (
                <div className="flex flex-col">
                  <div className="mb-1">
                    <Label htmlFor="mealPeriod" value="Meal Period" />
                  </div>
                  <DropdownWithSearch
                    setSelectedItem={setFormData}
                    selectedItem={mealPeriods?.find((c: any) => c._id === (formData?.mealPeriod?._id || formData?.mealPeriod))?.name || ''}
                    items={mealPeriods}
                    title="Meal Period"
                    handleFilter={handleMealPeriod}
                    fieldKey="mealPeriod"
                  />
                </div>
              )}

              {/* Tax */}
              <div className={`flex flex-col ${formData?.isMeal ? "lg:col-span-2" : "lg:col-span-3"}`}>
                <div className="mb-1">
                  <Label htmlFor="tax" value="Tax" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="w-full px-3 min-h-[40px] py-1.5 border border-DARK-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 flex items-start justify-between dark:bg-DARK-700 bg-slate-50">
                    {selectedTax?.length === 0 ? (
                      <span className="text-sm text-slate-500 dark:text-DARK-400  mt-1">No Tax Selected</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedTax.map((tax: any) => (
                          <span key={tax?._id} className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-xl flex items-center">
                            {tax?.taxName}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaxToggle(tax);
                              }}
                              className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 focus:outline-none"
                            >
                              <HiX size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    id="tax"
                    multiple
                    value={selectedTaxIds}
                    onChange={handleSelectChange}
                    className="w-full min-h-[80px] cursor-pointer px-3 py-2 bg-slate-50 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                    style={{ backgroundImage: "none" }}
                  >
                    {allTaxes.length > 0 ?
                      allTaxes.map((item: any) => (
                        <option key={item._id} value={item._id} className="cursor-pointer py-1">
                          {item.taxName} {item.rate} {item.type === "percentage" ? "%" : currencySymbol}
                        </option>
                      )) : <option disabled className="dark:text-DARK-400">No tax data found</option>}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col md:col-span-2 lg:col-span-3">
                <div className="mb-1">
                  <Label htmlFor="description" value="Description" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData?.description ?? ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter Description"
                  className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl resize-none"
                />
                {errors.description && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.description}</p>}
              </div>
            </div>

            {/* POS Design Style */}
            <div className="p-5 mt-6 border border-gray-200 dark:border-DARK-600 rounded-xl space-y-5 bg-gray-50/50 dark:bg-DARK-800/50">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-DARK-100">POS Design Style</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="flex flex-col">
                  <div className="mb-2">
                    <Label htmlFor="fontType" value="Font Type" />
                  </div>
                  <Select onChange={handleChange} id="fontType" name="fontType" value={formData?.fontType}>
                    <option>Select font type</option>
                    <option value={'arial'}>Arial</option>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <div className="mb-2">
                    <Label htmlFor="fontSize" value="Font Size" />
                  </div>
                  <Select onChange={handleChange} id="fontSize" name="fontSize" value={formData?.fontSize}>
                    <option>Select font size</option>
                    <option value={12}>12</option>
                    <option value={14}>14</option>
                    <option value={16}>16</option>
                    <option value={18}>18</option>
                    <option value={20}>20</option>
                    <option value={22}>22</option>
                  </Select>
                </div>

                <div className="flex flex-col items-start lg:items-center">
                  <div className="mb-2">
                    <Label htmlFor="background" value="Background" />
                  </div>
                  <div className="relative w-10 h-10 rounded-full shadow-sm border border-gray-200 dark:border-DARK-600 transition-transform hover:scale-105" style={{ backgroundColor: formData?.background || 'black' }}>
                    <input
                      type="color"
                      name="background"
                      value={formData?.background || ''}
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-center">
                  <div className="mb-2">
                    <Label htmlFor="fontColor" value="Font Color" />
                  </div>
                  <div className="relative w-10 h-10 rounded-full shadow-sm border border-gray-200 dark:border-DARK-600 transition-transform hover:scale-105" style={{ backgroundColor: formData?.fontColor || 'black' }}>
                    <input
                      type="color"
                      name="fontColor"
                      value={formData?.fontColor || ''}
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-center col-span-2 md:col-span-1">
                  <div className="mb-2">
                    <Label htmlFor="itemColor" value="Item Color" />
                  </div>
                  <div className="relative w-10 h-10 rounded-full shadow-sm border border-gray-200 dark:border-DARK-600 transition-transform hover:scale-105" style={{ backgroundColor: formData?.itemColor || 'black' }}>
                    <input
                      type="color"
                      name="itemColor"
                      value={formData?.itemColor || ''}
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons - Right Aligned */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-DARK-600">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={!!isButtonLoading}
                className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>}
        </div>
      </div>
    </>
  );
};

export default CategoryForm