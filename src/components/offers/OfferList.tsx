import {
  Alert,
  Button,
  Checkbox,
  Label,
  Modal,
  Table,
  Tabs,
  TextInput,
} from "flowbite-react";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import TableHeaders from "../../utils/common/TableHeaders";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { HiPencil } from "react-icons/hi";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import { AiOutlineLoading } from "react-icons/ai";
import {
  CompanyField,
  createQueryParams,
  RestaurantField,
} from "../../utils/functions";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import NoData from "../../utils/common/NoData";
import {
  deleteBtnStyle,
  divContainerStyle,
  editBtnStyle,
  MANAGER_ROLES,
  OWNER_ROLES,
  SUPER_ADMIN,
} from "../../utils/common/constant";
import { Filters } from "../../utils/common/Filters";
import FormLoader from "../../utils/common/FormLoader";
import { useSocket } from "../../context/SocketProvider";
import ListLoader from "../../utils/common/ListLoader";
import { capitalized, labelLayout, setTitle } from "../../utils/utility";
import { apiUrl, siteUrl } from "../../environment/env";
import { RxCross2 } from "react-icons/rx";
import { TimeInput } from "../../utils/common/TimeInput";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

interface IOffers {
  _id: string;
  offerImage?: string;
  title: string;
  description: string;
  scheduleType: string;
  isActive: boolean;
  dailyTime: string;
  weekDays: string[];
  monthDay: string;
  monthTime: string;
  cron: string;
  weekTime: string;
  customTime: string;
  restaurant?: {
    name?: string;
  };
  company?: {
    name?: string;
    currency?: {
      symbol?: string;
    };
  };
}

interface ErrorState {
  title?: string;
  description?: string;
  scheduleType?: string;
  dailyTime?: string;
  weekDays?: string;
  monthDay?: string;
  monthTime?: string;
  cron?: string;
  weekTime?: string;
  customTime?: string;
  restaurant?: string;
  company?: string;
  // offerImage?: string;
}

