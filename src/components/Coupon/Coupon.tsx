import { Button, Label, Modal, Table, } from "flowbite-react";
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import TableHeaders from "../../utils/common/TableHeaders";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HiPencil } from "react-icons/hi";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import { AiOutlineLoading } from "react-icons/ai";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { Filters } from "../../utils/common/Filters";
import NewSingleDate from "../../utils/common/NewSingleDate";
import FormLoader from "../../utils/common/FormLoader";
import { useSocket } from "../../context/SocketProvider";
import ListLoader from "../../utils/common/ListLoader";
import { formatDate, labelLayout, setTitle } from "../../utils/utility";
import { useConfigs } from "../../context/SiteConfigsProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

interface ICoupons {
  _id: string;
  code: string;
  discountValue: number;
  discountType: string;
  expirationDate: string;
  isExpire: boolean;
  maxDiscountAmount: number;
  restaurant?: {
    name?: string;
  }
  company?: {
    name?: string;
    currency?: {
      symbol?: string;
    }
  }
}

interface ICoupon {
  _id?: string;
  code?: string;
  discountValue?: number;
  discountType?: string;
  minOrderAmount?: number | "";
  maxDiscountAmount?: number | "";
  usageLimit?: number | "";
  expirationDate?: string;
  company?: string;
  restaurant?: string;
}

interface ErrorState {
  code?: string;
  discountValue?: string;
  discountType?: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  usageLimit?: string;
  expirationDate?: string;
  company?: string;
  restaurant?: string;
}

const blockInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  const isDigit = /^\d$/.test(e.key);
  const isDot = e.key === '.' && !e.currentTarget.value.includes('.');
  if (allowedKeys.includes(e.key) || isDigit || isDot) {
    return;
  }
  e.preventDefault();
};

const blockInvalidIntegerInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  const isDigit = /^\d$/.test(e.key);
  if (allowedKeys.includes(e.key) || isDigit) {
    return;
  }
  e.preventDefault();
};

const stopWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
  (e.target as HTMLInputElement).blur();
};

