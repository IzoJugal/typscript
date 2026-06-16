/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import NoData from "../../../utils/common/NoData"
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { Button, Modal, Table } from "flowbite-react";
import apiClient from "../../../utils/AxiosInstance";
import { useAuth } from "../../../context/AuthProvider";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { createQueryParams } from "../../../utils/functions";
import { capitalized, formatCurrency, formatDate } from "../../../utils/utility";
import TableHeaders from "../../../utils/common/TableHeaders";
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
import { useConfigs } from "../../../context/SiteConfigsProvider";
import CommonReportFilter from "../../../utils/CommonReportFilter";

Font.register({
    family: "NotoSans",
    fonts: [
        { src: `/fonts/NotoSans-Regular.ttf` },
        { src: `/fonts/NotoSans-Bold.ttf`, fontWeight: "bold" },
    ],
});

const WasteReport = () => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const { configData } = useConfigs();

    const [loading, setLoading] = useState<boolean>(true);
    const [totalWasteAmount, setTotalWasteAmount] = useState<number>(0);
    const [btnLoader, setBtnLoader] = useState<string>("");
    const [reports, setReports] = useState<any[]>([]);
    const [companyDetails, setCompanyDetails] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedRange, setSelectedRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });
    const [formData, setFormData] = useState<{ fromDate: string; toDate: string; company: string; restaurant: string; }>({
        fromDate: "",
        toDate: "",
        company: "",
        restaurant: "",
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currency, setCurrency] = useState({ symbol: "$" });
    const [showFilters, setShowFilters] = useState(false);

    const lastRequestedParams = useRef<string>("__INITIAL__");

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany();
        } else if (OWNER_ROLES.includes(loginRole) && userData?.staffMember?.company?._id) {
            getRestaurant(userData.staffMember.company._id);
            setFormData(prev => ({ ...prev, company: userData.staffMember.company._id }));
            setShowFilters(true);
        }
    }, [loginRole, userData?.staffMember?.company?._id]);

    // useEffect(() => {
    //     if (formData.company) {
    //         getRestaurant(formData.company);
    //     }
    // }, [formData.company]);

    useEffect(() => {
        if (formData.company) {
            getRestaurant(formData.company);
        }
    }, [formData.company]);

    useEffect(() => {
        const isSuperAdminMode = loginRole === SUPER_ADMIN;
        if (isSuperAdminMode && !formData.company) {
            return;
        }
        if (!formData.company || !formData.restaurant) {
            return;
        }
        const paramsKey = `${formData.company}|${formData.restaurant}|${formData.fromDate}|${formData.toDate}`;
        if (paramsKey === lastRequestedParams.current) {
            return;
        }
        lastRequestedParams.current = paramsKey;
        getWasteReport();

    }, [formData.company, formData.restaurant, formData.fromDate, formData.toDate, loginRole]);

    const getCompany = useCallback(async () => {
        try {
            const response = await apiClient.get(`/business`);
            const companies = response.data.companies || [];
            setCompanyDetails(companies);

            if (companies.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    company: prev.company || companies[0]._id,
                }));
            }
            setShowFilters(true);
        } catch (error) {
            setCompanyDetails([]);
            console.error('~ getCompany error :-', error);
        }
    }, []);

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    const getWasteReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = createQueryParams(formData);
            const response = await apiClient.get(`/waste-report${params}`);
            const { success, data, currency } = response.data;
            if (success) {
                const totalAmount = data.reduce((acc: number, item: any) => acc + item.value * (item.quantity || 1), 0);
                setTotalWasteAmount(totalAmount);
                setReports(data);
                setCurrency(currency || { symbol: "$" });
            } else {
                setTotalWasteAmount(0);
                setReports([]);
                setCurrency({ symbol: "$" });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, [formData]);


    const styles = StyleSheet.create({
        page: { padding: 30, fontSize: 10 },
        title: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontFamily: 'Helvetica-Bold' },
        summaryBox: { backgroundColor: '#7E6996', padding: 10, marginBottom: 20, borderRadius: 5 },
        summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
        summaryLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
        summaryValue: { color: '#F2F0F5', fontSize: 12, fontFamily: "NotoSans" },
        table: { marginTop: 10, width: '100%' },
        tableHeader: { flexDirection: 'row', backgroundColor: '#AC9FBC', padding: 5, borderBottomWidth: 2, borderBottomColor: '#7E6996' },
        headerCell: { flex: 1, fontFamily: 'Helvetica-Bold', textAlign: 'center', fontSize: 7, padding: 4 },
        tableRow: { flexDirection: 'row', padding: 4, borderBottomWidth: 1, borderBottomColor: '#D3D3D3' },
        cell: { flex: 1, fontSize: 7, textAlign: 'center', padding: 4, fontFamily: "NotoSans" },
        dateCell: { flex: 1.2 },
        menuCell: { flex: 1.5 },
        qtyCell: { flex: 0.8 },
        reasonCell: { flex: 1.2 },
        recordedByCell: { flex: 1 },
        orderCell: { flex: 1 },
    });

    const PDFDocumentComponent = ({
        reports,
        totalWasteAmount,
        currency,
    }: {
        reports: any[];
        totalWasteAmount: number;
        currency: { symbol: string, code?: string };
    }) => {
        return <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Waste Report</Text>
                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Waste Amount:</Text>
                        <Text style={styles.summaryValue}>
                            {formatCurrency(totalWasteAmount, currency?.code)}
                        </Text>
                    </View>
                </View>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
                        <Text style={[styles.headerCell, styles.menuCell]}>Menu</Text>
                        <Text style={[styles.headerCell, styles.qtyCell]}>Qty</Text>
                        <Text style={styles.headerCell}>Value</Text>
                        <Text style={[styles.headerCell, styles.reasonCell]}>Reason</Text>
                        <Text style={[styles.headerCell, styles.recordedByCell]}>RecordedBy</Text>
                        <Text style={[styles.headerCell, styles.orderCell]}>Table/Order#</Text>
                    </View>
                    {reports.map((item: any, index: number) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.dateCell]}>
                                {formatDate(item.date, configData?.dateFormat)} {item.time}
                            </Text>
                            <Text style={[styles.cell, styles.menuCell]}>
                                {item.product?.name}
                            </Text>
                            <Text style={[styles.cell, styles.qtyCell]}>
                                {item.quantity}
                            </Text>
                            <Text style={styles.cell}>
                                {formatCurrency(item.value * item.quantity, currency?.code)}
                            </Text>
                            <Text style={[styles.cell, styles.reasonCell]}>
                                {item.reason}
                            </Text>
                            <Text style={[styles.cell, styles.recordedByCell]}>
                                {item.server?.name}
                            </Text>
                            <Text style={[styles.cell, styles.orderCell]}>
                                {item.order ? item.order?.orderName : 'N/A'}
                            </Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>;
    };

    const generateWasteReportPDF = async (type: string) => {
        setBtnLoader(type);
        if (reports.length === 0) {
            setBtnLoader("");
            return;
        }
        if (type === 'preview') {
            setOpenModal(true);
            setBtnLoader('');
        } else {
            try {
                const blob = await pdf(
                    <PDFDocumentComponent
                        reports={reports}
                        totalWasteAmount={totalWasteAmount}
                        currency={currency}
                    />
                ).toBlob();
                const pdfUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = "Waste_Report.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pdfUrl);
            } catch (error) {
                console.error("Error generating PDF:", error);
            } finally {
                setBtnLoader('');
            }
        }
    }

    const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null }) => {
        setSelectedRange(value);
        setFormData(prev => ({
            ...prev,
            fromDate: value.startDate ? value.startDate.toISOString() : "",
            toDate: value.endDate ? value.endDate.toISOString() : "",
        }));
    };

    const handleCancel = () => {
        const fallbackCompany = loginRole === SUPER_ADMIN ? (companyDetails[0]?._id || "") : "";
        setFormData({
            fromDate: "",
            toDate: "",
            company: fallbackCompany,
            restaurant: ""
        });
        setSelectedRange({ startDate: null, endDate: null });
        if (loginRole === SUPER_ADMIN && companyDetails[0]?._id) {
            getRestaurant(companyDetails[0]._id);
        } else {
            setRestaurant([]);
        }
    };

    const handleBusiness = (value: string) => {
        setFormData(prev => ({ ...prev, company: value, restaurant: "" }));
    }

    const handleRestaurant = (value: string) => {
        setFormData(prev => ({ ...prev, restaurant: value }));
    }

    const hasFilters =
        !!selectedRange.startDate ||
        !!selectedRange.endDate ||
        (!!formData.company && companyDetails?.length > 1) ||
        (!!formData.restaurant && restaurant?.length > 1);

    const columnNames = ["Table/Order#", "Date", "Time", "Menu", "Portion", "Quantity", "Value", "Reason", "RecordedBy"];

    return (
        <>
            <FormHeaderPaths page={'Waste Report'} prevLink='#' prevPage='Sales' />
            <div className="mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-start">
                    <CommonReportFilter
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
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
                        onClear={handleCancel}
                        isDropdownOpen={isDropdownOpen}
                        setIsDropdownOpen={setIsDropdownOpen}
                        showClear={hasFilters}
                    />

                    <div className="flex justify-start sm:justify-end gap-2">
                        <Button
                            type="button"
                            onClick={() => generateWasteReportPDF('preview')}
                            className="flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 focus:!ring-0 h-10"
                            disabled={reports.length === 0 || btnLoader !== ""}
                        >
                            {btnLoader === "preview" ? "Loading..." : "Preview"}
                        </Button>
                        <Button
                            type="button"
                            className="flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 focus:!ring-0 h-10"
                            onClick={() => generateWasteReportPDF("print")}
                            disabled={reports.length === 0 || btnLoader !== ""}
                        >
                            {btnLoader === "print" ? "Loading..." : "Download"}
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                    <Table hoverable>
                        <TableHeaders columnNames={columnNames} />
                        <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-700">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={11} className="text-center py-6">
                                        <ListLoader />
                                    </Table.Cell>
                                </Table.Row>
                            ) : reports?.length > 0 ? (
                                reports?.map((item, index: number) => (
                                    <Table.Row key={index} className="bg-white dark:bg-DARK-800 hover:bg-DARK-50 dark:hover:bg-DARK-700 transition-colors duration-150">
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{item.order ? item.order?.orderName : 'N/A'}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{item?.date ? formatDate(item?.date, configData?.dateFormat) : '-'}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{item?.time || '-'}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{capitalized(item?.product?.name)}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{item?.portion}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{item?.quantity}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{currency.symbol}{(item?.value * item?.quantity).toFixed(2)}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{item?.reason}</Table.Cell>
                                        <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">{capitalized(item?.server?.name)}</Table.Cell>
                                    </Table.Row>
                                ))
                            ) : (
                                <Table.Row>
                                    <Table.Cell colSpan={11} className="text-center py-10 text-DARK-500 dark:text-DARK-400">
                                        <NoData title="No Waste Found" message="No waste entries are available right now. Added waste entries will appear here." />
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </div>

                <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
                    <Modal.Header>Waste Report</Modal.Header>
                    <Modal.Body>
                        {reports.length > 0 && (
                            <PDFViewer width="100%" height="500">
                                <PDFDocumentComponent reports={reports} totalWasteAmount={totalWasteAmount} currency={currency} />
                            </PDFViewer>
                        )}
                    </Modal.Body>
                </Modal>
            </div>
        </>
    );
};

export default WasteReport;