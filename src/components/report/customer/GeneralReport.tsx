
import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "flowbite-react";
import ConfirmModal from "../../../hooks/ConfirmModal";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import CommonInput from "../../../utils/common/CommonInput";

interface IGeneralReport {
  _id: string;
  customerId: string;
  customerName: string;
  company: string;
  restaurant: string;
  orderBy: string
  zipCode: string;
}


const GeneralReport = () => {
  const [openModal, setOpenModal] = useState(false);
  const [url, setUrl] = useState("");

  const [formData, setFormData] = useState<IGeneralReport>({
    _id: '',
    customerId: "",
    customerName: "",
    company: "",
    restaurant: "",
    orderBy: "menuId",
    zipCode: "",
  });
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isButtonType, setIsButtonType] = useState("");
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [btnLoader, setBtnLoader] = useState("");
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

  const isValid = (): boolean => {
    let isValid = false;

    if (formData.customerId || formData.customerName || formData.company) {
      isValid = true;
    }

    return isValid;
  };

  // const handleChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  // ) => {
  //   const { name, value, type } = e.target;

  //   // Zip Code validation
  //   if (name === "zipCode") {
  //     // Allow only digits
  //     const numericValue = value.replace(/\D/g, "");

  //     // Optional: limit length to 6 digits
  //     if (numericValue.length > 6) return;

  //     setFormData((prev) => ({
  //       ...prev,
  //       zipCode: numericValue,
  //     }));

  //     return;
  //   }

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
  //   }));
  // };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "zipCode") {
      const numericValue = value.replace(/\D/g, "");

      if (numericValue.length > 6) return;

      setFormData((prev) => ({
        ...prev,
        zipCode: numericValue,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "customerName"
          ? value.trimStart() // remove leading spaces while typing
          : type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      // const params = Object.fromEntries(
      //   Object.entries({
      //     customerId: formData.customerId,
      //     customerName: formData.customerName,
      //     orderBy: formData.orderBy,
      //     company: formData.company,
      //     restaurant: formData.restaurant,
      //     zipCode: formData.zipCode,
      //   }).filter(([, value]) => value)
      // );

      const params = Object.fromEntries(
        Object.entries({
          customerId: formData.customerId,
          customerName: formData.customerName.trim(),
          orderBy: formData.orderBy,
          company: formData.company,
          restaurant: formData.restaurant,
          zipCode: formData.zipCode,
        }).filter(([, value]) => value)
      );

      
      const response = await apiClient.get(`/customer/general/report`, {
        responseType: "blob",
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
      setTimeout(() => {
        setBtnLoader("")
        toast.error(errorMessage);
      }, 500);
      const errorMessage =
        error?.response?.data?.message ||
        "Customer not found";
      console.log("Error retrieving report:", error);
    }
  };

  const handlePrint = async () => {
    try {
      setBtnLoader("print")
      const params = Object.fromEntries(
        Object.entries({
          customerId: formData.customerId,
          customerName: formData.customerName,
          orderBy: formData.orderBy,
          company: formData.company,
          restaurant: formData.restaurant,
          zipCode: formData.zipCode,
        }).filter(([, value]) => value != null)
      );

      const response = await apiClient.get(`/customer/general/report`, {
        responseType: "blob",
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
      setTimeout(() => {
        setBtnLoader("")
        toast.error(errorMessage);
      }, 500);
      const errorMessage =
        error?.response?.data?.message ||
        "Customer not found";
      console.error("Error downloading report:", errorMessage);
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

    } else {
      setIsOpenModal(true)
    }
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
      customerId: "",
      customerName: "",
      orderBy: "menuId",
      company: "",
      restaurant: "",
      zipCode: "",
    })
    setOpenModal(false)
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
  };

  const hasFilters =
    !!formData.customerId ||
    !!formData.customerName ||
    (!!formData.company && companyDetails?.length > 1) ||
    (!!formData.restaurant && restaurantDetails?.length > 1) ||
    !!formData.zipCode;

  const handleBusiness = (value: string) => {
    setFormData(prev => ({ ...prev, company: value }));
    getRestaurant(value)
  }
  const handleRestaurant = (value: string) => {
    setFormData(prev => ({ ...prev, restaurant: value }));
  }


  return (
    <div>
      <div>
        {/* Heading */}
        <FormHeaderPaths page={'General Report'} prevLink='#' prevPage='Customer' />
      </div>
      <div className="relative mx-auto mt-2">
        <div className="p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg mx-4">
          <h2 className="text-2xl font-bold mb-6 dark:text-DARK-100">Customer Report </h2>
          <div className="space-y-6">
            {/* <span className="font-semibold mb-4 dark:text-DARK-100">Criteria</span> */}
            <div>
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
            </div>
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
              <div className="pb-2">
                <label htmlFor="customerName" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Customer Name</label>
                <CommonInput
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Customer Name"
                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                />
                {/* {errors.discountAmount && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.discountAmount}</p>} */}
              </div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Zip Code</label>
              <CommonInput
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="Zip Code"
                maxLength={6}
              // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
              />
              {/* {errors.discountAmount && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.discountAmount}</p>} */}
            </div>
            {/* <div>
              <fieldset className="flex max-w-md flex-col gap-4 mt-4 w-full">
                <legend className="mb-4 font-semibold dark:text-DARK-100">View option</legend>

                <div className="w-full">
                  <label htmlFor="orderby" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Order by</label>
                  <select
                    id="orderby"
                    name="orderBy"
                    value={formData?.orderBy}
                    onChange={handleChange}
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                  >
                    <option value="">Select Order</option>
                    <option value="menuId">Menu Id</option>
                    <option value="customerName">Customer Name</option>
                    {loginRole === SUPER_ADMIN && <option value="companyName">Business Name</option>}
                    <option value="group">Group</option>
                      <option value="class">Class</option>
                  </select>
                  {errors?.discountType && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.discountType}</p>}
                </div>

                {/* <div className="flex items-center gap-2">
                    <Radio id="report" name="viewOption" value="report" defaultChecked />
                    <Label htmlFor="report">Report</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Radio id="mailing-label" name="viewOption" value="mailingLabel" />
                    <Label htmlFor="mailing-label">Mailing Label</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Radio id="shipping-label" name="viewOption" value="shippingLabel" />
                    <Label htmlFor="shipping-label">Shipping Label</Label>
                  </div> 
              </fieldset>
            </div> */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                {/* <div className="flex space-x-4">
                    <Button className="flex gap-1 justify-center items-center">
                      <div className="flex justify-center items-center ">Email </div>
                    </Button>
                  </div> */}
                <div className="flex space-x-4">
                  <Button onClick={() => { setIsButtonType("preview"); handleSubmit("preview") }} className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600">
                    <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
                  </Button>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={() => { setIsButtonType("print"); handleSubmit("print") }} className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600">
                    <div className="flex justify-center items-center ">{btnLoader === "print" ? "Loading..." : "Download"} </div>
                  </Button>
                </div>
                {/* <div className="flex space-x-4">
                    <Button className="flex gap-1 justify-center items-center">
                      <div className="flex justify-center items-center ">Export </div>
                    </Button>
                  </div> */}
                {hasFilters && (
                  <div className="flex space-x-4">
                    <Button color="failure" onClick={handleCancel} className="flex gap-1 justify-center items-center">
                      <div className="flex justify-center items-center ">Clear </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      <ConfirmModal
        isOpen={isOpenModal}
        message="No Criteria Selected. Do you want to go for all ?"
        onConfirm={() => { handleConfirmSubmit() }}
        onCancel={() => setIsOpenModal(false)}
      />
      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header>Customer General Report</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default GeneralReport