const Coupon = () => {
  setTitle("Coupon");
    const { configData } = useConfigs();
  const [coupons, setCoupons] = useState<ICoupons[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [formData, setFormData] = useState<ICoupon | any>({
    _id: "",
    code: "",
    discountType: "",
    discountValue: "",
    restaurant: "",
    company: "",
    expirationDate: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { userData } = useAuth();
  const companyFetchedRef = useRef(false);
  const restaurantFetchedRef = useRef<string | null>(null);
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const [showFilters, setShowFilters] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const columnNames = ["Sr.No.", "Coupon Code", "Discount Rate", "Max Discount", "Expiration Date", "Actions"];
  const [selectedExpirationdate, setSelectedExpirationdate] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";

  const [searchFilter, setSearchFilter] = useState<any>({
    discountType: searchParams.get("discountType") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
    name: searchParams.get("name") || "",
  });

  const [queryData, setQueryData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    source: "web",
  });

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const queryDataRef = useRef(queryData);
  useEffect(() => {
    queryDataRef.current = queryData;
  }, [queryData]);

  const getCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...queryDataRef.current,
        ...searchFilterRef.current
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/coupons${queryParams}`,);

      setIsLoading(false);
      setCoupons(response.data.coupons);
      setNumOfRecords(response.data.count)
    } catch (error) {
      setIsLoading(false);
      setCoupons([]);
      console.error(" ~ getDevice error :- ", error);
    }
  }, []);

  const getCouponStatus = (expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);

    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffTime < 0) {
      return "expired";
    }

    if (diffDays <= 3) {
      return "expiringSoon";
    }

    return "active";
  };

  const getSingleCoupon = useCallback(async (id: string) => {
    try {
      setIsModalLoading(true);
      const response = await apiClient.get(`/coupons/${id}`);

      setTimeout(() => {
        setIsModalLoading(false);
        setFormData({
          ...response.data.coupon,
          discountValue: response.data.coupon.discountValue?.toString() || "",
          minOrderAmount: response.data.coupon.minOrderAmount?.toString() || "",
          maxDiscountAmount: response.data.coupon.maxDiscountAmount?.toString() || "",
          usageLimit: response.data.coupon.usageLimit?.toString() || "",
        });
        if (response.data.coupon?.expirationDate) {
          setSelectedExpirationdate({
            startDate: new Date(response.data.coupon.expirationDate),
            endDate: new Date(response.data.coupon.expirationDate),
          });
        }
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsModalLoading(false);
        setFormData({});
      }, 500);
      console.error(" ~ getDevice error :- ", error);
    }

  }, [setIsModalLoading]);

  const handleExpirationDate = (
    value: { startDate: Date | null; endDate: Date | null } | any
  ) => {
    if (value?.startDate) {
      setSelectedExpirationdate(value);

      const date = new Date(value.startDate);

      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      setFormData((prev: any) => ({
        ...prev,
        expirationDate: formattedDate,
      }));
    }

    if (errors?.expirationDate) {
      setErrors((prev) => ({ ...prev, expirationDate: "" }));
    }
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    // Coupon Code
    if (!formData.code || !formData.code.trim()) {
      errorMsg.code = "Please enter a coupon code.";
      isValid = false;
    } else if (!/^[A-Z0-9_-]{3,20}$/.test(formData.code.toUpperCase())) {
      errorMsg.code = "Code must be 3-20 chars, no spaces.";
      isValid = false;
    }

    // Discount Type
    if (!formData.discountType) {
      errorMsg.discountType = "Please select a discount type.";
      isValid = false;
    }

    // Discount Value
    if (formData.discountValue === "" || Number(formData.discountValue) <= 0) {
      errorMsg.discountValue = formData.discountValue === "" ? "Please enter discount value." : "Discount must be greater than 0.";
      isValid = false;
    } else if (
      formData.discountType === "percentage" &&
      Number(formData.discountValue) > 100
    ) {
      errorMsg.discountValue = "Percentage cannot exceed 100%.";
      isValid = false;
    }

    // Usage Limit
    if (formData.usageLimit === "" || Number(formData.usageLimit) <= 0) {
      errorMsg.usageLimit = formData.usageLimit === "" ? "Please enter usage limit." : "Usage limit must be greater than 0.";
      isValid = false;
    }
    if (!formData.expirationDate) {
      errorMsg.expirationDate = "Please select an expiration date.";
      isValid = false;
    } else {
      const selectedDate = new Date(formData.expirationDate);
      selectedDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() < today.getTime()) {
        errorMsg.expirationDate = "Expiration date cannot be in the past.";
        isValid = false;
      }
    }

    // Min Order Amount
    if (formData.minOrderAmount === "" || Number(formData.minOrderAmount) <= 0) {
      errorMsg.minOrderAmount = formData.minOrderAmount === "" ? "Please enter min order amount." : "Min order must be greater than 0.";
      isValid = false;
    }

    // Max Discount Amount
    if (formData.maxDiscountAmount === "" || Number(formData.maxDiscountAmount) <= 0) {
      errorMsg.maxDiscountAmount = formData.maxDiscountAmount === "" ? "Please enter max discount amount." : "Max discount must be greater than 0.";
      isValid = false;
    }

    // Logical validation
    if (formData.discountType === "fixed") {
      if (Number(formData.discountValue) <= 0) {
        errorMsg.discountValue = "Fixed amount must be greater than 0.";
        isValid = false;
      } else if (
        Number(formData.discountValue) > Number(formData.maxDiscountAmount)
      ) {
        errorMsg.discountValue =
          "Fixed discount cannot exceed max discount.";
        isValid = false;
      }
    }

    if (formData.discountType === "percentage") {
      if (
        Number(formData.discountValue) <= 0 ||
        Number(formData.discountValue) > 100
      ) {
        errorMsg.discountValue =
          "Percentage must be between 1 and 100.";
        isValid = false;
      }
    }

    // Role-based validation
    if (loginRole === SUPER_ADMIN) {
      if (!formData?.company) {
        errorMsg.company = "Please select business.";
        isValid = false;
      }
    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      if (!formData?.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        isValid = false;
      }
    }

    setErrors(errorMsg);
    return isValid;
  };

  const addEditCoupon = () => {
    setOpenModal(true);
  };

  const handleEdit = (item: any) => {
    setOpenModal(true);
    if (item?._id) {
      getSingleCoupon(item?._id);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid()) {
      try {
        setIsBtnLoading(true);
        const dataToSend = {
          ...formData,
          discountValue: formData.discountValue ? Number(formData.discountValue) : 0,
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
          maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : 0,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0,
        };
        let response: any;
        if (formData._id) {
          response = await apiClient.patch(`/coupons/${formData._id}`, dataToSend);
          setIsLoading(true);
          if (response?.data?.success === false) {
            toast.error(response?.data?.message);
            setIsBtnLoading(false);
            return;
          }

          toast.success(response?.data?.message || 'Coupon updated successfully.');
          setIsBtnLoading(false);

          setCoupons((prevCoupons: any) =>
            prevCoupons.map((coupon: any) => (coupon._id === formData._id ? response.data.coupon : coupon))
          );
        } else {
          response = await apiClient.post('/coupons', dataToSend);
          // setIsLoading(true);
          if (!response?.data?.success) {
            toast.error(response?.data?.message);
            setIsBtnLoading(false);
            return;
          }

          toast.success(response?.data?.message || 'Coupon Added successfully.');
          setIsBtnLoading(false);
          // setCoupons((prev: any) =>
          //   prev.map((item: any) =>
          //     item._id === formData._id ? response.data.coupon : item
          //   )
          // );
          // setCoupons((prevCoupons: any) => [...prevCoupons, response.data.coupon]);
          // const newData = response.data.coupon
          // setCoupons((prevData: any) => {
          //   const updatedData = [...prevData];
          //   if (prevData?.length >= limit) {
          //     updatedData?.pop();
          //   }
          //   return [newData, ...updatedData];
          // });
          // setNumOfRecords((prev: any) => prev + 1);
        }
        getCoupons();
        setOpenModal(false);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        setFormData({
          _id: "",
          code: "",
          discountType: "",
          discountValue: "",
          restaurant: "",
          company: "",
          expirationDate: "",
          minOrderAmount: "",
          maxDiscountAmount: "",
          usageLimit: "",
        });
        setSelectedExpirationdate({
          startDate: null,
          endDate: null,
        })
        if (loginRole === SUPER_ADMIN) {
          setRestaurant([]);
        }
      } catch (error: any) {
        setIsLoading(false);
        setIsBtnLoading(false);
        console.log('Error during form submission:', error);
        toast.error(error?.response?.data?.message || 'There was an issue with the request.');
      }
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    setIsModalOpen(false);
    const deleteId = selectedId;
    setSelectedId(null);
    if (!deleteId) return;

    try {
      setIsLoading(true)
      const response = await apiClient.post(`/coupons/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      setCoupons((prev: any) => {
        const updated = prev?.filter((item: any) => item._id !== deleteId) || [];
        if (updated.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return updated;
      });
      setNumOfRecords((prev: any) => prev - 1);
      getCoupons();
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.log('Delete POS error:', error);
      toast.error('Failed to delete the coupon. Please try again.');
    }
  };

  const getCompany = async () => {
    try {
      const response = await apiClient.get(`/business`);
      if (response.data.success) {
        setCompanies(response.data.companies)
        return response.data.companies;
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
        return response.data.restaurant;
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }

  useEffect(() => {
    if (!openModal) return;

    if (loginRole === SUPER_ADMIN && !companyFetchedRef.current) {
      companyFetchedRef.current = true;
      getCompany().then((companies) => {
        if (companies && companies.length === 1 && !formData.company) {
          setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
          setErrors((prev) => ({ ...prev, company: "" }));
        }
      });
    }

    const companyId = loginRole === SUPER_ADMIN ? formData?.company : userData?.staffMember?.company?._id;

    if (!companyId) return;
    if (restaurantFetchedRef.current === companyId) return;

    restaurantFetchedRef.current = companyId;
    getRestaurant(companyId).then((restaurants) => {
      if (restaurants && restaurants.length === 1 && !formData.restaurant) {
        setFormData((prev: any) => ({ ...prev, restaurant: restaurants[0]._id }));
        setErrors((prev) => ({ ...prev, restaurant: "" }));
      }
    });
  }, [loginRole, openModal, formData?.company, userData?.staffMember?.company?._id]);

  const onCloseModal = () => {
    setOpenModal(false);
    companyFetchedRef.current = false;
    restaurantFetchedRef.current = null;
    setFormData({
      _id: "",
      code: "",
      discountType: "",
      discountValue: "",
      restaurant: "",
      company: "",
      expirationDate: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      usageLimit: "",
    });
    setErrors({});
    setSelectedExpirationdate({
      startDate: null,
      endDate: null,
    });
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }
  }

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getCoupons();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getCoupons, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setQueryData((prev) => ({ ...prev, limit: data }))
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/coupon/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true)
    setQueryData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    if (Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")) {

      if (queryData?.page !== 1) {
        setQueryData((prev) => ({ ...prev, page: 1 }));
        setPage(1);
      }
    }
  }, [searchFilter]);


  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setQueryData((prev) => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));

    setPage(pageFromURL);
    setLimit(limitFromURL);
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(queryDataRef.current);
    setLimit(queryDataRef.current?.limit)
    setPage(queryDataRef.current?.page);
  }, [searchFilter, queryData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    const decimalFields = [
      "discountValue",
      "maxDiscountAmount",
      "minOrderAmount",
    ];

    if (decimalFields.includes(name)) {
      const regex = /^\d*\.?\d{0,2}$/;

      if (value !== "" && !regex.test(value)) {
        return;
      }
    }

    setFormData((prevForm: any) => ({
      ...prevForm,
      [name]: value,
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const socket = useSocket()
  const socketAllowDataPermission = (data: any) => {
    let status = false
    if (loginRole === "Super Admin") {
      status = true
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
        status = true
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
        status = true
      }
    }
    return status
  }

  useEffect(() => {
    const addCoupon = (couponData: any) => {
      if (socketAllowDataPermission(couponData)) {
        setCoupons((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [couponData, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateCoupon = (couponData: any) => {
      setCoupons((prev: any) => prev.map((item: any) => item._id === couponData._id ? couponData : item));
    };
    const deleteCoupon = (couponData: any) => {
      setCoupons((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(couponData._id));
        if (!exists) return prev;
        const updated = prev.filter((item: any) => item._id !== couponData?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getCoupons();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addCoupon", addCoupon);
    socket.on("updateCoupon", updateCoupon);
    socket.on("deleteCoupon", deleteCoupon);

    return () => {
      socket.off("addCoupon", addCoupon);
      socket.off("updateCoupon", updateCoupon);
      socket.off("deleteCoupon", deleteCoupon);
    };
  }, [socket]);

  const handleFilter = (value: string) => {
    setSearchFilter((prev: any) => ({ ...prev, company: value }))
  }

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Coupons" />
        </div>

        {/* Filters Section */}
        <div className="mt-4">
          <div className="flex gap-4">
            <button
              className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="text-sm" />
              Filters
              {showFilters ? (
                <FaAngleUp className="transition-transform duration-300 h-4 w-4" />
              ) : (
                <FaAngleDown className="transition-transform duration-300 h-4 w-4" />
              )}
            </button>
            {!showFilters &&
              <SearchInput
                value={searchFilter.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] self-center"
              />
            }

            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
              <span onClick={() => addEditCoupon()}>
                <AddActionButton text="Add a new coupon" />
              </span>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="coupon" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />

          <Table.Body className="divide-y">
            {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={6} className="text-center py-4">
                <ListLoader />
              </Table.Cell>
            </Table.Row>}
            {coupons && coupons?.length > 0 && !isLoading ? coupons?.map((item, index) => {
              return <Table.Row key={item?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={item.code.toUpperCase()}>{item.code.toUpperCase() ?? '-'}</Table.Cell>
                {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item.discountType)}>{capitalized(item.discountType) ?? '-'}</Table.Cell> */}
                <Table.Cell
                  className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                  title={item.discountValue !== undefined && item.discountValue !== null
                    ? `${item?.discountType === "percentage" ? "" : `${item?.company?.currency?.symbol || "$"}`}${Number(item.discountValue).toFixed(2)}${item?.discountType === "percentage" ? "%" : ""}`
                    : '-'}
                >
                  {item.discountValue !== undefined && item.discountValue !== null
                    ? `${item?.discountType === "percentage" ? "" : `${item?.company?.currency?.symbol ?? "$"}`}${Number(item.discountValue).toFixed(2)}${item?.discountType === "percentage" ? "%" : ""}`
                    : '-'}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={(item?.maxDiscountAmount ?? 0).toFixed(2)}>{item?.company?.currency?.symbol ?? "$"}{(item.maxDiscountAmount ?? 0).toFixed(2)}</Table.Cell>
                <Table.Cell
                  className="whitespace-nowrap text-sm font-semibold"
                >
                  {(() => {
                    const status = getCouponStatus(item?.expirationDate);

                    if (status === "expired") {
                      return <>{labelLayout("expired")}</>;
                    }

                    if (status === "expiringSoon") {
                      return (
                        <span className="text-yellow-500">
                          {formatDate(item?.expirationDate,configData?.dateFormat)}
                        </span>
                      );
                    }

                    return (
                      <span className="text-DARK-500 dark:text-DARK-300">
                        {formatDate(item?.expirationDate,configData?.dateFormat)}
                      </span>
                    );
                  })()}
                </Table.Cell>

                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button className={editBtnStyle.btn} onClick={() => handleEdit(item)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                  <Button onClick={() => confirmDelete(item?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                </Table.Cell>
              </Table.Row>
            }) : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                <NoData />
              </Table.Cell>
            </Table.Row>
            }
          </Table.Body>
        </Table>
        {numOfRecords > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && (
              <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                <PageSize handleLimit={handleLimit} limit={limit} />
              </div>
            )}
            <div>
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this coupon ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <Modal show={openModal} onClose={() => onCloseModal()} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header className="dark:bg-DARK-800">
          <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
            {isModalLoading ? (
              <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
            ) : (
              formData._id ? "Edit Coupon" : "Add Coupon"
            )}
          </span>
        </Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          {isModalLoading ? <FormLoader count={1} /> :
            <form className="flex max-w-full flex-col gap-4">
              <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
                {loginRole === SUPER_ADMIN && (
                  <div className="flex flex-col">
                    <CompanyField
                      companies={companies}
                      selectedCompanyId={formData?.company ?? ''}
                      handleChange={handleChange}
                      error={errors.company}
                    />
                  </div>)}
                {OWNER_ROLES.includes(loginRole) && <div className="flex flex-col">
                  <RestaurantField
                    restaurants={restaurant}
                    selectedRestaurantId={formData?.restaurant?._id || formData?.restaurant || ''}
                    handleChange={handleChange}
                    error={errors.restaurant}
                  />
                </div>}
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="code" value="Coupon Code" /><span className="text-ERROR_HOVER">*</span>
                </div>
                <input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="Enter Code"
                  value={formData.code.toUpperCase()}
                  onChange={handleChange}
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
                <span className="text-ERROR_HOVER">{errors?.code}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="discountType" value="Discount Type" /><span className="text-ERROR_HOVER">*</span>
                  </div>
                  <select
                    id="discountType"
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                  >
                    <option value="" disabled>
                      Select discount type
                    </option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  <span className="text-ERROR_HOVER">{errors?.discountType}</span>
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="discountValue" value="Discount Value" /><span className="text-ERROR_HOVER">*</span>
                  </div>
                  <input
                    id="discountValue"
                    name="discountValue"
                    type="text"
                    inputMode="decimal"
                    placeholder="Discount Value"
                    min={0}
                    step="0.01"
                    value={formData.discountValue !== undefined && formData.discountValue !== null ? formData.discountValue : ""}
                    onChange={handleChange}
                    onKeyDown={blockInvalidNumberInput}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData("text");
                      if (/[^\d.]/.test(paste)) {
                        e.preventDefault();
                      }
                    }}
                    onWheel={stopWheelChange}
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl 
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
                  />
                  <span className="text-ERROR_HOVER">{errors?.discountValue}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="maxDiscountAmount" value="Max Discount Amount" /><span className="text-ERROR_HOVER">*</span>
                  </div>
                  <input
                    id="maxDiscountAmount"
                    name="maxDiscountAmount"
                    type="text"
                    inputMode="decimal"
                    placeholder="Max Discount Amount"
                    min={0}
                    value={formData.maxDiscountAmount !== undefined && formData.maxDiscountAmount !== null ? formData.maxDiscountAmount : ""}
                    onChange={handleChange}
                    onKeyDown={blockInvalidNumberInput}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData("text");
                      if (paste.includes("-")) {
                        e.preventDefault();
                      }
                    }}
                    onWheel={stopWheelChange}
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
                  />
                  <span className="text-ERROR_HOVER">{errors?.maxDiscountAmount}</span>
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="minOrderAmount" value="Min Order Amount" /><span className="text-ERROR_HOVER">*</span>
                  </div>
                  <input
                    id="minOrderAmount"
                    name="minOrderAmount"
                    type="text"
                    inputMode="decimal"
                    placeholder="Min Order Amount"
                    min={0}
                    value={formData.minOrderAmount !== undefined && formData.minOrderAmount !== null ? formData.minOrderAmount : ""}
                    onChange={handleChange}
                    onKeyDown={blockInvalidNumberInput}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData("text");
                      if (paste.includes("-")) {
                        e.preventDefault();
                      }
                    }}
                    onWheel={stopWheelChange}
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
                  />
                  <span className="text-ERROR_HOVER">{errors?.minOrderAmount}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="usageLimit" value="Usage Limit" /><span className="text-ERROR_HOVER">*</span>
                  </div>
                  <input
                    id="usageLimit"
                    name="usageLimit"
                    type="text"
                    placeholder="Usage Limit"
                    value={formData.usageLimit !== undefined && formData.usageLimit !== null ? formData.usageLimit : ""}
                    onChange={handleChange}
                    onKeyDown={blockInvalidIntegerInput}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData("text");
                      if (/[^\d]/.test(paste)) {
                        e.preventDefault();
                      }
                    }}
                    onWheel={stopWheelChange}
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
                  />
                  <span className="text-ERROR_HOVER">{errors?.usageLimit}</span>
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="expirationDate" value="Expiration Date" /><span className="text-ERROR_HOVER">*</span>
                  </div>
                  <NewSingleDate value={selectedExpirationdate} onChange={handleExpirationDate} label="Expiration Date" />
                  <span className="text-ERROR_HOVER">{errors?.expirationDate}</span>
                </div>
              </div>
            </form>
          }
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          {/* {isLoading ? <Button className="w-32 bg-BRAND-500 hover:!bg-BRAND-600" size="sm" isProcessing processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}>
            Loading
          </Button> : <Button className="w-32 bg-BRAND-500 hover:!bg-BRAND-600" size="sm" type="submit" onClick={(e: any) => { e.preventDefault(); handleSaveCoupon(e); }} >
            Save Coupon
          </Button>} */}
          <Button
            type="button"
            onClick={() => onCloseModal()}
            disabled={isBtnLoading}
            className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={(e: any) => {
              e.preventDefault();
              if (!isModalLoading && !isBtnLoading) handleSaveCoupon(e);
            }}
            disabled={isBtnLoading}
            isProcessing={isBtnLoading}
            processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
            className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <span className="relative z-10">{isBtnLoading ? 'Loading...' : 'Submit'}</span>
            {isBtnLoading && (
              <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Coupon
