/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Checkbox, Label } from "flowbite-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { useAuth } from "../../context/AuthProvider";
import {
  CompanyField,
  phoneNumberLength,
  RestaurantField,
} from "../../utils/functions";
import FormLoader from "../../utils/common/FormLoader";
import NewSingleDate from "../../utils/common/NewSingleDate";
import {
  customerType,
  MANAGER_ROLES,
  OWNER_ROLES,
  SUPER_ADMIN,
} from "../../utils/common/constant";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { apiUrl, siteUrl } from "../../environment/env";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiPencil } from "react-icons/hi";
import SelectWithSearch from "../../utils/common/SelectWithSearch";
import { setTitle } from "../../utils/utility";

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
  dueBalance: number;
  currentBalance: number;
  accountNumber?: string;
  notes?: string;
}
interface ICustomer {
  _id: string;
  customerID: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode?: string;
  // mainPhone: string;
  // homePhone: string;
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
  hasHouseAccount: boolean;
  houseAccount: IHouseAccount;
}

interface ErrorState {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  // mainPhone: string;
  // homePhone: string;
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
  type?: string;
  storeCredit?: string;
  pointsEarned?: string;
  houseAccount?: {
    creditlimit?: string;
    currentBalance?: string;
    dueBalance?: string;
  };
}

