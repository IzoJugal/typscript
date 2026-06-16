import { Button, Label, Modal, Select, Table, } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import apiClient from "../../utils/AxiosInstance";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { Filters } from "../../utils/common/Filters";
import FormLoader from "../../utils/common/FormLoader";
import { capitalized, setTitle } from "../../utils/utility";
import { useSocket } from "../../context/SocketProvider";
import ListLoader from "../../utils/common/ListLoader";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

interface IDevice {
  _id?: string;
  name?: string;
  deviceID?: string;
  company?: string;
  restaurant?: string;
  deviceNumber?: string;
  defaultScreen?: string;
}
interface IPosDevice {
  _id?: string;
  name?: string;
  deviceID?: string;
  company?: {
    _id?: string;
    name?: string;
  };
  restaurant?: {
    _id?: string;
    name?: string;
  };
  deviceNumber?: string;
}
interface ErrorState {
  name?: string;
  deviceID?: string;
  company?: string;
  restaurant?: string;
  defaultScreen?: string;
  deviceNumber?: string;
}
const serviceOptions = [
  { label: 'Table Plan', value: 'Table Plan' },
  { label: 'Quick Service', value: 'Quick Service' },
  { label: 'Delivery', value: 'Delivery' },
  { label: 'Take out', value: 'Take out' },
  { label: 'Bar Tabs', value: 'Bar Tabs' },
];

