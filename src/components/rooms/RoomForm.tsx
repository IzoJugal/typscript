
import { useCallback, useEffect, useRef, useState } from "react";
import { HiChevronDown, HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { useAuth } from "../../context/AuthProvider";
import { CompanyField, RestaurantField } from "../../utils/functions";
import { Button, Label, Modal } from "flowbite-react";
import { MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { AiOutlineLoading } from "react-icons/ai";
import RoomFormLoader from "../../utils/common/RoomFormLoader";
import CommonInput from "../../utils/common/CommonInput";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface IRoom {
  _id: string;
  name: string;
  size: string;
  amenities: string[];
  company: string;
  restaurant: string;
}

const Amenities = [
  "Projector",
  "Whiteboard",
  "Video Conferencing",
  "Air Conditioning",
  "Balcony",
  "Free Wi-Fi",
];

const RoomForm = ({ openModal, roomId, setRoomId, setOpenModal, setRoomData, isLoading, setIsLoading }: { openModal: boolean, roomId: string, setRoomId: React.Dispatch<React.SetStateAction<string>>, setOpenModal: React.Dispatch<React.SetStateAction<boolean>>; setRoomData: any, isLoading: boolean, setIsLoading: React.Dispatch<React.SetStateAction<any>> }) => {

  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const companyID =
    loginRole !== SUPER_ADMIN
      ? `${userData?.staffMember?.company?._id || ""}`
      : "";

  const restaurantID =
    ![SUPER_ADMIN, ...OWNER_ROLES].includes(loginRole)
      ? `${userData?.staffMember?.restaurant?._id || ""}`
      : "";

  const [formData, setFormData] = useState<IRoom>({
    _id: '',
    name: '',
    company: companyID,
    restaurant: restaurantID,
    size: '',
    amenities: [],
  });
  const [amenities,] = useState(Amenities);
  const [errors, setErrors] = useState<any>({});
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const { isButtonLoading, setIsButtonLoading } = useLoading();
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === "company") {
      setFormData((prev) => ({
        ...prev,
        company: value,
        restaurant: "",
      }));

      setRestaurant([]);

      setErrors((prev: any) => ({
        ...prev,
        company: "",
      }));

      if (value) {
        getRestaurant(value);
      }

      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear the error for the field being changed
    if (errors[name as keyof any]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleModifierToggle = (modifier: string) => {
    setFormData(prev => {
      const existingModifierIndex = prev.amenities.indexOf(modifier);
      if (existingModifierIndex > -1) {
        return {
          ...prev,
          amenities: prev.amenities.filter(m => m !== modifier),
        };
      } else {
        return {
          ...prev,
          amenities: [...prev.amenities, modifier],
        };
      }
    });
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const sizerRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<any> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement> | null = null;

    if (!formData.name) {
      errorMsg.name = "Please enter name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      };
      isValid = false;
    }

    if (!formData.size) {
      errorMsg.size = "Please enter size.";
      if (!firstErrorRef) {
        firstErrorRef = sizerRef;
      };
      isValid = false;
    }
    const sizeValue = parseFloat(formData.size);

    if (sizeValue <= 5) {
      errorMsg.size = "Please enter a valid size. Set Minimum 5 sqft";

      if (!firstErrorRef) {
        firstErrorRef = sizerRef;
      }

      isValid = false;
    }

    if (loginRole === SUPER_ADMIN) {
      if (!formData?.company) {
        errorMsg.company = "Please select business.";
        if (!firstErrorRef) {
          firstErrorRef = companyRef;
        };
        isValid = false;
      }

    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      if (!formData?.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        if (!firstErrorRef) {
          firstErrorRef = restaurantRef;
        };
        isValid = false;
      }
    }

    setErrors((prev: any) => ({ ...prev, ...errorMsg }));
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    return isValid;
  };

  const getRoom = useCallback(async () => {
    try {
      setDataLoading(true);

      const response = await apiClient.get(`/table/room/${roomId}`);
      const room = response.data?.room;

      setFormData((prev) => ({
        ...prev,
        ...room,
      }));

      // fetch restaurants for selected company
      if (room?.company) {
        await getRestaurant(room.company);
      }

      setTimeout(() => {
        setDataLoading(false);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setDataLoading(false);
        setIsButtonLoading(false);
      }, 500);

      console.error("~ getRoom error :-", error);
    }
  }, [roomId]);

  useEffect(() => {
    if (!openModal) return;

    if (roomId) {
      getRoom();
    }

    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }

    if (loginRole !== SUPER_ADMIN && companyID) {
      getRestaurant(companyID);
    }
  }, [openModal, roomId, loginRole]);

  useEffect(() => {
    if (
      companies.length === 1 &&
      loginRole === SUPER_ADMIN
    ) {
      const selectedCompany = companies[0];

      setFormData((prev) => ({
        ...prev,
        company: selectedCompany._id,
      }));

      setErrors((prev: any) => ({
        ...prev,
        company: "",
      }));
    }
  }, [companies]);

  useEffect(() => {
    if (
      restaurant.length === 1 &&
      !formData.restaurant
    ) {
      const selectedRestaurant = restaurant[0];
      setFormData((prev) => ({
        ...prev,
        restaurant: selectedRestaurant._id,
      }));

      setErrors((prev: any) => ({
        ...prev,
        restaurant: "",
      }));
    }
  }, [restaurant, openModal]);

  // useEffect(() => {
  //   if (!openModal) return;

  //   if (formData.company) {
  //     getRestaurant(formData.company);
  //   }
  // }, [openModal, formData.company]);

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
        setRestaurant(response.data.restaurant)
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid()) {
      try {
        let response;
        if (loginRole !== SUPER_ADMIN) {
          formData.company = `${userData?.staffMember?.company?._id}`
        } else if (!OWNER_ROLES.includes(loginRole)) {
          formData.restaurant = `${userData?.staffMember?.restaurant?._id}`
        }
        if (roomId) {
          setIsButtonLoading(true)
          response = await apiClient.patch(`/table/room/${roomId}`, formData);
          toast.success(response?.data?.message || 'Room updated successfully!');
        } else {
          setIsButtonLoading(true)
          response = await apiClient.post('/table/room/add', formData);
          if (response?.data?.success) {
            toast.success('Room added successfully!');
          } else {
            toast.error(response?.data?.message || 'There was an issue adding the room.');
            return;
          }
        }
        if (response?.data?.success === true) {
          setOpenModal(false)
          setTimeout(() => {
            setFormData({
              _id: '',
              name: '',
              size: '',
              amenities: [],
              company: '',
              restaurant: '',
            })
            setRoomId("")
            setIsLoading(false)
            setRoomData(response.data)
            setIsButtonLoading(false);
            if (loginRole === SUPER_ADMIN) setRestaurant([]);
          }, 500);
        }
      } catch (error: any) {
        setIsButtonLoading(false)
        console.log('Error during form submission:', error);
        toast.error(error?.response?.data?.message);
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleModalClose = () => {
    setFormData({
      _id: '',
      name: '',
      company: companyID,
      restaurant: restaurantID,
      size: '',
      amenities: [],
    })
    setRoomId("")
    setOpenModal(false)
    setErrors({});
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }
  }

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAmenitiesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Modal show={openModal} onClose={() => { handleModalClose() }} className="backdrop-blur-sm 5dark:bg-DARK-950">
      <Modal.Header className="dark:bg-DARK-800">
        <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
          {dataLoading ? (
            <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
          ) : (
            formData._id ? "Update Room" : "Add Room"
          )}
        </span>
      </Modal.Header>


      <Modal.Body className="max-h-80 overflow-visible dark:bg-DARK-800 relative min-h-[350px]">
        {dataLoading ? <RoomFormLoader count={1} /> : (
          <form className="space-y-4">
            <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
              {loginRole === SUPER_ADMIN && (
                <div className="flex flex-col mb-2" ref={companyRef}>
                  <CompanyField
                    companies={companies}
                    selectedCompanyId={formData?.company}
                    handleChange={handleChange}
                    error={errors.company}
                  />
                </div>
              )}
              {(loginRole === SUPER_ADMIN ||
                OWNER_ROLES.includes(loginRole) ||
                MANAGER_ROLES.includes(loginRole)) && (
                  <div className="flex flex-col mb-2" ref={restaurantRef}>
                    <RestaurantField
                      restaurants={restaurant}
                      selectedRestaurantId={formData?.restaurant}
                      handleChange={handleChange}
                      error={errors.restaurant}
                    />
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" value="Name" />
                <span className="text-ERROR_HOVER">*</span>
                <CommonInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Name"
                  ref={nameRef}
                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
                {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="size" value="Size (sqft)" /><span className='text-red-500'>*</span>
                <NumberInputPOS
                  id="size"
                  name="size"
                  allowDecimal={true}
                  maxDecimalPlaces={2}
                  value={formData.size || ""}
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
                  placeholder="Enter Size (sqft)"
                  inputRef={sizerRef}
                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {errors.size && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.size}</p>}
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <label
                htmlFor="amenities"
                className="block text-sm font-medium dark:text-DARK-100 text-DARK-700 mb-1"
              >
                Amenities
              </label>

              <div
                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 border dark:border-none border-DARK-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
                onClick={() => setIsAmenitiesOpen(!isAmenitiesOpen)}
              >
                <div className="flex flex-wrap gap-1">
                  {formData.amenities.map((modifier) => (
                    <span
                      key={modifier}
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded"
                    >
                      {modifier}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModifierToggle(modifier);
                        }}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <HiX size={12} />
                      </button>
                    </span>
                  ))}
                  {formData.amenities.length === 0 && (
                    <span className="text-DARK-500 font-medium text-[14px] bg-slate-50">Select amenities</span>
                  )}
                </div>
                <HiChevronDown size={20} className="text-DARK-500" />
              </div>

              {isAmenitiesOpen && (
                <div className="absolute z-50 w-full bg-white dark:bg-DARK-700 border border-gray-200 dark:border-DARK-600 rounded-xl shadow-xl mt-2 overflow-hidden">
                  <div className="sticky top-0 bg-white dark:bg-DARK-700 border-b border-gray-100 dark:border-DARK-600 p-2 z-10">
                    <input
                      type="text"
                      placeholder="Search amenities..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="h-9 w-full px-3 text-sm border border-gray-300 dark:border-DARK-500 bg-gray-50 dark:bg-DARK-800 text-gray-900 dark:text-DARK-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 transition-all"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-DARK-600/50">
                    <div
                      className={`flex items-center px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${formData.amenities.length === amenities.length
                        ? "bg-BRAND-500/10 text-BRAND-600 dark:text-BRAND-400"
                        : "text-gray-700 dark:text-DARK-200 hover:bg-gray-50 dark:hover:bg-DARK-600"
                        }`}
                      onClick={() => {
                        if (formData.amenities.length === amenities.length) {
                          setFormData({ ...formData, amenities: [] });
                        } else {
                          setFormData({ ...formData, amenities });
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.length === amenities.length}
                        readOnly
                        className="h-4 w-4 rounded border-gray-300 dark:border-DARK-500 text-BRAND-500 focus:ring-0 mr-3 pointer-events-none transition-colors"
                      />
                      <span>Select All Amenities</span>
                    </div>

                    {amenities
                      ?.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
                      ?.map((option) => {
                        const isChecked = formData.amenities.includes(option);
                        return (
                          <div
                            key={option}
                            className={`flex items-center px-4 py-2.5 text-sm cursor-pointer transition-colors ${isChecked
                              ? "bg-BRAND-500/10 text-BRAND-600 dark:text-BRAND-400 font-medium"
                              : "text-gray-600 dark:text-DARK-300 hover:bg-gray-50 dark:hover:bg-DARK-600"
                              }`}
                            onClick={() => handleModifierToggle(option)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="h-4 w-4 rounded border-gray-300 dark:border-DARK-500 text-BRAND-500 focus:ring-0 mr-3 pointer-events-none transition-colors"
                            />
                            <span className="truncate">{option}</span>
                          </div>
                        );
                      })}

                    {amenities?.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-DARK-400">
                        No amenities found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </Modal.Body>

      <Modal.Footer className="justify-end dark:bg-DARK-800">
        <Button
          type="button"
          onClick={() => handleModalClose()}
          disabled={!!isButtonLoading}
          className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!!isButtonLoading}
          isProcessing={isButtonLoading}
          onClick={(e: any) => {
            e.preventDefault();
            if (!isLoading && !isButtonLoading) handleSubmit(e);
          }}
          processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
          className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        >
          <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
          {isButtonLoading && (
            <span className="absolute inset-0 !bg-BRAND-600 opacity-20 animate-pulse"></span>
          )}
        </Button>
      </Modal.Footer>
    </Modal>

  );
};

export default RoomForm;
