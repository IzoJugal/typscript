/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { useAuth } from "../../context/AuthProvider";
import { CompanyField, phoneNumberLength } from "../../utils/functions";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import FormLoader from "../../utils/common/FormLoader";
import { Button, Label } from "flowbite-react";
import { OWNER_ADMIN_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import {
  IAddress,
  Irestaurant,
} from "../../utils/common/Interface/OrderInterface";
import TextInputPOS from "../../utils/common/TextInputPOS";
import { HiEye, HiEyeOff } from "react-icons/hi";
import PhoneInput, { CountryData } from "react-phone-input-2";
import { TimeZoneDropdown } from "../../utils/common/TimeZoneDropdown";
import { TimeInput } from "../../utils/common/TimeInput";
import CommonInput from "../../utils/common/CommonInput";
interface IFormErrors {
  name?: string;
  company?: string;
  openTime?: string;
  closeTime?: string;
  autoCloseOutTime?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  upiId?: string;
  fssNo?: string;
  phoneNumber?: string;
}

const initialFormData: Irestaurant = {
  _id: "",
  name: "",
  address: { street: "", city: "", state: "", zipCode: "", country: "" },
  company: { _id: "", name: "" },
  phoneNumber: "",
  fssNo: "",
  email: "",
  isActive: true,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: { _id: "", firstName: "" },
  openTime: "",
  closeTime: "",
  autoCloseOutTime: "",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Set default to browser's time zone
  gratuity: [],
};

const RestaurantForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } =
    useLoading();
  const { userData } = useAuth();

  const [formData, setFormData] = useState<Irestaurant>(initialFormData);
  const [errors, setErrors] = useState<IFormErrors>({});
  const [companyData, setCompanyData] = useState<any[]>([]);

  const nameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const openTimeRef = useRef<HTMLInputElement>(null);
  const closeTimeRef = useRef<HTMLInputElement>(null);
  const autoCloseOutTimeRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const zipCodeRef = useRef<HTMLInputElement>(null);
  const upiIdRef = useRef<HTMLInputElement>(null);
  const [gratuities, setGratuities] = useState<string[]>([]);
  const [phoneInputData, setPhoneInputData] = useState<any>();

  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const isSuperAdmin = loginRole === SUPER_ADMIN;

  const fetchRestaurant = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data } = await apiClient.get(`/restaurant/${id}`);
      setFormData({
        ...initialFormData,
        ...data.restaurant,
        address: { ...initialFormData.address, ...data.restaurant.address },
      });
      const countryCode = data?.restaurant?.company?.countryCode || "+1";
      const phone = data?.restaurant?.company?.phone || "";
      if (phone) {
        setPhoneInputData(`${countryCode}${phone}`);
      } else {
        setPhoneInputData(undefined);
      }

      //   setPhoneInputData(
      //     `${data?.restaurant?.company?.countryCode || ""}${
      //       data?.restaurant?.company?.phone
      //     }`
      //   );
      if (
        Array.isArray(data.restaurant.gratuity) &&
        data.restaurant.gratuity.length > 0
      ) {
        setGratuities(data.restaurant.gratuity);
      } else {
        setGratuities([]);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [id, setIsLoading]);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/business");
      if (data?.success) {
        setCompanyData(data.companies);
        // Auto-select if only 1 company
        if (data.companies.length === 1) {
          setFormData((prev) => ({
            ...prev,
            company: {
              _id: data.companies[0]._id,
              name: data.companies[0].name,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, []);

  useEffect(() => {
    if (id) fetchRestaurant();
    fetchCompanies();
  }, [id, fetchRestaurant, fetchCompanies]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const companyId = e.target.value;
    const selectedCompany = companyData.find((c) => c._id === companyId);

    if (selectedCompany) {
      setFormData((prev) => ({
        ...prev,
        company: {
          _id: selectedCompany._id,
          name: selectedCompany.name,
        },
      }));
    }
    setErrors((prev) => ({ ...prev, company: undefined }));
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string }
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;

    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handlePaymentCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: inputValue } = e.target;
    let updatedValue = inputValue;

    if (name === "upiId" && !showUpi) {
      const currentRawValue = formData.paymentCredentials?.upiId || "";

      if (inputValue.length < currentRawValue.length) {
        updatedValue = currentRawValue.slice(0, inputValue.length);
      } else {
        const maskedLength = renderMaskedUpi(currentRawValue).length;
        const addedChars = inputValue.slice(maskedLength);
        updatedValue = currentRawValue + addedChars;
      }
    }

    setFormData((prev) => ({
      ...prev,
      paymentCredentials: {
        ...prev.paymentCredentials,
        [name]: updatedValue,
      },
    }));

    if (errors[name as keyof IFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const renderMaskedUpi = (upi: string): string => {
    if (!upi) return "";
    if (!upi.includes("@")) return "*".repeat(upi.length);
    const [username, domain] = upi.split("@");
    return "*".repeat(username.length) + "@" + domain;
  };

  const handleStatusChange = (isActive: boolean) => {
    setFormData((prev) => ({ ...prev, isActive }));
  };

  const validateForm = (): boolean => {
    const newErrors: IFormErrors = {};
    let firstErrorRef: React.RefObject<
      HTMLInputElement | HTMLDivElement
    > | null = null;
    const isValidUpiId = (vpa: any) =>
      /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa);

    if (!formData.name.trim()) {
      newErrors.name = "Please enter the restaurant name";
      firstErrorRef = nameRef;
    }

    if (!formData.openTime) {
      newErrors.openTime = "Please enter the opening time";
      firstErrorRef = firstErrorRef || openTimeRef;
    }

    if (!formData.closeTime) {
      newErrors.closeTime = "Please enter the closing time";
      firstErrorRef = firstErrorRef || closeTimeRef;
    }

    // const start = parseTimeStringToDate(formData.openTime);
    // const end = parseTimeStringToDate(formData.closeTime);

    // if (start && end && end <= start) {
    //     newErrors.closeTime = "Close time must be greater than start time.";
    //     firstErrorRef = firstErrorRef || closeTimeRef;
    // }

    if (!formData.autoCloseOutTime) {
      newErrors.autoCloseOutTime = "Please enter the auto close-out time";
      firstErrorRef = firstErrorRef || autoCloseOutTimeRef;
    }

    if (!id && isSuperAdmin && !formData.company?._id) {
      newErrors.company = "Please select a business";
      firstErrorRef = firstErrorRef || companyRef;
    }

    if (phoneRef.current) {
      phoneRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const zip = formData.address.zipCode?.trim();

    if (!zip) {
      newErrors.zipCode = "Please enter a zip code";
      firstErrorRef = firstErrorRef || zipCodeRef;
    } else if (!/^\d{6}$/.test(zip)) {
      newErrors.zipCode = "Zip code must be 6 digits";
      firstErrorRef = firstErrorRef || zipCodeRef;
    }

    // if (OWNER_ADMIN_ROLES.includes(loginRole) && !formData?.paymentCredentials?.upiId?.trim()) {
    //     newErrors.upiId = "Please enter your UPI ID";
    //     firstErrorRef = firstErrorRef || upiIdRef;
    // } else if (OWNER_ADMIN_ROLES.includes(loginRole) && !isValidUpiId(formData?.paymentCredentials?.upiId)) {
    //     newErrors.upiId = "Please enter a valid UPI ID (e.g., user@upi)";
    //     firstErrorRef = firstErrorRef || upiIdRef;
    // }

    if (OWNER_ADMIN_ROLES.includes(loginRole)) {
      const upiId = formData?.paymentCredentials?.upiId?.trim();

      if (upiId && !isValidUpiId(upiId)) {
        newErrors.upiId = "Please enter a valid UPI ID (e.g., user@upi)";
        firstErrorRef = firstErrorRef || upiIdRef;
      }
    }

    setErrors(newErrors);

    if (firstErrorRef?.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    return Object.keys(newErrors).length === 0;
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
    setPhoneInputData(phone);
    const phoneWithoutDialCode = phone.replace(country.dialCode || "", "");
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      phoneNumber: phoneWithoutDialCode,
      countryCode: `+${country.dialCode}`,
    }));
    const countryData = phoneNumberLength(country);
    handlePhoneNumberLength(
      countryData,
      phoneWithoutDialCode.length,
      "phoneNumber"
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsButtonLoading(true);
    try {
      formData.gratuity = gratuities;
      const url = id ? `/restaurant/${id}` : "/restaurant/add";
      const method = id ? apiClient.patch : apiClient.post;
      const { data } = await method(url, formData);

      if (data.success) {
        toast.success(
          data.message || `Restaurant ${id ? "updated" : "added"} successfully!`
        );
        navigate(-1);
        setFormData(initialFormData);
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "An error occurred");
    } finally {
      setIsButtonLoading(false);
    }
  };

  /* const handleGratuityChange = (index: number, value: string) => {
          if (value === '') {
              setGratuities([]);
          } else if (/^\d*\.?\d*$/.test(value)) {
              const updated = [...gratuities];
              updated[index] = value;
              setGratuities(updated);
          }
      };

      const addGratuityField = () => {
          if (gratuities.length < 5) {
              setGratuities([...gratuities, '']);

          }
      };

      const removeGratuityField = (index: number) => {
          const updated = gratuities.filter((_, i) => i !== index);
          setGratuities(updated.length > 0 ? updated : []);
      }; */

  const [showUpi, setShowUpi] = useState(false);
  const [isUpiFocused, setIsUpiFocused] = useState(false);
  const [upiInputValue, setUpiInputValue] = useState("");

   useEffect(() => {
    if (formData?.paymentCredentials?.upiId) {
      setUpiInputValue(formData.paymentCredentials.upiId);
    } else {
      setUpiInputValue("");
    }
  }, [formData?.paymentCredentials?.upiId]);

  const handleUpiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiInputValue(e.target.value);
    handlePaymentCredentialsChange(e);
  };

  // const maskUpi = (upi: string): string => {
  //   if (upi === "") {
  //     return "";
  //   }
  //   if (!upi.includes("@")) return "**********";
  //   const [username, domain] = upi.split("@");
  //   return "*".repeat(username.length) + "@" + domain;
  // };

  const handleSettingsClick = (e: any) => {
    if (!formData?._id || formData._id.trim() === "") {
      e.preventDefault();
      toast.error(
        "Please save the restaurant details before accessing Advanced Settings."
      );
    }
  };

  return (
    <>
      <FormHeaderPaths
        page={id ? "Edit Restaurant" : "Add Restaurant"}
        prevLink="/restaurant/1/"
        prevPage="Restaurants"
      />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative my-6 w-full mx-auto p-4 md:p-6 lg:p-8 bg-white dark:bg-DARK-800 shadow-xl border border-gray-100 dark:border-DARK-700 rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 dark:text-DARK-100">
            {id ? "Edit Restaurant" : "Add Restaurant"}
          </h2>

          {isLoading ? (
            <FormLoader count={1} />
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 space-y-8">
                {/* General Info Section */}
                <div className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-DARK-600 pb-2">
                    Basic Information
                  </h3>

                  {isSuperAdmin && (
                    <div ref={companyRef}>
                      <CompanyField
                        companies={companyData}
                        selectedCompanyId={formData.company?._id || formData.company}
                        handleChange={handleCompanyChange}
                        error={errors.company}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="name" value="Name" />
                    <span className="text-ERROR_HOVER">*</span>
                    <CommonInput
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={handleChange}
                      ref={nameRef}
                    // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="openTime" value="Open Time" />
                      <span className="text-ERROR_HOVER">*</span>
                      <TimeInput
                        inputRef={openTimeRef}
                        id="openTime"
                        name="openTime"
                        value={formData.openTime || ""}
                        onChange={handleChange}
                      />
                      {errors.openTime && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.openTime}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="closeTime" value="Close Time" />
                      <span className="text-ERROR_HOVER">*</span>
                      <TimeInput
                        inputRef={closeTimeRef}
                        id="closeTime"
                        name="closeTime"
                        value={formData.closeTime || ""}
                        onChange={handleChange}
                      />
                      {errors.closeTime && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.closeTime}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="autoCloseOutTime" value="Auto CloseOut Time" />
                      <span className="text-ERROR_HOVER">*</span>
                      <TimeInput
                        inputRef={autoCloseOutTimeRef}
                        id="autoCloseOutTime"
                        name="autoCloseOutTime"
                        value={formData.autoCloseOutTime || ""}
                        onChange={handleChange}
                      />
                      {errors.autoCloseOutTime && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.autoCloseOutTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone No.</Label>
                      <PhoneInput
                        inputClass="w-full -min-w-60 bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 border-2 border-DARK-300 dark:border-none focus:outline-none focus:ring-0 placeholder-DARK-400 dark:placeholder-DARK-300"
                        // inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-100"
                        buttonStyle={{ backgroundColor: "white", paddingLeft: "4px", }}
                        countryCodeEditable={false}
                        enableSearch={true}
                        country={"in"}
                        placeholder="Enter phone number"
                        value={phoneInputData}
                        onChange={(phone, country: CountryData) => {
                          handlePhoneNumber(phone, country);
                        }}
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-ERROR mt-1">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="fssNo" value="FSS No." />
                      <CommonInput
                        type="text"
                        inputMode="numeric"
                        id="fssNo"
                        name="fssNo"
                        placeholder="Enter FSS No"
                        value={formData.fssNo}
                        onChange={handleChange}
                      // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                      />
                      {errors.fssNo && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.fssNo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 dark:text-DARK-100">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["street", "city", "state", "zipCode", "country"].map(
                        (field) => (
                          <div key={field}>
                            <Label
                              htmlFor={field}
                              value={field.charAt(0).toUpperCase() + field.slice(1)}
                            />
                            {field === "zipCode" && (
                              <span className="text-red-500">*</span>
                            )}
                            <CommonInput
                              type="text"
                              inputMode={field === "zipCode" ? "numeric" : "text"}
                              id={field}
                              name={field}
                              placeholder={`Enter ${field}`}
                              value={formData.address[field as keyof IAddress]}
                              onChange={(e) => {
                                if (field === "zipCode") {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleAddressChange({
                                    name: field,
                                    value: value.slice(0, 6),
                                  });
                                } else {
                                  handleAddressChange(e);
                                }
                              }}
                              maxLength={field === "zipCode" ? 6 : undefined}
                              onKeyDown={(e) => {
                                if (
                                  field === "zipCode" &&
                                  ["-", ".", "e", "E", "+", "ArrowUp", "ArrowDown"].includes(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}

                              ref={field === "zipCode" ? zipCodeRef : undefined}
                            // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                            />
                            {errors[field as keyof IFormErrors] && (
                              <p className="mt-1 text-sm text-ERROR_HOVER">
                                {errors[field as keyof IFormErrors]}
                              </p>
                            )}
                          </div>
                        )
                      )}
                      <div>
                        <Label htmlFor="timeZone" value="TimeZone" />
                        <TimeZoneDropdown
                          value={
                            formData.timeZone ??
                            Intl.DateTimeFormat().resolvedOptions().timeZone
                          }
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              timeZone: val,
                            }))
                          }
                        />{" "}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sidebar settings & Actions */}
              <div className="xl:col-span-4 space-y-8 flex flex-col">

                {/* Payment & Settings Section */}
                <div className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-DARK-600 pb-2">
                    Payment Credentials & Settings
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="upiId" value="UPI ID" className="text-gray-700 dark:text-gray-300 font-medium" />

                      <div className={`relative mt-1 flex items-center w-full h-11 rounded-xl border transition-all duration-200 shadow-sm
  ${OWNER_ADMIN_ROLES.includes(loginRole)
                          ? "bg-white dark:bg-DARK-700 border-BRAND-200 dark:border-DARK-600 focus-within:ring-2 focus-within:ring-BRAND-500/20 focus-within:border-BRAND-500"
                          : "bg-gray-100 dark:bg-DARK-600 border-gray-300 dark:border-none cursor-not-allowed"
                        }`}
                      >
                        <TextInputPOS
                          name="upiId"
                          type="text"
                          // Show real value if eye is clicked OR if user clicked inside the box to edit it
                          value={showUpi || isUpiFocused ? upiInputValue : renderMaskedUpi(upiInputValue)}
                          placeholder="Enter UPI ID (e.g. user@bank)"
                          disabled={!OWNER_ADMIN_ROLES.includes(loginRole)}
                          onChange={handleUpiInputChange}
                          // Track when user enters or leaves the input field
                          onFocus={() => setIsUpiFocused(true)}
                          onBlur={() => setIsUpiFocused(false)}
                          className={`w-full h-full px-4 pr-12 rounded-xl outline-none border-none bg-transparent focus:ring-0 focus:border-transparent text-gray-900 dark:text-DARK-100
                            ${!OWNER_ADMIN_ROLES.includes(loginRole) ? "text-gray-500 dark:text-DARK-400 cursor-not-allowed" : "placeholder-gray-400 dark:placeholder-DARK-400"}
                          `}
                        />
                        {/* EYE TOGGLE BUTTON */}
                        {OWNER_ADMIN_ROLES.includes(loginRole) && (
                          <button
                            type="button"
                            onClick={() => setShowUpi((prev) => !prev)}
                            className="absolute inset-y-0 right-3 z-10 flex items-center text-gray-500 dark:text-gray-400 hover:text-BRAND-500 dark:hover:text-BRAND-400 transition-colors"
                          >
                            {showUpi ? (
                              <HiEye className="h-5 w-5" />
                            ) : (
                              <HiEyeOff className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>

                      {errors.upiId && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.upiId}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={() => handleStatusChange(true)}
                            className="h-4 w-4 text-BRAND-500 border-gray-300 focus:ring-BRAND-500 dark:border-DARK-600 dark:bg-DARK-700"
                          />
                          <span className="text-gray-700 dark:text-DARK-100 group-hover:text-BRAND-500 dark:group-hover:text-BRAND-400 transition-colors">Active</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="isActive"
                            checked={!formData.isActive}
                            onChange={() => handleStatusChange(false)}
                            className="h-4 w-4 text-BRAND-500 border-gray-300 focus:ring-BRAND-500 dark:border-DARK-600 dark:bg-DARK-700"
                          />
                          <span className="text-gray-700 dark:text-DARK-100 group-hover:text-BRAND-500 dark:group-hover:text-BRAND-400 transition-colors">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 flex flex-col gap-6 mt-auto">
                  <Link
                    to={`/restaurant/settings/${formData?._id}`}
                    className="text-BRAND-600 dark:text-BRAND-400 hover:text-BRAND-700 dark:hover:text-BRAND-300 underline font-semibold transition-colors w-full text-center sm:text-left"
                    onClick={handleSettingsClick}
                  >
                    Go to Advanced Settings
                  </Link>
                  <div className="flex flex-col sm:flex-row w-full gap-4">
                    <Button
                      type="button"
                      onClick={() => navigate(-1)}
                      disabled={isButtonLoading}
                      className="flex-1 bg-gray-200 text-gray-800 dark:bg-DARK-700 dark:text-DARK-100 hover:!bg-gray-300 dark:hover:!bg-DARK-600 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isButtonLoading}
                      className="flex-1 !bg-BRAND-500 hover:!bg-BRAND-600 transition-colors [&>span]:w-max"
                      isProcessing={isButtonLoading}
                    >
                      {isButtonLoading ? "Processing..." : "Save Restaurant"}
                    </Button>
                  </div>
                </div>

              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default RestaurantForm;
