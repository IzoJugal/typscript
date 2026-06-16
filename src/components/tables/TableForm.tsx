import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { useAuth } from "../../context/AuthProvider";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { setTitle } from "../../utils/utility";
import FormLoader from "../../utils/common/FormLoader";
import CommonInput from "../../utils/common/CommonInput";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface IRoom {
  _id: string;
  name: string;
  description: string;
}

interface ITable {
  _id: string;
  name: string;
  company: string;
  restaurant: string;
  room: string;
  number: number | string;
  shape: 'circle' | 'square' | 'rectangle' | 'oval';
  initialX: number | string;
  initialY: number | string;
  capacity: number | string;
  isFree: boolean;
  size: number | string;
}

interface ErrorState {
  name?: string;
  room?: string;
  company: string;
  restaurant: string;
  number?: string;
  capacity?: string;
  initialX: string;
  initialY: string;
  size: string;
}

const TableForm = () => {
  setTitle("Tables Form");
  const { userData } = useAuth();
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
  const [formData, setFormData] = useState<ITable>({
    _id: '',
    name: '',
    room: '',
    number: '',
    company: companyID,
    restaurant: restaurantID,
    capacity: '',
    isFree: true,
    shape: "square",
    initialX: '',
    initialY: '',
    size: '',
  });
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [errors, setErrors] = useState<ErrorState | any>({});
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);

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
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }, []);