const PosDevice = () => {
  setTitle("POS Devices");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posDevice, setPosDevice] = useState<IPosDevice[] | null>();
  const [formData, setFormData] = useState<IDevice>({
    _id: "",
    name: "",
    deviceID: "",
    company: "",
    restaurant: "",
    deviceNumber: "",
    defaultScreen: ""
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const restaurantFetchedRef = useRef(false);
  
  const columnNames = loginRole === SUPER_ADMIN ? ["Sr.No.", "Name", "Business", "Restaurant", "Actions"] : ["Sr.No.", "Name", "Restaurant", "Actions"];
  const [isButtonLoading, setIsButtonLoading] = useState(false);
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

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const queryDataRef = useRef(queryData);
  useEffect(() => {
    queryDataRef.current = queryData;
  }, [queryData]);

  const getDevice = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...queryDataRef.current,
        ...searchFilterRef.current
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/device${queryParams}`,);

      setIsLoading(false);
      setPosDevice(response.data.data);
      setNumOfRecords(response.data.count)
    } catch (error) {
      setIsLoading(false);
      setPosDevice([]);
      console.error(" ~ getDevice error :- ", error);
    }
  }, []);

  // useEffect(() => {
  //   getDevice();
  // }, [getDevice,]);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getDevice();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getDevice, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setQueryData((prev) => ({ ...prev, limit: data }));
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/posdevice/${updatedFormData.page}/${queryParams}`);
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


  const getSingleDevice = useCallback(async (id: string) => {
    try {
      setIsModalLoading(true);
      const response = await apiClient.get(`/device/${id}`);

      setTimeout(() => {
        setIsModalLoading(false);
        setFormData(response.data.data);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setIsModalLoading(false);
        setFormData({});
      }, 500);
      console.error(" ~ getDevice error :- ", error);
    }

  }, [setIsModalLoading]);


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
    if (loginRole === SUPER_ADMIN && openModal) {
      getCompany().then((companies) => {
        if (companies && companies.length === 1 && !formData.company) {
          setFormData((prev) => ({ ...prev, company: companies[0]._id }));
          setErrors((prev) => ({ ...prev, company: "" }));
        }
      });
    }
  }, [loginRole, openModal]);

  useEffect(() => {
    if (!openModal) {
      restaurantFetchedRef.current = false;
      return;
    }
    if (restaurantFetchedRef.current) return;

    const companyId = loginRole === SUPER_ADMIN
      ? formData?.company
      : userData?.staffMember?.company?._id;

    if (companyId) {
      restaurantFetchedRef.current = true;
      getRestaurant(companyId).then((restaurants) => {
        if (restaurants && restaurants.length === 1 && !formData.restaurant) {
          setFormData((prev) => ({ ...prev, restaurant: restaurants[0]._id }));
          setErrors((prev) => ({ ...prev, restaurant: "" }));
        }
      });
    }
  }, [loginRole, openModal, formData?.company, formData?.restaurant, userData]);


  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === "deviceNumber") {
      if (!/^\d{0,2}$/.test(value)) return;
    }

    if (name === 'company') {
      if (value === '') {
        setRestaurant([]);
      }
    }

    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    if (!formData.name) {
      errorMsg.name = "Please enter a device name."
      isValid = false;
    }
    if (!formData.deviceID) {
      errorMsg.deviceID = "Please enter a deviceID."
      isValid = false;
    }
    if (formData.deviceNumber) {
      if (!/^\d{1,2}$/.test(formData.deviceNumber)) {
        errorMsg.deviceNumber =
          "Device number must contain only up to 2 digits.";
        isValid = false;
      }
    }
    if (loginRole === SUPER_ADMIN) {
      if (!formData?.company) {
        errorMsg.company = "Please select business.";
        isValid = false;
      }
    }

    if (!formData?.defaultScreen) {
      errorMsg.defaultScreen = "Please choose default screen.";
      isValid = false;
    }

    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      if (!formData?.restaurant) {
        errorMsg.restaurant = "Please select restaurant.";
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    return isValid;
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const addEditDevice = () => {
    setOpenModal(true);
  };

  const handleEdit = (item: IDevice) => {
    // setFormData(item);
    setOpenModal(true);
    if (item?._id) {
      getSingleDevice(item?._id);
    }
  };

  const handleSaveDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid()) {
      try {
        let response: any;
        if (formData._id) {
          setIsButtonLoading(true);
          response = await apiClient.patch(`/device/${formData._id}`, formData);
          if (response?.data?.status === false || response?.data?.success === false) {
            toast.error(response?.data?.message);
            setIsButtonLoading(false);
          } else {
            setIsLoading(true)
            toast.success(response?.data?.message || 'Device updated successfully.');
            setIsButtonLoading(false);
            setPosDevice((prevDevice: any) =>
              prevDevice.map((device: any) => (device._id === formData._id ? response.data.data : device))
            );
          }
        } else {
          setIsButtonLoading(true);
          response = await apiClient.post('/device/add', formData);
          if (response?.data?.status === false || response?.data?.success === false) {
            toast.error(response?.data?.message);
            setIsButtonLoading(false);
          } else {
            setIsLoading(true)
            toast.success(response?.data?.message || 'Device Added successfully.');
            setIsButtonLoading(false);
            // setPosDevice((prevDevice: any) => [response.data.data, ...prevDevice]);
            // const newData = response.data.data
            // setPosDevice((prevData: any) => {
            //   const updatedData = [...prevData];
            //   if (prevData?.length >= limit) {
            //     updatedData?.pop();
            //   }
            //   return [newData, ...updatedData];
            // });
            // setNumOfRecords((prev: any) => prev + 1);
          }
        }
        // getDevice();
        setOpenModal(false);
        setTimeout(() => {
          setIsLoading(false)
        }, 500);
        setFormData({
          _id: "",
          name: "",
          deviceID: "",
          company: "",
          restaurant: "",
          deviceNumber: "",
        });
        if (loginRole === SUPER_ADMIN) {
          setRestaurant([]);
        }
      } catch (error: any) {
        setIsButtonLoading(false);
        setIsLoading(false);
        console.log('Error during form submission:', error);
        toast.error(error?.response?.data?.message || 'There was an issue with the request.');
      }
    }
  };

  const handleDelete = async () => {
    setIsModalOpen(false);
    const deleteId = selectedId;
    setSelectedId(null);
    if (!deleteId) return;

    try {
      setIsLoading(true)
      const response = await apiClient.post(`/device/delete/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      setPosDevice((prev: any) => {
        const updated = prev?.filter((pos: any) => pos._id !== deleteId) || [];
        if (updated.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return updated;
      });
      setNumOfRecords((prev: any) => prev - 1);
      getDevice();
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.log('Delete POS error:', error);
      toast.error('Failed to delete the device. Please try again.');
    }
  };

  const onCloseModal = () => {
    setOpenModal(false);
    setFormData({
      _id: "",
      name: "",
      deviceID: "",
      company: "",
      restaurant: "",
      deviceNumber: "",
    });
    setErrors({});
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
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
    const addDevice = (deviceData: any) => {
      if (socketAllowDataPermission(deviceData)) {
        setPosDevice((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [deviceData, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updatedDevice = (deviceData: any) => {
      setPosDevice((prev: any) => prev.map((item: any) => item._id === deviceData._id ? deviceData : item));
    };
    const deleteDevice = (posDeviceData: any) => {
      setPosDevice((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(posDeviceData._id));
        if (!exists) return prev;
        const updated = prev.filter((pos: any) => pos._id !== posDeviceData?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getDevice();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addDevice", addDevice);
    socket.on("updateDevice", updatedDevice);
    socket.on("deleteDevice", deleteDevice);

    return () => {
      socket.off("addDevice", addDevice);
      socket.off("updateDevice", updatedDevice);
      socket.off("deleteDevice", deleteDevice);
    };
  }, [socket]);

  const [showFilters, setShowFilters] = useState(false);

  const handleFilter = (value: string) => {
    setSearchFilter((prev: any) => ({ ...prev, company: value }))
  }

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="POS Device" />
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

              <span onClick={() => addEditDevice()}>
                <AddActionButton text="Add a new pos device" />
              </span>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="posDevice" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
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
            {posDevice && posDevice?.length > 0 && !isLoading ?
              posDevice?.map((elem: any, index: number) => (
                <Table.Row key={elem?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(elem?.name)}>{capitalized(elem?.name) ?? '-'}</Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(elem?.company?.name)}>{capitalized(elem?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={elem?.restaurant?.name}>{elem?.restaurant?.name ?? '-'}</Table.Cell>

                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">

                    <Button className={editBtnStyle.btn} onClick={() => handleEdit(elem)} size="xs"><HiPencil className={editBtnStyle.icon} /> <span className="sr-only">Edit</span></Button>
                    <Button
                      onClick={() => confirmDelete(elem?._id)}
                      className={deleteBtnStyle.btn}
                      size="xs"
                    >
                      <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No POS Devices Found"
                    message="No POS device records are available right now. Added POS device records will appear here."
                  />
                </Table.Cell>
              </Table.Row>}
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
        message="Are you sure you want to delete this Pos Device ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <Modal show={openModal} onClose={() => onCloseModal()} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header className="dark:bg-DARK-800">
          <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
            {isModalLoading ? (
              <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
            ) : (
              formData._id ? "Edit Pos Device" : "Add Pos Device"
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
                    selectedRestaurantId={formData?.restaurant ?? ''}
                    handleChange={handleChange}
                    error={errors.restaurant}
                  />
                </div>}
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="name" value="Device Name" /><span className="text-ERROR_HOVER">*</span>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Device Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
                <span className="text-ERROR_HOVER">{errors?.name}</span>
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="deviceID" value="Device ID" /><span className="text-ERROR_HOVER">*</span>
                </div>
                <input
                  id="deviceID"
                  name="deviceID"
                  type="text"
                  placeholder="Device ID"
                  value={formData.deviceID}
                  onChange={handleChange}
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
                <span className="text-ERROR_HOVER">{errors?.deviceID}</span>
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="deviceNumber" value="Device Number" />
                </div>
                <input
                  id="deviceNumber"
                  name="deviceNumber"
                  type="text"
                  placeholder="Device Number"
                  value={formData.deviceNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="defaultScreen" value="Default Screen" />
                  <span className="text-ERROR_HOVER">*</span>
                </div>
                <Select
                  id="defaultScreen"
                  name="defaultScreen"
                  value={formData.defaultScreen || ""}
                  onChange={handleChange}
                  className="w-full dark:bg-DARK-700 font-medium dark:text-DARK-200 dark:border-none "
                >
                  <option value="" disabled>
                    Select default screen
                  </option>
                  {serviceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {errors.defaultScreen && (
                  <span className="text-ERROR_HOVER text-sm">{errors.defaultScreen}</span>
                )}
              </div>
            </form>
          }
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          {/* {isLoading ? <Button className="w-32 bg-BRAND-500 hover:!bg-BRAND-600" size="sm" isProcessing processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}>
            Loading
          </Button> : <Button className="w-32 bg-BRAND-500 hover:!bg-BRAND-600" size="sm"  type="submit" onClick={(e: any) => { e.preventDefault(); handleSaveDevice(e); }} >
            {isButtonLoading ? "Loading..." : "Save Device"}
          </Button>} */}

          <Button
            type="button"
            onClick={() => onCloseModal()}
            disabled={isButtonLoading}
            className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={(e: any) => {
              e.preventDefault();
              if (!isModalLoading && !isButtonLoading) handleSaveDevice(e);
            }}
            disabled={isButtonLoading}
            isProcessing={isButtonLoading}
            processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
            className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
            {isButtonLoading && (
              <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default PosDevice;
