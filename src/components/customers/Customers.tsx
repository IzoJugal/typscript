import { useCallback, useEffect, useRef, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { Button, Table } from "flowbite-react";
import ConfirmModal from "../../hooks/ConfirmModal";
import Pagination from "../Pagination/Pagination";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import { useAuth } from "../../context/AuthProvider";
import { Filters } from "../../utils/common/Filters";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN, MANAGER_ROLES, divContainerStyle } from "../../utils/common/constant";
import { createQueryParams } from "../../utils/functions";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, formatDate, setTitle } from "../../utils/utility";
import * as XLSX from "xlsx";
import { BiExport } from "react-icons/bi";
import ListLoader from "../../utils/common/ListLoader";
import CustomerView from "./CustomerView";
import { IoMdEye } from "react-icons/io";
import QuickBooksSyncModel from "../../utils/QuickBooksSyncModel";
import { useConfigs } from "../../context/SiteConfigsProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import ActionDropdown from "../../utils/common/ActionDropdown";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

interface IBillingAddress {
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

interface IShippingAddress {
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

interface IHouseAccount {
  creditlimit: number;
  openingBalance: number;
  currentBalance: number;
}

interface Customer {
  _id: string;
  customerID: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  mainPhone: string;
  homePhone: string;
  company: {
    _id: string;
    name: string;
    currency: {
      _id: string;
      symbol: string;
      code?: string;
    };
  };
  salutation: string;
  spouse: string;
  dateofBirth: string;
  dateofMarriage: string;
  fax: string;
  billingAddress: IBillingAddress;
  shippingAddress: IShippingAddress;
  taxExempt: boolean;
  taxId: string;
  priceLevel: string;
  storeCredit: number;
  pointsEarned: number;
  crmParameters: object;
  houseAccount: IHouseAccount;
}

const Customers = () => {
  setTitle("Customers");
  const { userData } = useAuth();
    const { configData } = useConfigs();
  const socket = useSocket();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages || 1);
  const [numOfRecords, setNumOfRecords] = useState<number>(0);
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

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    sortBy: 'createdAt',
    order: 'desc',
  });

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const columnNames = loginRole === SUPER_ADMIN ?
    ["Sr.No.", "Name", "Business", "Email", "Phone Number", "Address", "Actions"] :
    ["Sr.No.", "Name", "Email", "Phone Number", "Address", "Actions"];

  const sortColumn = ["Name"];
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [selectCustomerId, setSelectCustomerId] = useState("");
  const [selectCustomer, setSelectCustomer] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [btnLoader, setBtnLoader] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const handleCustomerView = (customer: any) => {
    setSelectCustomer(customer);
    setSelectCustomerId(customer?._id);
    setOpenCustomerModal(true);
  };

  const getCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/customer${queryParams}`);

      setCustomers(response.data.data);
      setNumOfRecords(response.data.count);
      setIsLoading(false);
    } catch (error) {
      setCustomers([]);
      setIsLoading(false);
      console.error("~ getCustomers error :-", error);
    }
  }, []);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getCustomers();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getCustomers, location.search]);

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/customer/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true);
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  const handleLimit = (data: any) => {
    setLimit(data);
    setFormData((prev) => {
      const updatedFormData = { ...prev, limit: data, page: 1 };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(1);
  };

  useEffect(() => {
    if (Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")) {
      if (formDataRef.current?.page !== 1) {
        setFormData((prev) => ({ ...prev, page: 1 }));
        setPage(1);
      }
    }
  }, [searchFilter]);

  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setFormData((prev) => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));
    setPage(pageFromURL);
    setLimit(limitFromURL);
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(formDataRef.current);
    setLimit(formDataRef.current?.limit);
    setPage(formDataRef.current?.page);
  }, []);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const handleDelete = async () => {
    const deleteId = selectedId;
    setSelectedId(null);
    setIsModalOpen(false);
    if (!deleteId) return;

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/customer/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
        return;
      }
      setCustomers((prev) => {
        const updated = prev.filter((customer) => customer._id !== deleteId);
        if (updated.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return updated;
      });
      setNumOfRecords((prev: any) => Math.max(0, prev - 1));
      getCustomers();
    } catch (error) {
      setIsLoading(false);
      console.log("Delete customer error:", error);
      toast.error("Failed to delete the customer. Please try again.");
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const socketAllowDataPermission = (data: any) => {
    let status = false;
    if (loginRole === SUPER_ADMIN) {
      status = true;
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
        status = true;
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
        status = true;
      }
    }
    return status;
  };

  useEffect(() => {
    const addCustomer = (customerData: any) => {
      if (socketAllowDataPermission(customerData)) {
        setCustomers((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [customerData, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };

    const updateCustomer = (customerData: any) => {
      setCustomers((prev: any) => prev.map((item: any) => item._id === customerData._id ? customerData : item));
    };

    const updateHouseCredit = (houseCreditData: any) => {
      setCustomers((prev: any) => {
        return prev.map((item: any) => {
          if (item._id === houseCreditData._id) {
            return { ...item, houseAccount: houseCreditData.houseAccount };
          }
          return item;
        });
      });
      setSelectCustomer(houseCreditData);
    };

    const deleteCustomer = (customerData: any) => {
      setCustomers((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(customerData._id));
        if (!exists) return prev;
        const updated = prev.filter((customer: any) => customer._id !== customerData?._id);
        if (updated.length === 0) {
          curPage(page > 1 ? page - 1 : 1);
        }
        return updated;
      });
      getCustomers();
      setNumOfRecords((prev: any) => Math.max(0, prev - 1));
    };

    socket.on("addCustomer", addCustomer);
    socket.on("updateCustomer", updateCustomer);
    socket.on("deleteCustomer", deleteCustomer);
    socket.on("updateCustomerHouseCredit", updateHouseCredit);

    return () => {
      socket.off("addCustomer", addCustomer);
      socket.off("updateCustomer", updateCustomer);
      socket.off("deleteCustomer", deleteCustomer);
      socket.off("updateCustomerHouseCredit", updateHouseCredit);
    };
  }, [socket, page, limit]);

  const formatAddress = (address: any) => {
    if (!address) return '';
    return [
      address.address1 || '',
      address.address2 || '',
      address.city || '',
      address.state || '',
      address.postalCode || '',
      address.country || ''
    ].filter(Boolean).join(', ');
  };

  const exportToExcel = async () => {
    try {
      setBtnLoader(true);
      const combinedData = { ...searchFilter };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/customer${queryParams}`);
      const allCategory: Customer[] | any = response.data?.data;

      const ws = XLSX.utils.json_to_sheet(allCategory?.map((item: any) => ({
        Name: `${item?.firstName || ''} ${item?.lastName || ''}`,
        Fax: item?.fax,
        Email: item?.email,
        PhoneNumber: item?.phoneNumber,
        MainPhone: item?.mainPhone,
        BillingAddress: formatAddress(item?.billingAddress),
        ShippingAddress: formatAddress(item?.shippingAddress),
        Salutation: item?.salutation || '',
        Spouse: item?.spouse || '',
        DateOfBirth: item?.dateofBirth ? formatDate(item.dateofBirth,configData?.dateFormat) : '',
        DateOfMarriage: item?.dateofMarriage ? formatDate(item.dateofMarriage,configData?.dateFormat) : '',
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customer");
      XLSX.writeFile(wb, "Customer.xlsx");
    } catch (error) {
      console.error('~ exportToExcel error :-', error);
    } finally {
      setBtnLoader(false);
    }
  };


  return (
    <div className={divContainerStyle}>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Customer" />
        </div>

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
              <ActionDropdown
                actions={[
                  {
                    label: btnLoader ? "Exporting..." : "Export to Excel",
                    Icon: BiExport,
                    onClick: exportToExcel,
                  },
                ]}
              />

              <Link to="/customer/add">
                <AddActionButton text="Add a new customer" />
              </Link>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="customer" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders
            columnNames={columnNames}
            formData={formData}
            setFormData={setFormData as React.Dispatch<React.SetStateAction<Record<string, any>>>}
            sortColumn={sortColumn}
          />
          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={columnNames.length} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}

            {customers && !isLoading && customers.length > 0 ? (
              customers.map((customer, index) => (
                <Table.Row key={customer._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell
                    className="whitespace-nowrap font-medium text-DARK-900 dark:text-white hover:!text-BRAND-500 cursor-pointer"
                    onClick={() => handleCustomerView(customer)}
                    title={`${customer?.firstName || ''}${customer?.lastName ? ' ' + customer.lastName : ''}`}
                  >
                    {capitalized(customer?.firstName) ?? ''} {capitalized(customer?.lastName) ?? ''}
                  </Table.Cell>
                  {loginRole === SUPER_ADMIN && (
                    <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={customer?.company?.name}>
                      {customer?.company?.name ?? '-'}
                    </Table.Cell>
                  )}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={customer.email}>
                    {customer.email ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={customer.phoneNumber}>
                    {customer.phoneNumber && customer.phoneNumber !== "" ? customer.phoneNumber : '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={customer?.billingAddress?.address1}>
                    {customer?.billingAddress?.address1 ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => handleCustomerView(customer)} size="xs">
                      <IoMdEye className={editBtnStyle.icon} />
                    </Button>
                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/customer/edit/${customer?._id}`)} size="xs">
                      <HiPencil className={editBtnStyle.icon} />
                    </Button>
                    <Button onClick={() => confirmDelete(customer?._id)} className={deleteBtnStyle.btn} size="xs">
                      <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : !isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={columnNames.length} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Customers Found"
                    message="No customers are available right now. Added customers will appear here."
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

      <CustomerView
        openCustomerModal={openCustomerModal}
        setOpenCustomerModal={setOpenCustomerModal}
        selectCustomerId={selectCustomerId}
        selectCustomer={selectCustomer}
      />

      <ConfirmModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this customer ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />

      {openModal && <QuickBooksSyncModel syncType="customer" openModal={openModal} setOpenModal={setOpenModal} />}
    </div>
  );
};

export default Customers;