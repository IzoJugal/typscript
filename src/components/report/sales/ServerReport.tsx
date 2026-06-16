/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Table } from "flowbite-react";
import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { Modal } from "flowbite-react";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import TableHeaders from "../../../utils/common/TableHeaders";
import NoData from "../../../utils/common/NoData";
import { HiEye } from "react-icons/hi";
import { FaArrowCircleDown } from "react-icons/fa";
import { editBtnStyle, OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { createQueryParams } from "../../../utils/functions";
import { capitalized, formatCurrency, formatDate } from "../../../utils/utility";
import ListLoader from "../../../utils/common/ListLoader";
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Font } from "@react-pdf/renderer";
import { useConfigs } from "../../../context/SiteConfigsProvider";
import CommonReportFilter from "../../../utils/CommonReportFilter";

interface ISales {
  server?: string;
  company?: string;
  restaurant?: string;
}

interface IOrder {
  customer: string;
  orderDate: string;
  orderId: string;
  orderTotal: number;
  tip: number;
}

interface IServer {
  _id: string;
  orders: IOrder[];
  serverId: string;
  serverName: string;
  serverRole: string;
  totalOrders: number;
  totalSales: number;
  totaltips: number;
  currency?: {
    symbol?: string;
    code?: string;
  };
}

