/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { Button } from "flowbite-react";
import { IoPrintSharp } from "react-icons/io5";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import CardLoader from "../../../utils/common/CardLoader";
import { createQueryParams } from "../../../utils/functions";
import { useAuth } from "../../../context/AuthProvider";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import NoData from "../../../utils/common/NoData";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { formatCurrency } from "../../../utils/utility.js";
import CommonReportFilter from "../../../utils/CommonReportFilter.js";

const SalesMatrix = () => {
  const [salesMatrix, setSalesMatrix] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const todayDate = new Date();
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [formData, setFormData] = useState({
    fromDate: todayDate,
    toDate: todayDate,
    company: null,
    restaurant: null,
  });
  const [selectedRange, setSelectedRange] = useState({
    startDate: todayDate,
    endDate: todayDate,
  });
  const [isDefaultCompanySet, setIsDefaultCompanySet] = useState(false);
  const [currency, setCurrency] = useState({
    symbol: "$",
    code: "USD",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [restaurantLoaded, setRestaurantLoaded] = useState(false);

  const lastFetchedParams = useRef<string | null>(null);

  const getRestaurant = useCallback(async (companyId?: string) => {
    if (!companyId) return;
    if (lastFetchedParams.current === `restaurant:${companyId}`) return;
    lastFetchedParams.current = `restaurant:${companyId}`;
    setRestaurantLoaded(false);

    try {
      const response = await apiClient.get(
        `/restaurant/company/${companyId}`
      );

      if (response.data.success) {
        setRestaurant(response.data.restaurant);

        if (response.data.restaurant.length === 1) {
          setFormData(prev => ({
            ...prev,
            restaurant: response.data.restaurant[0]._id,
          }));
        }

        setRestaurantLoaded(true);
      }
    } catch (error) {
      setRestaurantLoaded(true);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await apiClient.get("/business");

      if (response.data.success) {
        const firstCompany = response.data?.companies?.[0]?._id;

        setCompanies(response.data.companies);

        if (firstCompany) {
          setFormData((prev) => ({
            ...prev,
            company: prev.company || firstCompany,
          }));
        }

        setIsDefaultCompanySet(true);
        setShowFilters(true);
      }
    } catch (error: any) {
      console.error("Error fetching companies:", error.message);
    }
  }, [getRestaurant]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      fetchCompanies();
    }
  }, [loginRole, fetchCompanies]);

  useEffect(() => {
    if (formData?.company) {
      getRestaurant(formData.company);
    } else if (
      OWNER_ROLES.includes(loginRole) &&
      userData?.staffMember?.company?._id
    ) {
      setFormData((prev) => ({
        ...prev,
        company: userData.staffMember.company._id,
      }));
    }
  }, [formData.company, loginRole, userData, getRestaurant]);

  const getSalesMatrixReport = useCallback(async () => {
    const paramsKey = `${formData.company}:${formData.restaurant}:${formData.fromDate}:${formData.toDate}`;
    if (lastFetchedParams.current === `report:${paramsKey}`) return;
    lastFetchedParams.current = `report:${paramsKey}`;
    try {
      setLoading(true);
      const queryParams = createQueryParams(formData);
      const response = await apiClient.get(
        `/reports/sales-matrix${queryParams}`
      );
      const { success, data, currency } = response.data;
      if (success) {
        setSalesMatrix(data);
        setCurrency(currency);
        setShowFilters(true);
      } else {
        setSalesMatrix({});
      }
    } catch (error) {
      setSalesMatrix({});
      console.error("Failed to fetch sales matrix report:", error);
    }
    setLoading(false);
  }, [formData.company, formData.restaurant, formData.fromDate, formData.toDate]);

 useEffect(() => {
  if (
    restaurantLoaded &&
    (loginRole !== SUPER_ADMIN ||
      (isDefaultCompanySet && formData.company))
  ) {
    getSalesMatrixReport();
  }
}, [
  restaurantLoaded,
  formData.company,
  formData.restaurant,
  formData.fromDate,
  formData.toDate,
  isDefaultCompanySet,
  loginRole,
]);

  const handleChangeCompany = (value: any) => {
    setFormData((prev) => ({ ...prev, company: value, restaurant: null }));
  };
  const handleChangeRestaurant = (value: any) => {
    setFormData((prev) => ({ ...prev, restaurant: value }));
  };
  const handleDateRangeChange = (
    value: { startDate: Date | null; endDate: Date | null } | any
  ) => {
    setSelectedRange(value);
    if (value?.startDate && value?.endDate) {
      setFormData((prev) => ({
        ...prev,
        fromDate: value?.startDate,
        toDate: value?.endDate,
      }));
    }
  };

  const handleClear = () => {
    setFormData({
      company: null,
      fromDate: todayDate,
      toDate: todayDate,
      restaurant: null,
    });

    setSelectedRange({
      startDate: todayDate,
      endDate: todayDate,
    });

    setRestaurant([]);
    lastFetchedParams.current = null;

    if (loginRole === SUPER_ADMIN) {
      setIsDefaultCompanySet(false);
      fetchCompanies();
    }
  };

  const [btnLoading, setBtnLoading] = useState(false);

  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 10,
    },
    title: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "bold",
    },
    category: {
      marginBottom: 20,
      fontSize: 14,
      fontWeight: "bold",
    },
    product: {
      marginBottom: 5,
    },
    total: {
      fontWeight: "bold",
    },
  });

  const PDFDocumentComponent = ({
    salesMatrix,
    currency,
  }: {
    salesMatrix: any;
    currency: { symbol: string; code: string };
  }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Sales Matrix Report</Text>
        {Object.entries(salesMatrix).map(
          ([category, products]: [string, any], catIndex: number) => (
            <View key={catIndex} wrap={false}>
              <Text style={styles.category}>{category}</Text>
              {Object.entries(products).map(
                (
                  [productName, salesAmount]: [string, unknown],
                  prodIndex: number
                ) => (
                  <Text
                    key={prodIndex}
                    style={[
                      styles.product,
                      ...(productName === "totalAmount" ? [styles.total] : []),
                    ]}
                  >
                    {productName === "totalAmount"
                      ? "Total Amount"
                      : productName}
                    :{formatCurrency(salesAmount as number, currency?.code)}
                  </Text>
                )
              )}
            </View>
          )
        )}
      </Page>
    </Document>
  );

  const generatePDF = async () => {
    setBtnLoading(true);
    try {
      const blob = await pdf(
        <PDFDocumentComponent salesMatrix={salesMatrix} currency={currency} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "SalesMatrixReport.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div>
      <FormHeaderPaths
        page={"Sales Matrix Report"}
        prevLink="#"
        prevPage="Sales"
      />
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-4">
        <main className="relative  bg-white dark:bg-DARK-800 p-8 shadow-md rounded-lg">
          <h1 className="text-3xl font-bold mb-6 dark:text-white">
            Sales Matrix Report
          </h1>

          <div className="mx-auto mb-4">
            <div className="flex justify-end mb-4">
              {Object.keys(salesMatrix).length > 0 && (
                <Button
                  onClick={generatePDF}
                  disabled={btnLoading}
                  className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600"
                >
                  <span className="flex items-center gap-2">
                    <IoPrintSharp />
                    {btnLoading ? "Loading..." : "Download PDF"}
                  </span>
                </Button>
              )}
            </div>

            <CommonReportFilter
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onClear={handleClear}
              loginRole={loginRole}
              SUPER_ADMIN={SUPER_ADMIN}
              MANAGER_ROLES={OWNER_ROLES}
              company={formData.company}
              restaurant={formData.restaurant}
              companyDetails={companies}
              restaurantDetails={restaurant}
              handleBusiness={handleChangeCompany}
              handleRestaurant={handleChangeRestaurant}
              dateFilter={true}
              dateValue={selectedRange}
              onDateChange={handleDateRangeChange}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              showClear={true}
            />
          </div>

          {loading ? (
            <div className="text-center">
              <CardLoader count={3} rows={3} />
            </div>
          ) : Object.keys(salesMatrix).length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(salesMatrix).map(
                  ([category, products]: any) => (
                    <div
                      key={category}
                      className="bg-white dark:bg-DARK-700 shadow rounded-lg p-4 border border-DARK-200"
                    >
                      <h2 className="text-xl font-bold tracking-tight text-DARK-900 dark:text-white">
                        {category}
                      </h2>

                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-sm text-DARK-600 border-b dark:text-DARK-200">
                            <th className="pb-2">Product Name</th>
                            <th className="pb-2 text-right">Sales Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(products).map(
                            ([productName, salesAmount]: any) => (
                              <tr
                                key={productName}
                                className={`text-DARK-700 dark:text-DARK-300 border-b last:border-none ${productName === "totalAmount"
                                  ? "font-bold"
                                  : ""
                                  }`}
                              >
                                <td className="py-2">
                                  {productName === "totalAmount"
                                    ? "Total Amount"
                                    : productName}
                                </td>
                                <td className="py-2 text-right">
                                  {formatCurrency(salesAmount, currency?.symbol)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-DARK-500 mt-10">
              <NoData
                title="No Sales Found"
                message="No sales matrix records are available right now. Added sales matrix records will appear here."
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SalesMatrix;