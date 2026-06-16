/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal, Table } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import TableHeaders from "../../../utils/common/TableHeaders";
import NoData from "../../../utils/common/NoData";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { createQueryParams } from "../../../utils/functions";
import ListLoader from "../../../utils/common/ListLoader";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  pdf,
  Font
} from "@react-pdf/renderer";
import { formatDate } from "../../../utils/utility";
import { useConfigs } from "../../../context/SiteConfigsProvider";
import CommonReportFilter from "../../../utils/CommonReportFilter";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: `/fonts/NotoSans-Regular.ttf` },
    { src: `/fonts/NotoSans-Bold.ttf`, fontWeight: "bold" },
  ],
});

interface ILateReport {
  _id: string;
  closeOut: string;
  fromDate: string;
  toDate: string;
  company?: string;
  restaurant?: string;
}

interface PaymentSummary {
  totalAmount: number;
  count: number;
}
interface IOrder {
  _id: string;
  orderName: string;
  orderType: string;
  productOrderType: string;
  amount: number;
  guestCount: number;
  status: string;
  customerId: string | null;
  server: string;
  orderNote: string | null;
  referenceCode: string | null;
  authCode: string | null;
  orderDate: string;
}

interface ICloseOut {
  date: string;
  orders: IOrder[];
  totalAmount: number;
  totalOrders: number;
  paymentSummary: Record<string, PaymentSummary>;
  discount?: number;
  tax?: number;
  tips?: number;
  gratuityAmount?: number;
  avgSales: number;
}