const getRoom = async (companyId?: string, restaurantId?: string) => {
  console.log("getRoom called", companyId, restaurantId);

  try {
    const param = createQueryParams({
      company: companyId,
      restaurant: restaurantId,
    });

    const response = await apiClient.get(`/table/room${param}`);
    setRooms(response.data?.rooms || []);
  } catch (error) {
    console.error(error);
  }
};

  // useEffect(() => {
  //   if (formData?.company) {
  //     getRestaurant(formData?.company);
  //   } else if (formData?.company === "") {
  //     setRestaurant([]);
  //     setRooms([]);
  //   }

  //   if (OWNER_ROLES.includes(loginRole) && formData?.restaurant) {
  //     getRoom(formData?.company, formData?.restaurant);
  //   } else if (!OWNER_ROLES.includes(loginRole)) {
  //     getRoom();
  //   }
  // }, [formData?.company, getRestaurant, formData?.restaurant, loginRole]);

  const integerFields = ["capacity", "number"];
  const decimalFields = ["size", "initialX", "initialY"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Integer fields
    if (integerFields.includes(name)) {
      // allow only whole digits
      if (!/^\d*$/.test(value)) return;
      // Remove leading zeros
      const numValue = value === '' ? '' : String(Number(value));
      setFormData(prev => ({
        ...prev,
        [name]: numValue === "" ? "" : Number(numValue),
      }));
      // Clear error only if value is valid (not 0, not empty)
      if (numValue && Number(numValue) > 0) {
        setErrors((prev: any) => ({
          ...prev,
          [name]: "",
        }));
      }
      return;
    }

    // Decimal fields
    if (decimalFields.includes(name)) {
      // allow digits and a single decimal point
      if (!/^\d*\.?\d*$/.test(value)) return;
      // Remove leading zeros before decimal point
      const numValue = value === '' || value === '.' ? '' : value.replace(/^0+(?=\d)/, '').replace(/^0\.(\d)/, '0.$1');
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }));
      // Clear error only if value is valid (not 0, not empty)
      if (numValue && Number(numValue) > 0) {
        setErrors((prev: any) => ({
          ...prev,
          [name]: "",
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setErrors((prev: any) => ({
      ...prev,
      [name]: "",
    }));
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const capacityRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement> | null = null;

    if (!formData.name) {
      errorMsg.name = "Please enter a name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      };
      isValid = false;
    }

    if (!formData.capacity || Number(formData.capacity) <= 0) {
      errorMsg.capacity = "Capacity must be greater than 0.";
      if (!firstErrorRef) {
        firstErrorRef = capacityRef;
      };
      isValid = false;
    }

    if (!formData.number || Number(formData.number) <= 0) {
      errorMsg.number = "Number must be greater than 0.";
      if (!firstErrorRef) {
        firstErrorRef = numberRef;
      };
      isValid = false;
    }

    if (formData.initialX && Number(formData.initialX) < 0) {
      errorMsg.initialX = "Initial X cannot be negative.";
      if (!firstErrorRef) firstErrorRef = null; // optional: no ref yet
      isValid = false;
    }

    if (formData.initialY && Number(formData.initialY) < 0) {
      errorMsg.initialY = "Initial Y cannot be negative.";
      if (!firstErrorRef) firstErrorRef = null;
      isValid = false;
    }

    if (formData.size && Number(formData.size) <= 0) {
      errorMsg.size = "Size must be greater than 0.";
      if (!firstErrorRef) firstErrorRef = null;
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
    if (OWNER_ROLES.includes(loginRole)) {
      if (!formData.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        if (!firstErrorRef) {
          firstErrorRef = restaurantRef;
        };
        isValid = false;
      }
    }

    if (!formData.room) {
      errorMsg.room = "Please select a room.";
      if (!firstErrorRef) {
        firstErrorRef = roomRef;
      };
      isValid = false;
    }

    setErrors(errorMsg);
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return isValid;
  };

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }
  }, [loginRole]);

  const getTable = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/table/${id}`);
      const table = response.data?.table;
      if (table) {
        setFormData({
          ...table,
          room: table.room || '',
        });
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      console.error("Error fetching table:", error);
    }
  }, [id, setIsLoading]);

  useEffect(() => {
    if (id) {
      getTable();
    }
  }, [id, getTable]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid()) {
      try {
        let response;
        if (loginRole !== SUPER_ADMIN) {
          formData.company = `${userData?.staffMember?.company?._id}`;
        } else if (!OWNER_ROLES.includes(loginRole)) {
          formData.restaurant = `${userData?.staffMember?.restaurant?._id}`;
        }
        if (id) {
          setIsButtonLoading(true);
          response = await apiClient.patch(`/table/${id}`, formData);
          toast.success(response.data?.message || 'Table updated successfully!');
        } else {
          setIsButtonLoading(true);
          response = await apiClient.post('/table/add', formData);
          if (response.status === 201) {
            toast.success('Table added successfully!');
          }
        }
        navigate(-1);
        setFormData({
          _id: '',
          name: '',
          room: '',
          number: '',
          company: "",
          restaurant: "",
          capacity: '',
          isFree: false,
          shape: "square",
          initialX: '',
          initialY: '',
          size: '',
        });
        setErrors({});
        setIsButtonLoading(false);
      } catch (error: any) {
        setIsButtonLoading(false);
        console.log("Error during form submission:", error);
        toast.error(error.response?.data?.message || 'An error occurred.');
      }
    }
  };

  const handleSetRoom = (id: any) => {
    setFormData((prev: any) => ({ ...prev, room: id }));
    setErrors((prev: any) => ({ ...prev, room: "" }));
  };

  const handleCompanyChange = (id: string) => {
    setFormData((prev: any) => ({ ...prev, company: id }));
    setErrors((prev: any) => ({ ...prev, company: "" }));
  };

  const handleRestaurantChange = (id: string) => {
    setFormData((prev: any) => ({ ...prev, restaurant: id }));
    setErrors((prev: any) => ({ ...prev, restaurant: "" }));
  };

  // Auto-select company if single
  useEffect(() => {
    if (companies?.length === 1) {
      setFormData((prev) => ({
        ...prev,
        company: companies[0]._id,
      }));
      setErrors((prev: any) => ({
        ...prev,
        company: "",
      }));
    }
  }, [companies]);

  // Auto-select restaurant if single
  useEffect(() => {
  if (
    restaurant.length === 1 &&
    formData.restaurant === ""
  ) {
    setFormData((prev) => ({
      ...prev,
      restaurant: restaurant[0]._id,
    }));
  }
}, [restaurant, formData.restaurant]);

  // Auto-select room if single
  useEffect(() => {
    if (rooms.length === 1) {
      setFormData((prev) => ({
        ...prev,
        room: rooms[0]._id,
      }));
      setErrors((prev: any) => ({
        ...prev,
        room: "",
      }));
    }
  }, [rooms]);

  // Replace the duplicate useEffects with this single improved one
 useEffect(() => {
  if (!formData.company) {
    setRestaurant([]);
    return;
  }

  getRestaurant(formData.company);
}, [formData.company, getRestaurant]);

useEffect(() => {
  if (OWNER_ROLES.includes(loginRole)) {
    if (!formData.company || !formData.restaurant) return;

    getRoom(formData.company, formData.restaurant);
  } else {
    getRoom();
  }
}, [formData.company, formData.restaurant, loginRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-DARK-50 via-white to-DARK-100 dark:from-DARK-950 dark:via-DARK-900 dark:to-DARK-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full bg-white dark:bg-DARK-900 rounded-3xl shadow-lg border border-DARK-200/50 dark:border-DARK-700/50 p-6 sm:p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <FormHeaderPaths
            page={id ? "Edit Table" : "Add Table"}
            prevLink="/table/1/"
            prevPage="Tables"
          />
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-BRAND-100 dark:bg-BRAND-900/20 rounded-2xl">
              <svg className="w-6 h-6 text-BRAND-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-DARK-800 dark:text-white tracking-tight">
              {id ? "Edit Table" : "Add New Table"}
            </h2>
          </div>
          <p className="text-sm text-DARK-600 dark:text-DARK-300 max-w-md mx-auto">
            Configure table details for seamless restaurant management.
          </p>
        </div>

        {isLoading && <FormLoader count={1} />}
        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <section className="bg-gradient-to-b from-DARK-100 to-white dark:to-DARK-950 dark:from-DARK-900 border border-DARK-200/50 dark:border-DARK-700/50 rounded-2xl p-6 space-y-6 shadow-md">
              <h3 className="text-xl font-bold text-DARK-800 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 bg-BRAND-500 rounded-full"></span>
                <span>Basic Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loginRole === SUPER_ADMIN && (
                  <div ref={companyRef}>
                    <label className="text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2 flex items-center space-x-1">
                      Company
                      <span className="text-ERROR_HOVER">*</span>
                    </label>
                    <CompanyField
                      companies={companies}
                      selectedCompanyId={formData?.company}
                      handleChange={(e: any) => {
                        handleCompanyChange(e?.target?.value || e);
                      }}
                      error={errors.company}
                      showTitle={false}
                      className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                    />
                  </div>
                )}

                {OWNER_ROLES.includes(loginRole) && (
                  <div ref={restaurantRef}>
                    <label className="text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2 flex items-center space-x-1">
                      Restaurant
                      <span className="text-ERROR_HOVER">*</span>
                    </label>
                    <RestaurantField
                      restaurants={restaurant}
                      selectedRestaurantId={formData?.restaurant}
                      handleChange={(e: any) => {
                        handleRestaurantChange(e?.target?.value || e);
                      }}
                      error={errors.restaurant}
                      showTitle={false}
                      className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2 flex items-center space-x-1">
                    Room
                    <span className="text-ERROR_HOVER">*</span>
                  </label>
                  <DropdownWithSearch
                    setSelectedItem={setFormData}
                    selectedItem={
                      rooms?.find((c: any) => c._id === formData?.room)?.name || ""
                    }
                    items={rooms}
                    title="Room"
                    handleFilter={handleSetRoom}
                    fieldKey="room"
                    className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  />
                  {errors.room && (
                    <p className="text-sm text-ERROR_HOVER mt-1">{errors.room}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2 flex items-center space-x-1">
                    Name
                    <span className="text-ERROR_HOVER">*</span>
                  </label>
                  <CommonInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter Table Name"
                    ref={nameRef}
                  // className="w-full text-sm px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  // style={{ padding: "11px 12px" }}
                  />
                  {errors.name && (
                    <p className="text-sm text-ERROR_HOVER mt-1">{errors.name}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Table Details Section */}
            <section className="bg-gradient-to-b from-DARK-100 to-white dark:to-DARK-950 dark:from-DARK-900 border border-DARK-200/50 dark:border-DARK-700/50 rounded-2xl p-6 space-y-6 shadow-md">
              <h3 className="text-xl font-bold text-DARK-800 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 bg-BRAND-500 rounded-full"></span>
                <span>Table Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2 flex items-center space-x-1">
                    Capacity
                    <span className="text-ERROR_HOVER">*</span>
                  </label>
                  <CommonInput
                    type="text"
                    inputMode="numeric"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (
                        ["-", ".", "e", "E", "+", "ArrowUp", "ArrowDown"].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter Capacity"
                    ref={capacityRef}
                    min={0}
                  // className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  />
                  {errors.capacity && (
                    <p className="text-sm text-ERROR_HOVER mt-1">{errors.capacity}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2 flex items-center space-x-1">
                    Number
                    <span className="text-ERROR_HOVER">*</span>
                  </label>
                  <NumberInputPOS
                    id="number"
                    name="number"
                    allowDecimal={false}
                    value={formData.number}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        number: value,
                      }));

                      if (errors.number) {
                        setErrors((prev: any) => ({
                          ...prev,
                          number: "",
                        }));
                      }
                    }}
                    placeholder="Enter Table Number"
                    inputRef={numberRef}
                  // className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  />
                  {errors.number && (
                    <p className="text-sm text-ERROR_HOVER mt-1">{errors.number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2">
                    Shape
                  </label>
                  <select
                    name="shape"
                    id="shape"
                    value={formData.shape}
                    onChange={handleChange}
                    className={`w-full -min-w-60 placeholder:text-BRAND-400 bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 border-2 border-DARK-300 dark:border-none focus:outline-none focus:ring-0 placeholder-DARK-400 dark:placeholder-DARK-300`}
                  // className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  >
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                    <option value="rectangle">Rectangle</option>
                    <option value="oval">Oval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2">
                    Size
                  </label>
                  <NumberInputPOS
                    id="size"
                    name="size"
                    value={formData.size}
                    allowDecimal={true}
                    maxDecimalPlaces={2}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        size: value,
                      }));

                      if (errors.size) {
                        setErrors((prev: any) => ({
                          ...prev,
                          size: "",
                        }));
                      }
                    }}
                    placeholder="Enter Size"
                  // className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  />
                  {errors.size && <p className="text-sm text-ERROR_HOVER mt-1">{errors.size}</p>}
                </div>
              </div>
            </section>

            {/* Position Settings Section */}
            <section className="bg-gradient-to-b from-DARK-100 to-white dark:bg-DARK-950 dark:from-DARK-900 border border-DARK-200/50 dark:border-DARK-700/50 rounded-2xl p-6 space-y-6 shadow-md">
              <h3 className="text-xl font-bold text-DARK-800 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 bg-BRAND-500 rounded-full"></span>
                <span>Position Settings</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2">
                    Initial X
                  </label>
                  <NumberInputPOS
                    allowDecimal={true}
                    maxDecimalPlaces={4}
                    id="initialX"
                    name="initialX"
                    value={formData.initialX}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        initialX: value,
                      }));

                      if (errors.initialX) {
                        setErrors((prev: any) => ({
                          ...prev,
                          initialX: "",
                        }));
                      }
                    }}
                    placeholder="Enter Initial X"
                  // className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  />
                  {errors.initialX && <p className="text-sm text-ERROR_HOVER mt-1">{errors.initialX}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-DARK-700 dark:text-DARK-200 mb-2">
                    Initial Y
                  </label>
                  <NumberInputPOS
                    allowDecimal={true}
                    maxDecimalPlaces={4}
                    id="initialY"
                    name="initialY"
                    value={formData.initialY}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        initialY: value,
                      }));

                      if (errors.initialY) {
                        setErrors((prev: any) => ({
                          ...prev,
                          initialY: "",
                        }));
                      }
                    }}
                    placeholder="Enter Initial Y"
                    // className="w-full px-4 py-3 bg-white dark:bg-DARK-800 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:!ring-0 dark:text-white transition-all duration-300"
                  />
                  {errors.initialY && <p className="text-sm text-ERROR_HOVER mt-1">{errors.initialY}</p>}
                </div>
              </div>
            </section>

            {/* Table Status Section */}
            <section className="bg-gradient-to-b from-DARK-100 to-white dark:bg-DARK-950 dark:from-DARK-900 border border-DARK-200/50 dark:border-DARK-700/50 rounded-2xl p-6 space-y-6 shadow-md">
              <h3 className="text-xl font-bold text-DARK-800 dark:text-white flex items-center space-x-2">
                <span className="w-2 h-2 bg-BRAND-500 rounded-full"></span>
                <span>Table Status</span>
              </h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    id="isFreeYes"
                    name="isFree"
                    value="true"
                    checked={formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true }))}
                    className="h-4 w-4 text-BRAND-500 focus:!ring-0 border-DARK-300 dark:border-DARK-600"
                  />
                  <span className="text-sm text-DARK-700 dark:text-DARK-200 cursor-pointer">Free</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    id="isFreeNo"
                    name="isFree"
                    value="false"
                    checked={!formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                    className="h-4 w-4 text-BRAND-500 focus:!ring-0 border-DARK-300 dark:border-DARK-600"
                  />
                  <span className="text-sm text-DARK-700 dark:text-DARK-200 cursor-pointer">Booked</span>
                </label>
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isButtonLoading}
                className="px-6 py-2.5 bg-DARK-200 dark:bg-DARK-700 text-DARK-700 dark:text-DARK-200 rounded-lg font-medium hover:bg-DARK-300 dark:hover:bg-DARK-600 focus:!ring-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isButtonLoading}
                className="px-6 py-2.5 bg-BRAND-500 text-white rounded-lg font-medium hover:bg-BRAND-600 focus:!ring-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                {isButtonLoading && (
                  <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TableForm;