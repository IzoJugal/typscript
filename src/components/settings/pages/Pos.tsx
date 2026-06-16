
import {  useCallback, useEffect, useState } from "react";
import {  SectionTitle, ToggleListPose } from "../utils/PosUtils";
import { GeneralToggle } from "../utils/functions";
import { FunctionModal } from "../utils/FunctionModal";
import axios from "axios";
import { apiUrl } from "../../../environment/env";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import { SUPER_ADMIN } from "../../../utils/common/constant";

export const formatLabel = (key: string): string => {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
        .replace("Id", "ID");
};

export const printWhileSaving = [
    { value: 'always', label: 'Always' },
    { value: 'never', label: 'Never' },
    { value: 'ask_for_confirmation', label: 'Ask for Confirmation' },
]

export const InvoicePrintingData = [
    { value: 'dispalyprintoption', label: 'Dispaly Print option' },
    { value: 'directprint', label: 'Direct print' },
    { value: 'donotprint', label: 'Do not Print' },
]

export const PricingData = [
    { value: 'by_price', label: 'By Price Schedule' },
    { value: 'by_custome', label: 'By Custom Price Group/Level' },
]
export const DefaultFocusOn = [
    { value: 'menuId', label: 'Menu ID' },
    { value: 'custId', label: 'Cust, ID' },
    { value: 'custNamePohone', label: 'Cust Name / Pohone' },
]


