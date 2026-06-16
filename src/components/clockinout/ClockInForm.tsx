/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Label, Modal, } from "flowbite-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { useLoading } from "../../context/LoadingContext";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { AiOutlineLoading } from "react-icons/ai";

interface ClockInForm {
  server: string;
  company: string;
  restaurant: string;
}

interface Staff {
  _id: string;
  name: string;
  position: string;
  age: number;
  email: string;
  phone: string;
  salary: number;
  passcode: string;
  hireDate: Date;
  isActive: boolean;
}

interface Company {
  _id: string;
  name: string;
}

interface Restaurant {
  _id: string;
  name: string;
}

interface ClockInProps {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  setClockData: React.Dispatch<any>;
}

const ClockIn: React.FC<ClockInProps> = ({
  openModal,
  setOpenModal,
  setClockData,
}) => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const companyID = userData?.staffMember?.company?._id;
  const userRole = !(
    userData?.staffMember?.role?.name === SUPER_ADMIN ||
    userData?.staffMember?.role?.name === "Owner/Admin" ||
    userData?.staffMember?.role?.name === "Owner" ||
    userData?.staffMember?.role?.name === "Manager"
  );
  const { isButtonLoading, setIsButtonLoading } = useLoading();

  const [clockInForm, setClockInForm] = useState<ClockInForm>({
    server: userRole ? userData?.staffMember?._id : "",
    company: userRole ? companyID : "",
    restaurant: userRole ? userData?.staffMember?.restaurant?._id : "",
  });

  const [staffDetail, setStaffDetail] = useState<Staff[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ClockInForm, string>>>({});

  const getCompany = async () => {
    try {
      const response = await apiClient.get(`/business`);
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const getRestaurant = async (companyId: string) => {
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  const getStaff = useCallback(async (company: string, restaurant?: string) => {
    try {
      const queryParam = createQueryParams({ company: company, restaurant: restaurant })
      const response = await apiClient.get(`/staff/web/all${queryParam}`);
      setStaffDetail(response.data.data || []);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setStaffDetail([]);
    }
  }, []);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }
    if (MANAGER_ROLES.includes(loginRole)) {
      getRestaurant(companyID)
    }
  }, [loginRole]);

  useEffect(() => {
    // if (clockInForm?.company) {
    //   getStaff(clockInForm?.company);
    // }
    if (clockInForm?.restaurant) {
      getStaff(companyID || clockInForm?.company, clockInForm?.restaurant);
    }
  }, [getStaff, loginRole, clockInForm?.restaurant, companyID]);

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<Record<keyof ClockInForm, string>> = {};

    if (!clockInForm.server) {
      errorMsg.server = "Please select a staff member.";
      isValid = false;
    }
    if (loginRole === SUPER_ADMIN) {
      if (!clockInForm.company) {
        errorMsg.company = "Please select a business.";
        isValid = false;
      }

    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      if (!clockInForm.restaurant) {
        errorMsg.restaurant = "Please select a restaurant.";
        isValid = false;
      }
    }

    setErrors(errorMsg);
    return isValid;
  };

  const handleChange = (e: any) => {
    const { value, name } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));
    if (name === "company") {
      if (value === "") {
        setRestaurant([]);
        setStaffDetail([]);
        setClockInForm({
          server: "",
          company: "",
          restaurant: "",
        });
      } else {
        setRestaurant([]);
        setStaffDetail([]);
        getRestaurant(value);
        setClockInForm((prev) => ({
          ...prev,
          [name]: value,
          restaurant: "",
          server: "",
        }));
      }
    } else if (name === "restaurant") {
      setStaffDetail([]);
      setClockInForm((prev) => ({
        ...prev,
        [name]: value,
        server: "",
      }));
    } else {
      setClockInForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValid()) {
      setIsButtonLoading(true);
      const payload = {
        server: clockInForm.server,
        company: clockInForm.company,
        restaurant: clockInForm.restaurant,
      };

      try {

        const response = await apiClient.post(`/clock/in`, payload);
        if (response.data.success) {
          toast.success(response.data.message || "Clock In successful!");
          setClockData(response.data);
          handleModalClose();
        } else {
          toast.error(response.data.message || "Clock In failed!");
        }
        setIsButtonLoading(false);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "An error occurred.");
        setIsButtonLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setClockInForm({
      server: "",
      company: "",
      restaurant: "",
    });
    setErrors({});
    setOpenModal(false);
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }
    setStaffDetail([]);
  };

  const handleSetStaff = (id: any) => {
    setClockInForm((pre: any) => ({ ...pre, server: id }))
    setErrors(prev => ({ ...prev, server: "" }));
  }

  // Company auto selection
  useEffect(() => {
    if (companies.length === 1 && loginRole === SUPER_ADMIN) {
      const selectedCompany = companies[0];

      setClockInForm((prev) => ({
        ...prev,
        company: selectedCompany._id,
      }));

      getRestaurant(selectedCompany._id);

      setErrors((prev) => ({
        ...prev,
        company: "",
      }));
    }
  }, [companies]);

  // Restaurant auto selection
  useEffect(() => {
    if (restaurant.length === 1) {
      const selectedRestaurant = restaurant[0];

      setClockInForm((prev) => ({
        ...prev,
        restaurant: selectedRestaurant._id,
      }));

      setErrors((prev) => ({
        ...prev,
        restaurant: "",
      }));
    }
  }, [restaurant]);

  // Staff auto selection
  useEffect(() => {
    if (staffDetail.length === 1) {
      const selectedStaff = staffDetail[0];

      setClockInForm((prev) => ({
        ...prev,
        server: selectedStaff._id,
      }));

      setErrors((prev) => ({
        ...prev,
        server: "",
      }));
    }
  }, [staffDetail]);

  return (
    <Modal show={openModal} onClose={handleModalClose} className="backdrop-blur-sm dark:bg-DARK-950" size="xl">
      <Modal.Header className="dark:bg-DARK-800">Clock In Form</Modal.Header>
      <Modal.Body className="dark:bg-DARK-800 max-h-[90vh] overflow-y-auto p-6">
        <form id="clockInForm" className="space-y-6" onSubmit={handleSubmit}>
          <div className={`grid  ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
            {loginRole === SUPER_ADMIN && (
              <div className="flex flex-col">
                <CompanyField
                  companies={companies}
                  selectedCompanyId={clockInForm?.company}
                  handleChange={handleChange}
                  error={errors.company}
                />
              </div>
            )}
            {(MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) && (
              <div className="flex flex-col">
                <RestaurantField
                  restaurants={restaurant}
                  selectedRestaurantId={clockInForm?.restaurant}
                  handleChange={handleChange}
                  error={errors.restaurant}
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="server" value="Select Staff" /><span className="text-red-500">*</span>
            <DropdownWithSearch
              setSelectedItem={setClockInForm}
              selectedItem={staffDetail?.find((c: any) => c._id === clockInForm.server)?.name || ''}
              items={staffDetail}
              title="Staff"
              handleFilter={handleSetStaff}
              fieldKey="server"
            />
            {errors?.server && <p className="text-ERROR">{errors.server}</p>}
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className="justify-end dark:bg-DARK-800 ">
        <Button
          type="button"
          onClick={() => handleModalClose()}
          disabled={isButtonLoading}
          className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="clockInForm"
          disabled={isButtonLoading}
          isProcessing={isButtonLoading}
          processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
          className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        >
          <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
          {isButtonLoading && (
            <span className="absolute inset-0 !bg-BRAND-600 opacity-20 animate-pulse"></span>
          )}
        </Button>
      </Modal.Footer>
    </Modal >
  );
};

export default ClockIn;