interface Staff {
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

Font.register({
  family: "NotoSans",
  fonts: [
    { src: `/fonts/NotoSans-Regular.ttf` },
    { src: `/fonts/NotoSans-Bold.ttf`, fontWeight: "bold" },
  ],
});

const ServerReport = () => {
  const { configData } = useConfigs();
  const [formData, setFormData] = useState<ISales>({
    server: "",
    company: "",
    restaurant: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [server, setServer] = useState<IServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffDetail, setStaffDetail] = useState<Staff[] | []>([]);
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const columnNames = ["Sr.No.", "Server Name", "Server Role", "Total Orders", "Total Sales", "Actions"];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResDropdownOpen, setIsResDropdownOpen] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const skipServerFetch = useRef(false);

  const [selectedRange, setSelectedRange] = useState({
    startDate: null,
    endDate: null,
  });

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
  }, []);

  const getRestaurant = useCallback(async (companyId: string) => {
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
    try {
      const params = createQueryParams(formData);
      const response = await apiClient.get(`/staff/web/all${params}`);
      setTimeout(() => {
        setStaffDetail(response.data.data);
      }, 500);
    } catch (error) {
      setStaffDetail([]);
      console.error("~ getStaff error :-", error);
    }
  }, [formData.company, formData.restaurant]);

  useEffect(() => {
    if (loginRole === SUPER_ADMIN) {
      getCompany();
    }
  }, [loginRole, getCompany]);

  useEffect(() => {
    if (formData?.company) {
      getRestaurant(formData.company);
    } else if (OWNER_ROLES.includes(loginRole) && userData?.staffMember?.company?._id) {
      getRestaurant(userData.staffMember.company._id);
    }
  }, [formData?.company, loginRole, userData?.staffMember?.company?._id, getRestaurant]);

  useEffect(() => {
    if (restaurant?.length === 1 && restaurant[0]?._id) {
      const singleResId = restaurant[0]._id;
      if (formData.restaurant !== singleResId) {
        skipServerFetch.current = true;
        setFormData((prev) => ({
          ...prev,
          restaurant: singleResId,
        }));
      }
    }

    const activeRestaurantId = formData?.restaurant || (restaurant?.length === 1 ? restaurant[0]?._id : null);
    if (activeRestaurantId) {
      getStaff();
    }
  }, [formData?.restaurant, restaurant?.length, getStaff]);

  const getServerData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = Object.fromEntries(
        Object.entries({
          company: formData.company,
          restaurant: formData.restaurant,
          server: formData.server,
          fromDate: selectedRange.startDate,
          toDate: selectedRange.endDate,
        }).filter(([, value]) => value)
      );

      const response = await apiClient.get(`/category/sales/serversale`, { params });
      setServer(response?.data?.data || []);
    } catch (error) {
      console.log("Error retrieving serverData:", error);
      setServer([]);
    } finally {
      setIsLoading(false);
    }
  }, [formData.server, formData.company, formData.restaurant, selectedRange.startDate, selectedRange.endDate]);

  useEffect(() => {
    if (skipServerFetch.current) {
      skipServerFetch.current = false;
      return;
    }
    getServerData();
  }, [getServerData]);

  const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
    setSelectedRange(value);
  };

  const handlePreview = async (serverID: any) => {
    setSelectedServerId(serverID);
    setShowModal(true);
  };

  const handlePrint = async (serverID: any) => {
    const selectedServer = server?.find((item) => item.serverId === serverID);
    if (!selectedServer) return;
    try {
      const blob = await pdf(<PDFDocumentComponent selectedServer={selectedServer} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "server-sales-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleCancel = () => {
    const hasValidFilter = Object.values(formData).some((value) => value !== "");
    if (hasValidFilter) {
      setFormData({ company: "", server: "", restaurant: "" });
      setStaffDetail([]);
    }
    if (selectedRange?.startDate || selectedRange?.endDate) {
      setSelectedRange({ startDate: null, endDate: null });
    }
    if (loginRole === SUPER_ADMIN) {
      setRestaurant([]);
    }
  };

  const handleBusiness = (value: string) => {
    setFormData((prev) => ({ ...prev, company: value, restaurant: "", server: "" }));
    setRestaurant([]);
    setStaffDetail([]);
  };

  const handleEmployee = (value: string) => {
    setFormData((prev) => ({ ...prev, server: value }));
  };

  const handleRestaurant = (value: string) => {
    setFormData((prev) => ({ ...prev, restaurant: value, server: "" }));
    setStaffDetail([]);
    setServer([]);
  };

  const [showFilters, setShowFilters] = useState(false);

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10 },
    title: { fontSize: 16, textAlign: "center", marginBottom: 20, fontFamily: "NotoSans" },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontFamily: "NotoSans", marginBottom: 10 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    label: { fontFamily: "NotoSans", width: "40%" },
    value: { width: "60%", fontFamily: "NotoSans" },
    tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 5 },
    headerCell: { flex: 1, fontFamily: "NotoSans", textAlign: "center" },
    tableRow: { flexDirection: "row", padding: 5, borderBottomWidth: 1, borderBottomColor: "#ddd" },
    cell: { flex: 1, textAlign: "center", fontFamily: "NotoSans" },
    narrowCell: { flex: 0.5 },
    wideCell: { flex: 2 },
  });

  const PDFDocumentComponent = ({ selectedServer }: { selectedServer: IServer | null }) => {
    if (!selectedServer) {
      return (
        <Document>
          <Page style={styles.page}>
            <Text style={styles.title}>Server Sales Report</Text>
            <Text>No data found for the selected server.</Text>
          </Page>
        </Document>
      );
    }

    const currencyCode = selectedServer.currency?.code || "USD";

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Server Sales Report</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Server Information:</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Server Name:</Text>
              <Text style={styles.value}>{selectedServer.serverName || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Server Role:</Text>
              <Text style={styles.value}>{selectedServer.serverRole || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Orders:</Text>
              <Text style={styles.value}>{selectedServer.totalOrders || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Sales:</Text>
              <Text style={styles.value}>{formatCurrency(selectedServer.totalSales, currencyCode)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Tips:</Text>
              <Text style={styles.value}>{formatCurrency(selectedServer.totaltips, currencyCode)}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details:</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.narrowCell]}>Order</Text>
              <Text style={[styles.headerCell, styles.wideCell]}>Order Name</Text>
              <Text style={styles.headerCell}>Order Total</Text>
              <Text style={styles.headerCell}>Tip</Text>
              <Text style={[styles.headerCell, styles.narrowCell]}>Order Date</Text>
            </View>
            {selectedServer.orders?.map((order: any, orderIndex: number) => (
              <View key={orderIndex} style={styles.tableRow}>
                <Text style={[styles.cell, styles.narrowCell]}>{orderIndex + 1}</Text>
                <Text style={[styles.cell, styles.wideCell]}>{order?.orderName || "-"}</Text>
                <Text style={styles.cell}>{formatCurrency(order?.orderTotal, currencyCode)}</Text>
                <Text style={styles.cell}>{formatCurrency(order?.tip, currencyCode)}</Text>
                <Text style={[styles.cell, styles.narrowCell]}>
                  {formatDate(order?.orderDate, configData?.dateFormat)}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  };

  const hasFilters = !!selectedRange.startDate || !!selectedRange.endDate || (!!formData.company && companyDetails?.length > 1) || (!!formData.restaurant && restaurant?.length > 1);

  return (
    <div>
      <FormHeaderPaths page={"Server Sales Report"} prevLink="#" prevPage="Sales" />
      <div className="min-h-screen px-6">
        <div className="mx-auto">
          <main className="relative max-w-screen-2xl mx-auto bg-white dark:bg-DARK-800 p-8 shadow-md rounded-lg">
            <h1 className="text-3xl font-bold mb-6 dark:text-white">Server Sales Report</h1>
            <CommonReportFilter
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onClear={handleCancel}
              loginRole={loginRole}
              SUPER_ADMIN={SUPER_ADMIN}
              MANAGER_ROLES={OWNER_ROLES}
              company={formData.company}
              restaurant={formData.restaurant}
              companyDetails={companyDetails}
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
              <div className="min-w-[220px]">
                <DropdownWithSearch
                  setSelectedItem={setFormData}
                  selectedItem={staffDetail?.find((c: any) => c._id === formData?.server)?.name || ""}
                  items={staffDetail}
                  title="Employee"
                  setIsDropdownOpen={setIsResDropdownOpen}
                  isDropdownOpen={isResDropdownOpen}
                  handleFilter={handleEmployee}
                  fieldKey="server"
                  isManual={true}
                />
              </div>
            </CommonReportFilter>
          </main>

          <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-auto border-t-2 border-BRAND-300 dark:border-DARK-400 mt-6">
            <Table hoverable>
              <TableHeaders columnNames={columnNames} />
              <Table.Body className="divide-y">
                {isLoading && (
                  <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                    <Table.Cell colSpan={6} className="text-center py-4">
                      <ListLoader />
                    </Table.Cell>
                  </Table.Row>
                )}
                {server && server?.length > 0 && !isLoading ? (
                  server?.map((item, index) => (
                    <Table.Row key={item?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                        {index + 1}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item.serverName)}>
                        {capitalized(item.serverName) ?? "-"}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={capitalized(item.serverRole)}>
                        {capitalized(item.serverRole) ?? "-"}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={String(item?.totalOrders) || "-"}>
                        {item?.totalOrders ?? "-"}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 truncate max-w-36" title={String(item?.totalSales) || "-"}>
                        {item?.totalSales ? `${item?.currency?.symbol || "$"}${item.totalSales}` : "-"}
                      </Table.Cell>
                      <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="flex gap-2">
                          <Button onClick={() => handlePreview(item?.serverId)} title="Preview" className={editBtnStyle.btn} size="xs">
                            <HiEye className={editBtnStyle.icon} />
                          </Button>
                          <Button onClick={() => handlePrint(item?.serverId)} title="Download" className={editBtnStyle.btn} size="xs">
                            <FaArrowCircleDown className={editBtnStyle.icon} />
                          </Button>
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  !isLoading && (
                    <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                      <Table.Cell colSpan={6} className="text-center py-4 text-DARK-500">
                        <NoData
                          title="No Server Sales Data Found"
                          message="No server sales records are available right now. Added server sales records will appear here."
                        />
                      </Table.Cell>
                    </Table.Row>
                  )
                )}
              </Table.Body>
            </Table>
          </div>

          <Modal size="7xl" show={showModal} onClose={() => setShowModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header>Server Sales Report</Modal.Header>
            <Modal.Body>
              {selectedServerId && server && (
                <PDFViewer width="100%" height="500">
                  <PDFDocumentComponent
                    selectedServer={server.find((s: IServer) => s.serverId === selectedServerId) || null}
                  />
                </PDFViewer>
              )}
            </Modal.Body>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ServerReport;