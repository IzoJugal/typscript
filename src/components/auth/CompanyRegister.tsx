import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import { Button, Label, Modal, ToggleSwitch } from "flowbite-react";
import FormLoader from "../../utils/common/FormLoader";
import TextInputPOS from "../../utils/common/TextInputPOS";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"
import SelectWithSearch from "../../utils/common/SelectWithSearch";
import { ICurrency } from "../Currency/Currency";
import { useAuth } from "../../context/AuthProvider";
import { SUPER_ADMIN } from "../../utils/common/constant";
import { phoneNumberLength } from "../../utils/functions";

interface CompanyDocument {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  countryCode?: string;
  registrationNumber: string;
  taxID: string;
  isActive: boolean;
  text: string;
  timeOut?: number;
  currency?: string;
  isEmailActive?: boolean;
  isWhatsappActive?: boolean;
  isShowClient?: boolean;
}

interface ErrorState {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  registrationNumber?: string;
  taxID?: string;
  timeOut?: string;
  currency?: string;
}

const CompanyRegister = (props: any) => {
  const fromPage = props.from;
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CompanyDocument>({
    _id: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    countryCode: '',
    registrationNumber: '',
    taxID: '',
    isActive: true,
    text: '',
    timeOut: 0,
    currency: '',
    isEmailActive: false,
    isWhatsappActive: false,
    isShowClient: false,
  });
  const [phoneInputData, setPhoneInputData] = useState<any>();
  const [currencyList, setCurrencyList] = useState<ICurrency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [originalData, setOriginalData] = useState({
    registrationNumber: "",
    taxID: "",
  });
  const [showExistModal, setShowExistModal] = useState(false);
  const [existMessage, setExistMessage] = useState("");

  const [errors, setErrors] = useState<ErrorState>({});
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();

  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const isSuperAdmin = loginRole === SUPER_ADMIN;

  const location = useLocation();
  const { email } = location.state || {};

  useEffect(() => {
    if (email) {
      setFormData((prev) => ({
        ...prev,
        email,
      }));
    }
  }, [email]);

  const getAllCurrency = useCallback(async () => {
    try {
      const response = await apiClient.get(`/currency`,);
      setTimeout(() => {
        setCurrencyList(response.data?.data);
      }, 500);
    } catch (error) {
      setCurrencyList([])
      console.error('~ getAllCurrency error :-', error);
    }
  }, []);

  useEffect(() => {
    getAllCurrency();
  }, [getAllCurrency])

  const company = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/business/${id}`);
      const companyData = response.data.company;
      if (companyData?.currency?.label) {
        setSelectedCurrency(companyData?.currency?.label)
      }
      setPhoneInputData(`${response?.data?.company?.countryCode || ''}${response.data.company.phone}`)
      setFormData(prev => ({
        ...prev,
        ...companyData,
      }));
      setOriginalData({
        registrationNumber: companyData.registrationNumber || "",
        taxID: companyData.taxID || "",
      });
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      console.error('Error fetching company data:', error);
    }
  }, [id, setIsLoading]);

  useEffect(() => {
    if (id) company();
  }, [id, company]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // TIMEOUT validation
    if (name === "timeOut") {
      if (value === "") {
        setFormData(prev => ({ ...prev, timeOut: "" as any }));
        setErrors(prev => ({ ...prev, timeOut: "" }));
        return;
      }

      if (!/^\d+$/.test(value)) {
        setErrors(prev => ({
          ...prev,
          timeOut: "Timeout must be a valid number",
        }));
        return; // stop updating state
      }

      // ✅ valid number
      setFormData(prev => ({
        ...prev,
        timeOut: Number(value),
      }));

      setErrors(prev => ({ ...prev, timeOut: "" }));
      return;
    }

    // default handler for others
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const contactPersonRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const registrationNumberRef = useRef<HTMLInputElement>(null);
  const taxIDRef = useRef<HTMLInputElement>(null);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement> | null = null;

    if (!formData.name) {
      errorMsg.name = "Please enter your business name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      };
      isValid = false;
    }

    if (!formData.contactPerson) {
      errorMsg.contactPerson = "Please enter the contact person's name.";
      if (!firstErrorRef) {
        firstErrorRef = contactPersonRef;
      };
      isValid = false;
    }

    const email = formData.email.trim();

    if (!email) {
      errorMsg.email = "Please enter an email address.";

      if (!firstErrorRef) {
        firstErrorRef = emailRef;
      }

      isValid = false;

    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
    ) {
      errorMsg.email = "Please enter a valid email address.";

      if (!firstErrorRef) {
        firstErrorRef = emailRef;
      }

      isValid = false;
    }

    const regChanged =
      formData.registrationNumber !== originalData.registrationNumber;

    const taxChanged =
      formData.taxID !== originalData.taxID;

    if (
      regChanged &&
      formData.registrationNumber &&
      formData.registrationNumber.trim().length !== 21
    ) {
      errorMsg.registrationNumber =
        "Registration Number must be 21 characters.";
      if (!firstErrorRef) firstErrorRef = registrationNumberRef;
      isValid = false;
    }

    if (
      taxChanged &&
      formData.taxID &&
      formData.taxID.trim().length !== 15
    ) {
      errorMsg.taxID = "Tax ID must be 15 characters.";
      if (!firstErrorRef) firstErrorRef = taxIDRef;
      isValid = false;
    }

    if (formData.timeOut !== undefined && formData.timeOut !== null) {
      if (isNaN(Number(formData.timeOut))) {
        errorMsg.timeOut = "TimeOut must be a valid number";
        isValid = false;
      }
    }

    if (!formData.currency) {
      errorMsg.currency = "Please select a currency";
      firstErrorRef = currencyRef;
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    return isValid;
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
      phone: phoneWithoutDialCode, // <--- Changed to 'phone'
      countryCode: `+${country.dialCode}`,
    }));
    const countryData = phoneNumberLength(country);
    handlePhoneNumberLength(
      countryData,
      phoneWithoutDialCode.length,
      "phone" // <--- Changed to 'phone'
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValid()) {
      try {
        setIsButtonLoading(true);

        let response;

        if (id) {
          response = await apiClient.patch(`/company/${id}`, formData);

          if (response.data.success === true) {
            toast.success(
              response?.data?.message || "Business updated successfully!"
            );
          }
        } else {
          response = await apiClient.post("/company/add", formData);

          if (response?.data?.success === true) {
            let message =
              response?.data?.message || "Business added successfully!";

            if (response?.data?.hasGeneratePassMailsent === true) {
              message +=
                " Generate password link has been sent to your mail.";
            }

            toast.success(message);
          }
        }

        // ✅ Backend returns 200 + success false
        if (response.data.success === false) {
          setIsButtonLoading(false);

          const message =
            response?.data?.message ||
            "There was an issue adding the company.";

          if (
            message.toLowerCase().includes("company name already exists")
          ) {
            setErrors(prev => ({
              ...prev,
              name: message,
            }));

            setTimeout(() => {
              const input =
                nameRef.current?.querySelector("input") as HTMLInputElement;

              if (input) {
                input.focus();

                const length = input.value.length;
                input.setSelectionRange(length, length);

                input.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 200);

            setIsButtonLoading(false);
            return;
          }

          if (
            message.toLowerCase().includes("already exists") ||
            message.toLowerCase().includes("already linked") ||
            message.toLowerCase().includes("account with this email")
          ) {
            setExistMessage(message);
            setShowExistModal(true);
            return;
          }

          toast.error(message);
          return;
        }

        // success flow
        if (fromPage === "admin") {
          navigate(-1);
        } else {
          localStorage.setItem(
            "companyId",
            response?.data?.company?._id
          );

          localStorage.setItem("userEmail", formData.email);

          if (location.state?.selectedPlan) {
            localStorage.setItem(
              "selectedPlan",
              JSON.stringify(location.state.selectedPlan)
            );
          }

          const selectedPlan = location.state?.selectedPlan;

          if (selectedPlan) {
            if (selectedPlan.isCustomPrice) {
              navigate("/contactus", {
                state: { selectedPlan },
              });
            } else if (!selectedPlan.price) {
              navigate("/subscription/success");
            } else {
              navigate(`/subscription/pay/${selectedPlan._id}`, {
                state: { selectedPlan },
              });
            }
          } else {
            navigate("/pricing");
          }
        }

        setFormData({
          _id: "",
          name: "",
          contactPerson: "",
          email: "",
          phone: "",
          registrationNumber: "",
          taxID: "",
          isActive: true,
          text: "",
          timeOut: 0,
          currency: "",
        });

        setErrors({});
        setIsButtonLoading(false);
      } catch (error: any) {
        setIsButtonLoading(false);

        const message =
          error?.response?.data?.message || "An error occurred.";

        toast.error(message);
      }
    }
  };

  const handleCurrency = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      currency: id
    }));

    setErrors(prev => ({ ...prev, 'currency': "" }));
  };

  return (
    <>
      <div className={`${fromPage ? "bg-DARK-100  py-8 px-2 antialiased dark:bg-DARK-800 md:py-6 w-full" : "flex items-center justify-center min-h-screen bg-gradient-to-br from-BRAND-200 to-BRAND-300 dark:from-DARK-600 dark:to-DARK-700"}`}>
        <div className={`${fromPage ? "w-full mx-auto lg:mx-0" : "w-full m-6 sm:m-8 md:m-12 lg:m-16 xl:m-24"} p-6 bg-white dark:bg-DARK-800 shadow-md rounded-2xl`}>

          {isLoading && <FormLoader count={2} />}
          {!isLoading && (
            <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left mb-0">
                <h2 className="pb-2 text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-BRAND-400 via-BRAND-500 to-BRAND-600 dark:from-white dark:via-gray-300 dark:to-gray-100">
                  POS Bucket
                </h2>
                <h2 className="pb-2 text-2xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-800 via-gray-900 to-black dark:from-white dark:via-gray-300 dark:to-gray-100">
                  Business Registration Form
                </h2>
              </div>

              <hr className="border-gray-300 dark:border-gray-700 mb-8" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
                {/* Business Name */}
                {/* <div ref={nameRef}>
                  <TextInputPOS
                    label="Business Name"
                    name="name"
                    value={formData.name}
                    placeholder="Enter Business Name"
                    type="text"
                    onChange={handleChange}
                    required
                    error={errors.name}
                    className="text-lg"
                  />
                </div> */}
                <div>
                  <Label htmlFor="businessName" value="Business Name" />
                  <span className="text-ERROR ml-1">*</span>
                  <div className="relative" ref={nameRef}>
                    <TextInputPOS
                      // label="Business Name"
                      name="name"
                      value={formData.name}
                      placeholder="Enter Business Name"
                      type="text"
                      onChange={handleChange}
                      // error={errors.name}
                      className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  </div>
                </div>

                {/* Contact Person */}
                {/* <div ref={contactPersonRef}>
                  <TextInputPOS
                    label="Contact Person"
                    name="contactPerson"
                    value={formData.contactPerson}
                    placeholder="Enter Contact Person's (Owner) Name"
                    type="text"
                    onChange={handleChange}
                    error={errors.contactPerson}
                    className="w-full p-3 rounded-md border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                  />
                </div> */}

                <div>
                  <Label htmlFor="contactPerson" value="Contact Person" />
                  <span className="text-ERROR ml-1">*</span>
                  <div className="relative" ref={nameRef}>
                    <TextInputPOS
                      // label="Contact Person"
                      name="contactPerson"
                      value={formData.contactPerson}
                      placeholder="Enter Contact Person's (Owner) Name"
                      type="text"
                      onChange={handleChange}
                      // error={errors.contactPerson}
                      className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                    />
                    {errors.contactPerson && <p className="text-sm text-red-600 mt-1">{errors.contactPerson}</p>}
                  </div>
                </div>

                {/* Email */}
                {/* <div ref={emailRef}>
                  <TextInputPOS
                    label="Email"
                    name="email"
                    value={formData.email}
                    placeholder="Enter Email"
                    type="email"
                    onChange={handleChange}
                    required
                    error={errors.email}
                    className="text-lg"
                  />
                </div> */}

                <div>
                  <Label htmlFor="email" value="Email" />
                  <span className="text-ERROR ml-1">*</span>
                  <div className="relative" ref={emailRef}>
                    <TextInputPOS
                      // label="Email"                      
                      name="email"
                      value={formData.email}
                      placeholder="Enter Email"
                      type="text"
                      onChange={handleChange}
                      // error={errors.email}
                      className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col -gap-2 pt-1">
                  <Label>Phone</Label>
                  <PhoneInput
                    inputClass="appearance-none block w-full mx-4 bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-2 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-100"
                    buttonStyle={{ backgroundColor: "white", paddingLeft: "4px" }}
                    countryCodeEditable={false}
                    enableSearch={true}
                    // disableDropdown
                    country={"in"}
                    // onlyCountries={["in"]}
                    placeholder="Enter phone number"
                    value={phoneInputData || ""}
                    onChange={(phone, country: CountryData) => {
                      handlePhoneNumber(phone, country);
                    }}
                  />
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>

                {/* Registration Number */}
                <div>
                  <TextInputPOS
                    label="Registration Number"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    placeholder="Enter Registration Number"
                    type="text"
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                  />
                  {errors.registrationNumber && <p className="text-sm text-red-600 mt-1">{errors.registrationNumber}</p>}
                </div>

                {/* Tax ID */}
                <div>
                  <TextInputPOS
                    label="Tax ID"
                    name="taxID"
                    value={formData.taxID}
                    placeholder="Enter TAX ID"
                    type="text"
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                  />
                  {errors.taxID && <p className="text-sm text-red-600 mt-1">{errors.taxID}</p>}
                </div>

                {(userData || id) && (
                  <>
                    {/* Text */}
                    <div>
                      <TextInputPOS
                        label="Text"
                        name="text"
                        value={formData.text}
                        placeholder="Enter Text"
                        type="text"
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                      />
                    </div>

                    {/* Time Out */}
                    <div>
                      <TextInputPOS
                        label="Time Out"
                        name="timeOut"
                        value={formData.timeOut?.toString() || ''}
                        placeholder="Enter TimeOut"
                        type="number"
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:ring-BRAND-500 focus:border-transparent bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 placeholder-DARK-400 dark:placeholder-DARK-500"
                      />
                      {errors.timeOut && (
                        <p className="text-sm text-red-600 mt-1">{errors.timeOut}</p>
                      )}
                    </div>
                  </>
                )}

                <div ref={currencyRef}>
                  <Label htmlFor="currency" value="Currency" /><span className="text-ERROR_HOVER">*</span>
                  <SelectWithSearch
                    items={currencyList}
                    title="Currency"
                    fieldKey="currency"
                    selectedItem={selectedCurrency}
                    setSelectedItem={setSelectedCurrency}
                    handleChange={handleCurrency}
                    displayKey="label"
                    searchKey="label"
                    valueKey="_id"
                  />
                  {errors?.currency && <p className="mt-1 text-sm text-red-600">{errors?.currency}</p>}      </div>
              </div>

              {(userData && isSuperAdmin) && (
                <div className="flex  gap-2">
                  {/* Status */}
                  <div className="flex items-center space-x-4 col-span-full">
                    <Label htmlFor="isActive" className="font-medium text-DARK-700">Status</Label>
                    {/* <div className="flex space-x-6">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="Activated"
                            name="isActive"
                            value="true"
                            checked={formData?.isActive === true}
                            onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                            className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                          />
                          <Label htmlFor="Activated" className="ml-2 text-DARK-700">Activated</Label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="DeActivated"
                            name="isActive"
                            value="false"
                            checked={formData?.isActive === false}
                            onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                            className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                          />
                          <Label htmlFor="DeActivated" className="ml-2 text-DARK-700">DeActivated</Label>
                        </div>
                      </div> */}
                    <ToggleSwitch
                      checked={!!formData?.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e }))}
                      color="success"
                    />
                  </div>
                  <div className="flex items-center space-x-4 col-span-full">
                    <Label htmlFor="isEmailActive" className="font-medium text-DARK-700">Email Service</Label>
                    <ToggleSwitch
                      checked={!!formData?.isEmailActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isEmailActive: e }))}
                      color="success"
                    />
                  </div>
                  <div className="flex items-center space-x-4 col-span-full">
                    <Label htmlFor="isWhatsappActive" className="font-medium text-DARK-700">Whatsapp Message Service</Label>
                    <ToggleSwitch
                      checked={!!formData?.isWhatsappActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isWhatsappActive: e }))}
                      color="success"
                    />
                  </div>
                  <div className="flex items-center space-x-4 col-span-full">
                    <Label htmlFor="isShowClient" className="font-medium text-DARK-700">Show As Client </Label>
                    <ToggleSwitch
                      checked={!!formData?.isShowClient}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isShowClient: e }))}
                      color="success"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    localStorage.removeItem("selectedPlan");
                    navigate(-1);
                  }}
                  disabled={isButtonLoading}
                  className="mr-2 bg-DARK-900 dark:bg-DARK-700 dark:hover:!bg-DARK-600 text-white text-xl font-semibold rounded-lg hover:!bg-DARK-950 focus:!ring-0 transition ease-in-out duration-200 disabled:opacity-50 py-1 w-full md:w-[10%]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isButtonLoading}
                  className="!bg-BRAND-500 text-white text-xl font-semibold rounded-lg hover:!bg-BRAND-600 focus:!ring-0 w-full md:w-[10%] transition ease-in-out duration-200 disabled:opacity-50 py-1"
                >
                  {isButtonLoading ? 'Loading...' : 'Submit'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <Modal
          show={showExistModal}
          size="md"
          popup
          onClose={() => setShowExistModal(false)}
        >
          <Modal.Body>
            <div className="text-center px-4 py-6">

              {/* Title */}
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                {existMessage}
              </h3>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">

                <Button
                  onClick={() => {
                    setShowExistModal(false);
                    setTimeout(() => {
                      const input =
                        emailRef.current?.querySelector("input") as HTMLInputElement;

                      if (input) {
                        input.focus();

                        const length = input.value.length;
                        input.setSelectionRange(length, length);
                      }
                    }, 200);
                  }}
                  className="min-w-[120px] !bg-DARK-900 hover:!bg-DARK-950 rounded-lg py-1 text-sm font-normal shadow-md !ring-1 !ring-black hover:!ring-black transition-all"
                >
                  Change Email
                </Button>

                {!userData && (
                  <Button
                    onClick={() =>
                      navigate("/login", {
                        state: {
                          email: formData.email,
                        },
                      })
                    }
                    className="min-w-[120px] !bg-BRAND-500 hover:!bg-BRAND-600 rounded-lg py-1 text-sm font-normal shadow-md"
                  >
                    Login Now
                  </Button>
                )}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </div >
    </>
  )
}

export default CompanyRegister