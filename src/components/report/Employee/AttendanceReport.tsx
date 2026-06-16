import { Button, Modal } from "flowbite-react";
import { useState, useCallback, useEffect } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";


interface IAttendanceReport {
  _id?: string;
  employee?: string;
  fromDate?: string;
  toDate?: string;
  company?: string;
  restaurant?: string;
}

// interface ErrorState {
//   employee?: string;
//   fromDate?: string;
//   toDate?: string;
// }

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
  isActive: boolean
}

const AttendanceReport = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [btnLoader, setBtnLoader] = useState("");
  const [formData, setFormData] = useState<IAttendanceReport>({
    _id: '',
    employee: "",
    fromDate: "",
    toDate: "",
    company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
    restaurant: "",
  });
  const [staffDetail, setStaffDetail] = useState<Staff[] | []>();
  // const [errors, setErrors] = useState<ErrorState>({});
  const [openModal, setOpenModal] = useState(false);
  const [url, setUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
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
        setRestaurantDetails(response.data.restaurant)
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }

  const getStaff = useCallback(async () => {
    try {
      try {
        const params = Object.fromEntries(
          Object.entries({
            company: formData.company,
            restaurant: formData.restaurant,
          }).filter(([, value]) => value)
        );
        const response = await apiClient.get('/staff/web/all', { params: params })
        setTimeout(() => {
          setStaffDetail(response.data.data)
        }, 500);
      } catch (error) {
        setStaffDetail([])
        console.error('~ getStaff error :-', error);
      }
    } catch (error) {
      console.error('~ getStaff error :-', error);
    }
  }, [formData.company, formData.restaurant]);

  // useEffect(() => {
  //   if (loginRole === SUPER_ADMIN) {
  //     getCompany()
  //   }
  //   if (loginRole !== SUPER_ADMIN && !MANAGER_ROLES.includes(loginRole)) {
  //     getStaff();
  //   }
  //   if (formData?.company && formData.restaurant) {
  //     getStaff();
  //   }
  //   if (MANAGER_ROLES.includes(loginRole)) {
  //     getRestaurant(userData?.staffMember?.company?._id)
  //   }
  // }, [getCompany, formData.company, getStaff, loginRole]);

  // useEffect(() => {
  //   getStaff();
  // }, [getStaff]);

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
  // };

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }

    if (MANAGER_ROLES.includes(loginRole)) {
      getRestaurant(userData?.staffMember?.company?._id);
    }

    if (!MANAGER_ROLES.includes(loginRole)) {
      getStaff();
    }

  }, [loginRole]);

  useEffect(() => {
    // Auto select single restaurant
    if (
      restaurantDetails?.length === 1 &&
      !formData.restaurant
    ) {
      setFormData((prev: any) => ({
        ...prev,
        restaurant: restaurantDetails[0]._id,
      }));
    }
  }, [restaurantDetails]);

  useEffect(() => {
    // Load employees whenever company/restaurant changes
    if (loginRole === SUPER_ADMIN && formData.company && formData.restaurant) {
      getStaff();
    } else if (loginRole !== SUPER_ADMIN && (formData.company || formData.restaurant)) {
      getStaff();
    }
  }, [formData.company, formData.restaurant, getStaff, loginRole]);

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    setSelectedRange(value);
    setFormData((prev: any) => ({ ...prev, fromDate: value?.startDate, toDate: value?.endDate }));
  };

  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      const params = Object.fromEntries(
        Object.entries({
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          employee: formData.employee,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get('/clock/employee/attendance/report', {
        responseType: 'blob',
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false) {
          setBtnLoader("")
          toast.error(jsonData.message || "No data available to preview.");
          return;
        }
      } else if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: contentType,
        });
        const url = window.URL.createObjectURL(blob);

        setUrl(url);
        setOpenModal(true);

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          setBtnLoader("")
        }, 100);

        // console.log("Report preview opened successfully.");
      } else {
        throw new Error("Failed to retrieve report.");
      }
    } catch (error: any) {
      console.error("Error retrieving report:", error);
      const errorMessage = error?.response?.data?.message || "No records found!";
      setTimeout(() => {
        setBtnLoader("")
        toast.error(errorMessage);
      }, 500);
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
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get('/clock/employee/attendance/report', {
        responseType: 'blob',
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false) {
          setBtnLoader("")
          toast.error(jsonData.message || "No data available to preview.");
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

        const filename = `report.pdf`;
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
        "No records found!";
      console.error("Error downloading report:", errorMessage);
      setTimeout(() => {
        setBtnLoader("")
        toast.error(errorMessage);
      }, 500);
    }
  };

  const handleCancel = () => {
    setFormData({
      fromDate: "",
      toDate: "",
      employee: "",
      company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
      restaurant: "",
    })
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      setStaffDetail([]);
    }
    // setErrors({})
    setOpenModal(false)
    setSelectedRange({
      startDate: null,
      endDate: null
    })
  }
  const handleSubmit = (type: string) => {
    if (type === "preview") {
      handlePreview()
    }
    if (type === "print") {
      handlePrint()
    }
  };

  // const handleBusiness = (value: string) => {
  //   setFormData(prev => ({ ...prev, company: value, employee: '' }));
  //   getRestaurant(value)
  //   setStaffDetail([]);
  // }

  const handleBusiness = (value: string) => {
    setFormData(prev => ({
      ...prev,
      company: value,
      restaurant: "",
      employee: '',
    }));

    setStaffDetail([]);
    getRestaurant(value);
  }

  const handleRestaurant = (value: string) => {
    setFormData(prev => ({ ...prev, restaurant: value }));
  }
  const handleEmployee = (value: string) => {
    setFormData(prev => ({ ...prev, employee: value }));
  }

  const hasFilters =
    (!!formData.employee && staffDetail?.length! > 1) ||
    !!formData.fromDate ||
    !!formData.toDate ||
    (!!formData.restaurant && restaurantDetails?.length > 1) ||
    (loginRole === SUPER_ADMIN && !!formData.company);

  return (
    <div>
      <FormHeaderPaths page={'Attendance Report'} prevLink='#' prevPage='Employee' />
      <div className="space-y-4 relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Attendance Report </h2>
        <hr className="border-t-2 border-DARK-800 dark:border-DARK-400 " />
        <div>
          {/* <label className="font-semibold py-6 dark:text-white">Criteria</label> */}
          <div>
            {loginRole === SUPER_ADMIN && (
              <div className="mt-3">
                <label className="block font-medium dark:text-DARK-200">Business</label>
                <DropdownWithSearch
                  setSelectedItem={() => { }}
                  selectedItem={companyDetails?.find((c: any) => c._id === formData?.company)?.name || ''}
                  items={companyDetails}
                  title="Business"
                  setIsDropdownOpen={setIsDropdownOpen}
                  isDropdownOpen={isDropdownOpen}
                  handleFilter={handleBusiness}
                  fieldKey="company"
                />
              </div>)}
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
            {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) &&
              <div className="relative mt-3">
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
          </div>
          <div className="mt-3">
            <label className="block  font-medium dark:text-DARK-200">Date Filter</label>
            <NewDateRangePicker
              value={selectedRange}
              onChange={handleDateRangeChange}
            />
          </div>
          <div>
            <div className="mb-4 py-6 flex items-center space-x-4">
              {/* <div className="flex space-x-4">
                <Button className="flex gap-1 justify-center items-center">
                  <div className="flex justify-center items-center ">Email </div>
                </Button>
              </div> */}
              <Button onClick={() => { handleSubmit("preview") }} className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600">
                <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
              </Button>

              <Button onClick={() => { handleSubmit("print") }} className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600">
                <div className="flex justify-center items-center ">{btnLoader === "print" ? "Loading..." : "Download"} </div>
              </Button>
              {hasFilters && (
                <Button color="failure" onClick={handleCancel}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
          <Modal.Header>Attendance Report</Modal.Header>
          <Modal.Body>
            <iframe src={url} width="100%" height="500px" />
          </Modal.Body>
        </Modal>
      </div>
    </div>
  )
};

export default AttendanceReport;
