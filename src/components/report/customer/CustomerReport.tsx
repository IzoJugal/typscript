import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Modal, Table } from "flowbite-react";
import apiClient from "../../../utils/AxiosInstance";
import * as XLSX from "xlsx";
import { HiEye, } from "react-icons/hi";
import { FaArrowCircleDown } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths, } from "../../../utils/HeaderPaths";
import TableHeaders from "../../../utils/common/TableHeaders";
import Pagination from "../../Pagination/Pagination";
import PageSize from "../../Pagination/PageSize";
import NoData from "../../../utils/common/NoData";
import { editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { capitalized } from "../../../utils/utility";
import ListLoader from "../../../utils/common/ListLoader";
import CommonReportFilter from "../../../utils/CommonReportFilter";

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
    name: string;
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
const CustomerReport = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [keys, setKeys] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [url, setUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [company, setCompany] = useState<string | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<string | null>(null);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [btnLoader, setBtnLoader] = useState(false);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(isNaN(+pages) ? 1 : +pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState({ key: "", value: "", company: "", restaurant: "" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const columnNames = ["Sr.No.", "Customer Name", "Email", "Phone Number", "Address", "Country", "Actions"];

  if (loginRole === SUPER_ADMIN) {
    columnNames.splice(3, 0, "Business");
  }

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

  const getCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.post("/customer/detail/report", search, {
        params: {
          limit: Number(limit),
          page: Number(page - 1),
          sort: -1,
        }
      });
      setTimeout(() => {
        setCustomers(response.data.data);
        setNumOfRecords(response.data.total)
        setIsLoading(false)
      }, 500);
    } catch (error) {
      setCustomers([])
      setIsLoading(false)
      console.log("~ getCustomers error :-", error);
    }
  }, [setIsLoading, search.company, search.key, search.restaurant, search.value, limit, page]);

  const { pathname } = useLocation();
  const webView = ['/report/customer/detail/app'];
  const appWebView = webView.includes(pathname);

  const exportToExcel = async () => {
    try {
      setBtnLoader(true);

      const response = await apiClient.post("/customer/detail/report", search);

      if (response.data.status === false) {
        setBtnLoader(false);
        toast.error(response.data?.message)
        return;
      }

      const allCustomers: Customer[] = response.data.data;

      // Map the data to Excel sheet format
      const ws = XLSX.utils.json_to_sheet(allCustomers.map(item => ({
        CustomerId: item?._id,
        CustomerName: item?.firstName + item?.lastName,
        Email: item?.email,
        company: item?.company?.name || '',
        Phone: item?.phoneNumber,
        BillingAddress: [
          item?.billingAddress?.address1,
          item?.billingAddress?.address2,
          item?.billingAddress?.city,
          item?.billingAddress?.state,
          item?.billingAddress?.postalCode
        ].filter(Boolean).join(", ") || '-',
        ShippingAddress: [
          item?.shippingAddress?.address1,
          item?.shippingAddress?.address2,
          item?.shippingAddress?.city,
          item?.shippingAddress?.state,
          item?.shippingAddress?.postalCode
        ].filter(Boolean).join(", ") || '-',
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");

      XLSX.writeFile(wb, "Customer_Report.xlsx");
    } catch (error) {
      console.error('~ exportToExcel error :-', error);
    } finally {
      setBtnLoader(false);
    }
  };

  const handleSearch = () => {
    const searchCriteria: any = { key: keys, value: nameFilter };

    if (company) {
      searchCriteria.company = company;
    }
    if (restaurant) {
      searchCriteria.restaurant = restaurant;
    }

    setSearch((pre: any) => ({ ...pre, ...searchCriteria }));
  };

  const handleClear = () => {
    setNameFilter('')
    setKeys('')
    setCompany('')
    setRestaurant('')
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    if (search.key && search.value || search.company || search.restaurant) {
      setSearch({ key: "", value: "", company: "", restaurant: "" })
    }
  };

  const handlePrint = async (id: string) => {
    try {
      const response = await apiClient.get(`/customer/detail/report/${id}`, {
        responseType: "blob",
      });

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
      console.log("File downloaded successfully.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Customer not found";
      console.error("Error downloading report:", errorMessage);
      toast.error(errorMessage);
    }
  };
  const handlePreview = async (id: string) => {
    try {
      const response = await apiClient.get(`/customer/detail/report/${id}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      setUrl(url)
      setOpenModal(true)
      // Open the blob URL in a new tab for preview
      // window.open(url);

      // Optionally, revoke the object URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100); // Adjust the timeout as necessary

      // console.log("Report preview opened successfully.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Customer not found";
      console.log("Error retrieving report:", errorMessage);
      toast.error(errorMessage);
    }
  };


  const handleBusiness = (value: string) => {
    setCompany(value)
    getRestaurant(value)
  }
  const handleRestaurant = (value: string) => {
    setRestaurant(value)
  }


  useEffect(() => {
    const myParam: any = new URLSearchParams(location.search).get("page");
    const pageNum = myParam ? +myParam : 1;
    setPage(isNaN(pageNum) ? 1 : pageNum);
    getCustomers();
  }, [page, limit, getCustomers,]);

  const handleLimit = (data: any) => {
    curPage(1)
    const adjustedLimit = data > numOfRecords ? numOfRecords : data;
    setLimit(adjustedLimit);
  }

  const curPage = (pageNum: any) => {
    setIsLoading(true);
    const url = `/report/customer/detail/${pageNum}/`;
    setPage(pageNum);
    navigate(url);
  };

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    const url = `/report/customer/detail/1`;
    setPage(1);
    navigate(url);
  }, []);

  useEffect(() => {
    navigateSearchPrams();
  }, [search.company, search.key, search.restaurant, search.value, navigateSearchPrams]);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = !!(
    company ||
    restaurant ||
    keys ||
    nameFilter ||
    (search.key && search.value)
  );

  const shouldShowFilters = hasActiveFilters || customers?.length! > 0;

  const hasFilters =
    !!keys ||
    !!nameFilter ||
    !!company && companyDetails?.length > 1 ||
    !!restaurant && restaurantDetails?.length > 1;

  return (
    <div className="container px-4 sm:px-5 flex flex-col gap-4">
      {/* Heading */}
      <div className="flex flex-col gap-4 -ml-8">

        <FormHeaderPaths page={'Detail Report'} prevLink='#' prevPage='Customer' />
      </div>

      {shouldShowFilters && <CommonReportFilter
        showFilters={showFilters}
        setShowFilters={setShowFilters}

        keys={keys}
        setKeys={setKeys}

        searchValue={nameFilter}
        setSearchValue={setNameFilter}

        options={[
          {
            label: "First Name",
            value: "firstName",
          },
          {
            label: "Last Name",
            value: "lastName",
          },
        ]}

        onSearch={handleSearch}
        onClear={handleClear}

        loginRole={loginRole}
        SUPER_ADMIN={SUPER_ADMIN}
        MANAGER_ROLES={MANAGER_ROLES}

        company={company}
        setCompany={setCompany}
        companyDetails={companyDetails}

        restaurant={restaurant}
        restaurantDetails={restaurantDetails}

        handleBusiness={handleBusiness}
        handleRestaurant={handleRestaurant}

        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}

        showClear={hasFilters}

        appWebView={appWebView}
        exportToExcel={exportToExcel}
        btnLoader={btnLoader}
      />}

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={8} className="text-center py-4">
                <ListLoader />
              </Table.Cell>
            </Table.Row>}
            {customers && customers?.length > 0 && !isLoading ? customers?.map((customer, index) => (
              <Table.Row key={customer._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(customer.lastName)}>{capitalized(customer.firstName) || ''} {customer.lastName || ''} </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={customer.email}>{customer.email || '-'}</Table.Cell>
                {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">{customer.company?.name ? `${capitalized(customer.company?.name)}` : '-'}</Table.Cell>}
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={customer.phoneNumber}>{customer.phoneNumber || '-'}</Table.Cell>
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={customer.billingAddress?.address1}>{customer.billingAddress?.address1 || '-'}</Table.Cell>
                {/* <td className="px-2 py-1 whitespace-nowrap text-sm text-DARK-500 border-b border-DARK-200 truncate max-w-36" title={customer.city}>{customer.city ?? '-'}</td> */}
                <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={customer.billingAddress?.country}>{customer.billingAddress?.country || '-'}</Table.Cell>
                <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className="flex gap-2">
                    <Button onClick={() => handlePreview(customer._id)} title="Preview" className={editBtnStyle.btn} size="xs">
                      <HiEye className={editBtnStyle.icon} />
                    </Button>
                    <Button onClick={() => handlePrint(customer._id)} title="Download" className={editBtnStyle.btn} size="xs">
                      <FaArrowCircleDown className={editBtnStyle.icon} />
                    </Button>
                    {/* <button onClick={() => handlePreview(customer._id)} title="Preview" className={deleteBtnStyle.btn}>
                        <HiEye className={deleteBtnStyle.icon} />
                        <span className="sr-only">Preview</span>
                      </button> */}
                    {/* <button onClick={() => handlePrint(customer._id)} title="Print" className="text-BRAND-500 hover:text-BRAND-600  mr-2">
                        <FaArrowCircleDown className="h-5 w-5" />
                        <span className="sr-only">Print</span>
                      </button> */}
                  </span>
                </Table.Cell>

              </Table.Row>
            )) : isLoading === false && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Customers Found"
                    message="Customer records will appear here once available."
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
        {isLoading === false && numOfRecords > 0 && (
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
      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm">
        <Modal.Header>Customer Detail Report</Modal.Header>
        <Modal.Body>
          <iframe src={url} width="100%" height="500px" />
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default CustomerReport