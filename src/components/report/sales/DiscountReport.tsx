import { Button, Modal } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../utils/AxiosInstance";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { createQueryParams, RestaurantField } from "../../../utils/functions";

interface ISales {
  fromDate?: string;
  toDate?: string;
  type?: boolean;
  isProduct?: boolean;
  company?: string;
  restaurant?: string;
}

const DiscountReport = () => {
  const [formData, setFormData] = useState<ISales>({
    fromDate: "",
    toDate: "",
    isProduct: true,
    company: "",
    restaurant: "",
  });
  const [errors, setErrors] = useState<ISales>({});
  const [openModal, setOpenModal] = useState(false);
  const [url, setUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
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
        setRestaurant(response.data.restaurant)
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany()
    }
    if (formData?.company) {
      getRestaurant(formData.company);
    } else if (OWNER_ROLES.includes(loginRole) && userData?.staffMember?.company?._id) {
      getRestaurant(userData.staffMember.company._id);
    }
  }, [formData?.company, loginRole]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //   const { name, value, type } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'radio' ? value === 'true' : value), // Convert string to boolean for isVoid
  //   }));
  //   // Clear the error for the field being changed
  //   if (errors[name as keyof ISales]) {
  //     setErrors(prev => ({ ...prev, [name]: "" }));
  //   }
  // };

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    setSelectedRange(value);
    setFormData((prev: any) => ({ ...prev, fromDate: value?.startDate, toDate: value?.endDate }));
  };

  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      const params = createQueryParams(formData);
      const response = await apiClient.get(`/discount/sales/report${params}`, {
        responseType: 'blob',
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

        console.log("Report preview opened successfully.");
      } else {
        throw new Error("Failed to retrieve report.");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "discount not found";
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
      const params = createQueryParams(formData)

      const response = await apiClient.get(`/discount/sales/report${params}`, {
        responseType: "blob",
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

        const filename = `discount_report.pdf`;
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
        "discount not found";
      console.error("Error downloading report:", errorMessage);
      setTimeout(() => {
        setBtnLoader("")
        toast.error(errorMessage);
      }, 500);
    }
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ISales> = {};

    if (loginRole === SUPER_ADMIN && !formData.company) {
      errorMsg.company = "Please select a business.";
      isValid = false;
    }


    setErrors(prev => ({ ...prev, ...errorMsg }));
    return isValid;
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
    //   toast.warn("No Record Found") 
  };

  const handleCancel = () => {
    setFormData({
      fromDate: '',
      toDate: '',
      isProduct: true,
      company: '',
      restaurant: "",
    })
    setOpenModal(false);
    setErrors({});
    setSelectedRange({
      startDate: null,
      endDate: null
    });
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }
  };

  const handleBusiness = (value: string) => {
    setFormData(prev => ({ ...prev, company: value }));
    setErrors((prev) => ({
      ...prev,
      company: ""
    }));
  };

  const handleRestaurant = (e: any) => {
    setFormData(prev => ({ ...prev, restaurant: e.target.value }));
  };


  return (
    <div>
      <div>
        <FormHeaderPaths page={'Discount Report'} prevLink='#' prevPage='Sales' />
      </div>
      <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Discount Report</h2>
        <div className="space-y-4">
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
              {errors.company && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.company}</p>}
            </div>)}
          {OWNER_ROLES.includes(loginRole) && (<div className="col-span-1">
            <RestaurantField
              restaurants={restaurant}
              selectedRestaurantId={formData?.restaurant || ''}
              handleChange={handleRestaurant}
              error={''}
            />
          </div>)}
          <div>
            <label className="block text-sm font-medium text-DARK-700 mb-1 dark:text-DARK-200">Date Filter</label>
            <NewDateRangePicker
              value={selectedRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
        <div>
          <div className="mb-4 flex py-3 items-center justify-start space-x-4">
            {/* <Button type="submit" className="flex gap-1 justify-center items-center">
                                    <div className="flex justify-center items-center">Email</div>
                                </Button> */}
            <Button type="submit" className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600" onClick={() => { handleSubmit("preview") }}>
              <div className="flex justify-center items-center">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
            </Button>
            <Button type="submit" className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600" onClick={() => { handleSubmit("print") }}>
              <div className="flex justify-center items-center">{btnLoader === "print" ? "Loading..." : "Download"} </div>
            </Button>
            <Button color="failure" className="flex gap-1 justify-center items-center">
              <div className="flex justify-center items-center" onClick={handleCancel}>Clear</div>
            </Button>
          </div>
        </div>
      </div>
      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header>Discount Detail Report</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default DiscountReport