function CustomerForm() {
  setTitle("Customer Form");
  const { userData } = useAuth();
  const NoImage = `${siteUrl}/images/download.png`;
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  let companyID = "";
  let restaurantID = "";
  if (loginRole !== SUPER_ADMIN) {
    companyID = `${userData?.staffMember?.company?._id}`;
  } else if (!OWNER_ROLES.includes(loginRole)) {
    restaurantID = `${userData?.staffMember?.restaurant?._id}`;
  }
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ICustomer | any>({
    _id: "",
    customerID: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    mainPhone: "",
    homePhone: "",
    company: companyID,
    restaurant: restaurantID,
    salutation: "",
    spouse: "",
    dateofBirth: "",
    dateofMarriage: "",
    fax: "",
    billingAddress: {
      address1: "",
      address2: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
    },
    shippingAddress: {
      address1: "",
      address2: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
    },
    taxExempt: false,
    taxId: "",
    priceLevel: "a",
    storeCredit: "",
    pointsEarned: "",
    crmParameters: {},
    hasHouseAccount: false,
    houseAccount: {
      creditlimit: "",
      dueBalance: 0,
      currentBalance: 0,
      accountNumber: "",
    },
  });

  const [errors, setErrors] = useState<ErrorState | any>({});
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } =
    useLoading();

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
  const [phoneInputData, setPhoneInputData] = useState<any>();
  // const [mainPhoneInputData, setMainPhoneInputData] = useState<any>()
  // const [homePhoneInputData, setHomePhoneInputData] = useState<any>()
  const [type, setType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | any>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const getCompany = async () => {
    try {
      const response = await apiClient.get(`/business`);
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  };

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

  //   const getCustomer = useCallback(async () => {
  //     try {
  //       setIsLoading(true);
  //       const response = await apiClient.get(`/customer/${id}`);
  //       const customer = response.data.data;
  //       setPhoneInputData(
  //         `${response?.data?.data?.countryCode || "1"}${
  //           response.data.data?.phoneNumber
  //         }`
  //       );
  //       // setMainPhoneInputData(`1${response.data.data?.mainPhone}`)
  //       // setHomePhoneInputData(`1${response.data.data?.homePhone}`)
  //       setFormData((prev: any) => ({
  //         ...prev,
  //         ...customer,
  //       }));

  //       setFormData((pre: any) => ({
  //         ...pre,
  //         company: customer?.company?._id,
  //         restaurant: customer.restaurant?._id,
  //       }));
  //       if (customer?.type) {
  //         const matchedType = customerType.find(
  //           (item: any) => item.value === customer.type
  //         );
  //         if (matchedType) {
  //           setType(matchedType.label);
  //         }
  //       }
  //       if (customer?.dateofBirth) {
  //         setSelectedBirthdate({
  //           startDate: new Date(customer.dateofBirth),
  //           endDate: new Date(customer.dateofBirth),
  //         });
  //       }
  //       if (customer?.dateofMarriage) {
  //         setSelectedMarriagedate({
  //           startDate: new Date(customer.dateofMarriage),
  //           endDate: new Date(customer.dateofMarriage),
  //         });
  //       }
  //       setTimeout(() => {
  //         setIsLoading(false);
  //       }, 500);
  //     } catch (error) {
  //       setTimeout(() => {
  //         setIsLoading(false);
  //       }, 500);
  //       console.error("~ getCustomer error :-", error);
  //     }
  //   }, [id, setIsLoading]);

  const sanitizeFormData = (data: any): ICustomer => {
    const sanitized: any = { ...data };

    // List of top-level string/number fields that should never be null in inputs
    const stringFields = [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "salutation",
      "spouse",
      "fax",
      "taxId",
      "dateofBirth",
      "dateofMarriage",
      "priceLevel",
    ];

    const numberFields = ["storeCredit", "pointsEarned"];

    stringFields.forEach((field) => {
      if (sanitized[field] === null || sanitized[field] === undefined) {
        sanitized[field] = "";
      }
    });

    numberFields.forEach((field) => {
      if (sanitized[field] === null || sanitized[field] === undefined || sanitized[field] === 0) {
        sanitized[field] = ""; // use "" so input doesn't show "0"
      }
    });

    // Billing & Shipping Address
    ["billingAddress", "shippingAddress"].forEach((addr) => {
      if (sanitized[addr]) {
        const fields = [
          "address1",
          "address2",
          "city",
          "postalCode",
          "state",
          "country",
        ];
        fields.forEach((f) => {
          if (sanitized[addr][f] === null || sanitized[addr][f] === undefined) {
            sanitized[addr][f] = "";
          }
        });
      }
    });

    // House Account
    if (sanitized.houseAccount) {
      const haFields = ["accountNumber", "notes"];
      haFields.forEach((f) => {
        if (
          sanitized.houseAccount[f] === null ||
          sanitized.houseAccount[f] === undefined
        ) {
          sanitized.houseAccount[f] = "";
        }
      });

      // creditlimit, currentBalance, dueBalance → default to 0
      ["creditlimit", "currentBalance", "dueBalance"].forEach((f) => {
        if (
          sanitized.houseAccount[f] === null ||
          sanitized.houseAccount[f] === undefined ||
          (f === "creditlimit" && sanitized.houseAccount[f] === 0)
        ) {
          sanitized.houseAccount[f] = f === "creditlimit" ? "" : 0;
        }
      });
    }

    return sanitized;
  };

  const getCustomer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/customer/${id}`);
      const customer = response.data.data;
      // Sanitize before setting state
      const sanitizedCustomer = sanitizeFormData(customer);

      if (customer?.countryCode && customer?.phoneNumber) {
        const fullPhone = `${customer.countryCode.replace("+", "")}${customer.phoneNumber
          }`;
        setPhoneInputData(fullPhone);
      } else if (customer?.phoneNumber) {
        // Fallback: assume US if no countryCode
        setPhoneInputData(`1${customer.phoneNumber}`);
      } else {
        setPhoneInputData("");
      }

      setFormData((prev: any) => ({
        ...prev,
        ...sanitizedCustomer,
        company: customer?.company?._id || "",
        restaurant: customer?.restaurant?._id || "",
      }));

      if (customer?.type) {
        const matchedType = customerType.find(
          (item: any) => item.value === customer.type
        );
        if (matchedType) {
          setType(matchedType.label);
        }
      }
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
    } catch (error: any) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      console.error("~ getCustomer error :-", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [id, setIsLoading]);

  useEffect(() => {
    if (id) {
      getCustomer();
    }
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }
  }, [id, getCustomer, loginRole]);

  useEffect(() => {
    if (formData?.company) {
      getRestaurant(formData.company);
    }
  }, [formData?.company, getRestaurant]);

  // Auto-select company if single
  useEffect(() => {
    if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
      setErrors((prev: any) => ({ ...prev, company: "" }));
    }
  }, [companies, loginRole]);

  // Auto-select restaurant if single
  useEffect(() => {
    if (restaurant?.length === 1) {
      setFormData((prev: any) => ({ ...prev, restaurant: restaurant[0]._id }));
      setErrors((prev: any) => ({ ...prev, restaurant: "" }));
    }
  }, [restaurant]);

  // Set company for non-SUPER_ADMIN
  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
    }
  }, [loginRole, userData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    const isCheckbox = type === "checkbox";
    let inputValue: string | boolean = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    if (type === "number" && typeof inputValue === "string") {
      inputValue = inputValue.replace(/[-eE+]/g, "");
    }

    setFormData((prev: any) => {
      if (name.includes(".")) {
        const [parentKey, childKey] = name.split(".");

        return {
          ...prev,
          [parentKey]: {
            ...((prev[parentKey as keyof typeof prev] as Record<string, any>) ||
              {}),
            [childKey]: inputValue,
          },
        };
      } else {
        return {
          ...prev,
          [name]: inputValue,
        };
      }
    });

    setErrors((prev: any) => {
      if (name.includes(".")) {
        const [parentKey, childKey] = name.split(".") as [
          keyof ErrorState,
          string
        ];

        if (prev[parentKey] && typeof prev[parentKey] === "object") {
          return {
            ...prev,
            [parentKey]: {
              ...(prev[parentKey] as Record<string, string>),
              [childKey]: "",
            },
          };
        }
      } else if (prev[name as keyof ErrorState]) {
        return { ...prev, [name]: "" };
      }
      return prev;
    });
  };

  const handleBirthDate = (
    value: { startDate: Date | null; endDate: Date | null } | any
  ) => {
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

  const handleMarriageDate = (
    value: { startDate: Date | null; endDate: Date | null } | any
  ) => {
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
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const creditLimitRef = useRef<HTMLInputElement>(null);
  const currentBalanceRef = useRef<HTMLInputElement>(null);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};
    let firstErrorRef: React.RefObject<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | HTMLDivElement
    > | null = null;

    if (loginRole === SUPER_ADMIN) {
      if (!formData.company) {
        errorMsg.company = "Please select business.";
        if (!firstErrorRef) {
          firstErrorRef = companyRef;
        }
        isValid = false;
      }
    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      if (!formData.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        if (!firstErrorRef) {
          firstErrorRef = restaurantRef;
        }
        isValid = false;
      }
    }

    if (!formData.type) {
      errorMsg.type = "Please select customer type.";
      if (!firstErrorRef) {
        firstErrorRef = typeRef;
      }
      isValid = false;
    }

    if (!formData.firstName) {
      errorMsg.firstName = "Please enter first name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      }
      isValid = false;
    }

    if (!formData.lastName) {
      errorMsg.lastName = "Please enter last name.";
      if (!firstErrorRef) {
        firstErrorRef = lastNameRef;
      }
      isValid = false;
    }

    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errorMsg.email = "Please enter a valid email address.";

        if (!firstErrorRef) {
          firstErrorRef = emailRef;
        }

        isValid = false;
      }
    }

    if (!formData.phoneNumber) {
      errorMsg.phoneNumber = "Please enter phone number.";
      if (!firstErrorRef) {
        firstErrorRef = phoneRef;
      }
      isValid = false;
    }

    if (formData?.hasHouseAccount) {
      if (!errorMsg.houseAccount) {
        errorMsg.houseAccount = {};
      }

      const credit = Number(formData?.houseAccount?.creditlimit);

      if (
        formData?.houseAccount?.creditlimit === "" ||
        formData?.houseAccount?.creditlimit === null ||
        formData?.houseAccount?.creditlimit === undefined
      ) {
        errorMsg.houseAccount.creditlimit = "Please enter credit limit.";
        isValid = false;
      } else if (isNaN(credit)) {
        errorMsg.houseAccount.creditlimit = "Credit limit must be a valid number.";
        isValid = false;
      } else if (credit < 0) {
        errorMsg.houseAccount.creditlimit = "Credit limit cannot be negative.";
        isValid = false;
      }

      // if (!formData?.houseAccount?.currentBalance) {
      //     errorMsg.houseAccount.currentBalance = "Please enter current balance.";
      //     if (!firstErrorRef) {
      //         firstErrorRef = currentBalanceRef;
      //     };
      //     isValid = false;
      // };
      if (formData.houseAccount.currentBalance < 0) {
        errorMsg.houseAccount.currentBalance = "Current balance cannot be negative.";
        if (!firstErrorRef) {
          firstErrorRef = currentBalanceRef;
        }
        isValid = false;
      }

      if (formData.houseAccount.dueBalance < 0) {
        errorMsg.houseAccount.dueBalance = "Due balance cannot be negative.";
        isValid = false;
      }
    }

    // Validate storeCredit
    if (formData.storeCredit !== undefined && formData.storeCredit !== null && formData.storeCredit !== "") {
      const val = parseFloat(formData.storeCredit);
      if (isNaN(val)) {
        errorMsg.storeCredit = "Store credit must be a valid number.";
        isValid = false;
      } else if (val < 0) {
        errorMsg.storeCredit = "Store credit cannot be negative.";
        isValid = false;
      }
    }

    // Validate pointsEarned
    if (
      formData.pointsEarned !== undefined &&
      formData.pointsEarned !== null &&
      formData.pointsEarned !== ""
    ) {
      const val = parseFloat(formData.pointsEarned);

      if (isNaN(val)) {
        errorMsg.pointsEarned = "Points earned must be a valid number.";
        isValid = false;
      } else if (val < 0) {
        errorMsg.pointsEarned = "Points earned cannot be negative.";
        isValid = false;
      }
    }

    // if (!formData.billingAddress.address1) {
    //   if (!errorMsg.billingAddress) {
    //     errorMsg.billingAddress = {};
    //   }
    //   errorMsg.billingAddress.address1 = "Please enter address.";
    //   isValid = false;
    // }
    // if (!formData.billingAddress.city) {
    //   if (!errorMsg.billingAddress) {
    //     errorMsg.billingAddress = {};
    //   }
    //   errorMsg.billingAddress.city = "Please enter city.";
    //   isValid = false;
    // }
    // if (!formData.billingAddress.postalCode) {
    //   if (!errorMsg.billingAddress) {
    //     errorMsg.billingAddress = {};
    //   }
    //   errorMsg.billingAddress.postalCode = "Please enter postal code.";
    //   isValid = false;
    // }
    // if (!formData.billingAddress.country) {
    //   if (!errorMsg.billingAddress) {
    //     errorMsg.billingAddress = {};
    //   }
    //   errorMsg.billingAddress.country = "Please enter country.";
    //   isValid = false;
    // }
    // if (!formData.billingAddress.state) {
    //   if (!errorMsg.billingAddress) {
    //     errorMsg.billingAddress = {};
    //   }
    //   errorMsg.billingAddress.state = "Please enter state.";
    //   isValid = false;
    // }

    if (loginRole === SUPER_ADMIN) {
      if (!formData.company) {
        errorMsg.company = "Please select business.";
        if (!firstErrorRef) {
          firstErrorRef = companyRef;
        }
        isValid = false;
      }
    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      if (!formData.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        if (!firstErrorRef) {
          firstErrorRef = restaurantRef;
        }
        isValid = false;
      }
    }

    setErrors((prev: any) => ({ ...prev, ...errorMsg }));
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
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
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "countryCode",
      "type",
      "company",
      "restaurant",
      "salutation",
      "spouse",
      "dateofBirth",
      "dateofMarriage",
      "fax",
      "taxExempt",
      "hasHouseAccount",
      "taxId",
      "priceLevel",
      "storeCredit",
      "pointsEarned",
    ];

    simpleFields.forEach((field) => {
      if (formData[field as keyof ICustomer]) {
        formDataToSend.append(
          field,
          String(formData[field as keyof ICustomer])
        );
      }
    });

    formDataToSend.append("customerProfile", selectedFile);

    if (formData.billingAddress) {
      const billing = formData.billingAddress;
      formDataToSend.append("billingAddress[address1]", billing.address1 || "");
      formDataToSend.append("billingAddress[address2]", billing.address2 || "");
      formDataToSend.append("billingAddress[city]", billing.city || "");
      formDataToSend.append(
        "billingAddress[postalCode]",
        billing.postalCode || ""
      );
      formDataToSend.append("billingAddress[state]", billing.state || "");
      formDataToSend.append("billingAddress[country]", billing.country || "");
    }

    if (formData.shippingAddress) {
      const shipping = formData.shippingAddress;
      formDataToSend.append(
        "shippingAddress[address1]",
        shipping.address1 || ""
      );
      formDataToSend.append(
        "shippingAddress[address2]",
        shipping.address2 || ""
      );
      formDataToSend.append("shippingAddress[city]", shipping.city || "");
      formDataToSend.append(
        "shippingAddress[postalCode]",
        shipping.postalCode || ""
      );
      formDataToSend.append("shippingAddress[state]", shipping.state || "");
      formDataToSend.append("shippingAddress[country]", shipping.country || "");
    }

    if (formData.houseAccount) {
      const house = formData.houseAccount;
      formDataToSend.append(
        "houseAccount[creditlimit]",
        house.creditlimit != null ? String(house.creditlimit) : ""
      );
      formDataToSend.append(
        "houseAccount[dueBalance]",
        house.dueBalance != null ? String(house.dueBalance) : ""
      );
      formDataToSend.append(
        "houseAccount[currentBalance]",
        house.currentBalance != null ? String(house.currentBalance) : ""
      );
      formDataToSend.append(
        "houseAccount[accountNumber]",
        house.accountNumber != null ? String(house.accountNumber) : ""
      );
      formDataToSend.append(
        "houseAccount[notes]",
        house.notes != null ? String(house.notes) : ""
      );
    }

    return formDataToSend;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid()) {
      try {
        let response;
        const formDataToSend = prepareFormData();

        if (id) {
          setIsButtonLoading(true);
          response = await apiClient.patch(`/customer/${id}`, formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (response.data.status) {
            toast.success(
              response?.data?.message || "Customer updated successfully!"
            );
          } else {
            toast.error(
              response?.data?.message || "Failed to update customer."
            );
            setIsButtonLoading(false);
            return;
          }
        } else {
          setIsButtonLoading(true);
          response = await apiClient.post("/customer/add", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (response?.status === 201) {
            toast.success("Customer added successfully!");
          } else {
            toast.error(
              response?.data?.message ||
              "There was an issue adding the customer."
            );
            setIsButtonLoading(false);
            return;
          }
        }
        navigate(-1);
        setFormData({
          _id: "",
          customerID: "",
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          countryCode: "",
          // mainPhone: '',
          // homePhone: '',
          company: "",
          restaurant: "",
          salutation: "",
          spouse: "",
          dateofBirth: "",
          dateofMarriage: "",
          fax: "",
          billingAddress: {
            address1: "",
            address2: "",
            city: "",
            postalCode: "",
            state: "",
            country: "",
          },
          shippingAddress: {
            address1: "",
            address2: "",
            city: "",
            postalCode: "",
            state: "",
            country: "",
          },
          taxExempt: false,
          taxId: "",
          priceLevel: "a",
          storeCredit: "",
          pointsEarned: "",
          crmParameters: {},
          hasHouseAccount: false,
          houseAccount: {
            creditlimit: "",
            dueBalance: 0,
            currentBalance: 0,
            accountNumber: "",
          },
        });
        setType("");
        setErrors({});
        setIsButtonLoading(false);
      } catch (error: any) {
        setIsButtonLoading(false);
        toast.error(error?.response?.data?.message);
      }
    }
  };

  const [isFileEdit, setIsFileEdit] = useState(false);

  //   const profilePhoto = useMemo(() => {
  //     if (previewUrl) return previewUrl;
  //     if (formData?.customerProfile)
  //       return `${apiUrl}/${formData.customerProfile}`;
  //     return NoImage;
  //   }, [previewUrl, formData?.customerProfile]);

  const profilePhoto = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (selectedFile === null) {
      // Explicitly deleted
      return NoImage;
    }
    if (formData?.customerProfile) {
      return `${apiUrl}/${formData.customerProfile}`;
    }
    return NoImage;
  }, [selectedFile, formData?.customerProfile]);

  const handlePreviousFile = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsFileEdit(true);
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

  // const handleMainPhoneNumber = (phone: any, country: any) => {
  //     setMainPhoneInputData(phone)
  //     const phoneWithoutDialCode = phone.replace(country.dialCode || "", "")
  //     setFormData((prevFormData: any) => ({
  //         ...prevFormData,
  //         mainPhone: phoneWithoutDialCode
  //     }));
  //     const countryData = phoneNumberLength(country);
  //     handlePhoneNumberLength(countryData, phoneWithoutDialCode.length, "mainPhone");
  // }

  // const handleHomePhoneNumber = (phone: any, country: any) => {
  //     setHomePhoneInputData(phone)
  //     const phoneWithoutDialCode = phone.replace(country.dialCode || "", "")
  //     setFormData((prevFormData: any) => ({
  //         ...prevFormData,
  //         homePhone: phoneWithoutDialCode
  //     }));
  //     const countryData = phoneNumberLength(country);
  //     handlePhoneNumberLength(countryData, phoneWithoutDialCode.length, "homePhone");
  // };

  const handleCustomerType = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      type: id,
    }));

    setErrors((prev: any) => ({ ...prev, type: "" }));
  };

  return (
    <>
      <FormHeaderPaths
        page={id ? "Edit Customer" : "Add Customer"}
        prevLink="/customer/1/"
        prevPage="Customers"
      />
      <div className="px-4 sm:px-6 lg:px-8 my-6">
        <div className="relative p-4 md:p-6 lg:p-8 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 sm:mb-8 text-gray-800 dark:text-DARK-100">
            Customer Form
          </h2>
          {isLoading && <FormLoader count={2} />}
          {!isLoading && (
            <form onSubmit={handleSubmit} className="relative bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6" noValidate>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Profile Section */}
                <div className="lg:col-span-1 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <img
                        src={profilePhoto || "images/download.png"}
                        alt="Profile Preview"
                        className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-full border-2 border-DARK-300 dark:border-DARK-600 shadow-2xl bg-white dark:bg-DARK-700 transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => (e.currentTarget.src = NoImage)}
                      />
                      <input
                        type="file"
                        id="customerProfile"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                      />
                      <div className="flex justify-center gap-2 mt-4">
                        {isFileEdit ? (
                          <div
                            title="Click to switch back to your previous picture"
                            onClick={handlePreviousFile}
                            className="p-2 cursor-pointer bg-white dark:bg-DARK-700 text-BRAND-600 dark:text-BRAND-400 border border-BRAND-200 dark:border-DARK-600 rounded-full shadow-md hover:bg-BRAND-50 dark:hover:bg-DARK-600 transition-all"
                          >
                            <RxCross2 className="font-extrabold w-5 h-5" />
                          </div>
                        ) : (
                          <Label htmlFor="customerProfile" className="cursor-pointer">
                            <div className="p-2 bg-white dark:bg-DARK-700 text-BRAND-600 dark:text-BRAND-400 border border-BRAND-200 dark:border-DARK-600 rounded-full shadow-md hover:bg-BRAND-50 dark:hover:bg-DARK-600 transition-all">
                              <HiPencil className="w-5 h-5" />
                            </div>
                          </Label>
                        )}
                        <button
                          type="button"
                          onClick={handleDeletePhoto}
                          disabled={!formData?.customerProfile && !selectedFile}
                          title={
                            !formData?.customerProfile && !selectedFile
                              ? "No picture to delete"
                              : "Delete profile picture permanently"
                          }
                          className={`
                        p-2 rounded-full border shadow-md transition-all duration-200
                        ${formData?.customerProfile || selectedFile
                              ? "cursor-pointer bg-white dark:bg-DARK-700 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400"
                              : "cursor-not-allowed bg-gray-100 dark:bg-DARK-800 text-gray-400 border-gray-200 dark:border-DARK-700"
                            }
                        `}
                          aria-label="Delete profile picture"
                        >
                          <RiDeleteBin6Line className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-DARK-500 dark:text-DARK-400 text-center italic">
                      Click the pencil icon to upload or change the profile picture.
                    </p>
                  </div>
                </div>

                {/* Right Side: Form Inputs */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Business & Restaurant */}
                  <div
                    className={`grid grid-cols-1 ${loginRole === SUPER_ADMIN ? "md:grid-cols-2" : "md:grid-cols-1"
                      } gap-4`}
                  >
                    {loginRole === SUPER_ADMIN && (
                      <div className="flex flex-col" ref={companyRef}>
                        <CompanyField
                          companies={companies}
                          selectedCompanyId={formData?.company}
                          handleChange={handleChange}
                          error={errors.company}
                        />
                      </div>
                    )}
                    {(MANAGER_ROLES.includes(loginRole) ||
                      loginRole === SUPER_ADMIN) && (
                        <div className="flex flex-col" ref={restaurantRef}>
                          <RestaurantField
                            restaurants={restaurant}
                            selectedRestaurantId={formData?.restaurant}
                            handleChange={handleChange}
                            error={errors.restaurant}
                          />
                        </div>
                      )}
                  </div>

                  {/* Type, Names */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div ref={typeRef}>
                      <Label htmlFor="type" value="Type" />
                      <span className="text-ERROR_HOVER">*</span>
                      <SelectWithSearch
                        items={customerType}
                        title="Customer type"
                        displayKey="label"
                        searchKey="label"
                        valueKey="value"
                        selectedItem={type}
                        setSelectedItem={setType}
                        handleChange={handleCustomerType}
                      />
                      {errors.type && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">{errors.type}</p>
                      )}
                    </div>
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
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.firstName}
                        </p>
                      )}
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
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email, Phone, Salutation, Spouse */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`}>
                    <div>
                      <Label
                        htmlFor="email"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Email
                      </Label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Phone Number <span className="text-ERROR_HOVER">*</span>
                      </Label>
                      <PhoneInput
                        inputClass="!w-full !h-11 !pl-12 !pr-4 !py-2 !dark:bg-DARK-700 !bg-white !text-DARK-700 !dark:text-DARK-200 !border !border-BRAND-200 !dark:border-DARK-600 !rounded-xl !focus:ring-2 !focus:ring-BRAND-500/20 !focus:border-BRAND-500 !shadow-sm !transition-all !outline-none"
                        buttonStyle={{ borderRadius: "12px 0 0 12px" }}
                        buttonClass="!border !border-BRAND-200 !dark:border-DARK-600 !bg-white !dark:bg-DARK-700"
                        countryCodeEditable={false}
                        country={"in"}
                        enableSearch={true}
                        placeholder="Enter phone number"
                        value={phoneInputData || ""}
                        onChange={(phone, country: CountryData) => {
                          handlePhoneNumber(phone, country);
                        }}
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="salutation"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Salutation
                      </Label>
                      <input
                        type="text"
                        id="salutation"
                        name="salutation"
                        placeholder="Enter Salutation"
                        value={formData.salutation}
                        onChange={handleChange}
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="spouse"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Spouse
                      </Label>
                      <input
                        type="text"
                        id="spouse"
                        name="spouse"
                        placeholder="Enter Spouse"
                        value={formData.spouse}
                        onChange={handleChange}
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Dates & Fax */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label
                        htmlFor="dateofBirth"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Date of Birth
                      </Label>
                      <NewSingleDate
                        value={selectedBirthdate}
                        onChange={handleBirthDate}
                        allowPastDates={true}
                        label="Date of Birth"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="dateofMarriage"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Date of Marriage
                      </Label>
                      <NewSingleDate
                        value={selectedMarriagedate}
                        onChange={handleMarriageDate}
                        allowPastDates={true}
                        label="Date of Marriage"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="fax"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Fax
                      </Label>
                      <input
                        type="text"
                        id="fax"
                        name="fax"
                        placeholder="Enter Fax"
                        value={formData.fax}
                        onChange={handleChange}
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-t-2 bg-gray-200 dark:bg-DARK-600 my-6" />
              <div className="">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-DARK-100 mb-4">Billing Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="billingaddress1"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Address 1
                    </Label>
                    <input
                      type="text"
                      id="billingaddress1"
                      name="billingAddress.address1"
                      placeholder="Enter Address 1"
                      value={formData.billingAddress.address1}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {errors.billingAddress?.address1 && (
                      <p className="mt-1 text-sm text-ERROR_HOVER">
                        {errors.billingAddress?.address1}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="billingaddress2"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Address 2
                    </Label>
                    <input
                      type="text"
                      id="billingaddress2"
                      name="billingAddress.address2"
                      placeholder="Enter Address 2"
                      value={formData.billingAddress.address2}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.billingaddress2 && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.billingaddress2}</p>} */}
                  </div>
                  <div>
                    <Label
                      htmlFor="billingpostalCode"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Postal Code
                    </Label>
                    <input
                      type="text"
                      id="billingpostalCode"
                      name="billingAddress.postalCode"
                      placeholder="Enter Postal Code"
                      value={formData.billingAddress.postalCode}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {errors.billingAddress?.postalCode && (
                      <p className="mt-1 text-sm text-ERROR_HOVER">
                        {errors.billingAddress?.postalCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="billingcity"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      City
                    </Label>
                    <input
                      type="text"
                      id="billingcity"
                      name="billingAddress.city"
                      placeholder="Enter City"
                      value={formData.billingAddress.city}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {errors.billingAddress?.city && (
                      <p className="mt-1 text-sm text-ERROR_HOVER">
                        {errors.billingAddress?.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="billingstate"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      State
                    </Label>
                    <input
                      type="text"
                      id="billingstate"
                      name="billingAddress.state"
                      placeholder="State"
                      value={formData.billingAddress.state}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {errors.billingAddress?.state && (
                      <p className="mt-1 text-sm text-ERROR_HOVER">
                        {errors.billingAddress?.state}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="billingcountry"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Country
                    </Label>
                    <input
                      type="text"
                      id="billingcountry"
                      name="billingAddress.country"
                      placeholder="Country"
                      value={formData.billingAddress.country}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {errors.billingAddress?.country && (
                      <p className="mt-1 text-sm text-ERROR_HOVER">
                        {errors.billingAddress?.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-t-2 bg-gray-200 dark:bg-DARK-600 my-6" />
              <div className="">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-DARK-100 mb-4">Shipping Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="shippingaddress1"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Address 1
                    </Label>
                    <input
                      type="text"
                      id="shippingaddress1"
                      name="shippingAddress.address1"
                      placeholder="Enter Address 1"
                      value={formData.shippingAddress.address1}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.shippingaddress1 && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.shippingaddress1}</p>} */}
                  </div>
                  <div>
                    <Label
                      htmlFor="shippingaddress2"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Address 2
                    </Label>
                    <input
                      type="text"
                      id="shippingaddress2"
                      name="shippingAddress.address2"
                      placeholder="Enter Address 2"
                      value={formData.shippingAddress.address2}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.shippingaddress2 && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.shippingaddress2}</p>} */}
                  </div>
                  <div>
                    <Label
                      htmlFor="shippingpostalCode"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Postal Code
                    </Label>
                    <input
                      type="text"
                      id="shippingpostalCode"
                      name="shippingAddress.postalCode"
                      placeholder="Enter Postal Code"
                      value={formData.shippingAddress.postalCode}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.shippingpostalCode && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.shippingpostalCode}</p>} */}
                  </div>
                  <div>
                    <Label
                      htmlFor="shippingcity"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      City
                    </Label>
                    <input
                      type="text"
                      id="shippingcity"
                      name="shippingAddress.city"
                      placeholder="Enter City"
                      value={formData.shippingAddress.city}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.shippingcity && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.shippingcity}</p>} */}
                  </div>
                  <div>
                    <Label
                      htmlFor="shippingstate"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      State
                    </Label>
                    <input
                      type="text"
                      id="shippingstate"
                      name="shippingAddress.state"
                      placeholder="Enter State"
                      value={formData.shippingAddress.state}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.shippingstate && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.shippingstate}</p>} */}
                  </div>
                  <div>
                    <Label
                      htmlFor="shippingcountry"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Country
                    </Label>
                    <input
                      type="text"
                      id="shippingcountry"
                      name="shippingAddress.country"
                      placeholder="Enter Country"
                      value={formData.shippingAddress.country}
                      onChange={handleChange}
                      className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                    />
                    {/* {errors.shippingcountry && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.shippingcountry}</p>} */}
                  </div>
                </div>
              </div>

              <div className="flex max-w-md flex-col gap-4" id="checkbox">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="taxId"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Tax ID
                  </Label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    placeholder="Enter Tax ID"
                    value={formData.taxId}
                    onChange={handleChange}
                    className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                  />
                  {/* {errors.taxId && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.taxId}</p>} */}
                </div>
                <div>
                  <Label
                    htmlFor="priceLevel"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Price Level
                  </Label>
                  <select
                    id="priceLevel"
                    name="priceLevel"
                    value={formData?.priceLevel}
                    onChange={handleChange}
                    className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                  >
                    <option className="dark:text-DARK-100" value="a">
                      A
                    </option>
                    <option className="dark:text-DARK-100" value="b">
                      B{" "}
                    </option>
                    <option className="dark:text-DARK-100" value="c">
                      C
                    </option>
                    <option className="dark:text-DARK-100" value="d">
                      D
                    </option>
                    <option className="dark:text-DARK-100" value="e">
                      E
                    </option>
                  </select>
                  {/* {errors.priceLevel && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.priceLevel}</p>} */}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="storeCredit"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Store Credit
                  </Label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    id="storeCredit"
                    name="storeCredit"
                    placeholder="Enter Store Credit"
                    value={formData?.storeCredit}
                    onChange={handleChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (["ArrowUp", "ArrowDown", "-", "e", "E", "+"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {errors.storeCredit && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.storeCredit}</p>}
                </div>
                <div>
                  <Label
                    htmlFor="pointsEarned"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Points Earned
                  </Label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    id="pointsEarned"
                    name="pointsEarned"
                    placeholder="Enter Points Earned"
                    value={formData.pointsEarned}
                    onChange={handleChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (["ArrowUp", "ArrowDown", "-", "e", "E", "+"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {errors.pointsEarned && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.pointsEarned}</p>}
                </div>
              </div>
              <div className="flex max-w-md flex-col gap-4" id="checkbox">
                <Label htmlFor="hasHouseAccount" className="flex gap-3">
                  <Checkbox
                    className="checked:!bg-BRAND-500 !ring-0"
                    id="hasHouseAccount"
                    name="hasHouseAccount"
                    checked={formData.hasHouseAccount}
                    onChange={handleChange}
                  />
                  Has House Account
                </Label>
              </div>
              {formData?.hasHouseAccount && (
                <>
                  <hr className="border-t-2 border-DARK-800 dark:border-DARK-300 my-4" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-DARK-100 mb-4">
                    House Account info.
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium text-DARK-700  dark:text-DARK-100  mb-1"
                      >
                        Account Number
                      </Label>
                      <input
                        type="text"
                        id="accountNumber"
                        name="houseAccount.accountNumber"
                        value={formData.houseAccount.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter Account Number"
                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                      />
                      {/* {errors.accountNumber && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.accountNumber}</p>} */}
                    </div>
                    <div>
                      <Label
                        htmlFor="creditlimit"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Credit Limit
                      </Label>
                      <input
                        ref={creditLimitRef}
                        type="number"
                        step="0.01"
                        min="0"
                        id="creditlimit"
                        name="houseAccount.creditlimit"
                        value={formData.houseAccount.creditlimit ?? ""}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                          if (["ArrowUp", "ArrowDown", "-", "e", "E", "+"].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Enter Credit Limit"
                        className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {errors?.houseAccount?.creditlimit && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors?.houseAccount?.creditlimit}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="currentBalance"
                        className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                      >
                        Current Balance
                      </Label>
                      <input
                        type="number"
                        id="currentBalance"
                        name="houseAccount.currentBalance"
                        value={formData.houseAccount.currentBalance}
                        onChange={handleChange}
                        ref={currentBalanceRef}
                        disabled
                        className="w-full h-11 px-4 py-2 rounded-xl border border-BRAND-200 dark:border-DARK-600 bg-slate-100 text-DARK-500 cursor-not-allowed dark:bg-DARK-700 dark:text-DARK-500 shadow-sm transition-all outline-none"
                      />
                      {errors?.houseAccount?.currentBalance && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors?.houseAccount?.currentBalance}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="dueBalance"
                        className="block text-sm font-medium text-DARK-700  dark:text-DARK-100  mb-1"
                      >
                        Due Balance
                      </Label>
                      <input
                        type="number"
                        id="dueBalance"
                        name="houseAccount.dueBalance"
                        value={formData.houseAccount.dueBalance}
                        onChange={handleChange}
                        disabled
                        className="w-full h-11 px-4 py-2 rounded-xl border border-BRAND-200 dark:border-DARK-600 bg-slate-100 text-DARK-500 cursor-not-allowed dark:bg-DARK-700 dark:text-DARK-500 shadow-sm transition-all outline-none"
                      />
                      {/* {errors.dueBalance && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.dueBalance}</p>} */}
                    </div>
                  </div>
                  <div className="grid grid-cols-1">
                    <div>
                      <Label
                        htmlFor="notes"
                        className="block text-sm font-medium text-DARK-700  dark:text-DARK-100  mb-1"
                      >
                        Notes
                      </Label>
                      <textarea
                        // type="text"
                        id="notes"
                        name="houseAccount.notes"
                        value={formData.houseAccount.notes}
                        onChange={handleChange}
                        placeholder="Add internal notes..."
                        className="w-full px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                      />
                      {/* {errors.notes && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.notes}</p>} */}
                    </div>
                  </div>
                </>
              )}

              {/* <button disabled={!!isButtonLoading} type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        {isButtonLoading ? 'Loading...' : 'Submit'}
                    </button> */}
              {/* Buttons - Right Aligned */}
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
                  <span className="relative z-10">
                    {isButtonLoading ? "Loading..." : "Submit"}
                  </span>
                  {isButtonLoading && (
                    <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default CustomerForm;
