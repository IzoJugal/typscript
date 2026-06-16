/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { toast } from "react-toastify";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { createQueryParams } from "../../../utils/functions";
import { formatDate } from "../../../utils/utility";
import { useDarkMode } from "../../../context/DarkModeProvider";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  pdf,
} from "@react-pdf/renderer";
import { useConfigs } from "../../../context/SiteConfigsProvider";
import CommonReportFilter from "../../../utils/CommonReportFilter";

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
interface ILateReport {
  _id: string;
  closeOut: string;
  fromDate: string;
  toDate: string;
  company?: string;
  employee?: string;
  restaurant?: string;
}

const ConsolidatedCloseout = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const { configData } = useConfigs();
  let employeeID = "";
  if (!OWNER_ROLES.includes(loginRole)) {
    employeeID = `${userData?.staffMember?._id}`;
  }
  const [formData, setFormData] = useState<ILateReport>({
    _id: "",
    closeOut: "",
    fromDate: "",
    toDate: "",
    company: "",
    employee: employeeID,
    restaurant: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [closeout, setCloseout] = useState<any>({});
  const [btnLoader, setBtnLoader] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [companyAddress, setCompanyAddress] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [staffDetail, setStaffDetail] = useState<IStaff[] | []>();
  const [selectedRange, setSelectedRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const previousRequest = useRef("__INITIAL__");
  const pendingRestaurantLoad = useRef(false);

  const currency = closeout?.currency?.symbol || configData?.currency?.symbol;

  const getCompany = useCallback(async () => {
    try {
      const response = await apiClient.get(`/business`);
      setTimeout(() => {
        setCompanyDetails(response.data.companies);
      }, 500);
    } catch (error) {
      setCompanyDetails([]);
      console.error("~ getCompany error :-", error);
    }
  }, [loginRole, formData.company]);

  const selectedCompany = companyDetails?.find(
    (c: any) => c._id === formData?.company
  );

  const getCompanyAddress = useCallback(async () => {
    if (!selectedCompany?._id) return;

    try {
      const response = await apiClient.get(
        `/configs/getByCompany/${selectedCompany._id}`
      );
      setCompanyAddress(response.data.data);
    } catch (error) {
      setCompanyAddress(null);
    }
  }, [selectedCompany?._id]);

  const getRestaurant = useCallback(async (companyId: string) => {
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant);
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }, [formData?.company]);

  const selectedRestaurant = restaurant?.find(
    (r: any) => r._id === formData?.restaurant
  );

  const getStaff = useCallback(async () => {
    const companyId = formData?.company || userData?.staffMember?.company?._id;
    if (!companyId) return;
    try {
      const response = await apiClient.get("/staff/web/all", {
        params: { company: companyId, restaurant: formData?.restaurant || "" },
      });
      setStaffDetail(response.data.data);
    } catch (error) {
      setStaffDetail([]);
    }
  }, [formData?.company, formData?.restaurant]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN && selectedCompany?._id) {
      getCompanyAddress();
    }
  }, [selectedCompany?._id, loginRole]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }
  }, [loginRole]);

  useEffect(() => {
    if (formData?.company) {
      pendingRestaurantLoad.current = true;
      getRestaurant(formData.company);
    } else if (
      OWNER_ROLES.includes(loginRole) &&
      userData?.staffMember?.company?._id
    ) {
      pendingRestaurantLoad.current = true;
      getRestaurant(userData.staffMember.company._id);
    }
  }, [formData.company]);

  useEffect(() => {
  const companyId =
    formData?.company || userData?.staffMember?.company?._id;

  if (!companyId || !formData.restaurant) return;

  getStaff();
}, [formData.company, formData.restaurant]);

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

  const getCloseoutData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = createQueryParams(formData);
      const employee = formData?.employee;
      const response = await apiClient.get(
        `/reports/closeout/${employee}${params}`
      );
      if (response.data.success === true) {
        setTimeout(() => {
          setCloseout(response?.data?.data);
          setIsLoading(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCloseout({});
          setIsLoading(false);
        }, 200);
      }
    } catch (error) {
      console.log("Error retrieving closeoutData:", error);
    }
  }, [setIsLoading, formData]);

  useEffect(() => {
    const params = createQueryParams(formData);
    const requestKey = `${formData.employee}${params}`;

    if (previousRequest.current === requestKey) return;

    previousRequest.current = requestKey;

    getCloseoutData();
  }, [formData]);

  const formatKey = (key: string): string =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const { isDarkMode } = useDarkMode();

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 30,
      fontSize: 10,
    },
    title: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
      fontFamily: "Times-Bold",
    },
    date: {
      marginBottom: 20,
      textAlign: "right",
      fontSize: 10,
    },
    center: {
      alignItems: "center",
      marginBottom: 5,
    },
    companyName: {
      fontSize: 11,
      fontFamily: "Times-Bold",
      textAlign: "center",
    },
    address: {
      fontSize: 9,
      textAlign: "center",
      marginBottom: 5,
    },
    dateRange: {
      textAlign: "right",
      marginBottom: 10,
      fontSize: 10,
    },
    line: {
      borderBottomWidth: 1,
      borderBottomColor: "black",
      width: "100%",
      marginVertical: 10,
    },
    columns: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    column: {
      width: "48%",
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      marginBottom: 5,
    },
    keyValue: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    key: {
      fontSize: 10,
      fontFamily: "Times-Roman",
    },
    value: {
      fontSize: 12,
      fontFamily: "Times-Roman",
    },
    nested: {
      marginLeft: 20,
    },
  });

  const SimpleSectionPDF = ({
    title,
    data,
    currency,
    noCurrencyKeys = [],
  }: {
    title: string;
    data: any;
    currency: string;
    noCurrencyKeys?: string[];
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {Object.entries(data || {}).map(([key, value]: [string, any]) => {
        const useCurrency = !noCurrencyKeys.includes(key);
        const formattedValue = useCurrency
          ? `${currency} ${parseFloat(value || 0).toFixed(2)}`
          : value;
        return (
          <View key={key} style={styles.keyValue}>
            <Text style={styles.key}>{formatKey(key)}:</Text>
            <Text style={styles.value}>{formattedValue}</Text>
          </View>
        );
      })}
    </View>
  );

  const CategorySalesPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CATEGORY SALES</Text>
      {Object.entries(data || {}).map(([key, value]: [string, any]) => (
        <View key={key} style={styles.keyValue}>
          <Text style={styles.key}>
            {formatKey(key)} ({value?.count || 0}):
          </Text>
          <Text style={styles.value}>
            {currency}{" "}
            {parseFloat(value?.totalSales || 0).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );

  const OrdersSummaryPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ORDERS SUMMARY</Text>
      {Object.entries(data || {}).map(([key, value]: [string, any]) => (
        <View key={key} style={styles.keyValue}>
          <Text style={styles.key}>
            {formatKey(key)} ({value?.count || 0}):
          </Text>
          <Text style={styles.value}>
            {currency}{" "}
            {parseFloat(value?.amount || 0).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );

  const VoidTransactionPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>VOID TRANSACTION</Text>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Count:</Text>
        <Text style={styles.value}>{data?.count || 0}</Text>
      </View>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Amount:</Text>
        <Text style={styles.value}>
          {currency}{" "}
          {parseFloat(data?.amount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const ReturnTransactionPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>RETURN TRANSACTION</Text>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Count:</Text>
        <Text style={styles.value}>{data?.count || 0}</Text>
      </View>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Amount:</Text>
        <Text style={styles.value}>
          {currency}{" "}
          {parseFloat(data?.amount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const PayInPayOutPDF = ({
    payIn,
    payOut,
    currency,
  }: {
    payIn: string | number;
    payOut: string | number;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>PAY IN / PAY OUT</Text>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Pay In:</Text>
        <Text style={styles.value}>
          {currency}{" "}
          {parseFloat(String(payIn || 0)).toFixed(2)}
        </Text>
      </View>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Pay Out:</Text>
        <Text style={styles.value}>
          {currency}{" "}
          {parseFloat(String(payOut || 0)).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const MainCategorySalesPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>MAIN CATEGORY SALES</Text>
      {Object.entries(data || {}).map(([mainKey, mainValue]: [string, any]) => (
        <View key={mainKey}>
          <View style={styles.keyValue}>
            <Text style={styles.key}>{formatKey(mainKey)}:</Text>
            <Text style={styles.value}>
              {currency}{" "}
              {parseFloat(mainValue?.grandTotal || 0).toFixed(2)}
            </Text>
          </View>
          {Object.entries(mainValue || {})
            .filter(([sk]) => sk !== "grandTotal" && sk !== "count")
            .map(([subKey, subValue]: [string, any]) =>
              subValue && typeof subValue === "object" ? (
                <View key={subKey} style={styles.nested}>
                  <View style={styles.keyValue}>
                    <Text style={styles.key}>
                      {formatKey(subKey)} ({subValue?.count || 0}):
                    </Text>
                    <Text style={styles.value}>
                      {currency}{" "}
                      {parseFloat(subValue?.totalSales || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : null
            )}
        </View>
      ))}
    </View>
  );

  const EmployeeSalesPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => {
    let grandTotal = 0;
    data?.forEach((emp: any) => {
      grandTotal += parseFloat(emp?.totalAmount || 0);
    });
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMPLOYEE SALES</Text>
        {data?.map((emp: any) => (
          <View key={emp?.serverId} style={{ marginBottom: 10 }}>
            <View style={styles.keyValue}>
              <Text style={styles.key}>
                {emp?.serverName} ({emp?.totalOrderCount || 0}):
              </Text>
              <Text style={styles.value}>
                {currency}{" "}
                {parseFloat(emp?.totalAmount || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.keyValue}>
          <Text style={[styles.key, { fontFamily: "Times-Bold" }]}>
            Grand Total:
          </Text>
          <Text style={[styles.value, { fontFamily: "Times-Bold" }]}>
            {currency}{" "}
            {grandTotal.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const TaxExemptionsPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>TAX EXEMPTIONS</Text>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Orders:</Text>
        <Text style={styles.value}>{data?.orderCount || 0}</Text>
      </View>
      <View style={styles.keyValue}>
        <Text style={styles.key}>Total Exemption Tax Amount:</Text>
        <Text style={styles.value}>
          {currency}{" "}
          {parseFloat(data?.totalExemptionTaxAmount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const CashRegistersPDF = ({
    data,
    currency,
  }: {
    data: any;
    currency: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CASH REGISTERS</Text>
      <Text style={{ fontFamily: "Times-Bold", marginBottom: 5 }}>
        Cash Register Totals
      </Text>
      {Object.entries(data?.cashRegisterTotals || {})
        .filter(([key]) => key !== "currencyCounts")
        .map(([key, value]: [string, any]) => {
          const displayValue =
            typeof value === "number"
              ? value
              : `${currency} ${parseFloat(value).toFixed(2)}`;
          return (
            <View key={key} style={styles.keyValue}>
              <Text style={styles.key}>{formatKey(key)}:</Text>
              <Text style={styles.value}>{displayValue}</Text>
            </View>
          );
        })}
      {data?.cashRegisterTotals?.currencyCounts && (
        <View style={styles.nested}>
          <Text style={{ marginBottom: 5 }}>Currency Counts</Text>
          {Object.entries(data.cashRegisterTotals.currencyCounts).map(
            ([denom, count]: [string, any]) => {
              if (typeof count === "object" && count !== null) {
                if (currency === "$") {
                  return (
                    <View key={denom}>
                      <Text style={{ marginBottom: 3, marginLeft: 10 }}>
                        Cents
                      </Text>
                      {Object.entries(count).map(
                        ([cent, centCount]: [string, any]) => (
                          <View
                            key={cent}
                            style={[styles.keyValue, { marginLeft: 20 }]}
                          >
                            <Text style={styles.key}>{cent}¢:</Text>
                            <Text style={styles.value}>{centCount}</Text>
                          </View>
                        )
                      )}
                    </View>
                  );
                }
                return null;
              }
              return (
                <View key={denom} style={[styles.keyValue, { marginLeft: 10 }]}>
                  <Text style={styles.key}>
                    {currency}{" "}
                    {denom}:
                  </Text>
                  <Text style={styles.value}>{count}</Text>
                </View>
              );
            }
          )}
        </View>
      )}
      {data?.cashRegisterByDevice?.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontFamily: "Times-Bold", marginBottom: 5 }}>
            Cash Register By Device
          </Text>
          {data.cashRegisterByDevice.map((device: any) => (
            <View
              key={device._id}
              style={{
                marginBottom: 10,
                padding: 5,
                border: "1px solid black",
                borderRadius: 2,
              }}
            >
              <View style={styles.keyValue}>
                <Text style={styles.key}>
                  Device: {device.deviceName || device.deviceID}
                </Text>
                <Text style={styles.value}>Status: {device.status}</Text>
              </View>
              {[
                "openingBalance",
                "currentBalance",
                "closingBalance",
                "payIn",
                "payOut",
              ].map((field) => (
                <View key={field} style={styles.keyValue}>
                  <Text style={styles.key}>{formatKey(field)}:</Text>
                  <Text style={styles.value}>
                    {currency}{" "}
                    {parseFloat(device[field] || 0).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const TransactionTotalPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF
      {...props}
      title="TRANSACTION TOTALS"
      noCurrencyKeys={[
        "totalOrders",
        "noOfCardTransactions",
        "noOfCashTransactions",
      ]}
    />
  );

  const TipsAndGratuityPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF {...props} title="TIPS AND GRATUITY" />
  );

  const ExpectedTotalsPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF {...props} title="EXPECTED TOTALS" />
  );

  const EmployeeStatsPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF
      {...props}
      title="EMPLOYEE STATS"
      noCurrencyKeys={["guests"]}
    />
  );

  const CashTotalPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF {...props} title="CASH TOTAL" />
  );

  const GiftDataPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF {...props} title="GIFT DATA" />
  );

  const OtherDataPDF = (props: { data: any; currency: string }) => (
    <SimpleSectionPDF {...props} title="OTHER DATA" />
  );

  const PDFDocumentComponent = (props: {
    closeout: any;
    formData: ILateReport;
    selectedCompany: any;
    selectedRestaurant: any;
    companyAddress: any;
    currency: string;
  }) => {
    const {
      closeout,
      formData,
      selectedCompany,
      selectedRestaurant,
      companyAddress,
    } = props;
    const currencyObj = closeout?.currency;
    const currency = (currencyObj?.code === "USD" || currencyObj?.symbol === "$")
      ? "$"
      : currencyObj?.code || currencyObj?.symbol;
    const { fromDate, toDate } = formData || "";
    let dateRangeTitle = "";

    if (fromDate && toDate) {
      dateRangeTitle = `From ${formatDate(fromDate, configData?.dateFormat)} To ${formatDate(
        toDate, configData?.dateFormat
      )}`;
    } else if (fromDate) {
      dateRangeTitle = `From ${formatDate(fromDate, configData?.dateFormat)}`;
    } else if (toDate) {
      dateRangeTitle = `To ${formatDate(toDate, configData?.dateFormat)}`;
    } else {
      dateRangeTitle = "No date range selected";
    }

    const formatAddress = (address: any) => {
      if (!address || typeof address !== "object") return "";

      return [
        address.address1 || address.street,
        address.address2,
        address.city,
        address.state,
        address.country,
        address.zip || address.zipCode,
      ]
        .filter(Boolean)
        .join(", ");
    };

    const formattedCompanyAddress = formatAddress(companyAddress?.address);
    const formattedRestaurantAddress = formatAddress(
      selectedRestaurant?.address
    );

    return (
      <Document>
        <Page size="LETTER" orientation="landscape" style={styles.page}>
          <Text style={styles.title}>CloseOut Report</Text>
          <Text style={styles.date}>Date: {formatDate(new Date(), configData?.dateFormat)}</Text>
          <View style={styles.center}>
            <Text style={styles.companyName}>
              Company: {selectedCompany?.name || "Company Name"}
            </Text>
            {formattedCompanyAddress && (
              <Text style={styles.address}>{formattedCompanyAddress}</Text>
            )}
          </View>
          {selectedRestaurant?.name && (
            <View style={styles.center}>
              <Text style={[styles.companyName, { fontSize: 10 }]}>
                Restaurant: {selectedRestaurant.name}
              </Text>
              {formattedRestaurantAddress && (
                <Text style={styles.address}>{formattedRestaurantAddress}</Text>
              )}
            </View>
          )}
          <Text style={styles.dateRange}>{dateRangeTitle}</Text>
          <View style={styles.line} />
          <View style={styles.columns}>
            <View style={styles.column}>
              <TransactionTotalPDF
                data={closeout?.transactionTotal}
                currency={currency}
              />
              <TipsAndGratuityPDF
                data={closeout?.tipsAndGratuity}
                currency={currency}
              />
              <ExpectedTotalsPDF
                data={closeout?.expectedTotals}
                currency={currency}
              />
              <EmployeeStatsPDF
                data={closeout?.employeeStats}
                currency={currency}
              />
              <CashTotalPDF data={closeout?.cashTotal} currency={currency} />
              <VoidTransactionPDF
                data={closeout?.voidTransaction}
                currency={currency}
              />
              <ReturnTransactionPDF
                data={closeout?.returnTransaction}
                currency={currency}
              />
              <TaxExemptionsPDF
                data={closeout?.taxExemptions}
                currency={currency}
              />
            </View>
            <View style={styles.column}>
              <CategorySalesPDF
                data={closeout?.categorySales}
                currency={currency}
              />
              <PayInPayOutPDF
                payIn={closeout?.payIn}
                payOut={closeout?.payOut}
                currency={currency}
              />
              <OrdersSummaryPDF
                data={closeout?.ordersSummary}
                currency={currency}
              />
              <GiftDataPDF data={closeout?.giftData} currency={currency} />
              <OtherDataPDF data={closeout?.otherData} currency={currency} />
              <MainCategorySalesPDF
                data={closeout?.mainCategorySales}
                currency={currency}
              />
              <CashRegistersPDF
                data={closeout?.cashRegisters}
                currency={currency}
              />
            </View>
          </View>
          <View style={styles.line} />
          <EmployeeSalesPDF
            data={closeout?.employeeSales}
            currency={currency}
          />
          <View style={styles.line} />
        </Page>
      </Document>
    );
  };

  const handlePreview = async () => {
    if (Object.entries(closeout)?.length === 0) {
      toast.error("Consolidated Closeout not available at this time.");
      return;
    }

    try {
      setBtnLoader("preview");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setOpenModal(true);
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoader("");
    }
  };

  const handlePrint = async () => {
    if (Object.entries(closeout)?.length === 0) {
      toast.error("Consolidated Closeout not available at this time.");
      return;
    }
    try {
      setBtnLoader("print");
      const blob = await pdf(
        <PDFDocumentComponent
          closeout={closeout}
          formData={formData}
          selectedCompany={selectedCompany}
          selectedRestaurant={selectedRestaurant}
          companyAddress={companyAddress}
          currency={currency}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "CloseOut_report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error generating PDF");
    } finally {
      setBtnLoader("");
    }
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
      _id: "",
      closeOut: "",
      fromDate: "",
      toDate: "",
      company: "",
      employee: employeeID,
      restaurant: "",
    });
    setSelectedRange({
      startDate: null,
      endDate: null,
    });
    setOpenModal(false);

    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }

    setStaffDetail([]);
  };

  const handleBusiness = (value: string) => {
    setFormData((prev) => ({ ...prev, company: value, employee: "" }));
  };
  const handleEmployee = (value: string) => {
    setFormData((prev) => ({ ...prev, employee: value }));
  };

  const handleRestaurant = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      restaurant: value,
      employee: "",
    }));
  };

  // Component for Transaction Total
  const TransactionTotalCard = ({ data }: { data: any }) => {
    const orderedKeys = Object.keys(data).filter(
      key => key !== "totalOrders" && key !== "totalTransactions"
    );
    orderedKeys.push("totalOrders", "totalTransactions");

    return (
      <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
        <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
          Transaction Total
        </h5>
        <div className="space-y-2">
          {orderedKeys.map((key) => {
            const value = data[key];
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-DARK-700 dark:text-DARK-200">
                  {formatKey(key)}
                </span>
                <span className="font-medium text-DARK-900 dark:text-white">
                  {["totalOrders", "noOfCardTransactions", "noOfCashTransactions"].includes(key)
                    ? value
                    : `${currency}${parseFloat(value).toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Component for Tips and Gratuity
  const TipsAndGratuityCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Tips And Gratuity
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-DARK-700 dark:text-DARK-200">
              {formatKey(key)}
            </span>
            <span className="font-medium text-DARK-900 dark:text-white">
              {currency}
              {parseFloat(value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Expected Totals
  const ExpectedTotalsCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Expected Totals
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-DARK-700 dark:text-DARK-200">
              {formatKey(key)}
            </span>
            <span className="font-medium text-DARK-900 dark:text-white">
              {currency}
              {parseFloat(value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Employee Stats
  const EmployeeStatsCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Employee Stats
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-DARK-700 dark:text-DARK-200">
              {formatKey(key)}
            </span>
            <span className="font-medium text-DARK-900 dark:text-white">
              {key === "guests"
                ? value
                : `${currency}${parseFloat(value).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Category Sales
  const CategorySalesCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Category Sales
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-DARK-700 dark:text-DARK-200">
              {formatKey(key)} ({value.count})
            </span>
            <span className="font-medium text-DARK-900 dark:text-white">
              {currency}
              {parseFloat(value.totalSales).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Cash Total
  const CashTotalCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Cash Total
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-DARK-700 dark:text-DARK-200">
              {formatKey(key)}
            </span>
            <span className="font-medium text-DARK-900 dark:text-white">
              {currency}
              {parseFloat(value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Orders Summary
  const OrdersSummaryCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Orders Summary
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-DARK-700 dark:text-DARK-200">
              {formatKey(key)} ({value.count})
            </span>
            <span className="font-medium text-DARK-900 dark:text-white">
              {currency}
              {parseFloat(value.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Gift Data
  // const GiftDataCard = ({ data }: { data: any }) => (
  //   <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
  //     <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
  //       Gift Data
  //     </h5>
  //     <div className="space-y-2">
  //       {Object.entries(data).map(([key, value]: any) => (
  //         <div key={key} className="flex justify-between text-sm">
  //           <span className="text-DARK-700 dark:text-DARK-200">
  //             {formatKey(key)}
  //           </span>
  //           <span className="font-medium text-DARK-900 dark:text-white">
  //             {currency}
  //             {parseFloat(value).toFixed(2)}
  //           </span>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  // // Component for Other Data
  // const OtherDataCard = ({ data }: { data: any }) => (
  //   <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
  //     <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
  //       Other Data
  //     </h5>
  //     <div className="space-y-2">
  //       {Object.entries(data).map(([key, value]: any) => (
  //         <div key={key} className="flex justify-between text-sm">
  //           <span className="text-DARK-700 dark:text-DARK-200">
  //             {formatKey(key)}
  //           </span>
  //           <span className="font-medium text-DARK-900 dark:text-white">
  //             {currency}
  //             {parseFloat(value).toFixed(2)}
  //           </span>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  // Component for Void Transaction
  const VoidTransactionCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Void Transaction
      </h5>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Count</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {data.count}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Amount</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {currency}
            {parseFloat(data.amount).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  // Component for Return Transaction
  const ReturnTransactionCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Return Transaction
      </h5>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Count</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {data.count}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Amount</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {currency}
            {parseFloat(data.amount).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  // Component for Pay In / Pay Out
  const PayInPayOutCard = ({
    payIn,
    payOut,
  }: {
    payIn: string;
    payOut: string;
  }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Pay In / Pay Out
      </h5>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Pay In</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {currency}
            {parseFloat(payIn).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Pay Out</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {currency}
            {parseFloat(payOut).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  // Component for Employee Sales
  const EmployeeSalesCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Employee Sales
      </h5>
      <div className="space-y-2">
        {data.map((item: any) => (
          <div key={item?.serverId} className="space-y-1">
            <div className="flex justify-between text-sm font-medium text-DARK-900 dark:text-white">
              <span>
                {item?.serverName} ({item?.totalOrderCount})
              </span>
              <span>
                {currency}
                {parseFloat(item?.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-DARK-600 dark:text-DARK-300 pl-4">
              <div>
                Cash: {currency}
                {parseFloat(item?.cashAmount).toFixed(2)}
              </div>
              <div>
                Card: {currency}
                {parseFloat(item?.cardAmount).toFixed(2)}
              </div>
              <div>
                Digital: {currency}
                {parseFloat(item?.digitalAmount).toFixed(2)}
              </div>
              <div>
                Gift Card: {currency}
                {parseFloat(item?.giftCardAmount).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold text-DARK-900 dark:text-white pt-2 border-t border-gray-200 dark:border-DARK-600">
          <span>Grand Total</span>
          <span>
            {currency}
            {data
              .reduce(
                (sum: any, item: any) =>
                  parseFloat(sum) + (parseFloat(item?.totalAmount) || 0.0),
                0
              )
              .toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  // Component for Main Category Sales
  const MainCategorySalesCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Main Category Sales
      </h5>
      <div className="space-y-2">
        {Object.entries(data).map(([mainKey, mainValue]: any) => (
          <div key={mainKey}>
            <div className="flex justify-between text-sm font-medium text-DARK-900 dark:text-white">
              <span>{formatKey(mainKey)}</span>
              <span>
                {mainValue?.grandTotal
                  ? `${currency}${parseFloat(mainValue.grandTotal).toFixed(2)}`
                  : `${currency}0.00`}
              </span>
            </div>
            {mainValue &&
              typeof mainValue === "object" &&
              Object.entries(mainValue).map(([subKey, subValue]: any) => {
                if (subKey === "grandTotal" || subKey === "count") return null;
                if (typeof subValue === "object") {
                  return (
                    <div
                      key={subKey}
                      className="flex justify-between text-sm pl-4"
                    >
                      <span className="text-DARK-700 dark:text-DARK-200">
                        {formatKey(subKey)} ({subValue?.count || 0})
                      </span>
                      <span className="font-medium text-DARK-900 dark:text-white">
                        {currency}
                        {parseFloat(subValue?.totalSales || "0.00").toFixed(2)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
          </div>
        ))}
      </div>
    </div>
  );

  // Component for Cash Registers
  const CashRegistersCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Cash Registers
      </h5>

      <div className="space-y-2">
        <div className="font-medium text-DARK-900 dark:text-white">
          Cash Register Totals
        </div>

        {Object.entries(data?.cashRegisterTotals || {}).map(
          ([key, value]: any) => {
            if (key === "currencyCounts") {
              return (
                <div key={key} className="space-y-1">
                  <div className="text-sm text-DARK-700 dark:text-DARK-200">
                    Currency Counts
                  </div>
                  {Object.entries(value).map(([denom, count]: any) => {
                    if (typeof count === "object" && count !== null) {
                      // Nested cent denominations
                      if (currency === "$") {
                        return (
                          <div key={denom}>
                            <div className="text-xs text-DARK-600 dark:text-DARK-300 pl-2">
                              Cents
                            </div>
                            {Object.entries(count).map(
                              ([cent, centCount]: any) => (
                                <div
                                  key={cent}
                                  className="flex justify-between text-sm pl-6"
                                >
                                  <span className="text-DARK-700 dark:text-DARK-200">
                                    {cent}¢
                                  </span>
                                  <span className="font-medium text-DARK-900 dark:text-white">
                                    {centCount}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        );
                      }

                      return null;
                    }

                    // Flat denominations
                    return (
                      <div
                        key={denom}
                        className="flex justify-between text-sm pl-4"
                      >
                        <span className="text-DARK-700 dark:text-DARK-200">
                          {currency}
                          {denom}
                        </span>
                        <span className="font-medium text-DARK-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Render other totals like openingBalance, payIn, etc.
            const displayValue =
              typeof value === "number"
                ? value
                : `${currency}${parseFloat(value).toFixed(2)}`;

            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-DARK-700 dark:text-DARK-200">
                  {formatKey(key)}
                </span>
                <span className="font-medium text-DARK-900 dark:text-white">
                  {displayValue}
                </span>
              </div>
            );
          }
        )}

        {data?.cashRegisterByDevice?.length > 0 && (
          <>
            <div className="font-medium text-DARK-900 dark:text-white pt-2">
              Cash Register By Device
            </div>
            {data.cashRegisterByDevice.map((device: any) => (
              <div
                key={device._id}
                className="space-y-1 border rounded-xl p-2 dark:border-DARK-500"
              >
                <div className="flex justify-between text-sm font-medium text-DARK-900 dark:text-white">
                  <span>Device: {device.deviceName || device.deviceID}</span>
                  <span>Status: {device.status}</span>
                </div>
                {[
                  "openingBalance",
                  "currentBalance",
                  "closingBalance",
                  "payIn",
                  "payOut",
                ].map((field) => (
                  <div className="flex justify-between" key={field}>
                    <span className="text-DARK-700 dark:text-DARK-200">
                      {formatKey(field)}
                    </span>
                    <span className="font-medium text-DARK-900 dark:text-white">
                      {currency}
                      {parseFloat(device[field] || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  const TaxExemptionsCard = ({ data }: any) => (
    <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h5 className="text-lg font-semibold text-DARK-900 dark:text-white mb-3 border-b border-DARK-200 dark:border-DARK-600">
        Tax Exemptions
      </h5>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Orders</span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {data.orderCount}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">
            Total Exemption Tax Amount
          </span>
          <span className="font-medium text-DARK-900 dark:text-white">
            {currency}
            {parseFloat(data.totalExemptionTaxAmount).toFixed(2)}
          </span>
        </div>
        {/* <div className="flex justify-between text-sm">
          <span className="text-DARK-700 dark:text-DARK-200">Total orders without tax</span>
          <span className="font-medium text-DARK-900 dark:text-white">${parseFloat(data.totalAmount).toFixed(2)}</span>
        </div> */}
      </div>
    </div>
  );

  const hasFilters =
    !!selectedRange.startDate ||
    !!selectedRange.endDate ||
    !!(
      !!formData.company &&
      companyDetails?.length > 1
    ) ||
    !!(
      !!formData.restaurant &&
      restaurant?.length > 1
    );

  return (
    <div>
      <>
        <FormHeaderPaths
          page={"Consolidated Closeout Report"}
          prevLink="#"
          prevPage="Closeout"
        />
        <div className="mx-auto px-4 sm:px-6 lg:px-8 lg:flex-row items-center justify-between gap-2">
          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <Button
              size="xs"
              className="flex-1 sm:flex-none flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600 h-10 sm:w-20"
              onClick={() => handleSubmit("preview")}
            >
              <div className="flex justify-center items-center">
                {btnLoader === "preview" ? "Loading..." : "Preview"}
              </div>
            </Button>
            <Button
              size="xs"
              className="flex-1 sm:flex-none flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600 h-10 sm:w-20"
              onClick={() => handleSubmit("print")}
            >
              <div className="flex justify-center items-center">
                {btnLoader === "print" ? "Loading..." : "Download"}
              </div>
            </Button>
          </div>

          {/* Common Filter */}
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
            <DropdownWithSearch
              setSelectedItem={handleEmployee}
              selectedItem={
                staffDetail?.find((c: any) => c._id === formData?.employee)?.name || ""
              }
              items={staffDetail || []}
              title={
                staffDetail?.length
                  ? "Employee"
                  : "Employee"
              }
              setIsDropdownOpen={setIsEmpDropdownOpen}
              isDropdownOpen={isEmpDropdownOpen}
              handleFilter={handleEmployee}
              fieldKey="employee"
            />
          </CommonReportFilter>
        </div>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {isLoading &&
              Array(6)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="break-inside-avoid">
                    <SkeletonTheme
                      baseColor={isDarkMode ? "#212529" : "#F1E9EE"}
                      highlightColor={isDarkMode ? "#343A40" : "#F9F5F7"}
                    >
                      <Skeleton height={180} className="rounded-xl" />
                    </SkeletonTheme>
                  </div>
                ))}

            {closeout && Object.entries(closeout).length > 0 && !isLoading && (
              <>
                <div className="break-inside-avoid">
                  <TransactionTotalCard data={closeout.transactionTotal} />
                </div>

                <div className="break-inside-avoid">
                  <TipsAndGratuityCard data={closeout.tipsAndGratuity} />
                </div>

                <div className="break-inside-avoid">
                  <ExpectedTotalsCard data={closeout.expectedTotals} />
                </div>

                <div className="break-inside-avoid">
                  <EmployeeStatsCard data={closeout.employeeStats} />
                </div>

                <div className="break-inside-avoid">
                  <CategorySalesCard data={closeout.categorySales} />
                </div>

                <div className="break-inside-avoid">
                  <CashTotalCard data={closeout.cashTotal} />
                </div>

                <div className="break-inside-avoid">
                  <OrdersSummaryCard data={closeout.ordersSummary} />
                </div>

                <div className="break-inside-avoid">
                  <VoidTransactionCard data={closeout.voidTransaction} />
                </div>

                <div className="break-inside-avoid">
                  <ReturnTransactionCard data={closeout.returnTransaction} />
                </div>

                <div className="break-inside-avoid">
                  <PayInPayOutCard
                    payIn={closeout.payIn}
                    payOut={closeout.payOut}
                  />
                </div>

                <div className="break-inside-avoid">
                  <EmployeeSalesCard data={closeout.employeeSales} />
                </div>

                <div className="break-inside-avoid">
                  <MainCategorySalesCard data={closeout.mainCategorySales} />
                </div>

                <div className="break-inside-avoid">
                  <CashRegistersCard data={closeout.cashRegisters} />
                </div>

                <div className="break-inside-avoid">
                  <TaxExemptionsCard data={closeout.taxExemptions} />
                </div>
              </>
            )}
          </div>
          {isLoading === false && Object.entries(closeout)?.length === 0 && (
            <p className="flex justify-center dark:text-DARK-200">
              Consolidated Closeout not available at this time.
            </p>
          )}
        </div>
      </>
      <Modal
        size="7xl"
        show={openModal}
        onClose={() => setOpenModal(false)}
        className="backdrop-blur-sm"
      >
        <Modal.Header>CloseOut Report</Modal.Header>
        <Modal.Body>
          <PDFViewer width="100%" height="500">
            <PDFDocumentComponent
              closeout={closeout}
              formData={formData}
              selectedCompany={selectedCompany}
              selectedRestaurant={selectedRestaurant}
              companyAddress={companyAddress}
              currency={currency || ""}
            />
          </PDFViewer>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ConsolidatedCloseout;
