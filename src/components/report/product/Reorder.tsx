
import { Button, Modal } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IReorderReport {
  _id: string;
  type: string;
  reorderBy?: [];
  orderBy: string;
  reorderpoint: boolean;
  pos: boolean
  reorderByData: string;
  company?: string;
  restaurant?: string;
}

interface ErrorState {
  type?: string;
  reorderBy?: string;
  reorderByData?: string;
  orderBy?: string;
}
interface ICategory {
  _id: string;
  name: string;
}
const Reorder = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [openModal, setOpenModal] = useState(false);
  const [btnLoader, setBtnLoader] = useState("");
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [formData, setFormData] = useState<IReorderReport | any>({
    _id: '',
    type: "",
    reorderBy: [],
    reorderByData: "category",
    orderBy: "",
    reorderpoint: true,
    pos: false,
    company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
    restaurant: "",
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
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
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    if (!formData?.reorderBy?.length) {
      errorMsg.reorderBy = "Please select data.";
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    return isValid;
  };

  const [searchTerm, setSearchTerm] = useState('');

  const getCategory = useCallback(async () => {
    try {
      let param: any;

      if (loginRole === SUPER_ADMIN || formData?.company) {
        param = { company: formData.company, restaurant: formData?.restaurant }
      }
      if (formData?.reorderByData === "category") {
        const response = await apiClient.get('/category', { params: param });
        setCategories(response.data?.categories || []);
      } else if (formData?.type === "modifier") {
        const response = await apiClient.get('/modifier', { params: param });
        setCategories(response.data.modifiers || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('~ getCategory error :-', error);
      setCategories([]);
    }
  }, [formData?.reorderByData, formData?.type, formData?.company, formData?.restaurant, loginRole]);

  useEffect(() => {
    if (loginRole !== SUPER_ADMIN || formData?.company) {
      getCategory();
    }
  }, [getCategory, loginRole, formData?.company, formData?.restaurant]);

  const allSelected = categories?.length > 0 && categories.every(cat => formData?.reorderBy.includes(cat._id));

  const handleCategoryCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setErrors((pre) => ({ ...pre, reorderBy: "" }))
    setFormData((prevData: any) => ({
      ...prevData,
      reorderBy: checked
        ? [...prevData.reorderBy, name]
        : prevData.reorderBy.filter((id: any) => id !== name),
    }));
  };

  const handleSelectAll = () => {
    setErrors((pre) => ({ ...pre, reorderBy: "" }))
    setFormData((prevData: any) => ({
      ...prevData,
      reorderBy: allSelected ? [] : categories.map(cat => cat._id),
    }));
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreview = async () => {
    try {
      setBtnLoader("preview")
      const response = await apiClient.post(`/product/reorder/report`, formData, {
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
      const response = await apiClient.post(`/product/reorder/report`, formData, {
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
      _id: '',
      type: "",
      reorderBy: [],
      reorderByData: "category",
      orderBy: "",
      reorderpoint: true,
      pos: false,
      company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
      restaurant: "",
    })
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    setErrors({})
    setOpenModal(false)
    if (loginRole === SUPER_ADMIN) {
      setCategories([]);
    }
  };

  const handleBusiness = (value: string) => {
    setFormData((prev: any) => ({ ...prev, company: value }));
    getRestaurant(value)
  }

  const handleRestaurant = (value: string) => {
    setFormData((prev: any) => ({ ...prev, restaurant: value }));
  }

  const hasFilters =
  formData?.reorderBy?.length > 0 ||
  !!formData?.type ||
  (!!formData?.company && companyDetails?.length > 1) ||
  (!!formData?.restaurant && restaurantDetails?.length > 1) ||
  !!formData?.orderBy ||
  formData?.reorderByData !== "category" ||
  !formData?.reorderpoint ||
  formData?.pos;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div>
        <FormHeaderPaths page={'Reorder Report'} prevLink='#' prevPage='Products' />
      </div>
      <div className="relative mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 dark:text-DARK-100">Reorder Report </h2>
        <form className="space-y-6">
          {/* <hr className="border-t-2 border-DARK-800 dark:border-DARK-300 " /> */}
          {/* <label className="font-semibold dark:text-DARK-100">Criteria</label> */}
          {loginRole === SUPER_ADMIN && (
            <div>
              <label className="block font-medium dark:text-DARK-100">Business</label>
              <DropdownWithSearch
                setSelectedItem={() => {}}
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
                setSelectedItem={() => {}}
                selectedItem={restaurantDetails?.find((c: any) => c._id === formData?.restaurant)?.name || ''}
                items={restaurantDetails}
                title="Restaurant"
                handleFilter={handleRestaurant}
                fieldKey="restaurant"
              />
            </div>)}
          {/* <div>
              <label htmlFor="type" className="block text-sm font-medium text-DARK-700 mb-1">Type</label>
              <select
                id="type"
                name="type"
                value={formData?.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-DARK-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="item">Item</option>
                <option value="modifier">Modifier</option>
              </select>
              {errors?.type && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.type}</p>}
            </div> */}
          {/* <div>
              <label htmlFor="reorderByData" className="block text-sm font-medium text-DARK-700 mb-1">Reorder by</label>
              <select
                id="reorderByData"
                name="reorderByData"
                value={formData?.reorderByData}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-DARK-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="category">Category</option>
                <option value="posscreengroup">POS Screen Group</option>
              </select>
              {errors?.reorderByData && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.reorderByData}</p>}
            </div> */}
          <div className="mt-4">
            <label className="block font-medium dark:text-DARK-100">Category:</label>
            <div className="flex flex-col mt-2 space-y-2 border rounded-lg dark:border-DARK-400 p-6">
              <label className="flex items-center font-medium dark:text-DARK-100">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="mr-2 checked:!bg-BRAND-500"
                />
                Select All
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md dark:bg-DARK-700 dark:placeholder:text-DARK-400"
              />
              <div className="h-28 border mt-2 p-2 rounded-xl dark:bg-DARK-700 overflow-y-auto scrollbar-hide">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <label key={cat._id} className="flex items-center dark:text-DARK-100">
                      <input
                        type="checkbox"
                        name={cat._id}
                        checked={formData?.reorderBy.includes(cat._id)}
                        onChange={handleCategoryCheck}
                        className="mr-2 checked:!bg-BRAND-500"
                      />
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </label>
                  ))
                ) : (
                  <div className="dark:text-DARK-100">No categories found.</div>
                )}
              </div>
              {errors?.reorderBy && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.reorderBy}</p>}
            </div>
          </div>
          {/* <hr className="border-t-2 border-DARK-800 dark:border-DARK-300 " /> */}
          {/* <label className="font-semibold dark:text-DARK-100">View Option</label>
          <div>
            <label htmlFor="orderBy" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Order by</label>
            <select
              id="orderBy"
              name="orderBy"
              value={formData?.orderBy}
              onChange={handleChange}
              className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
            >
              <option value="itemId">Item ID</option>
              <option value="description">Description</option>
            </select>
            {errors?.orderBy && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.orderBy}</p>}
          </div> */}
          {/* <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="reorderpoint" name="reorderpoint" defaultChecked />
                <Label htmlFor="reorderpoint">Include only items where quantity on hand is below reorder point.</Label>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="pos" name="pos" />
                <Label htmlFor="pos">Page break on POS Screen Group.</Label>
              </div>
            </div> */}
          <div className="mt-6 flex space-x-2">
            {/* <Button onClick={() => console.log('Email')}>
                    Email
                </Button> */}

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
          <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header>Product Reorder  Report</Modal.Header>
            <Modal.Body>
              <iframe src={url} width="100%" height="500px" />
            </Modal.Body>
          </Modal>
        </form>
      </div>
    </div>
  )
}

export default Reorder