// const tabs = ["Daily", "Weekly", "Monthly", "Custom"];
const OfferList = () => {
  setTitle("Offers");
  const [offers, setOffers] = useState<IOffers[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [formData, setFormData] = useState<IOffers | any>({
    _id: "",
    title: "",
    offerImage: "",
    description: "",
    scheduleType: "Daily",
    isActive: true,
    dailyTime: "",
    weekDays: [],
    monthDay: "",
    monthTime: "",
    cron: "",
    weekTime: "",
    customTime: "",
    restaurant: null,
    company: null,
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const NoImage = `${siteUrl}/images/default_image.jpg`;
  const [selectedFile, setSelectedFile] = useState<File | any>("");
  const [isFileEdit, setIsFileEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dailyTimeRef = useRef<HTMLInputElement>(null);
  const weeklyTimeRef = useRef<HTMLInputElement>(null);
  const monthlyTimeRef = useRef<HTMLInputElement>(null);

  const columnNames = [
    "Sr.No.",
    "Offer Title",
    "Schedule",
    "Status",
    "Actions",
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [searchFilter, setSearchFilter] = useState<any>({
    company: searchParams.get("company") || "",
    restaurant: searchParams.get("restaurant") || "",
    name: searchParams.get("name") || "",
  });

  const [queryData, setQueryData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    source: "web",
  });

  const getOffers = useCallback(async () => {
    try {
      setIsLoading(true);

      const combinedData = {
        ...queryData,
        ...searchFilter,
      };

      const queryParams = createQueryParams(combinedData);

      const response = await apiClient.get(`/offers${queryParams}`);

      const { success } = response.data;

      if (success) {
        setOffers(response.data.offers);
        setNumOfRecords(response.data.count);
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 500);

    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
        setOffers([]);
      }, 500);

      console.error("getOffers error:", error);
    }
  }, [queryData, searchFilter]);

  const getSingleOffer = useCallback(
    async (id: string) => {
      try {
        setIsModalLoading(true);
        const response = await apiClient.get(`/offers/${id}`);
        const { success, offer } = response.data;
        if (success) {
          setTimeout(() => {
            setIsModalLoading(false);
            const clearedErrors = clearScheduleValidation(offer?.scheduleType);
            // setFormData({ ...offer, weekDays: offer.weekDays ? offer.weekDays.split(',') : [] });
            setFormData({
              ...offer,
              weekDays: Array.isArray(offer.weekDays)
                ? offer.weekDays
                : offer.weekDays
                  ? offer.weekDays.split(",")
                  : [],
            });
            setErrors(clearedErrors);
          }, 500);
        }
      } catch (error) {
        setTimeout(() => {
          setIsModalLoading(false);
          setFormData({});
        }, 500);
        console.error(" ~ getDevice error :- ", error);
      }
    },
    [setIsModalLoading]
  );

  const clearScheduleValidation = (field: string) => {
    const fieldErrorsMap: any = {
      Daily: ["weekDays", "weekTime", "monthDay", "monthTime", "cron"],
      Weekly: ["dailyTime", "monthDay", "monthTime", "cron"],
      Monthly: ["dailyTime", "weekDays", "weekTime", "cron"],
    };

    const cleared: any = {};
    fieldErrorsMap[field]?.forEach((key: string) => {
      cleared[key] = "";
    });

    return cleared;
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    if (!formData?.title) {
      errorMsg.title = "Please enter a title.";
      isValid = false;
    }

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

    if (formData?.scheduleType === "Daily") {
      clearScheduleValidation("Daily");
      if (!formData?.dailyTime) {
        errorMsg.dailyTime = "Please enter a time.";
        isValid = false;
      }
    } else if (formData?.scheduleType === "Weekly") {
      clearScheduleValidation("Weekly");
      if (!formData?.weekDays || formData.weekDays.length === 0) {
        errorMsg.weekDays = "Please select days.";
        isValid = false;
      }
      if (!formData?.weekTime) {
        errorMsg.weekTime = "Please enter a time.";
        isValid = false;
      }
    } else if (formData?.scheduleType === "Monthly") {
      clearScheduleValidation("Monthly");
      if (!formData?.monthDay) {
        errorMsg.monthDay = "Please enter a day.";
        isValid = false;
      } else if (Number(formData?.monthDay) < 1 || Number(formData?.monthDay) > 31) {
        errorMsg.monthDay = "Day must be between 1 and 31.";
        isValid = false;
      }
      if (!formData?.monthTime) {
        errorMsg.monthTime = "Please enter a time.";
        isValid = false;
      }
    } else if (formData?.scheduleType === "Custom") {
      clearScheduleValidation("Custom");
      if (!formData?.cron) {
        errorMsg.cron = "Please enter a cron expression.";
        isValid = false;
      }
    }

    // if (!formData?._id && !selectedFile && !formData?.offerImage) {
    //   errorMsg.offerImage = "Please upload offer image.";
    //   isValid = false;
    // }

    // setErrors((prev) => ({ ...prev, ...errorMsg }));
    setErrors(errorMsg);
    return isValid;
  };

  const addEditOffer = () => {
    setOpenModal(true);
  };

  const handleEdit = async (item: any) => {
    setOpenModal(true);
    if (item?._id) {
      await getSingleOffer(item?._id);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid()) return;

    setIsBtnLoading(true);
    // setIsLoading(true);

    try {
      const formDataToSend = prepareOfferFormData(formData);
      const isUpdate = Boolean(formData?._id);

      const response = isUpdate
        ? await apiClient.patch(
          `/offers/update/${formData._id}`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        )
        : await apiClient.post("/offers/add", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

      const { success, message, offer } = response.data;

      if (!success) {
        toast.error(message || "Something went wrong.");
        return;
      }

      toast.success(
        message ||
        (isUpdate
          ? "Offer updated successfully."
          : "Offer added successfully.")
      );

      if (!isUpdate) {
        setOffers((prevOffers: any) => [offer, ...prevOffers]);
      } else {
        setOffers((prevOffers: any) =>
          prevOffers.map((prevOffer: any) =>
            prevOffer._id === offer._id ? offer : prevOffer
          )
        );
      }

      // Reset form and close modal
      onCloseModal();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "There was an issue with the request."
      );
    } finally {
      // setIsLoading(false);
      setIsBtnLoading(false);
    }
  };

  const prepareOfferFormData = (formData: IOffers) => {
    const formDataToSend = new FormData();

    for (const key in formData) {
      const value = formData[key as keyof IOffers];
      if (value != null && key !== "offerImage") {
        formDataToSend.append(key, String(value));
      }
    }

    const imageFile = selectedFile || formData.offerImage;
    if (imageFile) {
      formDataToSend.append("offerImage", imageFile as any);
    }

    return formDataToSend;
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    setSelectedId(null);

    try {
      setIsLoading(true);
      const response = await apiClient.post(
        `/offers/delete/${selectedId}?isHardDelete=true`,
        {}
      );
      const { success, message } = response.data;
      if (success) {
        setFormData({
          _id: "",
          title: "",
          description: "",
          scheduleType: "Daily",
          restaurant: "",
          company: "",
          maxDiscountAmount: 0,
          usageLimit: 0,
        });
        setSelectedFile(null);
        toast.success(message);
      } else {
        toast.error(message);
      }
      setOffers(offers?.filter((item) => item._id !== selectedId));

      getOffers();
      if (offers?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setTimeout(() => {
        setIsLoading(false);
        setNumOfRecords(numOfRecords - 1);
      }, 500);
    } catch (error: any) {
      toast.error("Failed to delete the offer. Please try again.");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  const getCompany = async () => {
    try {
      const response = await apiClient.get(`/business`);
      const { success, companies } = response.data;
      if (success) {
        setCompanies(companies);
        return companies;
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  };

  const getRestaurant = async (companyId: string) => {
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      const { success, restaurant } = response.data;
      if (success) {
        setRestaurant(restaurant);
        return restaurant;
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  };

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany().then((companies) => {
        if (companies && companies.length === 1 && !formData?._id && !formData.company) {
          setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
          setErrors((prev) => ({ ...prev, company: "" }));
        }
      });
    }

    const companyId = loginRole === SUPER_ADMIN ? formData?.company : userData?.staffMember?.company?._id;

    if (companyId) {
      getRestaurant(companyId).then((restaurants) => {
        if (restaurants && restaurants.length === 1 && !formData?._id && !formData.restaurant) {
          setFormData((prev: any) => ({ ...prev, restaurant: restaurants[0]._id }));
          setErrors((prev) => ({ ...prev, restaurant: "" }));
        }
      });
    }

    clearScheduleValidation(formData?.scheduleType);
  }, [loginRole, formData?.company, formData?.scheduleType]);

  const onCloseModal = () => {
    setOpenModal(false);

    setFormData({
      _id: "",
      title: "",
      offerImage: "",
      description: "",
      scheduleType: "Daily",
      isActive: true,
      dailyTime: "",
      weekDays: [],
      monthDay: "",
      monthTime: "",
      cron: "",
      weekTime: "",
      customTime: "",
      restaurant: null,
      company: null,
    });

    setErrors({});
    setSelectedFile(null);
    setIsFileEdit(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setRestaurant([]);
  };

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getOffers();
    }, 500);

    return () => clearTimeout(debounceDelay);
  }, [queryData, searchFilter]);

  const handleLimit = (data: any) => {
    curPage(1);
    const adjustedLimit = data > numOfRecords ? numOfRecords : data;
    setLimit(adjustedLimit);
    setQueryData((prev) => ({ ...prev, limit: adjustedLimit }));
  };

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate({
      pathname: `/offers/${updatedFormData.page}`,
      search: queryParams,
    });
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true);
    setQueryData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    if (
      Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")
    ) {
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
    // setFormData((prev: any) => ({
    //   ...prev,
    //   scheduleType: "Daily",
    // }));
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(queryData);
    setLimit(queryData?.limit);
    setPage(queryData?.page);
  }, [searchFilter, queryData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === "company") {
      if (value === "") {
        setRestaurant([]);
      } else {
        getRestaurant(value).then((restaurants) => {
          if (restaurants && restaurants.length === 1 && !formData.restaurant) {
            setFormData((prev: any) => ({ ...prev, restaurant: restaurants[0]._id }));
            setErrors((prev) => ({ ...prev, restaurant: "" }));
          }
        });
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

  const socket = useSocket();
  const socketAllowDataPermission = (data: any) => {
    let status = false;
    if (loginRole === "Super Admin") {
      status = true;
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (
        userData?.staffMember?.company?._id ===
        (data?.company?._id || data?.company)
      ) {
        status = true;
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if (
        userData?.staffMember?.company?._id ===
        (data?.company?._id || data?.company) &&
        userData?.staffMember?.restaurant?._id ===
        (data?.restaurant?._id || data?.restaurant)
      ) {
        status = true;
      }
    }
    return status;
  };

  useEffect(() => {
    const addOffer = (offerData: any) => {
      if (socketAllowDataPermission(offerData)) {
        setOffers((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [offerData, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateOffer = (offerData: any) => {
      setOffers((prev: any) =>
        prev.map((item: any) => (item._id === offerData._id ? offerData : item))
      );
    };
    const deleteOffer = (offerData: any) => {
      const exists = offers?.some((item: any) => {
        return String(item._id) === String(offerData._id);
      });
      if (!exists) {
        setIsLoading(false);
        return;
      }
      const updatedOffer = offers?.filter(
        (pos: any) => pos._id !== offerData?._id
      );
      setOffers(updatedOffer);
      getOffers();
      if (updatedOffer?.length === 0) {
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords(numOfRecords - 1);
    };

    socket.on("addOffer", addOffer);
    socket.on("updateOffer", updateOffer);
    socket.on("deleteOffer", deleteOffer);

    return () => {
      socket.off("addOffer", addOffer);
      socket.off("updateOffer", updateOffer);
      socket.off("deleteOffer", deleteOffer);
    };
  }, [offers, socket]);

  const offerImage = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (formData?.offerImage) {
      return `${apiUrl}/${formData?.offerImage}`;
    }
    return NoImage;
  }, [selectedFile, formData?.offerImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsFileEdit(true);
    }
    setErrors((prev) => ({ ...prev, offerImage: "" }));
  };

  const handlePreviousFile = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // This is the key!
    }
  };

  const handleDeletePhoto = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    setFormData((pre: any) => ({ ...pre, offerImage: "" }));
  };

  /*   const handleCronChange = (field: string, value: any) => {
      setFormData((prev: any) => ({
        ...prev,
        cron: { ...prev.cron, [field]: value }
      }));
    }; */

  const handleFilter = (value: string) => {
    setSearchFilter((prev: any) => ({ ...prev, company: value }))
  }

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Offers" />

          <div className="group relative w-full sm:w-auto">
            <span onClick={() => addEditOffer()} className="block w-full sm:w-auto">
              <AddActionButton text="Add a new offer" />
            </span>
          </div>
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
                value={searchFilter?.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] self-center"
              />
            }
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="offer" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={8} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {offers && offers?.length > 0 && !isLoading
              ? offers?.map((item, index) => {
                return (
                  <Table.Row
                    key={item?._id}
                    className="bg-white dark:border-DARK-700 dark:bg-DARK-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                      {index + 1 + (page - 1) * limit}
                    </Table.Cell>
                    <Table.Cell
                      className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"
                      title={item?.title}
                    >
                      {item?.title ?? "-"}
                    </Table.Cell>
                    <Table.Cell
                      className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                      title={item?.scheduleType}
                    >
                      {item?.scheduleType ?? "-"}
                    </Table.Cell>
                    <Table.Cell
                      className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                      title={item?.isActive ? "Active" : "Inactive"}
                    >
                      {labelLayout(
                        item?.isActive ? "activated" : "deactivated"
                      )}
                    </Table.Cell>
                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        className={editBtnStyle.btn}
                        onClick={() => handleEdit(item)}
                        size="xs"
                      >
                        <HiPencil className={editBtnStyle.icon} />
                      </Button>
                      <Button
                        onClick={() => confirmDelete(item?._id)}
                        className={deleteBtnStyle.btn}
                        size="xs"
                      >
                        <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
              : isLoading === false && (
                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell
                    colSpan={10}
                    className="text-center py-4 text-DARK-500"
                  >
                    <NoData
                      title="No Offers Found"
                      message="No offers are available right now. Added offers will appear here."
                    />
                  </Table.Cell>
                </Table.Row>
              )}
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
        message="Are you sure you want to delete this offer ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <Modal
        show={openModal}
        onClose={() => onCloseModal()}
        className="backdrop-blur-sm dark:bg-DARK-950"
      >
        <Modal.Header className="dark:bg-DARK-800">
          <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
            {isModalLoading ? (
              <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
            ) : formData?._id ? (
              "Edit Offer"
            ) : (
              "Add Offer"
            )}
          </span>
        </Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          {isModalLoading ? (
            <FormLoader count={1} />
          ) : (
            <form className="flex max-w-full flex-col gap-4">
              <div
                className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""
                  } gap-4`}
              >
                {loginRole === SUPER_ADMIN && (
                  <div className="flex flex-col">
                    <CompanyField
                      companies={companies}
                      selectedCompanyId={formData?.company ?? ""}
                      handleChange={handleChange}
                      error={errors.company}
                    />
                  </div>
                )}
                {OWNER_ROLES.includes(loginRole) && (
                  <div className="flex flex-col">
                    <RestaurantField
                      restaurants={restaurant}
                      selectedRestaurantId={
                        formData?.restaurant?._id || formData?.restaurant || ""
                      }
                      handleChange={handleChange}
                      error={errors.restaurant}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <img
                  src={offerImage}
                  alt="Offer Image"
                  className="w-2/4 h-48 object-cover rounded-xl border-2 border-DARK-300 shadow-2xl"
                  onError={(e) => (e.currentTarget.src = NoImage)}
                />
                <input
                  type="file"
                  id="offerImage"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <div className="flex">
                  <label htmlFor="offerImage" className="cursor-pointer">
                    <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                      <HiPencil />
                    </div>
                  </label>

                  {isFileEdit && (
                    <div
                      title="Click to switch back to your previous picture"
                      onClick={handlePreviousFile}
                      className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                    >
                      <RxCross2 className="font-extrabold" />
                    </div>
                  )}
                  <button
                    className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                    type="button"
                    title={
                      !formData?.offerImage
                        ? "Picture not stored – can't delete"
                        : "Delete picture"
                    }
                    onClick={handleDeletePhoto}
                    disabled={formData?.offerImage ? false : true}
                  >
                    {" "}
                    <RiDeleteBin6Line />
                  </button>
                </div>
                {/* <span className="text-ERROR_HOVER">{errors?.offerImage}</span> */}
              </div>

              <div>
                <div className="mb-2 block">
                  <Label htmlFor="title" value="Offer Title" />
                  <span className="text-ERROR_HOVER">*</span>
                </div>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter Title"
                  value={capitalized(formData?.title)}
                  onChange={handleChange}
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
                <span className="text-ERROR_HOVER">{errors?.title}</span>
              </div>

              <div className="max-w-full p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Schedule Tasks
                </h2>
                <Tabs
                  aria-label="Schedule tabs"
                  onActiveTabChange={(index) => {
                    const types = ["Daily", "Weekly", "Monthly", "Custom"];
                    // setFormData({ ...formData, scheduleType: types[index] });
                    setFormData((prev: any) => ({
                      ...prev,
                      scheduleType: types[index],
                    }));
                    setErrors(clearScheduleValidation(types[index]));
                  }}
                >
                  {/* DAILY */}
                  <Tabs.Item
                    active={formData?.scheduleType === "Daily"}
                    title="Daily"
                  >
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label htmlFor="daily-time" value="Run every day at" />
                        <span className="text-ERROR_HOVER">*</span>
                        <TimeInput
                          id="daily-time"
                          name="dailyTime"
                          value={formData?.dailyTime}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              dailyTime: e.target.value,
                            });
                            if (errors.dailyTime) {
                              setErrors((prev) => ({ ...prev, dailyTime: "" }));
                            }
                          }}
                          inputRef={dailyTimeRef}
                        />
                      </div>
                      <span className="text-ERROR_HOVER">
                        {errors?.dailyTime}
                      </span>
                    </div>
                  </Tabs.Item>

                  {/* WEEKLY */}
                  <Tabs.Item
                    active={formData?.scheduleType === "Weekly"}
                    title="Weekly"
                  >
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label value="Select days" />
                        <span className="text-ERROR_HOVER">*</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                          ].map((day) => {
                            const weekDays = formData?.weekDays ?? [];
                            return (
                              <label
                                key={day}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  checked={weekDays.includes(day)}
                                  onChange={(e) => {
                                    const newWeekDays = e.target.checked
                                      ? [...weekDays, day] // add
                                      : weekDays.filter(
                                        (d: string) => d !== day
                                      ); // remove
                                    setFormData({
                                      ...formData,
                                      weekDays: newWeekDays,
                                    });
                                    if (errors.weekDays && newWeekDays.length > 0) {
                                      setErrors((prev) => ({ ...prev, weekDays: "" }));
                                    }
                                  }}
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {day}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        <span className="text-ERROR_HOVER">
                          {errors?.weekDays}
                        </span>
                      </div>

                      <div className="max-w-xs">
                        <Label htmlFor="weekly-time" value="Time" />
                        <span className="text-ERROR_HOVER">*</span>
                        <TimeInput
                          id="weekly-time"
                          name="weekTime"
                          value={formData?.weekTime}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              weekTime: e.target.value,
                            });
                            if (errors.weekTime) {
                              setErrors((prev) => ({ ...prev, weekTime: "" }));
                            }
                          }}
                          inputRef={weeklyTimeRef}
                        />
                      </div>
                      <span className="text-ERROR_HOVER">
                        {errors?.weekTime}
                      </span>

                      {formData?.weekDays?.length > 0 && (
                        <Alert color="info" className="mt-2">
                          <span className="font-medium">Preview:</span> Runs
                          every {formData?.weekDays.join(", ")} at{" "}
                          {formData?.weekTime}
                        </Alert>
                      )}
                    </div>
                  </Tabs.Item>

                  {/* MONTHLY */}
                  <Tabs.Item
                    active={formData?.scheduleType === "Monthly"}
                    title="Monthly"
                  >
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-1 gap-2">
                      <div>
                        <Label htmlFor="month-day" value="Day of the month" />
                        <span className="text-ERROR_HOVER">*</span>
                        <TextInput
                          id="month-day"
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={2}
                          value={formData?.monthDay ?? ""}
                          placeholder="Enter Day of the month (1-31)"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              monthDay: e.target.value,
                            })
                          }
                        />
                      </div>
                      <span className="text-ERROR_HOVER">
                        {errors?.monthDay}
                      </span>

                      <div>
                        <Label htmlFor="month-time" value="Time" />
                        <span className="text-ERROR_HOVER">*</span>
                        <TimeInput
                          id="month-time"
                          name="monthTime"
                          value={formData?.monthTime ?? ""}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              monthTime: e.target.value,
                            });

                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.monthTime;
                              return copy;
                            });
                          }}
                          inputRef={monthlyTimeRef}
                        />
                      </div>
                      <span className="text-ERROR_HOVER">
                        {errors?.monthTime}
                      </span>
                    </div>
                  </Tabs.Item>

                  {/* CUSTOM / CRON */}
                  {/* <Tabs.Item active={formData?.scheduleType === "Custom"} title="Custom (Cron)">
                    <div className="mt-6">

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: "Minutes", field: "minutes" },
                          { label: "Hours", field: "hours" },
                          { label: "Day of Month", field: "dayOfMonth" },
                          { label: "Month", field: "month" },
                          { label: "Day of Week", field: "dayOfWeek" },
                          { label: "Seconds", field: "seconds" },
                        ].map((item: any) => (
                          <div key={item.field}>
                            <Label value={item.label} />
                            <TextInput
                              placeholder={item.placeholder}
                              value={formData?.cron?.[item.field] || ""}
                              onChange={(e) => handleCronChange(item.field, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg font-mono text-sm">
                        <Badge color="info" size="lg">
                          {formData?.cron ? Object.values(formData?.cron).join(" ") : ""}
                        </Badge>
                      </div>

                    </div>
                  </Tabs.Item> */}
                </Tabs>
              </div>

              <div>
                <div className="mb-2 block">
                  <Label htmlFor="description" value="Description" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter Description"
                  rows={5}
                  value={formData?.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
                {/* <span className="text-ERROR_HOVER">{errors?.description}</span> */}
              </div>
            </form>
          )}
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
              if (!isModalLoading && !isBtnLoading) handleSaveOffer(e);
            }}
            disabled={isBtnLoading}
            isProcessing={isBtnLoading}
            processingSpinner={
              <AiOutlineLoading className="h-6 w-6 animate-spin" />
            }
            className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <span className="relative z-10">
              {isBtnLoading ? "Loading..." : formData?._id ? "Update" : "Add"}
            </span>
            {isBtnLoading && (
              <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OfferList;
