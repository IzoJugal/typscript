import { Button } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../utils/AxiosInstance";
import * as XLSX from "xlsx";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IPayrollExport {
  fromDate?: string;
  toDate?: string;
  employee: string;
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
  isActive: boolean
}

const ExportPayrollReport = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [btnLoader, setBtnLoader] = useState(false);
  const [formData, setFormData] = useState<IPayrollExport>({
    fromDate: "",
    toDate: "",
    employee: "",
    company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
    restaurant: ""
  });
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [staffDetail, setStaffDetail] = useState<IStaff[] | []>();
  const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
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
        const restaurants = response.data.restaurant || [];

        setRestaurantDetails(restaurants);

        if (restaurants.length === 1) {
          setFormData((prev) => ({
            ...prev,
            restaurant: restaurants[0]._id,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            restaurant: "",
          }));
        }
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  };

  const getStaff = useCallback(async () => {
    try {
      const params = Object.fromEntries(
        Object.entries({
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get('/staff/web/all', { params: params })
      setTimeout(() => {
        setStaffDetail(response.data.data)
      }, 500);
    } catch (error) {
      setStaffDetail([])
      console.error('~ getProduct error :-', error);
    }
  }, [formData.company, formData?.restaurant]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }

    // manager/company login restaurant load
    if (MANAGER_ROLES.includes(loginRole)) {
      getRestaurant(userData?.staffMember?.company?._id);
    }

    // super admin selected company
    if (loginRole === SUPER_ADMIN && formData.company) {
      getRestaurant(formData.company);
    }
  }, [loginRole, formData.company]);

  useEffect(() => {
    if (
      loginRole !== SUPER_ADMIN &&
      !MANAGER_ROLES.includes(loginRole)
    ) {
      getStaff();
      return;
    }

    if (formData.restaurant && formData.company) {
      getStaff();
    }
  }, [
    formData.company,
    formData.restaurant,
    getStaff,
    loginRole,
  ]);

  const handleDateRangeChange = (
    value: { startDate: Date | null; endDate: Date | null }
  ) => {
    setSelectedRange(value);

    const fromDate = value.startDate
      ? value.startDate.toISOString()
      : "";

    const toDate = value.endDate
      ? value.endDate.toISOString()
      : "";

    setFormData((prev) => ({
      ...prev,
      fromDate,
      toDate,
    }));
  };

  const handleSubmit = async () => {
    setBtnLoader(true);
    try {
      const params = Object.fromEntries(
        Object.entries({
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          employee: formData.employee,
          company: formData.company,
          restaurant: formData?.restaurant,
        }).filter(([, value]) => value)
      );
      const response = await apiClient.get(`/clock/employee/payroll/report`, {
        params,
      });

      const payRoll = response.data?.payroll;

      if (payRoll?.length > 0) {
        setTimeout(() => {
          setBtnLoader(false);

          // Process payroll data to calculate totals
          const processedData = payRoll.map((item: any) => {
            const totalHours = item.attendances.reduce((sum: number, attendance: any) => {
              const [hours, minutes] = attendance.hoursWorked.split(":").map(Number);
              return sum + hours + minutes / 60;
            }, 0);

            const totalOrders = item.attendances.reduce(
              (sum: number, attendance: any) => sum + attendance.totalOrders,
              0
            );

            const totalAmount = item.attendances.reduce(
              (sum: number, attendance: any) => sum + attendance.totalAmount,
              0
            );

            const totalTips = item.attendances.reduce(
              (sum: number, attendance: any) => sum + attendance.totalTips,
              0
            );

            return {
              EmployeeName: item.staffName,
              EmployeeRole: item.role,
              TotalHoursWorked: totalHours.toFixed(2),
              TotalOrders: totalOrders,
              TotalAmountSales: totalAmount,
              TotalTips: totalTips,
            };
          });

          const ws = XLSX.utils.json_to_sheet(processedData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Payroll");
          XLSX.writeFile(wb, "Payroll_Report.xlsx");
        }, 1000);
      }
      else {
        setTimeout(() => {
          setBtnLoader(false)
          toast.error("No records found!");
        }, 500);
      }
    } catch (error: any) {
      console.error("Error retrieving report:", error);
      const errorMessage = error?.response?.data?.message || "An error occurred!";
      setTimeout(() => {
        toast.error(errorMessage);
        setBtnLoader(false);
      }, 500);
    }
  };

  const handleCancel = () => {
    setFormData({
      fromDate: "",
      toDate: "",
      employee: "",
      company: loginRole !== SUPER_ADMIN ? userData?.staffMember?.company?._id : "",
      restaurant: ""
    });
    if (loginRole === SUPER_ADMIN) {
      setRestaurantDetails([])
    }
    if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
      setStaffDetail([]);
    }
    setBtnLoader(false); // Reset loader on cancel as well
    setSelectedRange({
      startDate: null,
      endDate: null
    })
  };

  const handleBusiness = (value: string) => {
    setFormData(prev => ({ ...prev, company: value, restaurant: "", employee: "" }));
    setStaffDetail([]);
    // getRestaurant(value);
  }

  const handleRestaurant = (value: string) => {
    setFormData(prev => ({ ...prev, restaurant: value, employee: "", }));
  }
  
  const handleEmployee = (value: string) => {
    setFormData(prev => ({ ...prev, employee: value }));
  }

  const hasFilters =
  !!formData.fromDate ||
  !!formData.toDate ||
  !!formData.employee && staffDetail?.length! > 1 ||
  (restaurantDetails?.length > 1 && !!formData.restaurant) ||
  (
    loginRole === SUPER_ADMIN &&
    !!formData.company
  );

  return (
    <div>
      <FormHeaderPaths page={'Payroll Export'} prevLink='#' prevPage='Employee' />
      <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Payroll Export</h2>
        <form className="space-y-4">
          <div>
            {loginRole === SUPER_ADMIN && (
              <div>
                <label className="block font-medium dark:text-DARK-200">Business</label>
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
            <div className="mt-3">
              <label className="block font-medium dark:text-DARK-200">Restaurant</label>
              <DropdownWithSearch
                setSelectedItem={setFormData}
                selectedItem={restaurantDetails?.find((c: any) => c._id === formData?.restaurant)?.name || ''}
                items={restaurantDetails}
                title="Restaurant"
                handleFilter={handleRestaurant}
                fieldKey="restaurant"
              />
            </div>)}
          {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && <div>
            <label className="block font-medium dark:text-DARK-200">Employee</label>
            <DropdownWithSearch
              setSelectedItem={setFormData}
              selectedItem={staffDetail?.find((c: any) => c._id === formData?.employee)?.name || ''}
              items={staffDetail}
              title="Employee"
              handleFilter={handleEmployee}
              fieldKey="employee"
            />
          </div>}
          <div>
            <label className="block text-sm font-medium text-DARK-700 mb-1 dark:text-DARK-200">Date Filter</label>
            <NewDateRangePicker
              value={selectedRange}
              onChange={handleDateRangeChange}
            />
          </div>
          <div>
            <div className="mb-4 flex items-center space-x-4">
              <Button
                onClick={handleSubmit}
                className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600"
              >
                <div className="flex justify-center items-center">
                  {btnLoader ? "Loading..." : "Export"}
                </div>
              </Button>
              {hasFilters && (
              <Button
                color="failure"
                onClick={handleCancel}
                className="flex gap-1 justify-center items-center"
              >
                <div className="flex justify-center items-center">Clear</div>
              </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportPayrollReport;
