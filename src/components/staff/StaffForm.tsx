/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Label } from "flowbite-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiEye, HiEyeOff, HiLockClosed, HiPencil } from "react-icons/hi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { apiUrl, siteUrl } from "../../environment/env";
import FormLoader from "../../utils/common/FormLoader";
import NewSingleDate from "../../utils/common/NewSingleDate";
import { DropdownWithSearch } from "../../utils/common/Filters";
import {
  MANAGER_ROLES,
  OWNER_ADMIN_ROLES,
  OWNER_ROLES,
  SUPER_ADMIN,
} from "../../utils/common/constant";
import { createQueryParams, phoneNumberLength } from "../../utils/functions";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import Permissions from "./Permissions";
import { setTitle } from "../../utils/utility";
import { AiTwotoneInfoCircle } from "react-icons/ai";

interface IStaff {
  _id: string;
  name: string;
  alias: string;
  fingerPrint: string;
  position: string;
  age: number;
  email: string;
  phone: string;
  countryCode?: string;
  salary: number;
  employeeNumber: string;
  pin: string;
  role: object | any;
  hireDate: string | Date;
  password: string;
  staffColor: string;
  isActive: boolean;
  company: string;
  restaurant: string;
}

interface ErrorState {
  name: string;
  position: string;
  age: string;
  email: string;
  phone: string;
  salary: string;
  employeeNumber: string;
  pin: string;
  role: string;
  hireDate: string;
  password: string;
  staffColor: string;
  isActive: string;
  company: string;
  restaurant: string;
}
function StaffForm() {
  setTitle("Staff Form");
  const NoImage = `${siteUrl}/images/download.png`;
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, setUserData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const companyId =
    userData?.staffMember?.role?.name === SUPER_ADMIN
      ? ""
      : userData?.staffMember?.company?._id;
  const [formData, setFormData] = useState<IStaff | any>({
    _id: "",
    name: "",
    alias: "",
    fingerPrint: "",
    position: "",
    age: "",
    email: "",
    phone: "",
    countryCode: "",
    salary: 0,
    employeeNumber: "",
    pin: "",
    role: { _id: "", name: "" },
    hireDate: "",
    password: "",
    staffColor: "",
    isActive: true,
    company: companyId,
    restaurant: "",
  });
  const [errors, setErrors] = useState<ErrorState>({
    name: "",
    position: "",
    age: "",
    email: "",
    phone: "",
    salary: "",
    employeeNumber: "",
    pin: "",
    role: "",
    hireDate: "",
    password: "",
    staffColor: "",
    isActive: "",
    company: "",
    restaurant: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [Roles, setRoles] = useState<any>([]);
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } =
    useLoading();
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const location = useLocation();
  const hideSidebarRoutes = ["/profile/edit", `/profile/edit/${id}`];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);
  const [selectedFile, setSelectedFile] = useState<File | any>("");
  const [selectedHiredate, setSelectedHiredate] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [phoneInputData, setPhoneInputData] = useState<any>();
  const [isTaken, setIsTaken] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [openPermission, setOpenPermission] = useState<boolean>(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const restaurantsLoadedRef = useRef<string>('');
  const rolesLoadedRef = useRef<string>('');
  const companiesLoadedRef = useRef(false);

  const getCompany = async () => {
    if (companiesLoadedRef.current) return;
    companiesLoadedRef.current = true;
    try {
      const response = await apiClient.get(`/business`);
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  };

  const getRestaurant = async (companyId: string) => {
    if (restaurantsLoadedRef.current === `rest-${companyId}`) return;
    restaurantsLoadedRef.current = `rest-${companyId}`;
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant);
        return response.data.restaurant;
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
    return [];
  }

  const getStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/staff/${id}`);

      if (response.data.status) {
        const staff = response.data.data;
        staff.password = "";
        setPhoneInputData(
          `${response?.data?.data?.countryCode || ""}${response.data.data.phone
          }`
        );
        const company = staff?.company?._id;
        const role = staff?.role?._id;
        const restaurant = staff?.restaurant?._id;
        setFormData((prev: any) => ({
          ...prev,
          ...staff,
          hireDate: new Date(staff.hireDate) || staff.hireDate,
          company: company,
          role: role,
          restaurant: restaurant,
        }));
        getRestaurant(company);
        getRoles(company, restaurant);
        if (staff?.hireDate) {
          setSelectedHiredate({
            startDate: new Date(staff.hireDate),
            endDate: new Date(staff.hireDate),
            // startDate: staff?.hireDate,
            // endDate: staff?.hireDate,
          });
        }
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      console.error("~ getProduct error :-", error);
    }
  }, [id, setIsLoading]);

  const getRoles = async (company?: string, restaurant?: string) => {
    if (!company) return;
    const key = `roles-${company || ''}-${restaurant || ''}`;
    if (rolesLoadedRef.current === key) return;
    rolesLoadedRef.current = key;
    try {
      const queryParam = createQueryParams({ company, restaurant });
      const response = await apiClient.get(`/role/${queryParam}`);
      setRoles(response?.data?.roles || []);
    } catch (error: any) {
      console.log("error", error.message);
      setRoles([]);
    }
  };

  useEffect(() => {
    if (id) {
      getStaff();
    }
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }

    if (loginRole !== SUPER_ADMIN && OWNER_ROLES.includes(loginRole)) {
      getRestaurant(userData?.staffMember?.company?._id);
    }

    if (loginRole !== SUPER_ADMIN) {
      getRoles(
        userData?.staffMember?.company?._id,
        userData?.staffMember?.restaurant?._id
      );
    }
  }, [getStaff, id, loginRole]);

  useEffect(() => {
    if (formData?.company && loginRole === SUPER_ADMIN) {
      getRestaurant(formData.company);
      // getRoles(formData.company);
    }
  }, [formData?.company, loginRole]);

  // Auto-select company if single
  useEffect(() => {
    if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
      setErrors((prev: any) => ({ ...prev, company: "" }));
    }
  }, [companies, loginRole]);

  // Auto-select restaurant if single
  useEffect(() => {
    if (restaurant?.length === 1 && formData.company) {
      const restaurantId = restaurant[0]._id;

      setFormData((prev: any) => ({
        ...prev,
        restaurant: restaurantId,
        role: ""
      }));

      setErrors((prev: any) => ({ ...prev, restaurant: "" }));
      getRoles(formData.company, restaurantId);
    }
  }, [restaurant, formData.company]);

  // Set company for non-SUPER_ADMIN
  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
    }
  }, [loginRole, userData]);

  // Auto-select role if single
  useEffect(() => {
    if (Roles?.length === 1) {
      setFormData((prev: any) => ({ ...prev, role: Roles[0]._id }));
      setErrors((prev: any) => ({ ...prev, role: "" }));
    }
  }, [Roles]);

  // Real-time validation for required fields (only after first submit attempt)
  useEffect(() => {
    if (!isSubmitted) return;
    const newErrors: any = {};

    if (loginRole === SUPER_ADMIN && !formData.company) {
      newErrors.company = "Please select business.";
    } else if (formData.company) {
      newErrors.company = "";
    }

    if ((loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && !formData.restaurant) {
      newErrors.restaurant = "Please select restaurant.";
    } else if (formData.restaurant) {
      newErrors.restaurant = "";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Please enter name.";
    } else {
      newErrors.name = "";
    }

    if (!formData.phone) {
      newErrors.phone = "Please enter phone number.";
    } else {
      newErrors.phone = "";
    }

    if (loginRole !== SUPER_ADMIN && !formData.employeeNumber) {
      newErrors.employeeNumber = "Please enter Employee Number.";
    } else {
      newErrors.employeeNumber = "";
    }

    if (!formData.pin) {
      newErrors.pin = "Please enter pin.";
    } else if (formData.pin.length !== 4) {
      newErrors.pin = "Pin must be exactly 4 digits.";
    } else {
      newErrors.pin = "";
    }

    setErrors((prev: any) => ({ ...prev, ...newErrors }));
  }, [isSubmitted, formData.company, formData.restaurant, formData.name, formData.phone, formData.employeeNumber, formData.pin, loginRole]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev: any) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "company") {
      getRestaurant(value);
      // getRoles(value);
    }
    // if (name === "restaurant") {
    //   getRoles(formData.company, formData.restaurant);
    // }
  };

  const handleCompany = (id: any) => {
    setFormData((pre: any) => ({
      ...pre,
      company: id,
      restaurant: "",
      role: "",
    }));

    rolesLoadedRef.current = '';
    restaurantsLoadedRef.current = '';

    setRoles([]);
    setRestaurant([]);

    if (id) {
      getRestaurant(id);
    } else {
      setRestaurant([]);
      setRoles([]);
    }

    setErrors((pre: any) => ({ ...pre, company: "" }));
  };

  const handleRestaurant = (id: any) => {
    setFormData((pre: any) => ({
      ...pre,
      restaurant: id,
      role: "",
    }));

    setErrors((pre: any) => ({
      ...pre,
      restaurant: "",
    }));

    if (formData?.company && id) {
      getRoles(formData.company, id);
    }
  };

  const handleRole = (id: any) => {
    setFormData((pre: any) => ({ ...pre, role: id }));
    setErrors((pre: any) => ({ ...pre, role: "" }));
  };

  const handleHireDate = (
    value: { startDate: Date | null; endDate: Date | null } | any
  ) => {
    if (value?.startDate) {
      setSelectedHiredate(value);
      setFormData((prev: any) => ({
        ...prev,
        hireDate: value?.startDate,
      }));
    }
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const employeeNumberRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkTimeoutRef = useRef<any | null>(null);
  const latestRequestRef = useRef(0);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};
    let firstErrorRef: React.RefObject<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | HTMLDivElement
    > | null = null;

    if (!formData.name) {
      errorMsg.name = "Please enter name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      }
      isValid = false;
    }
    if (!formData.phone) {
      errorMsg.phone = "Please enter phone number.";
      if (!firstErrorRef) {
        firstErrorRef = phoneRef;
      }
      isValid = false;
    }

    // console.log("firstErrorRef", firstErrorRef);

    if (loginRole !== SUPER_ADMIN && !formData.employeeNumber) {
      errorMsg.employeeNumber = "Please enter Employee Number.";
      if (!firstErrorRef) {
        firstErrorRef = employeeNumberRef;
      }
      isValid = false;
    }

    if (isTaken) {
      errorMsg.employeeNumber = "Employee number is already taken.";

      if (!firstErrorRef) {
        firstErrorRef = employeeNumberRef;
      }

      isValid = false;
    }

    if (
      (typeof formData.role === "object" &&
        (!formData.role || !formData.role._id)) ||
      (typeof formData.role === "string" && !formData.role)
    ) {
      errorMsg.role = "Please select a role.";
      if (!firstErrorRef) {
        firstErrorRef = roleRef;
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

    const salary = String(formData.salary || '').trim();

    if (salary) {
      if (!/^\d*\.?\d{0,2}$/.test(salary)) {
        errorMsg.salary = "Salary must be a valid number.";
        isValid = false;
      } else if (Number(salary) < 0) {
        errorMsg.salary = "Salary cannot be negative.";
        isValid = false;
      }
    }

    if (!formData.pin) {
      errorMsg.pin = "Please enter pin.";
      if (!firstErrorRef) {
        firstErrorRef = pinRef;
      }
      isValid = false;
    } else if (formData?.pin?.length !== 4) {
      errorMsg.pin = "Pin must be exactly 4 digits.";
      if (!firstErrorRef) {
        firstErrorRef = pinRef;
      }
      isValid = false;
    }
    const age = String(formData.age || '').trim();

    if (age) {
      if (!/^\d+$/.test(age)) {
        errorMsg.age = "Age must contain numbers only.";
        isValid = false;
      } else {
        const numAge = Number(age);

        if (numAge < 18) {
          errorMsg.age = "Age must be at least 18.";
          isValid = false;
        } else if (numAge > 80) {
          errorMsg.age = "Age cannot be more than 80.";
          isValid = false;
        }
      }
    }
    setErrors((prev) => ({ ...prev, ...errorMsg }));
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
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
      phone: phoneWithoutDialCode,
      countryCode: `+${country.dialCode}`,
    }));
    const countryData = phoneNumberLength(country);
    handlePhoneNumberLength(
      countryData,
      phoneWithoutDialCode.length,
      "phone"
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (isValid()) {
      try {
        const formDataToSend = new FormData();
        const payload = {
          name: formData?.name,
          alias: formData?.alias,
          fingerPrint: formData?.fingerPrint,
          position: formData?.position,
          age:
            formData?.age === "" ||
              formData?.age === null ||
              formData?.age === undefined
              ? null
              : Number(formData.age),
          email: formData?.email,
          phone: formData?.phone,
          countryCode: formData?.countryCode,
          salary: formData?.salary || 0,
          employeeNumber: formData?.employeeNumber,
          pin: formData?.pin,
          role: formData?.role,
          hireDate: formData?.hireDate,
          password: formData?.password,
          staffColor: formData?.staffColor,
          isActive: formData?.isActive,
          company: formData?.company,
          restaurant: formData?.restaurant,
          isProfile: shouldHideSidebar && id === userData?.staffMember?._id,
        };

        for (const [key, value] of Object.entries(payload)) {
          if (value !== null && value !== undefined) {
            formDataToSend.append(key, value as any);
          }
        }
        formDataToSend.append("profile", selectedFile);

        let response: any = {};
        if (id) {
          setIsButtonLoading(true);
          response = await apiClient.patch(`/staff/${id}`, formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (response?.data?.success) {
            if (shouldHideSidebar) {
              setUserData((pre: any) => ({
                ...pre,
                staffMember: response?.data?.staff,
              }));
            }
            toast.success(
              response?.data?.message || "Staff updated successfully!"
            );
            navigate(-1);
          } else {
            toast.error(response?.data?.message);
          }
        } else {
          setIsButtonLoading(true);
          response = await apiClient.post("/staff/add", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (response?.data?.success) {
            toast.success(
              response?.data?.message || "Staff added successfully!"
            );
            navigate(-1);
          } else {
            setIsButtonLoading(false);
            toast.error(
              response?.data?.message ||
              "There was an issue adding the product."
            );
            return;
          }
        }
        /* setFormData({
          _id: "",
          name: "",
          profile: "",
          position: "",
          age: 0,
          email: "",
          phone: "",
          salary: 0,
          pin: "",
          role: { "_id": '', "name": '' },
          hireDate: new Date(),
          password: "",
          isActive: true,
          company: '',
          staffColor: '',
          restaurant: ''
        })
        setErrors({
          name: "",
          position: "",
          age: "",
          email: "",
          phone: "",
          salary: "",
          pin: "",
          role: "",
          hireDate: "",
          isActive: "",
          password: "",
          company: "",
          staffColor: "",
          restaurant: ""
        }); */
        setIsButtonLoading(false);
      } catch (error: any) {
        setIsButtonLoading(false);
        toast.error(error?.response?.data?.message);
      }
    }
  };

  const [isFileEdit, setIsFileEdit] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsFileEdit(true);
  };

  const profilePhoto = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (formData?.profile) {
      return `${apiUrl}/${formData.profile}`;
    }
    return NoImage;
  }, [selectedFile, formData?.profile]);

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
    setFormData((prev: any) => ({
      ...prev,
      profile: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const checkEmployeeNumber = (
    value: string,
    staffId: string
  ) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (value.length === 0) {
      setIsTaken(false);
      setIsChecking(false);
      return;
    }

    checkTimeoutRef.current = setTimeout(async () => {
      const requestId = ++latestRequestRef.current;

      try {
        setIsChecking(true);

        const combinedData = {
          number: value,
          staff: staffId,
          company: formData.company,
          restaurant: formData.restaurant,
        };

        const queryParams = createQueryParams(combinedData);

        const res = await apiClient.get(
          `/staff/check/employeeNumber${queryParams}`
        );

        // Ignore old responses
        if (requestId !== latestRequestRef.current) return;

        setIsTaken(res.data.success);
      } catch (err) {
        console.error("Error checking employee number:", err);

        if (requestId === latestRequestRef.current) {
          setIsTaken(false);
        }
      } finally {
        if (requestId === latestRequestRef.current) {
          setIsChecking(false);
        }
      }
    }, 500);
  };

  const canShowPermissionButton = (): boolean => {
    const loggedInId = userData?.staffMember?._id?.toString();
    const targetId = formData?._id?.toString();
    const targetRole = formData?.role?.name;

    if (loggedInId === targetId) return false;

    if (loginRole === SUPER_ADMIN) return true;

    if (
      MANAGER_ROLES.includes(loginRole) &&
      OWNER_ADMIN_ROLES.includes(targetRole)
    )
      return false;

    if (OWNER_ROLES.includes(loginRole) && loggedInId !== targetId) return true;

    if (
      MANAGER_ROLES.includes(loginRole) &&
      loggedInId !== targetId &&
      !OWNER_ROLES.includes(targetRole)
    )
      return true;

    return false;
  };

  return (
    <>
      {shouldHideSidebar ? (
        <FormHeaderPaths
          page={id === userData?.staffMember?._id ? "Edit Profile" : "Edit Staff"}
          prevLink={id === userData?.staffMember?._id ? `/profile/${id}` : "/staff/1/"}
          prevPage={id === userData?.staffMember?._id ? "Profile" : "Staffs"}
        />
      ) : (
        <FormHeaderPaths
          page={id ? "Edit Staff" : "Add Staff"}
          prevLink="/staff/1/"
          prevPage="Staffs"
        />
      )}
      <div className="px-4 sm:px-6 lg:px-8 flex">
        <div className="relative my-6 w-full p-4 md:p-6 lg:p-8 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 sm:mb-8 text-gray-800 dark:text-DARK-100">
            {shouldHideSidebar ? "Profile" : "Staff Form"}
          </h2>
          {isLoading && <FormLoader count={2} />}
          {!isLoading && (
            <form onSubmit={handleSubmit} className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
              <div className="flex flex-col items-center">
                <label htmlFor="profile" className="cursor-pointer">
                  <img
                    src={profilePhoto || "images/download.png"}
                    alt="Profile Preview"
                    className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300"
                    onError={(e) => (e.currentTarget.src = NoImage)}
                  />
                </label>
                <input
                  type="file"
                  id="profile"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <div className="flex">
                  {isFileEdit ? (
                    <div
                      title="Click to switch back to your previous picture"
                      onClick={handlePreviousFile}
                      className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                    >
                      <RxCross2 className="font-extrabold" />
                    </div>
                  ) : (
                    <label htmlFor="profile" className="cursor-pointer">
                      <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                        <HiPencil />
                      </div>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={!formData?.profile && !selectedFile}
                    title={
                      !formData?.profile && !selectedFile
                        ? "No picture to delete"
                        : "Delete profile picture permanently"
                    }
                    className={`
                    -mt-3.5 p-1.5 rounded-full border transition-all duration-200
                    ${formData?.profile || selectedFile
                        ? "cursor-pointer bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                        : "cursor-not-allowed bg-gray-100 text-gray-600 border-BRAND-400 dark:bg-DARK-700 dark:border-DARK-600"
                      }
                    `}
                    aria-label="Delete profile picture"
                  >
                    <RiDeleteBin6Line className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {canShowPermissionButton() && formData?._id && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <Button
                    onClick={() => {
                      setOpenPermission(true);
                      setSelectedPermissions(formData.permissions);
                    }}
                    disabled={isLoading}
                    className="!bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-600 dark:hover:!bg-DARK-700 w-full focus:!ring-0"
                  >
                    <HiLockClosed className="h-4 w-4 mr-2 my-auto" />
                    Open Permissions
                  </Button>
                </div>
              )}

              <div
                className={`grid  ${loginRole === "Owner/Admin" ? "" : "grid-cols-1 md:grid-cols-2"
                  }  gap-4`}
              >
                {loginRole === SUPER_ADMIN && (
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="flex flex-col mb-2" ref={companyRef}>
                      <div className="block">
                        <Label htmlFor="company" value="Business" />
                        <span className="text-red-500">*</span>
                      </div>
                      <DropdownWithSearch
                        setSelectedItem={setFormData}
                        selectedItem={
                          companies?.find((c: any) => c._id === formData?.company)
                            ?.name || ""
                        }
                        items={companies}
                        title="Business"
                        handleFilter={handleCompany}
                        fieldKey="company"
                      />
                      {errors.company && (
                        <p className="mt-1 text-sm text-ERROR_HOVER">
                          {errors.company}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(loginRole === SUPER_ADMIN ||
                  OWNER_ROLES.includes(loginRole)) && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div className="flex flex-col mb-2" ref={restaurantRef}>
                        <div className="block">
                          <Label htmlFor="restaurant" value="Restaurant" />
                          <span className="text-red-500">*</span>
                        </div>
                        <DropdownWithSearch
                          setSelectedItem={setFormData}
                          selectedItem={
                            restaurant?.find(
                              (c: any) => c._id === formData?.restaurant
                            )?.name || ""
                          }
                          items={restaurant}
                          title="Restaurant"
                          handleFilter={handleRestaurant}
                          fieldKey="restaurant"
                        />
                        {errors.restaurant && (
                          <p className="mt-1 text-sm text-ERROR_HOVER">
                            {errors.restaurant}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" value="Name" />
                  <span className="text-ERROR_HOVER">*</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter Name"
                    ref={nameRef}
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="alias" value="Alias" />
                  <input
                    type="text"
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                    placeholder="Enter Alias"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeNumber" value="Employee Number" />
                  <span className="text-ERROR_HOVER">*</span>

                  <input
                    type="text"
                    name="employeeNumber"
                    value={formData.employeeNumber}
                    ref={employeeNumberRef}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (/^\d{0,3}$/.test(value)) {
                        handleChange(e);
                        setErrors((prev: any) => ({
                          ...prev,
                          employeeNumber: undefined,
                        }));

                        if (value.length > 0) {
                          checkEmployeeNumber(value, formData._id);
                        } else {
                          setIsTaken(false);
                        }
                      }
                    }}
                    placeholder="Enter Employee Number"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                  />

                  {isChecking && (
                    <p className="text-sm text-gray-500">Checking...</p>
                  )}

                  {!isChecking &&
                    formData.employeeNumber?.length > 0 &&
                    isTaken && (
                      <p className="text-sm text-ERROR_HOVER">
                        Employee number is already taken
                      </p>
                    )}

                  {!isChecking &&
                    formData.employeeNumber?.length > 0 &&
                    !isTaken && !formData._id && (
                      <p className="text-sm text-green-600">
                        Employee number is available
                      </p>
                    )}

                  {errors.employeeNumber && (
                    <p className="text-ERROR_HOVER text-sm">
                      {errors.employeeNumber}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="block">
                    <Label htmlFor="role" value="Role" />
                    <span className="text-ERROR_HOVER">*</span>
                  </div>
                  <DropdownWithSearch
                    setSelectedItem={setFormData}
                    selectedItem={
                      Roles?.find((c: any) => c._id === formData?.role)?.name ||
                      ""
                    }
                    items={Roles}
                    title="Role"
                    handleFilter={handleRole}
                    fieldKey="role"
                  />
                  {errors.role && (
                    <p className="text-ERROR_HOVER text-sm">{errors.role}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fingerPrint" value="Fingerprint Id" />
                  <input
                    type="text"
                    name="fingerPrint"
                    value={formData.fingerPrint}
                    onChange={handleChange}
                    placeholder="Enter Fingerprint ID"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="position" value="Position" />
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Enter Position"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-ERROR_HOVER">
                      {errors.position}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Password
                  </label>
                  <div className="flex items-center border border-DARK-300 rounded-md">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      onChange={handleChange}
                      placeholder="Enter Password"
                      className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="px-3 py-2 text-DARK-500 dark:bg-DARK-700 dark:text-DARK-100 border-l border-DARK-300 rounded-r-md transition-colors duration-200 hover:text-BRAND-500 dark:hover:text-BRAND-400"
                    >
                      {showPassword ? (
                        <HiEye className="h-5 w-5" />
                      ) : (
                        <HiEyeOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {id && (
                    <small className="dark:text-DARK-400">
                      Note: The password will not be updated unless a new one is
                      entered.
                    </small>
                  )}
                  {errors.password && (
                    <p className="text-ERROR_HOVER text-sm">{errors.password}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Email"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                  />
                  {errors.email && (
                    <p className="text-ERROR_HOVER text-sm">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="block">
                    <Label htmlFor="phone" value="Phone number" />
                    <span className="text-red-500">*</span>
                  </div>
                  <PhoneInput
                    inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-100"
                    buttonStyle={{ backgroundColor: "white" }}
                    countryCodeEditable={false}
                    country={"in"}
                    enableSearch={true}
                    placeholder="Enter phone number"
                    value={phoneInputData || ""}
                    onChange={(phone, country: CountryData) => {
                      handlePhoneNumber(phone, country);
                    }}
                  />
                  {errors.phone && (
                    <p className="text-ERROR_HOVER text-sm">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <div>
                    <label
                      htmlFor="salary"
                      className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                    >
                      Salary
                    </label>

                    <input
                      type="text"
                      inputMode="decimal"
                      name="salary"
                      value={formData.salary}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!/^\d*\.?\d{0,2}$/.test(value)) {
                          return;
                        }
                        if (
                          value.length > 1 &&
                          value.startsWith("0") &&
                          !value.startsWith("0.")
                        ) {
                          value = value.replace(/^0+/, "");
                        }

                        setFormData((prev: any) => ({
                          ...prev,
                          salary: value,
                        }));

                        if (errors.salary) {
                          setErrors((prev: any) => ({
                            ...prev,
                            salary: "",
                          }));
                        }
                      }}
                      placeholder="Enter Salary"
                      onKeyDown={(e) => {
                        // Prevent negative and scientific notation
                        if (
                          ["-", "e", "E", "+", "ArrowUp", "ArrowDown"].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                    />

                    {errors.salary && (
                      <p className="text-ERROR_HOVER text-sm">{errors.salary}</p>
                    )}
                  </div>
                  {errors.salary && (
                    <p className="text-ERROR_HOVER text-sm">{errors.salary}</p>
                  )}
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="flex flex-col mb-2">
              <div className="block">
                <Label htmlFor="role" value="Role" /><span className="text-ERROR_HOVER">*</span>
              </div>
              <DropdownWithSearch
                setSelectedItem={setFormData}
                selectedItem={Roles?.find((c: any) => c._id === formData?.role)?.name || ''}
                items={Roles}
                title="Role"
                handleFilter={handleRole}
                fieldKey="role"
              />
              {errors.role && <p className="text-ERROR_HOVER text-sm">{errors.role}</p>}
            </div>
          </div> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* <label htmlFor="pin" className="block text-sm font-medium text-DARK-700 mb-1">Pin</label> */}
                  <Label htmlFor="pin" value="Pin" />
                  <span className="text-ERROR_HOVER">*</span>
                  {/* <input
                type="number"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Enter Pin"
                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
              /> */}
                  <input
                    type="text"
                    name="pin"
                    value={formData.pin}
                    ref={pinRef}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,4}$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    placeholder="Enter Pin"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                  />
                  {errors.pin && (
                    <p className="text-ERROR_HOVER text-sm">{errors.pin}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="hireDate"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                  >
                    Hire Date:
                  </label>
                  <NewSingleDate
                    value={selectedHiredate}
                    onChange={handleHireDate}
                    label="Hire Date"
                  />
                  {errors.hireDate && (
                    <p className="text-ERROR_HOVER text-sm">{errors.hireDate}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-DARK-700 dark:text-DARK-100"
                  >
                    Age
                  </label>

                  <div className="relative group cursor-pointer">
                    <AiTwotoneInfoCircle className="w-4 h-4 text-gray-500 hover:text-BRAND-500" />

                    <div
                      className="
        absolute left-5 top-1/2 -translate-y-1/2
        hidden group-hover:block
        whitespace-nowrap
        rounded-md bg-DARK-800 text-white text-xs
        px-2 py-1 shadow-lg z-10
      "
                    >
                      Age must be between 18 to 80
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  name="age"
                  value={formData.age === 0 ? "" : formData.age}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,3}$/.test(value)) {
                      if (value === "" || Number(value) <= 80) {
                        setFormData((prev: any) => ({
                          ...prev,
                          age: value,
                        }));
                      }
                    }
                  }}
                  placeholder="Enter Age"
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md "
                />
                {errors.age && (
                  <p className="text-ERROR_HOVER text-sm">{errors.age}</p>
                )}
              </div>
              <div>
                <Label value="Staff Color"></Label>
                <div
                  className="relative w-10 h-10 rounded-full shadow-md"
                  style={{ backgroundColor: formData?.staffColor || "black" }}
                >
                  <input
                    type="color"
                    name="staffColor"
                    value={formData?.staffColor || ""}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="isAvailable"
                  className="text-sm font-medium text-DARK-700 dark:text-DARK-100"
                >
                  Status{" "}
                </label>
                <input
                  type="radio"
                  id="Activated"
                  name="isActive"
                  value="true"
                  checked={formData.isActive === true}
                  onChange={() =>
                    setFormData((prev: any) => ({ ...prev, isActive: true }))
                  }
                  className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
                />
                <label
                  htmlFor="Activated"
                  className="text-sm font-medium text-DARK-700 dark:text-DARK-100"
                >
                  Activated
                </label>
                <input
                  type="radio"
                  id="DeActivated"
                  name="isActive"
                  value="false"
                  checked={formData.isActive === false}
                  onChange={() =>
                    setFormData((prev: any) => ({ ...prev, isActive: false }))
                  }
                  className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
                />
                <label
                  htmlFor="DeActivated"
                  className="text-sm font-medium text-DARK-700 dark:text-DARK-100"
                >
                  DeActivated
                </label>
              </div>
              {/* Buttons - Right Aligned */}
              <div className="flex justify-end gap-4">
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
      <Permissions
        openPermission={openPermission}
        setOpenPermission={setOpenPermission}
        selectedPermissions={selectedPermissions}
        setSelectedPermissions={setSelectedPermissions}
        setStaffData={setFormData}
        userData={userData}
        setUserData={setUserData}
        id={id}
      />
    </>
  );
}

export default StaffForm;
