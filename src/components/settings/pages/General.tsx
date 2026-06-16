/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useState } from "react";
import { TiInfoLarge } from "react-icons/ti";
import { toast } from "react-toastify";
import { apiUrl } from "../../../environment/env";
import apiClient from "../../../utils/AxiosInstance";
import { MaxChargeTextInput, PrinterSelection, QuickBookExportModal, RadioButtonGroup, ScaleModal, TextAreaWithLabel, ToggleGroup } from "../utils/General";
import { GeneralToggle } from "../utils/functions";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { formatDate } from "../../../utils/utility";
import { useConfigs } from "../../../context/SiteConfigsProvider";

export interface SignInOutSettings {
    forceEmployeeClockIn: boolean;
    useTimeclockFunction: boolean;
    autoSignOut: boolean;
    autoSignOutAfterSale: boolean;
}

interface scalPort {
    baudRate: string
    dataBits: string
    stopBits: string
    parity: string
    handshake: string
}

interface PrinterSelectionState {
    _id: string;
    selectedValues: string[];
    isA4Page: boolean;
    is8_5x11: boolean;
    header: string;
    footer: string;
    pdisplay: string;
    terminalId: string;
    scaleDevice: string;
    scalPort: scalPort;
    customerInfo: string;
    selectedTaxValues: string;
    selectedTax: string;
    maxCharge: string;
    signInOutSettings: SignInOutSettings;
    signInFiled: string;
    gratuity:string;
}

interface User {
    _id?: string,
    phone?: string;
    hireDate?: string; // ISO date string
    isActive?: boolean;
    isDelete?: boolean;
    name?: string;
    pin?: string;
    role?: string;
}

export const customerInfoOptions = [
    { value: 'optional', label: 'Optional' },
    { value: 'mandatory', label: 'Mandatory' },
];

export const payrollReport = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-weekly' },
]

export const userInField = [
    { value: 'userIdAndPassword', label: 'User Id And Password' },
    { value: 'userId', label: 'User Id' },
    { value: 'password', label: 'Password' },
]


export const gratuityFiled=[
    { value: '10%', label: '10%' },
    { value: '15%', label: '15%' },
    { value: '20%', label: '20%' },

]


