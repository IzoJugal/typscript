import { Button, Radio, Label, Modal } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../utils/AxiosInstance";
import ConfirmModal from "../../../hooks/ConfirmModal";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
// import DateRangePicker from "../../../utils/common/DateRangePicker";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IOtherReport {
  _id: string;
  report: string;
  fromdate: string;
  todate: string;
  sortOption: string;
  company: string;
  restaurant?: string;
}

interface ErrorState {
  report?: string;
  fromdate?: string;
  todate?: string;
  company?: string;
  restaurant?: string;
}

const OtherReport = () => {

  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState<IOtherReport>({
    _id: '',
    report: "totalPurchases",
    fromdate: '',
    todate: '',
    sortOption: 'byemployee',
    company: '',
    restaurant: '',
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isButtonType, setIsButtonType] = useState("");
  const [url, setUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [btnLoader, setBtnLoader] = useState("");
  const [selectedRange, setSelectedRange] = useState({
    startDate: null,
    endDate: null
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
        setRestaurantDetails(response.data.restaurant)
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany()
    }
    if (MANAGER_ROLES.includes(loginRole)) {
      getRestaurant(userData?.staffMember?.company?._id)
    }
  }, [getCompany, loginRole]);

  const handleSubmit = (type: string) => {
    if (isValid()) {
      if (type === "preview") {
        handlePreview()
      }
      if (type === "print") {
        handlePrint()
      }

    } else {
      setIsOpenModal(true)
    }
  };

  const handleBusiness = (value: string) => {
    setFormData(prev => ({ ...prev, company: value }));
    getRestaurant(value)
  }

  const handleRestaurant = (value: string) => {
    setFormData(prev => ({ ...prev, restaurant: value }));
  }



  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      const params = Object.fromEntries(
        Object.entries({
          report: formData.report,
          fromdate: formData.fromdate,
          todate: formData.todate,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get(`/customer/other/report`, {
        responseType: "blob",
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false || jsonData?.success === false) {
          setTimeout(() => {
            setBtnLoader("")
            toast.error(jsonData.message || "No data available to preview.");
          }, 500);
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
      const errorMessage = error?.response?.data?.message || "Order not found!";
      console.log("Error retrieving report:", error);
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
          report: formData.report,
          fromdate: formData.fromdate,
          todate: formData.todate,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );

      const response = await apiClient.get(`/customer/other/report`, {
        responseType: "blob",
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData?.status === false || jsonData?.success === false) {
          setTimeout(() => {
            setBtnLoader("")
            toast.error(jsonData.message || "No data available to download.");
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
        "Order not found";
      console.error("Error downloading report:", errorMessage);
      setTimeout(() => {
        setBtnLoader("")
        toast.error(errorMessage);
      }, 500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear the error for the field being changed
    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    setSelectedRange(value);
    setFormData((prev: any) => ({ ...prev, fromdate: value?.startDate, todate: value?.endDate }));
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    if (!formData.report) {
      errorMsg.report = "Please select a report type.";
      isValid = false;
    }
    if (loginRole === SUPER_ADMIN) {
      if (!formData?.company) {
        errorMsg.company = "Please select a report type.";
        isValid = false;
      }
    }

    if (!formData.fromdate) {
      errorMsg.fromdate = "Please select a from date.";
      isValid = false;
    }

    if (!formData.todate) {
      errorMsg.todate = "Please select a to date.";
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    return isValid;
  };

  const handleConfirmSubmit = () => {
    setIsOpenModal(false)
    if (isButtonType === "preview") {
      handlePreview()
    }
    if (isButtonType === "print") {
      handlePrint()
    }
  }
  const handleCancel = () => {
    setIsOpenModal(false)
    setFormData({
      _id: '',
      report: "totalPurchases",
      fromdate: '',
      todate: '',
      sortOption: 'byemployee',
      company: '',
      restaurant:""
    })
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    setOpenModal(false)
    setSelectedRange({
      startDate: null,
      endDate: null
    })
  };

  const hasFilters =
  formData.report !== "totalPurchases" ||
  !!formData.fromdate ||
  !!formData.todate ||
  (!!formData.company && companyDetails?.length > 1) ||
  (!!formData.restaurant && restaurantDetails?.length > 1) ||
  formData.sortOption !== "byemployee";

  return (
    <div>
      <div>
        {/* Heading */}
        <FormHeaderPaths page={'Other Report (Sales)'} prevLink='#' prevPage='Customer' />
      </div>
      <div className="relative mx-auto mt-2">
        <div className="p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg mx-4">
          <h2 className="text-2xl font-bold mb-6 dark:text-DARK-100">Customer Report </h2>
          <form className="space-y-6">
            {loginRole === SUPER_ADMIN && (
              <div>
                <label className="block font-medium dark:text-DARK-100">Business</label>
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
              {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && (
              <div>
                <label className="block font-medium dark:text-DARK-100">Restaurant</label>
                <DropdownWithSearch
                  setSelectedItem={setFormData}
                  selectedItem={restaurantDetails?.find((c: any) => c._id === formData?.restaurant)?.name || ''}
                  items={restaurantDetails}
                  title="Restaurant"
                  handleFilter={handleRestaurant}
                  fieldKey="restaurant"
                />
              </div>)}
            <div>
              <label htmlFor="report" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Report</label>
              <select
                id="report"
                name="report"
                value={formData?.report}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
              >
                <option value="totalPurchases">Total Purchases</option>
                <option value="lastVisit">Last Visit</option>
                {/* <option value="specialEvents">Special Events</option> */}
              </select>
              {/* {errors?.report && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.report}</p>} */}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Date Filter</label>
              <NewDateRangePicker
                value={selectedRange}
                onChange={handleDateRangeChange}
              />
            </div>
            {formData.report === "specialEvents" && (
              <div>
                <div className="flex space-x-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio id="byemployee" name="sortOption" value="byemployee" checked={formData.sortOption === "byemployee"} onChange={handleChange} defaultChecked />
                      <Label htmlFor="byemployee">Sort By Employee</Label>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio id="bydate" name="sortOption" value="bydate" checked={formData.sortOption === "bydate"} onChange={handleChange} />
                      <Label htmlFor="bydate">Sort By Date</Label>
                    </div>
                  </div>
                </div>
              </div>)}
            <div>
              <div className="mb-4 flex items-center gap-2">
                {/* <div className="flex space-x-4">
              <Button  className="flex gap-1 justify-center items-center">
                        <div className="flex justify-center items-center ">Email </div>
              </Button>
              </div> */}
                <div className="flex space-x-4">
                  <Button className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600" onClick={() => { setIsButtonType("preview"); handleSubmit("preview") }}>
                    <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
                  </Button>
                </div>
                <div className="flex space-x-4">
                  <Button className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600" onClick={() => { setIsButtonType("print"); handleSubmit("print") }}>
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
      </div>
      <ConfirmModal
        isOpen={isOpenModal}
        message="No Criteria Selected. Do you want to go for all ?"
        onConfirm={() => { handleConfirmSubmit() }}
        onCancel={() => setIsOpenModal(false)}
      />
      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header>Customer Other Report(Sales)</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default OtherReport