const TerminalCloseout = () => {
  const [formData, setFormData] = useState<ILateReport>({
    _id: "", closeOut: "", fromDate: "", toDate: "", company: "", restaurant: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [closeout, setCloseout] = useState<ICloseOut>();
  const [btnLoader, setBtnLoader] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { configData } = useConfigs();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [showFilters, setShowFilters] = useState(false);
  const [currency, setCurrency] = useState({ symbol: "$" });

  const columnNames = ["Sr.No.", "Order Date", "No. of Orders", "Total Amount", "Total Tips", "Total Gratuity"];

  // ==================== API ACTIONS ====================

  const getRestaurant = useCallback(async (companyId: string) => {
    if (!companyId) return;
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        const restaurants = response.data.restaurant || [];
        setRestaurant(restaurants);
        setFormData((prev) => ({
          ...prev,
          restaurant: restaurants[0]?._id || "",
        }));
      }
    } catch (error) {
      console.error("getRestaurant error:", error);
    }
  }, []);

  const getCompany = useCallback(async () => {
    try {
      const response = await apiClient.get(`/business`);
      const companies = response.data.companies || [];
      setCompanyDetails(companies);

      const defaultCompanyId = companies[0]?._id || "";
      if (defaultCompanyId) {
        setFormData((prev) => ({ ...prev, company: defaultCompanyId }));
        getRestaurant(defaultCompanyId);
      }
      setShowFilters(true);
    } catch (error) {
      console.error("getCompany error:", error);
      setCompanyDetails([]);
    }
  }, [getRestaurant]);

  const getCloseoutData = useCallback(async () => {
    // CRITICAL: Prevent querying if IDs aren't fully resolved yet
    if (!formData.company || !formData.restaurant) return;

    try {
      setIsLoading(true);
      const params = createQueryParams(formData);
      const response = await apiClient.get(`/order/terminal/closeout${params}`);
      setCloseout(response?.data?.data);
      setCurrency(response?.data?.currency || { symbol: "$" });
    } catch (error) {
      console.error("Closeout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // ==================== LIFECYCLE INITIALIZATION ====================

  // 1. Initial configuration load based on User Roles
  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    } else if (userData?.staffMember?.company?._id) {
      const companyId = userData.staffMember.company._id;
      setFormData((prev) => ({ ...prev, company: companyId }));
      getRestaurant(companyId);
      setShowFilters(true);
    }
  }, [loginRole, userData, getCompany, getRestaurant]);

  // 2. Main query execution triggered only on validated inputs
  useEffect(() => {
    if (formData.company && formData.restaurant) {
      getCloseoutData();
    }
  }, [formData.company, formData.restaurant, formData.fromDate, formData.toDate, getCloseoutData]);


  // ==================== INTERACTION HANDLERS ====================

  const selectedCompany = companyDetails?.find((item: any) => item._id === formData?.company);
  const selectedRestaurant = restaurant?.find((item: any) => item._id === formData?.restaurant);

  const handlePreview = async () => {
    if (!closeout || Object.keys(closeout).length === 0) return;
    try {
      setBtnLoader("preview");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setOpenModal(true);
    } catch (error) {
      console.error("Error opening preview:", error);
    } finally {
      setBtnLoader("");
    }
  };

  const handlePrint = async () => {
    if (!closeout || Object.keys(closeout).length === 0) return;
    try {
      setBtnLoader("print");
      const blob = await pdf(
        <PDFDocumentComponent
          closeout={closeout}
          formData={formData}
          selectedCompany={selectedCompany}
          selectedRestaurant={selectedRestaurant}
          currency={currency}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Terminal_CloseOut_report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setBtnLoader("");
    }
  };

  const handleSubmit = (type: string) => {
    if (type === "preview") handlePreview();
    if (type === "print") handlePrint();
  };

  const handleCancel = () => {
    setBtnLoader("");
    setFormData({ _id: "", closeOut: "", fromDate: "", toDate: "", company: "", restaurant: "" });
    setCloseout(undefined);
    setSelectedRange({ startDate: null, endDate: null });
    setOpenModal(false);
    if (loginRole === SUPER_ADMIN) setRestaurant([]);
  };

  const handleBusiness = (value: string) => {
    setFormData((prev) => ({ ...prev, company: value, restaurant: "" }));
    getRestaurant(value);
  };

  const handleRestaurant = (value: string) => {
    setFormData((prev) => ({ ...prev, restaurant: value }));
  };

  const handleDateRangeChange = (value: any) => {
    setSelectedRange(value);
    if (value?.startDate && value?.endDate) {
      setFormData((prev) => ({
        ...prev,
        fromDate: value.startDate.toISOString().split("T")[0],
        toDate: value.endDate.toISOString().split("T")[0],
      }));
    }
  };

  const hasFilters =
    !!selectedRange.startDate ||
    !!selectedRange.endDate ||
    !!(formData.company && companyDetails?.length > 1) ||
    !!(formData.restaurant && restaurant?.length > 1);

  // ==================== PDF STYLES & COMPONENTS ====================

  const styles = StyleSheet.create({
    page: { flexDirection: "column", backgroundColor: "#FFFFFF", padding: 30, fontSize: 10, fontFamily: "NotoSans" },
    title: { fontSize: 16, marginBottom: 20, textAlign: "center", fontFamily: "Helvetica-Bold" },
    header: { marginBottom: 10 },
    headerText: { marginBottom: 5 },
    dateRange: { textAlign: "right", marginBottom: 10, fontSize: 10 },
    line: { borderBottomWidth: 1, borderBottomColor: "black", width: "100%", marginVertical: 10 },
    section: { marginBottom: 10 },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 5 },
    subTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 5, marginBottom: 3 },
    paymentItem: { marginLeft: 20, marginBottom: 3 },
    grandTotal: { marginTop: 20 },
    bold: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  });

  const PDFDocumentComponent = (props: {
    closeout: any;
    formData: ILateReport;
    selectedCompany: any;
    selectedRestaurant: any;
    currency: any;
  }) => {
    const { closeout, formData, selectedCompany, selectedRestaurant, currency } = props;
    const pdfCurrency = (currency?.code === "USD" || currency?.symbol === "$") ? "$" : currency?.code || currency?.symbol;
    const { fromDate, toDate } = formData;

    let grandTotalAmount = 0;
    let grandTotalOrders = 0;
    const days = Object.values(closeout || {});
    const numDays = days.length;
    let overallAvgSales = 0;

    if (numDays > 0) {
      days.forEach((item: any) => {
        grandTotalAmount += item.totalAmount || 0;
        grandTotalOrders += item.totalOrders || 0;
      });
      overallAvgSales = grandTotalAmount / numDays;
    }

    const dateRangeTitle = fromDate && toDate ? `From ${formatDate(fromDate, configData?.dateFormat)} To ${formatDate(toDate, configData?.dateFormat)}` : "";

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Terminal CloseOut Report</Text>
          <View style={styles.header}>
            <Text style={styles.headerText}>Company: {selectedCompany?.name || "N/A"}</Text>
            <Text style={styles.headerText}>Restaurant: {selectedRestaurant?.name || "N/A"}</Text>
            <Text style={styles.headerText}>Date: {formatDate(new Date(), configData?.dateFormat)}</Text>
          </View>
          {dateRangeTitle && <Text style={styles.dateRange}>{dateRangeTitle}</Text>}
          <View style={styles.line} />
          {days.length > 0 ? (
            days.map((item: any, index: number) => {
              const avgSales = (item.totalAmount / item.totalOrders || 0).toFixed(2);
              return (
                <View key={index} style={styles.section}>
                  <Text style={styles.sectionTitle}>Date: {formatDate(item.date, configData?.dateFormat) || "-"}</Text>
                  <Text>Total Orders: {item?.totalOrders || "-"}</Text>
                  <Text>Total Amount: {pdfCurrency} {(item?.totalAmount || 0).toFixed(2)}</Text>
                  <Text>Total Tips: {pdfCurrency} {(item?.tips || 0).toFixed(2)}</Text>
                  <Text>Total Gratuity: {pdfCurrency} {(item?.gratuity || 0).toFixed(2)}</Text>
                  <Text>Average Sales (per order): {pdfCurrency} {avgSales}</Text>
                  <Text style={styles.subTitle}>Payment Summary:</Text>
                  {Object.entries(item.paymentSummary || {}).map(([method, summary]: [string, any]) => (
                    <Text key={method} style={styles.paymentItem}>
                      - {method}: {pdfCurrency} {summary.totalAmount.toFixed(2)} ({summary.count} orders)
                    </Text>
                  ))}
                </View>
              );
            })
          ) : (
            <Text>No data found for terminal closeOut.</Text>
          )}
          {days.length > 0 && (
            <>
              <View style={styles.line} />
              <View style={styles.grandTotal}>
                <Text style={styles.bold}>Grand Total Amount: {pdfCurrency} {grandTotalAmount.toFixed(2)}</Text>
                <Text style={styles.bold}>Total Orders: {grandTotalOrders}</Text>
                <Text style={styles.bold}>Overall Average Sales (per day): {pdfCurrency} {overallAvgSales.toFixed(2)}</Text>
              </View>
            </>
          )}
        </Page>
      </Document>
    );
  };

  return (
    <div>
      <FormHeaderPaths page={"Terminal Closeout Report"} prevLink="#" prevPage="Closeout" />
      <div className="mx-auto sm:px-6 px-4 sm:flex-row items-start sm:items-center gap-2 justify-between lg:px-8">
        <div className="flex justify-end gap-2 w-full sm:w-auto">
          <Button
            size="xs"
            disabled={!(closeout && Object.keys(closeout)?.length > 0)}
            title={closeout && Object.keys(closeout)?.length > 0 ? "Preview" : "No Data Available"}
            className="flex-1 sm:flex-none flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 h-10 sm:w-20"
            onClick={() => handleSubmit("preview")}
          >
            <div className="flex justify-center items-center">
              {btnLoader === "preview" ? "Loading..." : "Preview"}
            </div>
          </Button>
          <Button
            size="xs"
            disabled={!(closeout && Object.keys(closeout)?.length > 0)}
            title={closeout && Object.keys(closeout)?.length > 0 ? "Download" : "No Data Available"}
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
        />
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="overflow-x-auto">
          <div className={`${closeout && Object.keys(closeout).length > 0 ? "overflow-x-auto" : "overflow-hidden"}`}>
            <Table hoverable>
              {closeout && Object.keys(closeout)?.length > 0 && !isLoading && (
                <TableHeaders columnNames={columnNames} />
              )}

              <Table.Body className="divide-y">
                {isLoading && (
                  <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                    <Table.Cell colSpan={8} className="text-center py-4">
                      <ListLoader />
                    </Table.Cell>
                  </Table.Row>
                )}
                {closeout && !isLoading && Object.keys(closeout)?.length > 0 ? (
                  Object.values(closeout)?.map((item: any, index) => (
                    <Table.Row key={item._id || index} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1}</Table.Cell>
                      <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                        {item?.date ? formatDate(item?.date, configData?.dateFormat) : "-"}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36">{item.totalOrders}</Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36">
                        {`${currency?.symbol || "$"}${item.totalAmount.toFixed(2)}`}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36">
                        {`${currency?.symbol || "$"}${item.tips.toFixed(2)}`}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36">
                        {`${currency?.symbol || "$"}${item.gratuity?.toFixed(2) || "0.00"}`}
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  !isLoading && (
                    <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                      <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                        <NoData
                          title="No Terminal Closeouts Found"
                          message="No terminal closeout entries are available right now."
                        />
                      </Table.Cell>
                    </Table.Row>
                  )
                )}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>

      <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm">
        <Modal.Header>Terminal CloseOut Report</Modal.Header>
        <Modal.Body>
          {closeout && Object.keys(closeout).length > 0 && (
            <PDFViewer width="100%" height="500">
              <PDFDocumentComponent
                closeout={closeout}
                formData={formData}
                selectedCompany={selectedCompany}
                selectedRestaurant={selectedRestaurant}
                currency={currency}
              />
            </PDFViewer>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TerminalCloseout;