const formatLabel = (key: string): string => {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
        .replace("Id", "ID");
};
function General() {
      const { configData } = useConfigs();
    const [printerSelectionState, setPrinterSelectionState] = useState<PrinterSelectionState>({
        _id:'',
        selectedValues: [''],
        isA4Page: false,
        is8_5x11: false,
        header: '',
        footer: '',
        pdisplay: '',
        terminalId: '',
        scaleDevice: '',
        scalPort: {
            baudRate: "",
            dataBits: "",
            stopBits: "",
            parity: "",
            handshake: "",
        },
        selectedTaxValues: '',
        customerInfo: 'optional',
        selectedTax: '00.00',
        maxCharge: '00.00',
        signInOutSettings: {
            forceEmployeeClockIn: false,
            useTimeclockFunction: false,
            autoSignOut: false,
            autoSignOutAfterSale: false
        },
        signInFiled: '',
        gratuity:""
    });

    const getPrinterSelection = async () => {
        try {
            const response = await axios.get(`${apiUrl}/setting/general`)
            console.log("~ response :-", response.data.data[0].closeReportType);
            setPrinterSelectionState(response.data.data[0])
            setTaxCustomerSettings(response.data.data[0].taxCustomerSettings)
            setSelectPayroll(response.data.data[0].payrollReport)
            setSelectCLoseOutReport(response.data.data[0].closeReportType)

        } catch (error) {
            console.log("~ ERROR GENERAL :-", error);

        }
    }

    useEffect(() => {
        getPrinterSelection()
    }, [])

    // const [isPopupOpenTax, setIsPopupOpenTax] = useState(false);
    const [selectCLoseOutReport, setSelectCLoseOutReport] = useState('consolidated');
    const [selectPayroll, setSelectPayroll] = useState('weekly');

    // Handle value selection inside the popup
    const handleValueSelect:any = (value:any, index:any) => {
        setPrinterSelectionState(prevState => {
            const updatedValues = [...prevState.selectedValues];
            updatedValues[index] = value;
            return { ...prevState, selectedValues: updatedValues };
        });
    };

    // const handleValueSelect = (value: string) => {
    //     const updatedValues = [...printerSelectionState.selectedValues];
    //     if (activeSelectIndex !== null) {
    //         updatedValues[activeSelectIndex] = value;
    //     }
    //     setPrinterSelectionState((prevState) => ({ ...prevState, selectedValues: updatedValues }));
    //     setIsPopupOpen(false);
    // };

    const handleSwitchChangeA4 = () => {
        setPrinterSelectionState((prevState) => ({ ...prevState, isA4Page: !prevState.isA4Page }));
    };


    const handleSwitchChangeIs8 = () => {
        setPrinterSelectionState((prevState) => ({ ...prevState, is8_5x11: !prevState.is8_5x11 }));
    };

    const handleCustomerInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPrinterSelectionState((prevState) => ({
            ...prevState,
            customerInfo: event.target.value,
        }));
    };

    const handleInputSignIn = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrinterSelectionState((prevState) => ({
            ...prevState,
            signInFiled: e.target.value,
        }));
    }

    const gratuityInputChange=(e: React.ChangeEvent<HTMLInputElement>)=>{
        setPrinterSelectionState((prevState) => ({
            ...prevState,
            gratuity: e.target.value,
        }));
    }


    // Max Charge Handling
    const handleMaxChargeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setPrinterSelectionState((prevState) => ({
            ...prevState,
            maxCharge: newValue
        }));
    };

    // Sign In/Out Settings
    const handleSignInOut:any = (setting: keyof SignInOutSettings) => {
        setPrinterSelectionState(prevState => ({
            ...prevState,
            signInOutSettings: {
                ...prevState.signInOutSettings,
                [setting]: !prevState.signInOutSettings[setting]
            }
        }));
    };

    // Tax and Customer Settings
    const [taxCustomerSettings, setTaxCustomerSettings] = useState({
        taxInclusive: false,
        autoGenerateCustomerId: false,
        autoGenerateCustomerClass: false,
        autoGenerateCustomerGroup: false,
        autoGenerateItemModifierId: false,
        autoGenerateItemModifierCategoryId: false,
        digitDecimal: false,
        generateQuickBooksExport: false,
    });

    const handleCustomerSettings = (key: keyof typeof taxCustomerSettings) => {
        setTaxCustomerSettings(prevState => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    // Sales Report Type Handling
    const closeReportType = [
        { value: 'consolidated', label: 'Consolidated' },
        { value: 'withordertypebreakup', label: 'With Order Type Breakup' },
    ];

    const handleCloseOutReport = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectCLoseOutReport(e.target.value);
    };

    // Payroll Report Handling
    const handlePayRollReport = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectPayroll(e.target.value);
    };

    const [isQuickbookModalOpen, setIsQuickbookModalOpen] = useState(false);
    const [users, setUsers] = useState<User[] | any>([])

    const getStaffs = async () => {
        try {
            const response = await apiClient.get('/staff/for-setting')
            setUsers(response.data.data)
        } catch (error) {
            console.log("~ ERROR : Get User :-", error);
        }
    }

    useEffect(() => {
        getStaffs()
    }, [])


    const toggleQuickbookModal = () => {
        setIsQuickbookModalOpen(!isQuickbookModalOpen);
    };

    const styles = StyleSheet.create({
        page: {
            padding: 30,
            fontSize: 10,
        },
        title: {
            fontSize: 20,
            marginBottom: 10,
            textAlign: 'center',
            fontFamily: 'Helvetica-Bold',
        },
        infoText: {
            fontSize: 12,
            marginBottom: 5,
        },
        table: {
            marginTop: 10,
        },
        tableHeader: {
            flexDirection: 'row',
            backgroundColor: '#f0f0f0',
            padding: 5,
        },
        headerCell: {
            flex: 1,
            fontFamily: 'Helvetica-Bold',
            textAlign: 'left',
        },
        tableRow: {
            flexDirection: 'row',
            padding: 5,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
        },
        cell: {
            flex: 1,
            textAlign: 'left',
        },
    });

    const PDFDocumentComponent = ({ selectedUserMatch, exportType, fromDate, toDate }: { selectedUserMatch: any; exportType: string; fromDate: string; toDate: string }) => (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Exported Data for {selectedUserMatch?.name}</Text>
                <Text style={styles.infoText}>Export Type: {exportType}</Text>
                <Text style={styles.infoText}>From Date: {fromDate}</Text>
                <Text style={styles.infoText}>To Date: {toDate}</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerCell}>Field</Text>
                        <Text style={styles.headerCell}>Value</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.cell}>Phone</Text>
                        <Text style={styles.cell}>{selectedUserMatch?.phone ?? '-'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.cell}>Hire Date</Text>
                        <Text style={styles.cell}>{selectedUserMatch?.hireDate ? formatDate(selectedUserMatch?.hireDate,configData?.dateFormat) : ""}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.cell}>Is Active</Text>
                        <Text style={styles.cell}>{selectedUserMatch?.isActive ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.cell}>Role</Text>
                        <Text style={styles.cell}>{selectedUserMatch?.role?.name ?? '-'}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );

    const handleExport = async (
        exportType: string, 
        fromDate: string, 
        toDate: string, 
        selectedUser: string
      ): Promise<void> => {
        // Assuming users is an array of User objects
        const selectedUserMatch:any = users.find((user: User) => user?._id === selectedUser);
        
        if (!selectedUserMatch) {
          alert("Please select a user to export.");
          return;
        }
      
        try {
            const blob = await pdf(
                <PDFDocumentComponent
                    selectedUserMatch={selectedUserMatch}
                    exportType={exportType}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            ).toBlob();
            const pdfUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `${selectedUserMatch?._id}_export.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
      
        toggleQuickbookModal();
      };

    const createPayload = () => {
        return {
            ...printerSelectionState,
            taxCustomerSettings,
            closeReportType: selectCLoseOutReport,
            payrollReport: selectPayroll,
        };
    };

    const handleSubmit = async () => {
        const payload = createPayload();
        console.log("~ payload :-", payload);
        try {
            const response = await axios.patch(`${apiUrl}/setting/general/${printerSelectionState?._id}`, payload);
            if (response.status === 200) {
                toast.success(response.data.message);
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                // Axios-specific error handling
                if (error.response) {
                    // Server responded with a status other than 2xx
                    console.error('Server error:', error.response.status, error.response.data.message);
                    toast.error(`Failed to save data:- ${error.response.data.message}`);
                }
            } else {
                console.error('Unexpected error:', error);
                alert('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const [isPortSetupModal, setIsPortSetupModal] = useState(false)

    const openModalForScal = () => {
        setIsPortSetupModal(!isPortSetupModal)
    }

    const onCloseSetupModal = () => {
        setIsPortSetupModal(false)
    }

    return (<>
        <div className='grid grid-cols-3 gap-4 '>
            <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                <PrinterSelection
                    printerSelectionState={printerSelectionState}
                    handleValueSelect={handleValueSelect}
                    handleSwitchChangeA4={handleSwitchChangeA4}
                    handleSwitchChangeIs8={handleSwitchChangeIs8}
                />
                <div className='mt-2'>
                    <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Receipt Header and Footer</h3>
                    <div className="flex items-center bg-blue-100 p-2 mb-2 rounded text-black relative">
                        <span className="text-sm mr-2">
                            Hospitality info already added to header.
                        </span>
                        <div className="relative group">
                            <TiInfoLarge className="text-white bg-blue-500 rounded-full cursor-pointer mt-1" />
                            <div className="absolute left-1/2 transform -translate-x-1/2 w-56 bg-white text-DARK-800 text-xs rounded-lg p-3 shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
                                <p className="font-semibold mb-1">Following line will be printed as receipt header:</p>
                                <p className="font-medium">.Firepay Testing</p>
                                <p className="font-medium">1234 Main</p>
                                <p className="font-medium">City, NY Postal</p>
                            </div>
                        </div>
                    </div>

                    <TextAreaWithLabel
                        label="Recept Header"
                        name="header"
                        value={printerSelectionState.header}
                        onChange={(e) => setPrinterSelectionState((prev:any) => ({ ...prev, header: e.target.value }))}
                    />
                    <TextAreaWithLabel
                        label="Recept Footer"
                        name="footer"
                        value={printerSelectionState.footer}
                        onChange={(e) => setPrinterSelectionState((prev:any) => ({ ...prev, footer: e.target.value }))}
                    />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Pole Display</h3>
                    <input
                        type='text'
                        id='pdisplay'
                        name='pdisplay'
                        className="bg-[#2E5783] border-0 w-full p-2 text-white"
                        value={printerSelectionState?.pdisplay}
                        onChange={(e) => setPrinterSelectionState((prev:any) => ({ ...prev, pdisplay: e.target.value }))}
                    />

                    <div className="mb-4 mt-2">
                        <label htmlFor="terminal-id" className="block text-sm text-white mb-1">
                            Select Terminal ID
                        </label>
                        <select
                            id="terminal-id"
                            name="terminalId"
                            onChange={(e) => setPrinterSelectionState((prev:any) => ({ ...prev, terminalId: e.target.value }))}
                            value={printerSelectionState?.terminalId}
                            className="bg-[#2E5783] border-0 w-full p-2 text-white rounded"
                        >
                            <option className="text-white" value="" selected>Select Terminal ID</option>
                            <option className="text-white" value="1">Terminal 1</option>
                            <option className="text-white" value="2">Terminal 2</option>
                            <option className="text-white" value="3">Terminal 3</option>
                            <option className="text-white" value="4">Terminal 4</option>
                            <option className="text-white" value="5">Terminal 5</option>
                        </select>
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Scale Device</h3>
                    <div className="mb-4 mt-2">
                        <label htmlFor="terminal-id" className="block text-sm text-white mb-1">
                            Select Scale Device
                        </label>
                        <div className="flex gap-4">
                            <select
                                id="terminal-id"
                                name="scaleDevice"
                                onChange={(e) => setPrinterSelectionState((prev:any) => ({ ...prev, scaleDevice: e.target.value }))}
                                value={printerSelectionState?.scaleDevice}
                                className="bg-[#2E5783] border-0 w-full p-2 text-white rounded shadow-md focus:outline-none "
                            >
                                <option className="text-DARK-400" value="" disabled>Select Scale Device</option>
                                <option className="text-white" value="com1">com1</option>
                                <option className="text-white" value="com2">com2</option>
                                <option className="text-white" value="com3">com3</option>
                                <option className="text-white" value="com4">com4</option>
                            </select>
                            <button onClick={openModalForScal} className="bg-[#2E5783] text-white py-2 px-4 rounded hover:bg-slate-600 text-sm transition duration-150 ease-in-out">
                                Advanced Setup
                            </button>

                            {isPortSetupModal &&
                                <ScaleModal onCloseSetupModal={onCloseSetupModal} scalPort={printerSelectionState?.scalPort} setPrinterSelectionState={setPrinterSelectionState} id={printerSelectionState?._id} />
                            }
                        </div>
                    </div>


                </div>
            </div>

            <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>

                <div>
                    <div className="text-xl font-semibold text-[#46a92a] mb-4">Customer Information</div>
                    <RadioButtonGroup
                        options={customerInfoOptions}
                        selectedValue={printerSelectionState.customerInfo}
                        onChange={handleCustomerInfoChange}
                    />

                    <div>
                        <div className="text-xl font-semibold text-[#46a92a] mb-4">Gift Certificate</div>
                        <div className="flex flex-col gap-4 mt-4 text-white">
                            <MaxChargeTextInput
                                id="Tax"
                                label="Tax (%)"
                                value={printerSelectionState.selectedTax}
                                onChange={(e) => setPrinterSelectionState((prevState:any) => ({
                                    ...prevState,
                                    selectedTax: e.target.value
                                }))}
                            />
                        </div>

                    </div>

                    <MaxChargeTextInput
                        id="maxCharge"
                        label="Maximum Charge"
                        value={printerSelectionState.maxCharge}
                        onChange={handleMaxChargeChange}
                    />

                    <div className="text-xl font-semibold text-[#46a92a] mb-4">Sign In/Out</div>
                    <ToggleGroup
                        settings={printerSelectionState.signInOutSettings}
                        onChange={handleSignInOut}
                    />
                    {userInField.map((option) => {
                        return <div key={option.value} className="flex flex-col px-2 mb-4">
                            <label className="flex items-center w-[155px] py-2 cursor-pointer space-x-1">
                                <input
                                    type="radio"
                                    name="signInMethod"
                                    value={option.value}
                                    className=" text-blue-600  bg-DARK-100 border-DARK-300 focus:ring-blue-500 cursor-pointer"
                                    checked={printerSelectionState.signInFiled === option.value}
                                    onChange={handleInputSignIn}
                                />
                                <span className="text-white text-sm ">{option.label}</span>
                            </label>
                        </div>
                    })}

                    <div className="text-xl font-semibold text-[#46a92a] mb-4">Gratuity</div>
                    {gratuityFiled.map((option) => {
                        return <div key={option.value} className="flex flex-col px-2 mb-4">
                            <label className="flex items-center w-[155px] py-2 cursor-pointer space-x-1">
                                <input
                                    type="radio"
                                    name="gratuity"
                                    value={option.value}
                                    className=" text-blue-600  bg-DARK-100 border-DARK-300 focus:ring-blue-500 cursor-pointer"
                                    checked={printerSelectionState.gratuity === option.value}
                                    onChange={gratuityInputChange}
                                />
                                <span className="text-white text-sm ">{option.label}</span>
                            </label>
                        </div>
                    })}
                    {/* <ToggleGroup
                        settings={printerSelectionState.signInOutSettings}
                        onChange={handleSignInOut}
                    /> */}
                </div>
            </div>

            <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                <div className="text-xl font-semibold text-[#46a92a] mb-4">Others</div>
                <div className="flex flex-col">
                    {Object.entries(taxCustomerSettings)
                        .filter(([key]) => key !== '_id')
                        .map(([key, value]) => (
                            <GeneralToggle
                                key={key}
                                label={formatLabel(key)}
                                checked={value} // Use the current value
                                onChange={() => handleCustomerSettings(key as any)} // Handle change
                            />
                        ))}
                </div>
                <div className='text-center'>
                    <button onClick={toggleQuickbookModal} className='bg-[#2E5783] border-0 w-auto p-2 h-10 rounded text-white hover:bg-slate-600'>QUICKBOOK EXPORT</button>

                    <QuickBookExportModal
                        isOpen={isQuickbookModalOpen}
                        setIsOpen={setIsQuickbookModalOpen}
                        onExport={handleExport}
                        users={users}
                    />
                </div>
                <div>
                    <div className="font-semibold text-[#46a92a] mt-2">Sales, Closeout Report Type</div>
                    <div className="flex flex-col px-2 mb-4">
                        {closeReportType.map((option) => (
                            <label key={option.value} className="flex items-center w-48 py-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="closereport"
                                    value={option.value}
                                    className="mr-2 cursor-pointer"
                                    checked={selectCLoseOutReport === option.value}
                                    onChange={handleCloseOutReport}
                                />
                                <span className="text-sm text-white">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="font-semibold text-[#46a92a] mt-2">Payroll Report</div>
                    <div className="flex flex-col px-2 mb-4">
                        {payrollReport.map((option) => (
                            <label key={option.value} className="flex items-center w-24 py-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="payroll"
                                    value={option.value}
                                    className="mr-2 cursor-pointer"
                                    checked={selectPayroll === option.value}
                                    onChange={handlePayRollReport}
                                />
                                <span className="text-sm text-white">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div className="text-whit text-center" >
            <button type="submit" onClick={handleSubmit} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">Submit</button>
        </div>
    </>)
}

export default General