function Pos() {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || '';
    const [serviveId, setServiveId] = useState()
    const [serviceSettings, setServiceSettings] = useState({
        _id: "",
        serviceType: {
            quickServices: false,
            tablePlan: false,
            delivery: false,
            takeout: false,
            barTabs: false,
        },
        quantity: {
            quantityQuickService: false,
            quantityTablePlan: false,
            quantityDelivery: false,
            quantityTakeout: false,
            quantityBarTabs: false,
        },
        systemSetting: {
            pax: false,
            void: false,
            split: false,
            return: false,
            manualDiscount: false
        }
    });


    const getPos = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/setting/pos`)
            console.log("~ response :-", response.data.data[0].customizeOrderingModule);
            setServiveId(response.data.data[0]?._id)
            setServiceSettings(response.data.data[0].serviceSettings)
            setServiceTerminalState(response.data.data[0].serviceTerminalState)
            setSelectedPrintSaving(response.data.data[0]?.printSettings?.selectedPrintSaving)
            setSeletedTendering(response.data.data[0]?.printSettings?.seletedTendering)
            setInvoiceprinting(response.data.data[0]?.printSettings?.invoiceprinting)
            setOrderInvoice(response.data.data[0].orderInvoice)
            setDefaultFocus(response.data.data[0].defaultFocus)
            setSelectedPriceing(response.data.data[0].selectedPriceing)
            setSelectedIndex(response.data.data[0].selectedAppValue)
            setCustomizeOrderingModule(response.data.data[0].customizeOrderingModule)
        } catch (error) {
            console.log("~ ERROR GENERAL :-", error);

        }
    }, [])

    useEffect(() => {
        getPos()
    }, [])

    // Generalized toggle handler
    const handleToggle:any = (category: 'serviceType' | 'quantity', key: string) => {
        setServiceSettings((prevState:any) => ({
            ...prevState,
            [category]: {
                ...prevState[category],
                [key]: !prevState[category][key],
            },
        }));
    };

    const handleServiceTypeToggle = (key: keyof typeof serviceSettings.serviceType) => {
        handleToggle('serviceType', key);
    };

    const handleQuantityToggle = (key: keyof typeof serviceSettings.quantity) => {
        handleToggle('quantity', key);
    };

    const handleSystemSettingToggle = (key: keyof typeof serviceSettings.quantity) => {
        handleToggle('systemSetting', key);
    };

    // Merged state for terminal selection
    const [serviceTerminalState, setServiceTerminalState] = useState('');

    // Generalized handler to open the terminal popup
    const handleSelectService = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setServiceTerminalState(event.target.value);
    };

    // Handler to set the selected value for the active terminal
    // const handleServiceTerminalValue = (value: string) => {
    //     setServiceTerminalState((prevState) => {
    //         const updatedServices = [...prevState.selectedServices];
    //         if (prevState.activeServiceIndex !== null) {
    //             updatedServices[prevState.activeServiceIndex] = value;
    //         }
    //         return {
    //             ...prevState,
    //             selectedServices: updatedServices,
    //             popupOpen: false,
    //             activeServiceIndex: null,
    //         };
    //     });
    // };

    // // Handler to close the terminal popup
    // const handleServiceClose = () => {
    //     setServiceTerminalState((prevState) => ({
    //         ...prevState,
    //         popupOpen: false,
    //         activeServiceIndex: null,
    //     }));
    // };

    // kitchen
    // saving & tendering
    const [selectedPrintSaving, setSelectedPrintSaving] = useState('always')
    const [seletedTendering, setSeletedTendering] = useState('always')

    const handleSelected:any = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPrintSaving(event.target.value)
    }

    const handleTendering:any = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSeletedTendering(event.target.value)
    }

    // invoice printing
    const [invoiceprinting, setInvoiceprinting] = useState('dispalyprintoption')

    const handleInvoicePrinting:any = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setInvoiceprinting(event.target.value)
    }

    //show alternate name
    const [orderInvoice, setOrderInvoice] = useState({
        orderPrint: false,
        invoicePrint: true,
    })
    // const [printSettings, setPrintSettings] = useState({
    //     orderPrint: false,
    //     invoicePrint: true,
    // });
    const handlePrinting = (setting: keyof typeof orderInvoice) => {
        setOrderInvoice((prev) => ({
            ...prev,
            [setting]: !prev[setting],
        }));
    };

    // Pricing selection

    const [selectedPriceing, setSelectedPriceing] = useState('by_price')

    const handlePricing:any = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPriceing(event.target.value)
    }

    const [defaultFocus, setDefaultFocus] = useState('menuId')


    const handleDefaultFocus:any = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDefaultFocus(e.target.value)
    }

    //menu and modifier
    // Initialize selectedNoOfColumMenu as a string
    // const [selectedNoOfColumMenu, setSelectedNoOfColumMenu] = useState<string>('3');
    // const [noOfCloum, setNoOfCloum] = useState<number | null>(null); // Use number for index
    // const [noOfColumPopup, setNoOfColumPopup] = useState(false);

    // const handleNoOfColum = (index: number) => {
    //     setNoOfCloum(index);
    //     setNoOfColumPopup(true);
    // };

    // const handleNoOfColumValue = (value: string) => {
    //     if (noOfCloum !== null) {
    //         const columnsArray = selectedNoOfColumMenu.split(',');
    //         columnsArray[noOfCloum] = value;
    //         setSelectedNoOfColumMenu(columnsArray.join(','));
    //     }
    //     setNoOfColumPopup(false);
    // };

    // const handleNoOfColumClose = () => {
    //     setNoOfColumPopup(false);
    //     setNoOfCloum(null);
    // };

    // const [selectedModifier, setSelectedModifier] = useState<string>('3');
    // const [modifier, setModifier] = useState<number | null>(null);
    // const [modifierPopup, setModifierPopup] = useState(false);

    // const handleModifier = (index: number) => {
    //     setModifier(index);
    //     setModifierPopup(true);
    // };

    // const handleModifierValue = (value: string) => {
    //     if (modifier !== null) {
    //         const modifiersArray = selectedModifier.split(',');
    //         modifiersArray[modifier] = value;
    //         setSelectedModifier(modifiersArray.join(','));
    //     }
    //     setModifierPopup(false);
    // };

    // const handleModifierClose = () => {
    //     setModifierPopup(false);
    //     setModifier(null);
    // };


    const [customizeOrderingModule, setCustomizeOrderingModule] = useState({
        displayChangesAfterSale: false,
        addTipsAutomatically: false,
        showGiftCertificateBalance: false,
        printServedByOnKitchenPrinter: false,
        doNotPrintReceiptForNoSale: false,
        duplicateReceiptForCreditCard: false,
        autoHoldRetrieveOrders: false,
        useVoidCancelReason: false,
        showHoldDialog: false,
        printOrderNotes: false,
        useTablePlanGuestOption: false,
        recordSeatNumberInTablePlan: false,
        minimumAgeIDRequired: false,
        acceptChecksForPurchaseOnly: false,
        printDeliveryInfoOnKitchenPrinter: false,
        duplicateReceiptForAllPayments: false,
    });

    const handleToggleChange = (key: keyof typeof customizeOrderingModule) => {
        setCustomizeOrderingModule(prevState => ({
            ...prevState,
            [key]: !prevState[key]
        }));
    };

    const [apps, setApps] = useState([
        { name: 'Reprint Receipt', order: 1, visible: 'Yes' },
        { name: 'No Sale', order: 2, visible: 'Yes' },
        { name: 'Order Notes', order: 3, visible: 'Yes' },
        { name: 'Product Notes', order: 4, visible: 'Yes' },
        { name: 'Discount Ticket', order: 5, visible: 'Yes' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null | any>();
    const [selectedAppValue, setSelectedAppValue] = useState<string | null | any>(null);

    const moveRow = (index: number, direction: 'up' | 'down') => {
        const newApps = [...apps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex >= 0 && targetIndex < newApps.length) {
            [newApps[index], newApps[targetIndex]] = [newApps[targetIndex], newApps[index]];
            setApps(newApps);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleMoveDown = () => {
        if (selectedIndex && selectedIndex < apps.length - 1) {
            moveRow(selectedIndex, 'down');
            setSelectedIndex(selectedIndex + 1);
        }
    };

    const handleMoveUp = () => {
        if (selectedIndex && selectedIndex > 0) {
            moveRow(selectedIndex, 'up');
            setSelectedIndex(selectedIndex - 1);
        }
    };



    // Callback function to receive the selected app value
    const handleSelectedAppValue = (appValue: string | null | any) => {
        setSelectedAppValue(appValue.selectedApp);
        setIsModalOpen(false)
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            serviceSettings,
            serviceTerminalState: serviceTerminalState,
            printSettings: {
                selectedPrintSaving,
                seletedTendering,
                invoiceprinting,
            },
            orderInvoice,
            selectedPriceing,
            defaultFocus,
            // selectedNoOfColumMenu,
            // selectedModifier,
            customizeOrderingModule,
            selectedAppValue: selectedIndex,
        };
        try {
            const response = await axios.patch(`${apiUrl}/setting/pos/${serviveId}`, payload);

            if (response.status === 200) {
                console.log('Settings saved successfully:', response.data.message);
                toast.success(response.data.message);
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with a status other than 2xx
                    console.error('Server error:', error.response.status, error.response.data.message);
                    toast.error(`Failed to save data:- ${error.response.data.message}`);
                }
            } else {
                console.error('Unexpected error:', error);
                toast.error('An unexpected error occurred. Please try again later.');
            }
        }
    };




    return (
        <div>
            <div className='grid grid-cols-3 gap-4 '>
                <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                    <SectionTitle title="Services" />

                    {(loginRole === SUPER_ADMIN) && <div className="mb-3">
                        <ToggleListPose
                            settings={serviceSettings?.systemSetting}
                            handleToggle={handleSystemSettingToggle}
                            formatLabel={formatLabel}
                        />
                    </div>}
                    
                    <ToggleListPose
                        settings={serviceSettings.serviceType}
                        handleToggle={handleServiceTypeToggle}
                        formatLabel={formatLabel}
                    />

                    <div className="text-white">Use Quick Quantity for</div>
                    <ToggleListPose
                        settings={serviceSettings.quantity}
                        handleToggle={handleQuantityToggle}
                        formatLabel={formatLabel}
                    />

                    <div className="mt-4">
                        <div className="text-white">Default at this terminal</div>
                        <select className="bg-[#2E5783] flex cursor-pointer rounded border-0 w-full text-white" value={serviceTerminalState} onChange={handleSelectService}>
                            <option value='' disabled>Select value</option>
                            <option value='QuickService'>Quick Service</option>
                            <option value='TablePlan'>Table Plan</option>
                            <option value='Delivery'>Delivery</option>
                            <option value='Takeout'>Takeout</option>
                            <option value='BarTabs'>Bar Tabs</option>
                        </select>
                    </div>

                </div>
                <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                    <div className="text-xl font-semibold text-[#46a92a] mb-4">Kitchen Printing(Order Printing)</div>
                    <div>
                        <div className="font-semibold text-white mt-2">Print while saving ?</div>
                        <div className="flex flex-col px-2 mb-4">
                            {printWhileSaving.map((option) => (
                                <label key={option.value} className="flex items-center w-40 py-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="payroll"
                                        value={option.value}
                                        className="mr-2 cursor-pointer"
                                        checked={selectedPrintSaving === option.value}
                                        onChange={handleSelected}
                                    />
                                    <span className="text-sm text-white">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold text-white mt-2">Print while tendering ?</div>
                        <div className="flex flex-col px-2 mb-4">
                            {printWhileSaving.map((option) => (
                                <label key={option.value} className="flex items-center w-40 py-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tendering"
                                        value={option.value}
                                        className="mr-2 cursor-pointer"
                                        checked={seletedTendering === option.value}
                                        onChange={handleTendering}
                                    />
                                    <span className="text-sm text-white">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold text-[#46a92a]  mt-2">Invoice Printing</div>
                        <div className="flex flex-col px-2 mb-4">
                            {InvoicePrintingData.map((option) => (
                                <label key={option.value} className="flex items-center w-40 py-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="invoiceprinting"
                                        value={option.value}
                                        className="mr-2 cursor-pointer"
                                        checked={invoiceprinting === option.value}
                                        onChange={handleInvoicePrinting}
                                    />
                                    <span className="text-sm text-white">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-xl font-semibold text-[#46a92a] mb-4">Show Alternate Name in</div>
                        {Object.entries(orderInvoice).map(([key, value]) => (
                            <label key={key} className="flex items-center space-x-3">

                                <GeneralToggle
                                    key={key}
                                    label={formatLabel(key)}
                                    checked={value}
                                    onChange={() => handlePrinting(key as keyof typeof orderInvoice)}
                                />
                            </label>
                        ))}
                    </div>
                    <div>
                        <div className="font-semibold text-[#46a92a]  mt-2">Priceing Selection</div>
                        <div className="flex flex-col px-2 mb-4">
                            {PricingData.map((option) => (
                                <label key={option.value} className="flex items-center w-52 py-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="pricingselection"
                                        value={option.value}
                                        className="mr-2 cursor-pointer"
                                        checked={selectedPriceing === option.value}
                                        onChange={handlePricing}
                                    />
                                    <span className="text-sm text-white">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold text-[#46a92a]  mt-2">Default Foucs</div>
                        <div className="flex flex-col px-2 mb-4">
                            {DefaultFocusOn.map((option) => (
                                <label key={option.value} className="flex items-center w-52 py-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="defaultFocus"
                                        value={option.value}
                                        className="mr-2 cursor-pointer"
                                        checked={defaultFocus === option.value}
                                        onChange={handleDefaultFocus}
                                    />
                                    <span className="text-sm text-white">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* <div>
                        <div className="text-xl font-semibold text-[#46a92a] mb-4">Menu and Modifier Button Setup</div>
                        <div className="flex flex-col gap-4 mt-4  text-white">
                            <label>No of Cloumns(Menu)</label>
                            {[0].map((index) => (
                                <div key={index} className="relative bg-[#2E5783] flex cursor-pointer">
                                    <button
                                        className="rounded p-2 w-full text-left border-0"
                                        onClick={() => handleNoOfColum(index)}
                                    >
                                        {selectedNoOfColumMenu[index] || 'Select an option'}
                                    </button>
                                    <div className=''>
                                        <FaAngleDown className='text-3xl' />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Modal
                            isOpen={noOfColumPopup}
                            title="Select a Value"
                            options={[3, 4, 5, 6]}
                            onOptionSelect={handleNoOfColumValue}
                            onClose={handleNoOfColumClose}
                        />

                    </div>
                    <div>
                        <div className="flex flex-col gap-4 mt-4  text-white">
                            <label>No of Cloumns(Modifier)</label>
                            {[0].map((index) => (
                                <div key={index} className="relative bg-[#2E5783] flex cursor-pointer">
                                    <button
                                        className="rounded p-2 w-full text-left border-0"
                                        onClick={() => handleModifier(index)}
                                    >
                                        {selectedModifier[index] || 'Select an option'}
                                    </button>
                                    <div className=''>
                                        <FaAngleDown className='text-3xl' />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ModifierModal
                            isOpen={modifierPopup}
                            title="Select a Value"
                            options={[3, 4, 5, 6, 7]}
                            onOptionSelect={handleModifierValue}
                            onClose={handleModifierClose}
                        />

                    </div> */}

                    <div className="text-center mt-2">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className='bg-[#2E5783] border-0 w-auto text-sm p-2 h-10 rounded text-white hover:bg-slate-600'
                        >
                            SET POS FUNCTION BUTTONS
                        </button>
                        <FunctionModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            apps={apps}
                            handleMoveDown={handleMoveDown}
                            handleMoveUp={handleMoveUp}
                            selectedIndex={selectedIndex}
                            setSelectedIndex={setSelectedIndex}
                            handleSelectedAppValue={handleSelectedAppValue}
                            selectedAppValue={selectedAppValue}
                        />

                    </div>
                </div>

                <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                    <div className="text-xl font-semibold text-[#46a92a] mb-4">Customize Ordering Module</div>
                    <div className="settings-container">
                        {Object.entries(customizeOrderingModule).map(([key, value]) => (
                            <GeneralToggle
                                key={key}
                                label={formatLabel(key)}
                                checked={value}
                                onChange={() => handleToggleChange(key as keyof typeof customizeOrderingModule)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="text-whit text-center" >
                <button type="submit" onClick={handleSubmit} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">Submit</button>
            </div>
        </div>
    )
}

export default Pos