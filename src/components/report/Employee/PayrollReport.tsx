
import { Button, Modal } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IPayrollReport {
  fromDate?: string;
  toDate?: string;
  employee: string;
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

const PayrollReport = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [openModal, setOpenModal] = useState(false);
  const [btnLoader, setBtnLoader] = useState("");
  const [url, setUrl] = useState("");
  const [formData, setFormData] = useState<IPayrollReport>({
    fromDate: "",
    toDate: "",
    employee: "",
    company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
    restaurant: ""
  });
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [staffDetail, setStaffDetail] = useState<IStaff[] | []>();
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

        // auto select if only one restaurant
        if (restaurants.length === 1) {
          setFormData((prev) => ({
            ...prev,
            restaurant: restaurants[0]._id,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            restaurant: "",
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

    // manager/company login restaurant load
    if (MANAGER_ROLES.includes(loginRole)) {
      getRestaurant(userData?.staffMember?.company?._id);
    }

    // super admin selected company
    if (loginRole === SUPER_ADMIN && formData.company) {
      getRestaurant(formData.company);
    }
  }, [loginRole, formData.company]);

  useEffect(() => {
    if (
      loginRole !== SUPER_ADMIN &&
      !MANAGER_ROLES.includes(loginRole)
    ) {
      getStaff();
      return;
    }

    if (formData.restaurant && formData.company) {
      getStaff();
    }
  }, [
    formData.company,
    formData.restaurant,
    getStaff,
    loginRole,
  ]);

  const handleDateRangeChange = (
    value: { startDate: Date | null; endDate: Date | null }
  ) => {
    setSelectedRange(value);

    const fromDate = value.startDate
      ? value.startDate.toISOString()
      : "";

    const toDate = value.endDate
      ? value.endDate.toISOString()
      : "";

    setFormData((prev) => ({
      ...prev,
      fromDate,
      toDate,
    }));
  };

  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      const params = Object.fromEntries(
        Object.entries({
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          isPdf: true,
          employee: formData.employee,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get(`/clock/employee/payroll/report`, {
        responseType: "blob",
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

        console.log("Report preview opened successfully");
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
          isPdf: true,
          employee: formData.employee,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get(`/clock/employee/payroll/report`, {
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

        const filename = `payroll_report.pdf`;
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

  const handleSubmit = (type: string) => {
    if (type === "preview") {
      handlePreview()
    }
    if (type === "print") {
      handlePrint()
    }
  };

  const handleCancel = () => {
    setFormData({
      fromDate: "",
      toDate: "",
      employee: "",
      company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
      restaurant: ""
    })
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      setStaffDetail([]);
    }
    setBtnLoader("")
    setOpenModal(false)
    setSelectedRange({
      startDate: null,
      endDate: null
    })
  };

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
  }

  const handleEmployee = (value: string) => {
    setFormData(prev => ({ ...prev, employee: value }));
  }

  const hasFilters =
    !!formData.fromDate ||
    !!formData.toDate ||
    !!formData.employee && staffDetail?.length! > 1 ||
    (restaurantDetails?.length > 1 && !!formData.restaurant) ||
    (
      loginRole === SUPER_ADMIN &&
      companyDetails?.length > 1 &&
      !!formData.company
    );

  return (
    <div>
      <FormHeaderPaths page={'Payroll Report'} prevLink='#' prevPage='Employee' />
      <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Payroll Report </h2>
        <form className="space-y-4">
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
          </div>
          <div>
            <div className="mb-4 flex items-center space-x-4">
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
        </form>
      </div>
      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header>Payroll Report</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default PayrollReport;
