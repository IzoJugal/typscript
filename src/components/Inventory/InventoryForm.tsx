import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN, UNIT_OPTIONS } from "../../utils/common/constant";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { Button, Label, Modal } from "flowbite-react";
import { AiOutlineLoading } from "react-icons/ai";
import FormLoader from "../../utils/common/FormLoader";
import { CompanyField, RestaurantField } from "../../utils/functions";
import SelectWithSearch from "../../utils/common/SelectWithSearch";
import NewSingleDate from "../../utils/common/NewSingleDate";
import NumberInputPOS from "../../utils/common/NumberInputPOS";
import CommonInput from "../../utils/common/CommonInput";

interface IFormProps {
  id: string | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}


interface IFormData {
  _id?: string;
  name: string;
  unit: string;
  area?: string;
  category?: string;
  quantity: number;
  sku?: string;
  company?: any;
  restaurant?: any;
  expirationDate?: Date;
  mfgDate?: Date;
  isActive?: boolean;
}

interface ErrorState {
  name?: string;
  unit?: string;
  company?: string;
  restaurant?: string;
  quantity?: string;
}

const InventoryForm: React.FC<IFormProps> = ({ id, open, setOpen, onClose }) => {

  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<IFormData>({
    name: '',
    unit: '',
    quantity: 0
  });
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [companies, setCompanies] = useState<any>([]);
  const [restaurants, setRestaurants] = useState<any>([]);
  const [errors, setErrors] = useState<ErrorState>({});
  const [unit, setUnit] = useState("");
  const [selectedExpirationdate, setSelectedExpirationdate] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [selectedMfgdate, setSelectedMfgdate] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const resetForm = () => {
    setRestaurants([]);
    setFormData({
      name: '',
      unit: '',
      quantity: 0,
      area: '',
      category: '',
      sku: '',
      company: loginRole === SUPER_ADMIN
        ? ''
        : userData?.staffMember?.company?._id || '',
      restaurant: '',
      expirationDate: undefined,
      mfgDate: undefined,
      isActive: true
    });

    setErrors({});
    setUnit('');

    setSelectedMfgdate({
      startDate: null,
      endDate: null,
    });

    setSelectedExpirationdate({
      startDate: null,
      endDate: null,
    });
  };

  const getCompany = async () => {
    try {
      const response = await apiClient.get(`/business`);
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }

  const getRestaurant = async (
    companyId: string,
    autoSelect = false
  ) => {
    try {
      const response = await apiClient.get(
        `/restaurant/company/${companyId}`
      );

      if (response.data.success) {
        const restaurantData = response.data.restaurant || [];

        setRestaurants(restaurantData);

        // only auto select when explicitly needed
        if (autoSelect && restaurantData.length === 1) {
          setFormData((prev: any) => ({
            ...prev,
            restaurant: restaurantData[0]._id,
          }));

          setErrors((prev) => ({
            ...prev,
            restaurant: "",
          }));
        }

        return restaurantData;
      }
    } catch (error: any) {
      console.log("error", error.message);
    }

    return [];
  };

  // const getRestaurant = async (companyId: string) => {
  //   try {
  //     const response = await apiClient.get(`/restaurant/company/${companyId}`);
  //     if (response.data.success) {
  //       setRestaurants(response.data.restaurant);
  //       return response.data.restaurant;
  //     }
  //   } catch (error: any) {
  //     console.log("error", error.message);
  //   }
  //   return [];
  // }

  const getSingleInventoryData = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/inventory/${id}`);

      if (response?.data?.success) {
        setFormData(response?.data?.ingredient);
        if (response?.data?.ingredient?.unit) {
          const selected = UNIT_OPTIONS.find(u => u.value === response.data.ingredient.unit);
          if (selected) {
            setUnit(selected.label);
          }
        }
        if (response?.data?.ingredient?.expirationDate) {
          setSelectedExpirationdate({
            startDate: new Date(response.data.ingredient.expirationDate),
            endDate: new Date(response.data.ingredient.expirationDate),
          })
        }
        if (response?.data?.ingredient?.mfgDate) {
          setSelectedMfgdate({
            startDate: new Date(response.data.ingredient.mfgDate),
            endDate: new Date(response.data.ingredient.mfgDate),
          })
        }
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 500);

    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
        setFormData({
          name: '',
          unit: '',
          quantity: 0
        });
      }, 500);
      console.error(" ~ getDevice error :- ", error);
    }
  }, []);

  useEffect(() => {
    if (id) {
      getSingleInventoryData(id)
    }
  }, [id, getSingleInventoryData]);

  useEffect(() => {
    if (!open) return;

    if (!id) {
      resetForm();
    }

    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }

    if (loginRole !== SUPER_ADMIN && (OWNER_ROLES.includes(loginRole) || MANAGER_ROLES.includes(loginRole))) {
      getRestaurant(userData?.staffMember?.company?._id, !id);
    }
  }, [loginRole, userData?.staffMember?.company?._id, open, id]);

  useEffect(() => {
    if (formData?.company && loginRole === SUPER_ADMIN) {
      const companyId =
        typeof formData.company === "object"
          ? formData.company?._id
          : formData.company;

      if (companyId) {
        getRestaurant(companyId, !id);
      }
    }
  }, [formData?.company, loginRole, id]);

  useEffect(() => {
  if (
    open &&
    companies?.length === 1 &&
    loginRole === SUPER_ADMIN &&
    !id
  ) {
    setFormData(prev => ({
      ...prev,
      company: companies[0]._id,
    }));
  }
}, [open, companies, loginRole, id]);

  // Auto-select company if single
  useEffect(() => {
    if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
      setFormData(prev => ({ ...prev, company: companies[0]._id }));
      setErrors(prev => ({ ...prev, company: "" }));
    }
  }, [companies, loginRole]);

  // Auto-select restaurant if single
  // useEffect(() => {
  //   if (restaurants?.length === 1) {
  //     setFormData(prev => ({ ...prev, restaurant: restaurants[0]._id }));
  //     setErrors(prev => ({ ...prev, restaurant: "" }));
  //   }
  // }, [restaurants]);

  useEffect(() => {
    if (id && restaurants?.length === 1) {
      setFormData(prev => ({
        ...prev,
        restaurant: restaurants[0]._id
      }));

      setErrors(prev => ({
        ...prev,
        restaurant: ""
      }));
    }
  }, [restaurants, id]);

  // Set company for non-SUPER_ADMIN
  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      setFormData(prev => ({ ...prev, company: userData?.staffMember?.company?._id }));
    }
  }, [loginRole, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // if (name === "company") {
    //   getRestaurant(value);
    // }

    if (name === "company") {
      setFormData((prev: any) => ({
        ...prev,
        company: value,
        restaurant: "",
      }));

      setRestaurants([]);
      return;
    }

  }


  const nameRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {}
    let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement> | null = null;

    if (loginRole === SUPER_ADMIN) {
      if (!formData.company) {
        errorMsg.company = "Please select business.";
        if (!firstErrorRef) {
          firstErrorRef = companyRef;
        };
        isValid = false;
      }
    }
    if ((OWNER_ROLES.includes(loginRole) || MANAGER_ROLES.includes(loginRole)) || loginRole === SUPER_ADMIN) {
      if (!formData.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        if (!firstErrorRef) {
          firstErrorRef = restaurantRef;
        };
        isValid = false;
      }
    }

    if (!formData.name) {
      errorMsg.name = "Please enter name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      };
      isValid = false;
    }
    if (!formData.unit) {
      errorMsg.unit = "Please select unit.";
      if (!firstErrorRef) {
        firstErrorRef = unitRef;
      };
      isValid = false;
    }

    if (
      formData.quantity === undefined ||
      formData.quantity === null ||
      formData.quantity <= 0
    ) {
      errorMsg.quantity = "Please enter valid quantity.";
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
        setIsBtnLoading(true);
        const isEdit = Boolean(id);
        const url = isEdit ? `/inventory/${id}` : '/inventory/add';
        const method = isEdit ? 'patch' : 'post';

        const response = await apiClient[method](url, formData,);

        const successMessage = isEdit ? 'Ingredient updated successfully!' : 'Ingredient added successfully!';
        const errorMessage = isEdit ? 'Failed to update ingredient.' : 'There was an issue adding the ingredient.';

        if (response?.data?.success) {
          toast.success(response?.data?.message || successMessage);
          setFormData({
            name: '',
            unit: '',
            quantity: 0,
            area: '',
            category: '',
            sku: '',
            company: loginRole === SUPER_ADMIN ? '' : userData?.staffMember?.company?._id || '',
            restaurant: '',
            expirationDate: undefined,
            mfgDate: undefined,
            isActive: true
          });
          setErrors({});
          setUnit('');
          setSelectedMfgdate({
            startDate: null,
            endDate: null,
          });
          setSelectedExpirationdate({
            startDate: null,
            endDate: null,
          });
          onClose();
        } else {
          toast.error(response?.data?.message || errorMessage);
        }

        setTimeout(() => {
          setIsBtnLoading(false);
        }, 500)

      } catch (error: any) {
        setIsBtnLoading(false);
        console.log('Error during form submission:', error);
        toast.error(error?.response?.data?.message || 'There was an issue with the request.');
      }
    }
  };

  const handleUnit = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      unit: id
    }));

    setErrors((prev: any) => ({ ...prev, 'unit': "" }));
  };

  const handleModalClose = () => {
    resetForm();
    setOpen(false);
    onClose();
  };

  const handleExpirationDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    if (value?.startDate) {
      setSelectedExpirationdate(value);
      setFormData((prev: any) => ({
        ...prev,
        expirationDate: value?.startDate,
      }));
    }
    // Clear errors for the field being changed
    // if (errors?.expirationDate) {
    //   setErrors(prev => ({ ...prev, expirationDate: "" }));
    // }
  };

  const handleMfgDate = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    if (value?.startDate) {
      setSelectedMfgdate(value);
      setFormData((prev: any) => ({
        ...prev,
        mfgDate: value?.startDate,
      }));
    }
    // Clear errors for the field being changed
    // if (errors?.mfgDate) {
    //   setErrors(prev => ({ ...prev, mfgDate: "" }));
    // }
  };



  return (
    <Modal show={open} onClose={() => handleModalClose()} className="backdrop-blur-sm dark:bg-DARK-950">
      <Modal.Header className="dark:bg-DARK-800">
        <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
          {isLoading ? (
            <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
          ) : (
            id ? "Update Inventory Ingredient" : "Add Inventory Ingredient"
          )}
        </span>
      </Modal.Header>
      <Modal.Body className="dark:bg-DARK-800">
        {isLoading ? <FormLoader count={1} /> :
          <form className="flex max-w-full flex-col gap-4">
            <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
              {loginRole === SUPER_ADMIN && (
                <div className="flex flex-col">
                  <CompanyField
                    companies={companies}
                    selectedCompanyId={formData?.company?._id ?? formData?.company}
                    handleChange={handleChange}
                    error={errors.company}
                  />
                </div>)}
              {(loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole) || MANAGER_ROLES.includes(loginRole)) && <div className="flex flex-col" ref={restaurantRef}>
                <RestaurantField
                  restaurants={restaurants}
                  selectedRestaurantId={formData?.restaurant?._id ?? formData?.restaurant}
                  handleChange={handleChange}
                  error={errors.restaurant}
                />
              </div>}
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name" value="Name" /><span className="text-ERROR_HOVER">*</span>
                <CommonInput
                  // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter ingredient name"
                  value={formData?.name}
                  onChange={(e) => handleChange(e)}
                  ref={nameRef}
                />
                {errors?.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.name}</p>}
              </div>
              <div ref={unitRef}>
                <Label htmlFor="unit" value="Unit" /><span className="text-ERROR_HOVER">*</span>
                <SelectWithSearch
                  items={UNIT_OPTIONS}
                  title="Ingredient unit"
                  displayKey="label"
                  searchKey="label"
                  valueKey="value"
                  selectedItem={unit}
                  setSelectedItem={setUnit}
                  handleChange={handleUnit}
                />
                {errors?.unit && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.unit}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" value="Quantity" /><span className="text-ERROR_HOVER">*</span>
                <NumberInputPOS
                  inputRef={quantityRef}
                  // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity || ""}
                  allowDecimal={true}
                  placeholder="Enter ingredient quantity"
                  onChange={(value) => {
                    setFormData((prev: any) => ({
                      ...prev,
                      quantity: value === "" ? 0 : Number(value),
                    }));

                    if (errors.quantity) {
                      setErrors((prev) => ({
                        ...prev,
                        quantity: "",
                      }));
                    }
                  }}
                />
                {errors?.quantity && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.quantity}</p>}
              </div>
              <div>
                <Label htmlFor="area" value="Area" />
                <CommonInput
                  // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                  id="area"
                  type="text"
                  name="area"
                  placeholder="Enter area"
                  value={formData.area || ""} onChange={(e) => {
                    let value = e.target.value;
                    setFormData((prev: any) => ({
                      ...prev,
                      area: value,
                    }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="category" value="Category" />
                <CommonInput
                  // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                  id="category"
                  name="category"
                  type="text"
                  placeholder="Enter category"
                  value={formData?.category}
                  onChange={(e) => handleChange(e)}
                />
              </div>
              <div>
                <Label htmlFor="sku" value="SKU" />
                <CommonInput
                  // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                  id="sku"
                  name="sku"
                  type="text"
                  placeholder="Enter sku"
                  value={formData?.sku}
                  onChange={(e) => handleChange(e)}
                />
              </div>
              <div>
                <Label htmlFor="mfgDate" value="Manufacturing Date" />
                <NewSingleDate value={selectedMfgdate} onChange={handleMfgDate} allowPastDates={true} label="Manufacturing Date" />
              </div>
              <div>
                <Label htmlFor="expirationDate" value="Expiration Date" />
                <NewSingleDate value={selectedExpirationdate} onChange={handleExpirationDate} label="Expiration Date" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="isAvailable" className="text-sm font-medium text-DARK-700 dark:text-DARK-100">Status </label>
              <input
                type="radio"
                id="Activated"
                name="isActive"
                value="true"
                checked={formData.isActive === true}
                onChange={() => setFormData((prev: any) => ({ ...prev, isActive: true }))}
                className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
              />
              <label htmlFor="Activated" className="text-sm font-medium text-DARK-700 dark:text-DARK-100">Activated</label>
              <input
                type="radio"
                id="DeActivated"
                name="isActive"
                value="false"
                checked={formData.isActive === false}
                onChange={() => setFormData((prev: any) => ({ ...prev, isActive: false }))}
                className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
              />
              <label htmlFor="DeActivated" className="text-sm font-medium text-DARK-700 dark:text-DARK-100">DeActivated</label>
            </div>
          </form>
        }
      </Modal.Body>
      <Modal.Footer className="justify-end dark:bg-DARK-800">
        <Button
          type="button"
          onClick={() => handleModalClose()}
          disabled={isBtnLoading}
          className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={(e: any) => {
            e.preventDefault();
            if (!isLoading && !isBtnLoading) handleSubmit(e);
          }}
          disabled={isBtnLoading}
          isProcessing={isBtnLoading}
          processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
          className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        >
          <span className="relative z-10">{isBtnLoading ? 'Loading...' : 'Submit'}</span>
          {isBtnLoading && (
            <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default InventoryForm
