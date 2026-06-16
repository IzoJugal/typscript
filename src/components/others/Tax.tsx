import { Button, Label, Modal, Table, } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import ConfirmModal from "../../hooks/ConfirmModal";
import apiClient from "../../utils/AxiosInstance";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import { useAuth } from "../../context/AuthProvider";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import TableHeaders from "../../utils/common/TableHeaders";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { Filters } from "../../utils/common/Filters";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, labelLayout } from "../../utils/utility";
import { AiOutlineLoading } from "react-icons/ai";
import ListLoader from "../../utils/common/ListLoader";
import { useConfigs } from "../../context/SiteConfigsProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import NumberInputPOS from "../../utils/common/NumberInputPOS";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
}

interface ITax {
  _id: string;
  taxName: string;
  quickBookId?: string;
  quickBookTaxName?: string;
  rate: number | "";
  type: "" | "percentage" | "fixed";
  isActive: boolean;
  company: { _id: string; currency: Currency } | string;
  restaurant: { _id: string } | string;
}

interface ErrorState {
  taxName?: string;
  type?: string;
  rate?: string;
  company: string
  restaurant: string
}

const Tax = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const { configData } = useConfigs();

  let companyId = ""
  if (loginRole !== SUPER_ADMIN) {
    companyId = `${userData?.staffMember?.company?._id}`
  }
  const [taxes, setTaxes] = useState<ITax[]>([]);
  const { isButtonLoading, setIsButtonLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({ company: "", restaurant: "" });
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [formData, setFormData] = useState<ITax>({
    _id: '',
    taxName: "",
    quickBookId: "",
    quickBookTaxName: "",
    rate: "",
    type: "",
    isActive: false,
    company: companyId,
    restaurant: ""
  });
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";

  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
  });

  const [queryData, setQueryData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });

  const currencySymbol =configData?.currency?.symbol || "Rs";

  const columnNames = loginRole === SUPER_ADMIN ? ["Sr.No.", "Tax", "Type", "Business", "Rate(%)", "Status", "Actions"]
    : ["Sr.No.", "Tax", "Type", "Rate(%)", "Status", "Actions"]

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

  // useEffect(() => {
  //   if (!isOpenModal) return;

  //   if (loginRole === SUPER_ADMIN) {
  //     getCompany().then((companies) => {
  //       if (
  //         companies &&
  //         companies.length === 1 &&
  //         !formData.company
  //       ) {
  //         setFormData((prev) => ({
  //           ...prev,
  //           company: companies[0]._id,
  //         }));

  //         setErrors((prev) => ({
  //           ...prev,
  //           company: "",
  //         }));
  //       }
  //     });
  //   }

  //   const companyId =
  //     loginRole === SUPER_ADMIN
  //       ? typeof formData?.company === "object"
  //         ? formData.company._id.toString()
  //         : (formData?.company ?? "").toString()
  //       : userData?.staffMember?.company?._id;

  //   if (companyId) {
  //     getRestaurant(companyId).then((restaurants) => {

  //       // clear previous restaurant first
  //       setFormData((prev) => ({
  //         ...prev,
  //         restaurant: "",
  //       }));

  //       // auto select only when exactly 1 restaurant exists
  //       if (restaurants?.length === 1) {
  //         setFormData((prev) => ({
  //           ...prev,
  //           restaurant: restaurants[0]._id,
  //         }));

  //         setErrors((prev) => ({
  //           ...prev,
  //           restaurant: "",
  //         }));
  //       }
  //     });
  //   }
  // }, [formData.company, loginRole, isOpenModal]);

  useEffect(() => {
    if (!isOpenModal) return;

    if (loginRole === SUPER_ADMIN) {
      getCompany().then((companies) => {
        if (
          companies &&
          companies.length === 1 &&
          !formData.company
        ) {
          setFormData((prev) => ({
            ...prev,
            company: companies[0]._id,
          }));

          setErrors((prev) => ({
            ...prev,
            company: "",
          }));
        }
      });
    }

    const companyId =
      loginRole === SUPER_ADMIN
        ? typeof formData?.company === "object"
          ? formData.company._id.toString()
          : (formData?.company ?? "").toString()
        : userData?.staffMember?.company?._id;

    if (companyId) {
      getRestaurant(companyId).then((restaurants) => {

        // ONLY auto-select when adding new tax
        if (!formData._id) {
          // clear old restaurant
          setFormData((prev) => ({
            ...prev,
            restaurant: "",
          }));

          // auto select if only 1 restaurant
          if (restaurants?.length === 1) {
            setFormData((prev) => ({
              ...prev,
              restaurant: restaurants[0]._id,
            }));

            setErrors((prev) => ({
              ...prev,
              restaurant: "",
            }));
          }
        }
      });
    }
  }, [formData.company, loginRole, isOpenModal]);

  const getTaxes = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...queryData,
        ...searchFilter
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/tax/all${queryParams}`,);

      setTimeout(() => {
        setIsLoading(false);
        setTaxes(response.data.data);
        setNumOfRecords(response.data.count)
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsLoading(false);
        setTaxes([]);
      }, 500);
      console.error(" ~ getTaxes error :- ", error);
    }

  }, [queryData, searchFilter]);

  // const handleChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  // ) => {
  //   const { name, value, type } = e.target;

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: type === "checkbox" ? e.target.checked : value,
  //   }));

  //   // COMPANY CHANGE
  //   if (name === "company") {
  //     // clear old restaurant immediately
  //     setRestaurant([]);

  //     setFormData((prev) => ({
  //       ...prev,
  //       company: value,
  //       restaurant: "",
  //     }));

  //     // Clear company error when company is selected
  //     if (value !== "") {
  //       setErrors((prev) => ({
  //         ...prev,
  //         company: "",
  //       }));

  //       getRestaurant(value).then((restaurants) => {
  //         if (restaurants?.length === 1) {
  //           setFormData((prev) => ({
  //             ...prev,
  //             restaurant: restaurants[0]._id,
  //           }));
  //         }
  //       });
  //     }

  //     return;
  //   }

  //   if (name === "type" && formData.type !== value) {
  //     setErrors((prev: any) => ({
  //       ...prev,
  //       type: "",
  //       rate: "",
  //     }));
  //   }

  //   if (errors[name as keyof ErrorState]) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       [name]: "",
  //     }));
  //   }
  // };


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // CLEAR ERROR ONLY FOR THE SPECIFIC FIELD BEING CHANGED
    if (name === "taxName") {
      setErrors((prev) => ({ ...prev, taxName: "" }));
    } else if (name === "type") {
      setErrors((prev) => ({ ...prev, type: "" }));
    } else if (name === "rate") {
      setErrors((prev) => ({ ...prev, rate: "" }));
    } else if (name === "company") {
      setRestaurant([]);
      getRestaurant(value).then((restaurants) => {
        if (restaurants?.length === 1) {
          setFormData((p) => ({
            ...p,
            restaurant: restaurants[0]._id,
          }));
          setErrors((prev) => ({ ...prev, restaurant: "" }));
        } else {
          setErrors((prev) => ({ ...prev, restaurant: "" }));
        }
      });
      setErrors((prev) => ({ ...prev, company: "" }));
    } else if (name === "restaurant") {
      setErrors((prev) => ({ ...prev, restaurant: "" }));
    }
  };

  const isValid = (): boolean => {
    let valid = true;
    const errorMsg: Partial<ErrorState> = {};

    const rateValue = Number(formData.rate);

    // TAX NAME
    if (!formData.taxName?.trim()) {
      errorMsg.taxName = "Please enter a tax name.";
      valid = false;
    }

    // TAX TYPE
    if (!formData.type) {
      errorMsg.type = "Please select a tax type.";
      valid = false;
    }

    // RATE VALIDATION
    if (
      formData.rate === "" ||
      formData.rate === null ||
      formData.rate === undefined ||
      isNaN(rateValue)
    ) {
      errorMsg.rate = "Please enter a valid rate in " + formData.type + ".";
      valid = false;
    } else if (rateValue <= 0) {
      errorMsg.rate = "Rate must be greater than 0.";
      valid = false;
    } else if (
      formData.type === "percentage" &&
      rateValue > 100
    ) {
      errorMsg.rate = "Percentage tax cannot exceed 100%.";
      valid = false;
    }

    // COMPANY
    if (loginRole === SUPER_ADMIN && !formData.company) {
      errorMsg.company = "Please select business.";
      valid = false;
    }

    // RESTAURANT
    if (
      (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) &&
      !formData.restaurant
    ) {
      errorMsg.restaurant = "Please select restaurant.";
      valid = false;
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    return valid;
  };

  const addEditTax = () => {
    setIsOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValid()) {
      try {
        // setIsLoading(true)
        setIsButtonLoading(true)
        let response: any;
        if (loginRole !== SUPER_ADMIN) {
          formData.company = `${userData?.staffMember?.company?._id}`
        }
        if (formData._id) {
          response = await apiClient.patch(`/tax/${formData._id}`, formData);
          if (response?.data?.status === false) {
            toast.error(response?.data?.message);
            setIsButtonLoading(false)
            setIsLoading(false)
          } else {
            toast.success(response?.data?.message || 'Tax updated successfully.');
            setTimeout(() => {
              getTaxes()
              setTaxes((prevTaxes: any) =>
                prevTaxes.map((tax: any) => (tax._id === formData._id ? response.data.data : tax))
              );
              setIsButtonLoading(false)
              // setIsLoading(false)
            }, 500);
          }
        } else {
          response = await apiClient.post('/tax/add', formData);
          if (response?.data?.status === false) {
            toast.error(response?.data?.message);
            setIsButtonLoading(false)
            setIsLoading(false)
          } else {
            toast.success(response?.data?.message || 'Tax added successfully.');
            setTimeout(() => {
              // getTaxes()
              // const newData = response.data.data
              // setTaxes((prevData: any) => {
              //   const updatedData = [...prevData];
              //   if (prevData?.length >= limit) {
              //     updatedData?.pop();
              //   }
              //   return [newData, ...updatedData];
              // });
              // setNumOfRecords((prev: any) => prev + 1);
              setIsButtonLoading(false)
              setIsLoading(false)
            }, 500);
          }
        }

        setRestaurant([]);

        setFormData({
          _id: '',
          taxName: "",
          quickBookId: "",
          quickBookTaxName: "",
          rate: "",
          type: "",
          isActive: false,
          company: loginRole !== SUPER_ADMIN
            ? `${userData?.staffMember?.company?._id}`
            : "",
          restaurant: ""
        });

        setIsOpenModal(false);
      } catch (error: any) {
        setIsButtonLoading(false)
        // setIsLoading(false)
        console.log('Error during form submission:', error);
        toast.error(error?.response?.data?.message || 'There was an issue with the request.');
      }
    }
  };
  const handleEdit = (item: ITax) => {
    setIsOpenModal(true);
    setFormData(item);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleteOpen(false);
    setSelectedId(null);
    try {
      setIsLoading(true)
      const response = await apiClient.post(`/tax/${selectedId}`, {});
      const updatedTaxes = taxes?.filter(item => item._id !== selectedId);
      setTaxes(updatedTaxes);

      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      getTaxes();
      if (updatedTaxes?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setTimeout(() => {
        setIsLoading(false)
        setNumOfRecords(numOfRecords - 1)
      }, 500);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete Tax error:', error);
      toast.error('Failed to delete the tax. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const initialFormData: ITax = {
    _id: "",
    taxName: "",
    quickBookId: "",
    quickBookTaxName: "",
    rate: "",
    type: "",
    isActive: false,
    company: loginRole !== SUPER_ADMIN
      ? `${userData?.staffMember?.company?._id}`
      : "",
    restaurant: "",
  };

  const onCloseModal = () => {
    setIsOpenModal(false);

    setFormData(initialFormData);

    setRestaurant([]);

    setErrors({
      company: "",
      restaurant: "",
      taxName: "",
      rate: "",
      type: "",
    });
  };
  useEffect(() => {

    const debounceDelay = setTimeout(() => {
      getTaxes();
    }, 500);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, getTaxes, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setQueryData((prev) => ({ ...prev, limit: data }));
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/tax/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    if (pageNum !== page) {
      setIsLoading(true)
      setQueryData((prev) => {
        const updatedFormData = { ...prev, page: pageNum };
        updateURL(updatedFormData);
        return updatedFormData;
      });
    }
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
    updateURL(queryData);
    setLimit(queryData?.limit)
    setPage(queryData?.page);
  }, [searchFilter, queryData,]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

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
    const addTax = (data: any) => {
      if (socketAllowDataPermission(data)) {
        setTaxes((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [data, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateTax = (data: any) => {
      setTaxes((prev: any) => prev.map((item: any) => item._id === data._id ? data : item));
    };
    const deleteTax = (data: any) => {
      // setTaxes((prev: any) => prev.filter((item: any) => item._id !== data._id));
      const exists = taxes?.some((item: any) => {
        return String(item._id) === String(data._id)
      });
      if (!exists) {
        setIsLoading(false)
        return
      };
      const updatedTaxes = taxes?.filter(item => item._id !== data?._id);
      setTaxes(updatedTaxes);
      getTaxes();
      if (updatedTaxes?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords(numOfRecords - 1)
    };

    socket.on("addTax", addTax);
    socket.on("updateTax", updateTax);
    socket.on("deleteTax", deleteTax);

    return () => {
      socket.off("addTax", addTax);
      socket.off("updateTax", updateTax);
      socket.off("deleteTax", deleteTax);
    };
  }, [taxes, socket]);

  const [showFilters, setShowFilters] = useState(false);

  const handleFilter = (value: string) => {
    setSearchFilter((prev: any) => ({ ...prev, company: value }))
  }

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Tax" />
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
            {!showFilters && (
              <SearchInput
                value={searchFilter.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] self-center"
              />
            )}

            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
              <span onClick={() => addEditTax()}>
                <AddActionButton text="Add a new tax" />
              </span>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="tax" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />

          <Table.Body className="divide-y">
            {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={8} className="text-center py-4">
                <ListLoader />
              </Table.Cell>
            </Table.Row>}
            {!isLoading && taxes && taxes?.length > 0 ? taxes?.map((item: any, index: number) => {
              return <Table.Row key={item?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item.taxName)}>{capitalized(item.taxName) ?? '-'}</Table.Cell>
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item.type)}>{capitalized(item.type) ?? '-'}</Table.Cell>
                {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.company?.name)}>{capitalized(item?.company?.name) ?? '-'}</Table.Cell>}
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${item.rate}`}>{item?.type === "percentage" ? `${item?.rate ?? '-'}%` : ` ${item?.company?.currency?.symbol ?? currencySymbol}${item?.rate ?? '-'}`} </Table.Cell>
                {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item.isActive ? 'Active' : 'Inactive'}>{item.isActive ? 'Yes' : 'No'}</Table.Cell> */}
                {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item?.isActive ? 'Activated' : 'DeActivated'}>
                  <span className={`px-2 inline-flex w-full justify-center text-xs leading-5 font-semibold rounded-full ${item?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item?.isActive ? 'Activated' : 'DeActivated'}
                  </span>
                </Table.Cell> */}
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item?.isActive ? 'Activated' : 'DeActivated'}>
                  {labelLayout(item?.isActive ? 'Activated' : 'Deactivated')}
                </Table.Cell>
                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button className={editBtnStyle.btn} onClick={() => handleEdit(item)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                  <Button onClick={() => confirmDelete(item?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                </Table.Cell>
              </Table.Row>
            }) : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                <NoData
                  title="No Taxes Found"
                  message="No tax entries are available right now. Added tax entries will appear here."
                />
              </Table.Cell>
            </Table.Row>
            }
          </Table.Body>
        </Table>
        {numOfRecords > 0 &&
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
              <PageSize
                handleLimit={handleLimit}
                limit={limit}
              />
            </div>}
            <div className="float-right">
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>}
      </div>
      <Modal show={isOpenModal} onClose={onCloseModal} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header className="dark:bg-DARK-800">Tax Form</Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          <div className="space-y-6">
            <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
              {loginRole === SUPER_ADMIN && (
                <div className="flex flex-col">
                  <CompanyField
                    companies={companies}
                    selectedCompanyId={typeof formData.company === "object" ? formData.company._id : formData.company}
                    handleChange={handleChange}
                    error={errors.company}
                  />
                </div>)}
              {OWNER_ROLES.includes(loginRole) && <div className="flex flex-col">
                <RestaurantField
                  restaurants={restaurant}
                  selectedRestaurantId={typeof formData.restaurant === "object" ? formData.restaurant._id : formData.restaurant}
                  handleChange={handleChange}
                  error={errors.restaurant}
                />
              </div>}
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="taxName" value="Tax Name">
                  Tax Name
                </Label>
              </div>
              <input
                id="taxName"
                name="taxName"
                type="text"
                placeholder="Tax Name"
                className="w-full px-3 py-2 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50  dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl"
                value={formData.taxName}
                onChange={handleChange}
              />
              {errors.taxName && <p className="mt-1 text-sm text-red-600">{errors.taxName}</p>}
            </div>
            <div>
              <Label htmlFor="type" value="Tax Type" />
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
              // className="w-full px-3 py-2 text-sm border rounded-xl bg-slate-50  text-gray-700"
              >
                <option value="">Select Tax Type</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>

              {errors.type && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.type}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="rate" value="Rate" />
              <NumberInputPOS
                id="rate"
                name="rate"
                placeholder="Rate"
                value={formData.rate}
                allowDecimal
                maxDecimalPlaces={2}
                onChange={(value) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    rate: value,
                  }));

                  setErrors((prev) => ({
                    ...prev,
                    rate: "",
                  }));
                }}
              // className="w-full px-3 py-2 text-sm border rounded-xl bg-slate-50  text-gray-700"
              />

              {errors.rate && (
                <p className="mt-1 text-sm text-ERROR_HOVER">
                  {errors.rate}
                </p>
              )}
            </div>
            {/* {isConnectQuickBooks &&
              <div>
                <div className="mb-2 block">
                  <div className="flex items-center gap-3 h-6 w-full">
                    <Label
                      className="text-sm font-medium text-DARK-700 mb-1">
                      QuickBooks Tax
                    </Label>
                    {(isQuickBookLoader && quickBooksTax?.length === 0) && <samp><AiOutlineLoading3Quarters className="h-6 w-6 font-bold animate-spin text-PRIMARY" /></samp>}
                  </div>
                </div>
                <div className={`${isQuickBookLoader ? "!cursor-not-allowed" : ""}`}>
                  <DropdownWithSearch
                    setSelectedItem={() => { }}
                    selectedItem={quickBooksTax?.find((c: any) => c._id === formData.quickBookId)?.name || ''}
                    items={quickBooksTax}
                    title="QuickBooks Tax"
                    handleFilter={handleQuickBooksTex}
                    fieldKey="QuickBooks Tax"
                    isAllow={isQuickBookLoader}
                  />
                </div>
              </div>} */}
            {/* <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Checkbox className="checked:bg-BRAND-500 !ring-0" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div> */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="isAvailable" value="Status" className="text-sm font-medium text-DARK-700"></Label>
              <input
                type="radio"
                id="Activated"
                name="isActive"
                value="true"
                checked={formData.isActive === true}
                onChange={() => setFormData((prev: any) => ({ ...prev, isActive: true }))}
                className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
              />
              <Label htmlFor="Activated" value="Activated" className="text-sm font-medium text-DARK-700"></Label>
              <input
                type="radio"
                id="DeActivated"
                name="isActive"
                value="false"
                checked={formData.isActive === false}
                onChange={() => setFormData((prev: any) => ({ ...prev, isActive: false }))}
                className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
              />
              <Label htmlFor="DeActivated" value="DeActivated" className="text-sm font-medium text-DARK-700"></Label>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          <Button
            type="button"
            onClick={() => onCloseModal()}
            disabled={isButtonLoading}
            className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY text-white dark:bg-DARK-600 dark:hover:!bg-DARK-500 rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={(e: any) => handleSubmit(e)}
            disabled={isButtonLoading}
            isProcessing={isButtonLoading}
            processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
            className="w-full max-w-[150px] px-2 py-1 bg-BRAND-500 dark:bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <span className="relative z-10">{isButtonLoading ? "Loading..." : "Submit"}</span>
            {isButtonLoading && (
              <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <ConfirmModal
        isOpen={isDeleteOpen}
        message="Are you sure you want to delete this tax ?"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  )
}

export default Tax;