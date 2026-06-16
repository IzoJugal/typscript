/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import NoData from "../../../utils/common/NoData";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { Button, Modal, Table } from "flowbite-react";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { useAuth } from "../../../context/AuthProvider";
import { createQueryParams } from "../../../utils/functions";
import ListLoader from "../../../utils/common/ListLoader";
import TableHeaders from "../../../utils/common/TableHeaders";
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
import { formatCurrency } from "../../../utils/utility";
import CommonReportFilter from "../../../utils/CommonReportFilter";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: `/fonts/NotoSans-Regular.ttf` },
    { src: `/fonts/NotoSans-Bold.ttf`, fontWeight: "bold" },
  ],
});

interface TaxReport {
  taxName: string;
  totalTax: number;
  totalAmount: number;
  rate: number;
}

interface Company {
  _id: string;
  name: string;
}

interface Restaurant {
  _id: string;
  name: string;
}

const AllTaxesReport = () => {
  const [allTaxes, setAllTaxes] = useState<TaxReport[]>([]);
  const [totalTaxes, setTotalTaxes] = useState<number>(0);
  const [totalTaxableAmount, setTotalTaxableAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [btnLoader, setBtnLoader] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });

  const [formData, setFormData] = useState<{
    fromDate: string;
    toDate: string;
    company: string;
    restaurant: string;
  }>({
    fromDate: "",
    toDate: "",
    company: "",
    restaurant: "",
  });

  const [openModal, setOpenModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant[]>([]);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [currency, setCurrency] = useState({ symbol: "$" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      if (loginRole === SUPER_ADMIN) {
        await fetchCompanies();
      } else {
        const ownerCompanyId = userData?.staffMember?.company?._id;
        if (ownerCompanyId) {
          const restaurants = await getRestaurant(ownerCompanyId);
          const firstRestaurantId = restaurants?.[0]?._id || "";
          setFormData(prev => ({ ...prev, company: ownerCompanyId, restaurant: firstRestaurantId }));
        }
        setShowFilters(true);
      }
    };
    initializeData();
  }, [loginRole, userData?.staffMember?.company?._id]);

  useEffect(() => {
    if (!formData.company) return;

    getAllTaxReports();
  }, [formData, loginRole]);

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get("/business");
      if (response.data.success && response.data.companies?.length > 0) {
        const firstCompanyId = response.data.companies[0]._id;
        setCompanies(response.data.companies);

        const restaurants = await getRestaurant(firstCompanyId);
        const firstRestaurantId = restaurants?.[0]?._id || "";

        setFormData((prev) => ({
          ...prev,
          company: firstCompanyId,
          restaurant: firstRestaurantId,
        }));
        setShowFilters(true);
      }
    } catch (error: any) {
      console.error("Error fetching companies:", error.message);
    }
  };

  const getRestaurant = async (companyId?: string) => {
    if (!companyId) return [];
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant || []);
        return response.data.restaurant || [];
      }
    } catch (error: any) {
      console.log("error fetching restaurants", error.message);
    }
    return [];
  };

  const getAllTaxReports = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = createQueryParams(formData);
      const response = await apiClient.get(`/reports/sales/calculate-tax${params}`);
      const { success, data, totalTaxes, totalTaxableAmount, currency } = response.data;

      if (success) {
        setAllTaxes(data);
        setTotalTaxes(totalTaxes);
        setTotalTaxableAmount(totalTaxableAmount);
        setCurrency(currency);
        return data;
      } else {
        setAllTaxes([]);
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null }) => {
    setSelectedRange(value);
    if (value?.startDate && value?.endDate) {
      setFormData((prev) => ({
        ...prev,
        fromDate: value.startDate?.toISOString() || "",
        toDate: value.endDate?.toISOString() || "",
      }));
    }
  };

  const handleCancel = async () => {
    const defaultCompany = loginRole === SUPER_ADMIN ? (companies[0]?._id || "") : (userData?.staffMember?.company?._id || "");
    const restaurants = defaultCompany ? await getRestaurant(defaultCompany) : [];
    const defaultRestaurant = restaurants?.[0]?._id || "";
    setFormData({ fromDate: "", toDate: "", company: defaultCompany, restaurant: defaultRestaurant });
    setSelectedRange({ startDate: null, endDate: null });
  };

  const handleChangeCompany = async (value: string) => {
    const restaurants = await getRestaurant(value);
    const firstRestaurantId = restaurants?.[0]?._id || "";
    setFormData((prev) => ({ ...prev, company: value, restaurant: firstRestaurantId }));
  };

  const handleChangeRestaurant = (value: string) => {
    setFormData((prev) => ({ ...prev, restaurant: value }));
  };

  const handlePreview = async () => {
    setBtnLoader("preview");
    const freshData = await getAllTaxReports(true);
    if (!freshData || freshData.length === 0) {
      setBtnLoader("");
      return;
    }
    setOpenModal(true);
    setBtnLoader("");
  };

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10 },
    title: { fontSize: 16, textAlign: "center", marginBottom: 20, fontWeight: "bold" },
    summaryBox: { backgroundColor: "#7E6996", padding: 10, marginBottom: 20, borderRadius: 5 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    summaryLabel: { fontWeight: "bold", fontSize: 12 },
    summaryValue: { color: "#F2F0F5", fontSize: 12, fontFamily: "NotoSans" },
    table: { marginTop: 10 },
    tableHeader: { width: "33%", textAlign: "center", fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "black", paddingBottom: 5 },
    tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#D3D3D3", marginBottom: 5, paddingBottom: 5 },
    tableCell: { width: "33%", textAlign: "center", fontFamily: "NotoSans" },
    alternateRow: { backgroundColor: "#F5F5F5" },
  });

  const PDFDocumentComponent = ({
    allTaxes,
    totalTaxes,
    totalTaxableAmount,
    currency,
  }: {
    allTaxes: TaxReport[];
    totalTaxes: number;
    totalTaxableAmount: number;
    currency: { symbol: string, code?: string };
  }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Tax Summary Report</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Taxes:</Text>
            <Text style={styles.summaryValue}>{totalTaxes}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Taxable Amount:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalTaxableAmount, currency?.code)}
            </Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>Tax Name</Text>
            <Text style={styles.tableHeader}>Total Tax (%)</Text>
            <Text style={styles.tableHeader}>Total Amount ({currency?.code || ''})</Text>
          </View>
          {allTaxes.map((item, index) => (
            <View
              key={item.taxName}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [styles.alternateRow] : []),
              ]}
            >
              <Text style={styles.tableCell}>{item.taxName}</Text>
              <Text style={styles.tableCell}>{item.rate}%</Text>
              <Text style={styles.tableCell}>
                {formatCurrency(item.totalAmount, currency?.code)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  const generateTaxReportPDF = async (type: string) => {
    setBtnLoader(type);
    await getAllTaxReports(true);

    if (allTaxes.length === 0) {
      setBtnLoader("");
      return;
    }

    if (type === "preview") {
      setOpenModal(true);
    } else {
      try {
        const blob = await pdf(
          <PDFDocumentComponent
            allTaxes={allTaxes}
            totalTaxes={totalTaxes}
            totalTaxableAmount={totalTaxableAmount}
            currency={currency}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Tax_Summary_Report.pdf";
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
    setBtnLoader("");
  };

  const hasFilters =
    !!selectedRange.startDate ||
    !!selectedRange.endDate ||
    (!!formData.company && companies?.length > 1) ||
    (!!formData.restaurant && restaurant?.length > 1);

  const columnNames = ["Tax Name", "Tax Rate", "Total Amount"];

  return (
    <>
      <FormHeaderPaths page={"Tax Report"} prevLink="#" prevPage="Sales" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-start">
          <CommonReportFilter
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            loginRole={loginRole}
            SUPER_ADMIN={SUPER_ADMIN}
            MANAGER_ROLES={OWNER_ROLES}
            company={formData.company}
            companyDetails={companies}
            restaurant={formData.restaurant}
            restaurantDetails={restaurant}
            handleBusiness={handleChangeCompany}
            handleRestaurant={handleChangeRestaurant}
            dateFilter
            dateValue={selectedRange}
            onDateChange={handleDateRangeChange}
            onClear={handleCancel}
            showClear={hasFilters}
          />

          <div className="flex justify-start sm:justify-end gap-2">
            <Button
              type="button"
              onClick={handlePreview}
              className="flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 focus:!ring-0 h-10"
              disabled={allTaxes.length === 0}
            >
              <div className="flex justify-center items-center">
                {btnLoader === "preview" ? "Loading..." : "Preview"}
              </div>
            </Button>
            <Button
              type="button"
              className="flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 focus:!ring-0 h-10"
              onClick={() => generateTaxReportPDF("print")}
              disabled={allTaxes.length === 0}
            >
              <div className="flex justify-center items-center">
                {btnLoader === "print" ? "Loading..." : "Download"}
              </div>
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
          <Table hoverable>
            <TableHeaders columnNames={columnNames} />
            <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-700">
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={3} className="text-center py-6">
                    <ListLoader />
                  </Table.Cell>
                </Table.Row>
              ) : allTaxes?.length > 0 ? (
                allTaxes?.map((item) => (
                  <Table.Row
                    key={item.taxName}
                    className="bg-white dark:bg-DARK-800 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-150"
                  >
                    <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                      {item.taxName}
                    </Table.Cell>
                    <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                      {item.rate}%
                    </Table.Cell>
                    <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                      {currency?.symbol || "$"}
                      {item.totalAmount?.toFixed(2)}
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell
                    colSpan={3}
                    className="text-center py-10 text-DARK-500 dark:text-DARK-400"
                  >
                    <NoData
                      title="No Taxes Found"
                      message="No tax entries are available right now. Added tax entries will appear here."
                    />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>

        <Modal
          size="7xl"
          show={openModal}
          onClose={() => setOpenModal(false)}
          className="backdrop-blur-sm dark:bg-DARK-950"
        >
          <Modal.Header>All Taxes Report</Modal.Header>
          <Modal.Body>
            {allTaxes.length > 0 && (
              <PDFViewer width="100%" height="500">
                <PDFDocumentComponent
                  allTaxes={allTaxes}
                  totalTaxes={totalTaxes}
                  totalTaxableAmount={totalTaxableAmount}
                  currency={currency}
                />
              </PDFViewer>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default AllTaxesReport;