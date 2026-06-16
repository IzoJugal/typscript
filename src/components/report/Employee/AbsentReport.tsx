import { Button, Modal } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IAbsentReport {
  _id: string;
  employee: string;
  fromDate: string;
  toDate: string;
  reportoption: string;
  company?: string;
  restaurant?: string;
}

interface IStaff {
  _id: string;
  name: string;
  position: string;
  age: number;
  email: string;
  phone: string;
  salary: number;
  passcode: string;
  hireDate: Date;
  isActive: boolean
}

interface ErrorState {
  employee?: string;
  fromDate?: string;
  toDate?: string;
  reportoption?: string;
  dateRange?: string;
}

const AbsentReport = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [formData, setFormData] = useState<IAbsentReport>({
    _id: '',
    employee: "",
    fromDate: "",
    toDate: "",
    reportoption: "",
    company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
    restaurant: ""
  });
  const [staffDetail, setStaffDetail] = useState<IStaff[] | []>();
  const [errors, setErrors] = useState<ErrorState>({});
  const [openModal, setOpenModal] = useState(false);
  const [url, setUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const [btnLoader, setBtnLoader] = useState("");
  const [selectedRange, setSelectedRange] = useState({
    startDate: null,
    endDate: null
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);

  const getCompany = useCallback(async () => {
    try {
      try {
        const response = await apiClient.get(`/business`)
        setTimeout(() => {
          setCompanyDetails(response.data.companies)
        }, 500);
      } catch (error) {
        setCompanyDetails([])
        console.error('~ getCompany error :-', error);
      }
    } catch (error) {
      console.error('~ getCompany error :-', error);
    }
  }, []);

  const getRestaurant = async (companyId: string) => {
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);

      if (response.data.success) {
        const restaurants = response.data.restaurant || [];

        setRestaurantDetails(restaurants);

        if (restaurants.length === 1) {
          const restaurantId = restaurants[0]._id;

          setFormData((prev) => ({
            ...prev,
            restaurant: restaurantId,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            restaurant: "",
            employee: "",
          }));
        }
      }
    } catch (error: any) {
      console.log("error", error.message);
    } 
  };

  const getStaff = useCallback(async () => {
    try {
      const params = Object.fromEntries(
        Object.entries({
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get('/staff/web/all', { params: params })
      setTimeout(() => {
        setStaffDetail(response.data.data)
      }, 500);
    } catch (error) {
      setStaffDetail([])
      console.error('~ getProduct error :-', error);
    }
  }, [formData.company, formData?.restaurant]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }

    if (MANAGER_ROLES.includes(loginRole)) {
      getRestaurant(userData?.staffMember?.company?._id);
    }
  }, [loginRole]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN && formData.company) {
      getRestaurant(formData.company);
    }
  }, [loginRole, formData.company]);

   useEffect(() => {
     if (loginRole !== SUPER_ADMIN && !MANAGER_ROLES.includes(loginRole)) {
       getStaff();
       return;
     }

     if (formData.company && formData.restaurant) {
       getStaff();
     }
   }, [formData.company, formData.restaurant, loginRole, getStaff]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //   const { name, value, type } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
  //   }));

  //   // Clear the error for the field being changed
  //   if (errors[name as keyof ErrorState]) {
  //     setErrors(prev => ({ ...prev, [name]: "" }));
  //   }

  //   if (name === 'company') {
  //     setStaffDetail([]);
  //   }
  // };

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    setSelectedRange(value);
    // setFormData((prev:any) => ({ ...prev, fromDate: value?.startDate, toDate: value?.endDate }));
    const fromDate = value.startDate ? value.startDate.toISOString() : '';
    const toDate = value.endDate ? value.endDate.toISOString() : '';

    setFormData((prev: IAbsentReport) => ({
      ...prev,
      fromDate,
      toDate
    }));

    if (errors.dateRange) {
      setErrors((prev) => ({ ...prev, dateRange: "" }));
    }
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    if (!formData.fromDate) {
      errorMsg.fromDate = "Please select a from date.";
      isValid = false;
    }

    if (!formData.toDate) {
      errorMsg.toDate = "Please select a to date.";
      isValid = false;
    }

    if (!formData.fromDate || !formData.toDate) {
      errorMsg.dateRange = "Please select a date range.";
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    return isValid;
  };

  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      const params = Object.fromEntries(
        Object.entries({
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          reportoption: formData.reportoption,
          employee: formData.employee,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get('/clock/employee/absent/report', {
        responseType: 'blob',
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false) {
          setTimeout(() => {
            toast.error(jsonData.message || "No data available to preview");
            setBtnLoader("")
          }, 500);
          return;
        }
      } else if (response.status === 200) {
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        setUrl(url);
        setOpenModal(true);

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          setBtnLoader("")
        }, 100);

        // console.log("Report preview opened successfully");
      } else {
        throw new Error("Failed to retrieve report.");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "absent data not found";
      console.log("Error retrieving report:", error);
      toast.error(errorMessage);
    }
  };

  const handlePrint = async () => {
    try {
      setBtnLoader("print")
      const params = Object.fromEntries(
        Object.entries({
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          employee: formData.employee,
          reportoption: formData.reportoption,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );

      const response = await apiClient.get(`/clock/employee/absent/report`, {
        responseType: "blob",
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false) {
          setTimeout(() => {
            toast.error(jsonData.message || "No data available to preview.");
            setBtnLoader("")
          }, 500);
          return;
        }
      } else if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;

        const filename = `absent_report.pdf`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setTimeout(() => {
          setBtnLoader("")
        }, 500);
        console.log("File downloaded successfully.");
      } else {
        throw new Error("Failed to retrieve report.");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "absent data  not found";
      console.error("Error downloading report:", errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSubmit = (type: string) => {
    if (isValid()) {
      if (type === "preview") {
        handlePreview()
      }
      if (type === "print") {
        handlePrint()
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      _id: "",
      fromDate: "",
      toDate: "",
      reportoption: "",
      company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
      employee: "",
      restaurant: ""
    })
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    setErrors({})
    setOpenModal(false)
    setSelectedRange({
      startDate: null,
      endDate: null
    })
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      setStaffDetail([]);
    }
  };

  const hasFilters =
  (!!formData.employee && staffDetail?.length! > 1) ||
  !!formData.fromDate ||
  !!formData.toDate ||
  !!formData.reportoption ||
  (!!formData.restaurant && restaurantDetails?.length! > 1) ||
  (loginRole === SUPER_ADMIN && !!formData.company);

  const handleBusiness = (value: string) => {
    setFormData(prev => ({
      ...prev,
      company: value,
      restaurant: "",
      employee: ''
    }));

    setStaffDetail([]);
  }

  const handleRestaurant = (value: string) => {
    setFormData(prev => ({
      ...prev,
      restaurant: value,
      employee: "",
    }));

    setStaffDetail([]);
  }

  const handleEmployee = (value: string) => {
    setFormData(prev => ({ ...prev, employee: value }));
  }

  return (
    <div>
      <FormHeaderPaths page={'Absent Report'} prevLink='#' prevPage='Employee' />
      <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Absent Report </h2>
        <form className="space-y-4">
          <hr className="border-t-2 border-DARK-800 dark:border-DARK-400 " />
          {/* <label className="font-semibold dark:text-white">Criteria</label> */}
          <div>
            {loginRole === SUPER_ADMIN && (
              <div>
                <label className="block font-medium dark:text-DARK-200">Business</label>
                <DropdownWithSearch
                  setSelectedItem={setFormData}
                  selectedItem={companyDetails?.find((c: any) => c._id === formData?.company)?.name || ''}
                  items={companyDetails}
                  title="Business"
                  setIsDropdownOpen={setIsDropdownOpen}
                  isDropdownOpen={isDropdownOpen}
                  handleFilter={handleBusiness}
                  fieldKey="company"
                />
              </div>)}
          </div>
          {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && (
            <div className="mt-3">
              <label className="block font-medium dark:text-DARK-200">Restaurant</label>
              <DropdownWithSearch
                setSelectedItem={setFormData}
                selectedItem={restaurantDetails?.find((c: any) => c._id === formData?.restaurant)?.name || ''}
                items={restaurantDetails}
                title="Restaurant"
                handleFilter={handleRestaurant}
                fieldKey="restaurant"
              />
            </div>)}
          {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && <div>
            <label className="block font-medium dark:text-DARK-200">Employee</label>
            <DropdownWithSearch
              setSelectedItem={setFormData}
              selectedItem={staffDetail?.find((c: any) => c._id === formData?.employee)?.name || ''}
              items={staffDetail}
              title="Employee"
              setIsDropdownOpen={setIsEmpDropdownOpen}
              isDropdownOpen={isEmpDropdownOpen}
              handleFilter={handleEmployee}
              fieldKey="employee"
            />
          </div>}
          <div>
            <label className="block text-sm font-medium text-DARK-700 mb-1 dark:text-DARK-200">Date Filter</label>
            <NewDateRangePicker
              value={selectedRange}
              onChange={handleDateRangeChange}
            />
            {errors.dateRange && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.dateRange}</p>}
          </div>
          {/* <hr className="border-t-2 border-DARK-800 dark:border-DARK-400 " />
          <label className="font-semibold dark:text-white">View Option</label>
          <div>
            <label htmlFor="reportoption" className="block text-sm font-medium text-DARK-700 mb-1 dark:text-DARK-200">Report Option</label>
            <select
              id="reportoption"
              name="reportoption"
              value={formData?.reportoption}
              onChange={handleChange}
              className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200  dark:border-none border bg-DARK-100 rounded-md"
            >
              <option value=''>Select Report Option</option>
              <option value="detail">Detail</option>
              <option value="summary">Summary</option>
            </select>
            {errors?.reportoption && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.reportoption}</p>}
          </div> */}
          <div>
            <div className="mb-4 flex items-center space-x-4">
              {/* <div className="flex space-x-4">
            <Button  className="flex gap-1 justify-center items-center">
                      <div className="flex justify-center items-center ">Email </div>
            </Button>
            </div> */}
              <div className="flex space-x-4">
                <Button className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600" onClick={() => { handleSubmit("preview") }}>
                  <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
                </Button>
              </div>
              <div className="flex space-x-4">
                <Button className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600" onClick={() => { handleSubmit("print") }}>
                  <div className="flex justify-center items-center ">{btnLoader === "print" ? "Loading..." : "Download"} </div>
                </Button>
              </div>
              {hasFilters && (
                <div className="flex space-x-4">
                  <Button color="failure" className="flex gap-1 justify-center items-center" onClick={handleCancel}>
                    <div className="flex justify-center items-center ">Clear </div>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header>Absent Report</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default AbsentReport;
