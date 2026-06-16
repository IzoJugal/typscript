import { Button } from "flowbite-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { useNavigate } from "react-router-dom";
import { capitalized, checkAccess } from "../utility";
import { ModuleName, SKELETON_THEME } from "../common/constant";
import { FaUsers } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface CustomerDetailsProps {
  customers: User[];
  isLoading: boolean;
  isDarkMode: boolean
}

const CustomerDetails = ({ customers, isLoading, isDarkMode }: CustomerDetailsProps) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const hasAccess = checkAccess(ModuleName.ORDERS, userData);
  const handleCustomer = () => {
    if (hasAccess) {
      navigate('/customer/1');
    } else {
      navigate('#');
    }
  }
  return (
    <>
      {isLoading ? (
        <SkeletonTheme
          baseColor={isDarkMode ? SKELETON_THEME.dark.baseColor : SKELETON_THEME.light.baseColor}
          highlightColor={isDarkMode ? SKELETON_THEME.dark.highlightColor : SKELETON_THEME.light.highlightColor}
          borderRadius={12}
        >
          <Skeleton count={1} height={394} className="my-1 rounded-xl" />
        </SkeletonTheme>
      ) : (
        <div className="bg-white dark:bg-DARK-800 border border-gray-100 dark:border-DARK-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-base font-bold text-DARK-900 dark:text-white flex items-center gap-2">
                <FaUsers className="text-BRAND-600" /> Customers
              </h2>
              <p className="text-[10px] text-DARK-400 dark:text-DARK-500 font-medium">Recently joined customers</p>
            </div>
            <Button
              onClick={handleCustomer}
              className="!bg-BRAND-50 hover:!bg-BRAND-100 dark:!bg-BRAND-950/40 dark:hover:!bg-BRAND-900/30 !text-BRAND-700 dark:!text-BRAND-400 !border-BRAND-100/50 dark:!border-BRAND-800/30 !ring-0 rounded-xl px-2"
              size="xs"
            >
              <span className="text-[12px] font-bold">View All</span>
            </Button>
          </div>
          <div className="p-6 pt-0 flex-1 overflow-hidden flex flex-col">
            {customers?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-DARK-900 rounded-lg shadow-md">
                  <thead className="bg-gradient-to-r from-BRAND-50 to-BRAND-100 dark:from-DARK-700 dark:to-DARK-700 text-DARK-600 dark:text-DARK-300 uppercase text-[12px] font-medium">
                    <tr>
                      <th className="py-3 px-4 text-left">#</th>
                      <th className="py-3 px-4 text-left">Customer Name</th>
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Phone</th>
                      {/* <th className="py-3 px-4 text-left">Address</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer, index) => (
                      <tr
                        key={index}
                        className="hover:bg-BRAND-50 dark:hover:bg-DARK-700 even:bg-DARK-50 dark:even:bg-DARK-800 odd:bg-white dark:odd:bg-DARK-900 transition-colors duration-300"
                      >
                        <td className="p-3 text-sm text-DARK-800 dark:text-DARK-200">{index + 1}</td>
                        <td
                          className="p-3 text-sm text-DARK-700 dark:text-DARK-300 truncate max-w-[120px]"
                          title={`${customer?.firstName || ''}${customer?.lastName ? ' ' + customer.lastName : ''}`}
                        >
                          {customer?.firstName ? capitalized(customer.firstName) : "-"}{" "}
                          {customer?.lastName && capitalized(customer.lastName)}
                        </td>
                        <td className="p-3 text-sm text-DARK-700 dark:text-DARK-300 truncate max-w-[180px]" title={customer?.email}>
                          {customer?.email || "-"}
                        </td>
                        <td className="p-3 text-sm text-DARK-700 dark:text-DARK-300 truncate max-w-[120px]">
                          {customer?.phoneNumber || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-DARK-500 dark:text-DARK-400 font-medium">No customers available.</p>
            )}
          </div>
        </div>
      )}
    </>
  );

};


export default CustomerDetails;
