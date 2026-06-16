
import { Button, Modal } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IStockJournal {
  fromDate?: string;
  toDate?: string;
  type?: string;
  showNotes?: boolean;
  company?: string;
  restaurant?: string;
}



const StockJournal = () => {
  const [openModal, setOpenModal] = useState(false);
  const [btnLoader, setBtnLoader] = useState("");
  const [url, setUrl] = useState("");
  const [formData, setFormData] = useState<IStockJournal>({
    fromDate: "",
    toDate: "",
    type: "",
    showNotes: false,
    company: "",
    restaurant: "",
  });
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "fromDate") {
      setFormData(prev => ({
        ...prev,
        fromDate: value, toDate: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

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
          type: formData.type,
          company: formData.company,
          restaurant: formData.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get(`/product/stock_journal/report`, {
        responseType: "blob",
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false || jsonData.success === false) {
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
        setBtnLoader("")
        throw new Error("Failed to retrieve report.");
      }
    } catch (error: any) {
      console.log("Error retrieving report:", error);
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
          type: formData.type,
          company: formData.company,
          restaurant: formData.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get(`/product/stock_journal/report`, {
        responseType: "blob",
        params: params
      });

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        const textData = await response.data.text();
        const jsonData = JSON.parse(textData);

        if (jsonData.status === false || jsonData.success === false) {
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
        setBtnLoader("")
        throw new Error("Failed to retrieve report.");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "No records found!";
      console.log("Error downloading report:", error);
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
      type: "",
      showNotes: false,
      company: "",
      restaurant: "",
    })
    setOpenModal(false)
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    setSelectedRange({
      startDate: null,
      endDate: null
    })
  };

  const handleBusiness = (value: string) => {
    setFormData(prev => ({ ...prev, company: value }));
    getRestaurant(value)
  }
  const handleRestaurant = (value: string) => {
    setFormData(prev => ({ ...prev, restaurant: value }));
  }

  const hasFilters =
    !!formData.fromDate ||
    !!formData.toDate ||
    !!formData.type ||
    (
      !!formData.company &&
      !(companyDetails?.length === 1 && formData.company === companyDetails[0]?._id)
    ) ||
    (
      !!formData.restaurant &&
      !(restaurantDetails?.length === 1 && formData.restaurant === restaurantDetails[0]?._id)
    ) ||
    formData.showNotes;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div>
        <FormHeaderPaths page={'Stock Journal Report'} prevLink='#' prevPage='Products' />
      </div>
      <div className="relative mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 dark:text-DARK-100">Inventory Journal Report </h2>
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
            <label htmlFor="inout" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">In/Out</label>
            <select
              id="type"
              name="type"
              value={formData?.type}
              onChange={handleChange}
              className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
            >
              <option value="">All</option>
              <option value="stock in">Stock In</option>
              <option value="stock out">Stock Out</option>
            </select>
            {/* {errors?.inout && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.inout}</p>} */}
          </div>
          <div>
            <label className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Date Filter</label>
            <NewDateRangePicker value={selectedRange} onChange={handleDateRangeChange} />
          </div>
          {/* <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="showNotes" name="showNotes" />
                <Label htmlFor="showNotes">Show Notes</Label>
              </div>
            </div> */}
          <div>
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex space-x-4">
                {/* <Button className="flex gap-1 justify-center items-center">
                    <div className="flex justify-center items-center ">Email </div>
                  </Button> */}
              </div>
              <Button onClick={() => { handleSubmit("preview") }} className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600">
                <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
              </Button>

              <Button onClick={() => { handleSubmit("print") }} className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600">
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
        <Modal.Header>Order Type Wise Analysis</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  )
};

export default StockJournal;
