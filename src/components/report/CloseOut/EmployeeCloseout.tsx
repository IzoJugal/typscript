/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal, Table } from "flowbite-react";
import { useCallback, useEffect, useState, useRef } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import TableHeaders from "../../../utils/common/TableHeaders";
import NoData from "../../../utils/common/NoData";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { createQueryParams } from "../../../utils/functions";
import { capitalized } from "../../../utils/utility";
import ListLoader from "../../../utils/common/ListLoader";
import CommonReportFilter from "../../../utils/CommonReportFilter";

interface IForm {
  fromDate?: string;
  toDate?: string;
  closeOut: string;
  employee?: string;
  company?: string;
  restaurant?: string;
}
interface IStaff {
  _id: string;
  name: string;
  position: string;
  age: number;
  email: string;
  phone: string;
  salary: number;
  passcode: string;
  hireDate: Date;
  isActive: boolean;
}
interface ICloseOut {
  totalOrderCount: string;
  totalAmount: number;
  serverName: string;
  giftCardAmount: number;
  digitalAmount: number;
  cashAmount: number;
  cardAmount: number;
  currency?: {
    symbol?: string;
  };
}

const EmployeeCloseout = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  let employeeID = "";
  if (!OWNER_ROLES.includes(loginRole)) {
    employeeID = `${userData?.staffMember?._id}`;
  }
  const [isLoading, setIsLoading] = useState(true);
  const [closeout, setCloseout] = useState<ICloseOut[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [btnLoader, setBtnLoader] = useState("");
  const [url, setUrl] = useState("");
  const [staffDetail, setStaffDetail] = useState<IStaff[] | []>([]);
  const [formData, setFormData] = useState<IForm>({
    fromDate: "",
    toDate: "",
    closeOut: "",
    employee: employeeID,
    company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
    restaurant: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [showFilters, setShowFilters] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const columnNames = ["Sr.No.", "Employee Name", "No. of Orders", "Payment Breakdown", "Total Amount"];

  const getCompany = useCallback(async () => {
    try {
      const response = await apiClient.get(`/business`);
      setCompanyDetails(response.data.companies);
    } catch (error) {
      setCompanyDetails([]);
      console.error("~ getCompany error :-", error);
    }
  }, []);

  const getRestaurant = useCallback(async (companyId: string) => {
    if (!companyId) return;
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant);
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }, []);

  const getStaff = useCallback(async () => {
    const activeCompany = formData?.company || userData?.staffMember?.company?._id;
    if (!activeCompany || !formData?.restaurant) return;

    try {
      const response = await apiClient.get("/staff/web/all", {
        params: {
          company: activeCompany,
          restaurant: formData?.restaurant,
        },
      });

      setStaffDetail(
        (response.data.data || []).map((item: any) => ({
          ...item,
          name: item.name || item.fullName || item.employeeName,
        }))
      );
    } catch (error) {
      setStaffDetail([]);
      console.error("~ getStaff error :-", error);
    }
  }, [formData?.company, formData?.restaurant, userData?.staffMember?.company?._id]);

  const getCloseoutData = useCallback(async (signal?: AbortSignal) => {
    if (loginRole === SUPER_ADMIN && !formData.company) {
      setCloseout([]);
      setIsLoading(false);
      return;
    }

    const isAdminOrOwner = loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole);
    if (isAdminOrOwner && !formData.restaurant) {
      setCloseout([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = createQueryParams(formData);
      const response = await apiClient.get(`/clock/employee/closeout/report${params}`, { signal });
      if (!signal?.aborted) {
        setCloseout(response?.data?.payroll || []);
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.message === 'canceled') {
        return;
      }
      console.log("Error retrieving closeoutData:", error);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    formData.fromDate,
    formData.toDate,
    formData.company,
    formData.restaurant,
    formData.employee,
    formData.closeOut,
    loginRole
  ]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        getCloseoutData(controller.signal);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [getCloseoutData]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    } else if (userData?.staffMember?.company?._id) {
      const companyId = userData.staffMember.company._id;
      setFormData((prev) => ({ ...prev, company: companyId }));
    }
  }, [loginRole, getCompany, userData?.staffMember?.company?._id]);

  useEffect(() => {
    if (formData?.company) {
      getRestaurant(formData.company);
    } else if (OWNER_ROLES.includes(loginRole) && userData?.staffMember?.company?._id) {
      getRestaurant(userData.staffMember.company._id);
    }
  }, [formData?.company, loginRole, userData?.staffMember?.company?._id, getRestaurant]);

  useEffect(() => {
    if (restaurant?.length === 1 && !formData.restaurant) {
      setFormData((prev) => ({
        ...prev,
        restaurant: restaurant[0]._id,
      }));
    }
  }, [restaurant, formData.restaurant]);

  useEffect(() => {
    if (formData.restaurant) {
      getStaff();
    }
  }, [formData.restaurant, getStaff]);

  const handlePreview = async () => {
    try {
      setBtnLoader("preview");
      const combineData = { ...formData, isPdf: true };
      const params = createQueryParams(combineData);
      const response = await apiClient.get(`/clock/employee/closeout/report${params}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      setUrl(url);
      setOpenModal(true);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        setBtnLoader("");
      }, 100);
    } catch (error: any) {
      console.error("Error retrieving report:", error);
      const errorMessage = error?.response?.data?.message || "No records found!";
      setBtnLoader("");
      toast.error(errorMessage);
    }
  };

  const handlePrint = async () => {
    try {
      setBtnLoader("print");
      const combineData = { ...formData, isPdf: true };
      const params = createQueryParams(combineData);
      const response = await apiClient.get(`/clock/employee/closeout/report${params}`, {
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
      setBtnLoader("");
      console.log("File downloaded successfully.");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "No records found!";
      console.error("Error downloading report:", errorMessage);
      setBtnLoader("");
      toast.error(errorMessage);
    }
  };

  const handleBusiness = (value: string) => {
    setRestaurant([]);
    setStaffDetail([]);
    setFormData((prev) => ({ ...prev, company: value, restaurant: "", employee: "" }));
  };

  const handleEmployee = (value: string) => {
    setFormData((prev) => ({ ...prev, employee: value }));
  };

  const handleRestaurant = (value: string) => {
    setStaffDetail([]);
    setFormData((prev) => ({
      ...prev,
      restaurant: value,
      employee: "",
    }));
  };

  const handleSubmit = (type: string) => {
    if (type === "preview") {
      handlePreview();
    }
    if (type === "print") {
      handlePrint();
    }
  };

  const handleCancel = () => {
    setBtnLoader("");
    setFormData({
      fromDate: "",
      toDate: "",
      closeOut: "",
      employee: employeeID || "",
      company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
      restaurant: "",
    });
    setSelectedRange({ endDate: null, startDate: null });
    setOpenModal(false);
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }
    setStaffDetail([]);
  };

  const handleDateRangeChange = (value: any) => {
    setSelectedRange(value);
    const fromDate = value?.startDate
      ? (value.startDate instanceof Date ? value.startDate.toISOString() : value.startDate)
      : "";
    const toDate = value?.endDate
      ? (value.endDate instanceof Date ? value.endDate.toISOString() : value.endDate)
      : "";

    setFormData((prev) => ({
      ...prev,
      fromDate,
      toDate,
    }));
  };

  const hasFilters =
    !!selectedRange.startDate ||
    !!selectedRange.endDate ||
    (!!formData.company && companyDetails?.length > 1) ||
    (!!formData.restaurant && restaurant?.length > 1) ||
    (!!formData.employee && staffDetail?.length! > 1 && formData.employee !== employeeID);

  return (
    <div>
      <FormHeaderPaths page={"Employee Closeout Report"} prevLink="#" prevPage="Closeout" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end gap-2 w-full sm:w-auto">
          <Button
            size="xs"
            disabled={closeout?.length > 0 ? false : true}
            title={closeout?.length > 0 ? "Preview" : "No Data Available"}
            className="flex-1 sm:flex-none flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 border h-10 sm:w-20"
            onClick={() => handleSubmit("preview")}
          >
            <div className="flex justify-center items-center">
              {btnLoader === "preview" ? "Loading..." : "Preview"}
            </div>
          </Button>
          <Button
            size="xs"
            disabled={closeout?.length > 0 ? false : true}
            title={closeout?.length > 0 ? "Download" : "No Data Available"}
            className="flex-1 sm:flex-none flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 h-10 sm:w-20"
            onClick={() => handleSubmit("print")}
          >
            <div className="flex justify-center items-center">
              {btnLoader === "print" ? "Loading..." : "Download"}
            </div>
          </Button>
        </div>

        <CommonReportFilter
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onClear={handleCancel}
          loginRole={loginRole}
          SUPER_ADMIN={SUPER_ADMIN}
          MANAGER_ROLES={OWNER_ROLES}
          company={formData.company}
          companyDetails={companyDetails}
          restaurant={formData.restaurant}
          restaurantDetails={restaurant}
          handleBusiness={handleBusiness}
          handleRestaurant={handleRestaurant}
          dateFilter={true}
          dateValue={selectedRange}
          onDateChange={handleDateRangeChange}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          showClear={hasFilters}
        >
          {(formData.company || OWNER_ROLES.includes(loginRole)) && (
            <DropdownWithSearch
              setSelectedItem={handleEmployee}
              selectedItem={
                staffDetail?.find((c: any) => c._id === formData?.employee)?.name || ""
              }
              items={staffDetail}
              title="Employee"
              setIsDropdownOpen={setIsEmpDropdownOpen}
              isDropdownOpen={isEmpDropdownOpen}
              handleFilter={handleEmployee}
              fieldKey="employee"
            />
          )}
        </CommonReportFilter>
      </div>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="overflow-x-auto">
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
              {closeout && !isLoading && closeout?.length > 0 ? (
                closeout?.map((item, index) => {
                  return (
                    <Table.Row key={item?.serverName} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                        {index + 1}
                      </Table.Cell>
                      <Table.Cell
                        className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"
                        title={capitalized(item?.serverName)}
                      >
                        {capitalized(item?.serverName) ?? "-"}
                      </Table.Cell>
                      <Table.Cell
                        className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36"
                        title={item?.totalOrderCount}
                      >
                        {item?.totalOrderCount ?? "0"}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36">
                        <span className="block">
                          {item?.cardAmount > 0 &&
                            `Card Amount: ${item?.currency?.symbol || "$"}${item?.cardAmount?.toFixed(2)}`}
                        </span>
                        <span className="block">
                          {item?.cashAmount > 0 &&
                            `Cash Amount: ${item?.currency?.symbol || "$"}${item?.cashAmount?.toFixed(2)}`}
                        </span>
                        <span className="block">
                          {item?.digitalAmount > 0 &&
                            `Digital Amount: ${item?.currency?.symbol || "$"}${item?.digitalAmount.toFixed(2)}`}
                        </span>
                        <span className="block">
                          {item?.giftCardAmount > 0 &&
                            `GiftCard Amount: ${item?.currency?.symbol || "$"}${item?.giftCardAmount?.toFixed(2)}`}
                        </span>
                      </Table.Cell>
                      <Table.Cell
                        className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36"
                        title={item?.totalAmount?.toString()}
                      >
                        {item?.currency?.symbol || "$"}{item?.totalAmount?.toFixed(2) ?? "0"}
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              ) : (
                !isLoading && (
                  <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                    <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                      <NoData
                        title="No Employee Closeout Data Found"
                        message="Employee closeout report data will appear here once available."
                      />
                    </Table.Cell>
                  </Table.Row>
                )
              )}
            </Table.Body>
          </Table>
        </div>
        <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm">
          <Modal.Header>Employee CloseOut Report</Modal.Header>
          <Modal.Body>
            <iframe src={url} width="100%" height="500px" title="report-preview" />
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default EmployeeCloseout;