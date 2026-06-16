
import { FaAngleDown } from 'react-icons/fa';
import { GeneralToggle } from './functions';
import { ToggleSwitchHospit } from './hospitalityUtils';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../../environment/env';

// Define the PrinterSelectionState interface
interface PrinterSelectionState {
    selectedValues: string[];
    isA4Page: boolean;
    is8_5x11: boolean;
    header: string;
    footer: string;
}


interface TextAreaWithLabelProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    rows?: number;
}


// Define the props for the PrinterSelection component
interface PrinterSelectionProps {
    printerSelectionState: PrinterSelectionState; // Receive the entire state object
    handleSelectClick: (index: number) => void;
    isPopupOpen: boolean; // You may want to manage this in the parent
    handleValueSelect: (value: string) => void | any;
    handleClosePopup: () => void;
    handleSwitchChangeA4: () => void;
    handleSwitchChangeIs8: () => void;
}

// Define the props interface
// interface TaxModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     selectedTax: string | null; // Assuming selectedTax can be a string or null
//     onTaxSelect: (tax: string) => void;
// }

const formatLabel = (key: string): string => {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
        .replace("Id", "ID");
};

interface RadioButtonOption {
    value: string;
    label: string;
}

interface RadioButtonGroupProps {
    options: RadioButtonOption[];
    selectedValue: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}


interface DropdownButtonProps {
    label: string;
    selectedValue: string | null;
    onClick: () => void;
}

interface MaxChargeTextInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ToggleGroupProps {
    settings: Record<string, boolean>;
    onChange: (key: string) => void;
}

interface User {
    phone: string;
    hireDate: string;
    isActive: boolean;
    isDelete: boolean;
    name: string;
    pin: string;
    role: string;
    _id: string;
}


interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (exportType: string, fromDate: string, toDate: string, exportPath: string) => void;
    users: User[];
    setIsOpen:any
}

interface ScaleModal {
    onCloseSetupModal: boolean | any,
    id: string,
    setPrinterSelectionState:  any,
    scalPort: {
        baudRate: string
        dataBits: string
        stopBits: string
        parity: string
        handshake: string
    }
}

const printersDetail = [
    { id: 1, name: 'One Note for Windows 10' },
    { id: 2, name: 'Microsoft xps document writer' },
    { id: 3, name: 'Microsoft print to pdf' },
    { id: 4, name: 'Generic / text oncly (copy 1)' },
    { id: 5, name: 'Generic / text oncly' },
    { id: 6, name: 'Fax' },
]

export const PrinterSelection = ({
    printerSelectionState,
    handleSwitchChangeA4,
    handleSwitchChangeIs8,
    handleValueSelect,
}: PrinterSelectionProps | any) => {
    return (
        <>
            <div className="text-xl font-semibold text-[#46a92a] mb-4">Printer</div>
            <div className="flex flex-col gap-4 mt-4 text-white">
                {/* {[0, 1, 2, 3].map((index) => (
                    <div key={index}>
                        <label className="block text-sm mb-1">
                            {index === 0 && 'Recept Printer'}
                            {index === 1 && 'Report Printer'}
                            {index === 2 && 'Label Printer'}
                            {index === 3 && 'Delivery Printer'}
                        </label>
                        <div className="relative bg-[#2E5783] flex cursor-pointer">
                            <button
                                className="rounded p-2 w-full flex justify-between text-left border-0"
                                onClick={() => handleSelectClick(index)}
                            >
                                {printerSelectionState.selectedValues[index] || 'Select an option'}
                                <div>
                                    <FaAngleDown className='text-3xl' />
                                </div>
                            </button>
                        </div>
                        {index === 0 && (
                            <div className="mt-2">
                                <ToggleSwitchHospit
                                    isChecked={printerSelectionState.is8_5x11}
                                    onChange={handleSwitchChangeIs8}
                                    label="Print in 8.5 x 11 page"
                                    labelText={''}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {isPopupOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center text-black z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                            <h2 className="text-xl font-semibold mb-4">Select a Value</h2>
                            <div className="flex flex-col gap-3">
                                {printersDetail.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleValueSelect(option.name)}
                                        className="border-0 rounded-lg p-3 w-full text-left hover:bg-DARK-200 transition duration-200 ease-in-out"
                                    >
                                        {option.name}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleClosePopup}
                                className="mt-6 w-full bg-red-500 text-white p-3 rounded-lg hover:bg-ERROR_HOVER transition duration-200 ease-in-out"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )} */}
                <div className="flex flex-col gap-4 mt-4 text-white">
                    {[0, 1, 2, 3].map((index:any) => (
                        <div key={index}>
                            <label className="block text-sm mb-1">
                                {index === 0 && 'Recept Printer'}
                                {index === 1 && 'Report Printer'}
                                {index === 2 && 'Label Printer'}
                                {index === 3 && 'Delivery Printer'}
                            </label>
                            <select
                                className="relative bg-[#2E5783] rounded p-2 w-full border-0 text-white"
                                value={printerSelectionState.selectedValues[index] || ''}
                                onChange={(e) => handleValueSelect(e.target.value,)}
                            >
                                <option value="" disabled>
                                    Select an option
                                </option>
                                {printersDetail.map((option) => (
                                    <option key={option.id} value={option.name}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                            {index === 0 && (
                                <div className="mt-2">
                                    <ToggleSwitchHospit
                                        isChecked={printerSelectionState.is8_5x11}
                                        onChange={handleSwitchChangeIs8}
                                        label="Print in 8.5 x 11 page"
                                        labelText=""
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>


                <ToggleSwitchHospit
                    isChecked={printerSelectionState.isA4Page}
                    onChange={handleSwitchChangeA4}
                    label="Print in A4 Page"
                    labelText={''}
                />

            </div>
        </>
    );
};

export const TextAreaWithLabel: React.FC<TextAreaWithLabelProps> = ({ label, name, value, onChange, rows = 4 }) => (
    <div className="mb-4">
        <label htmlFor={name} className="block text-sm mb-1 text-white">
            {label}
        </label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            className="bg-[#2E5783] border-0 w-full p-2 rounded text-white"
            rows={rows}
        />
    </div>
);


export const RadioButtonGroup = ({ options, selectedValue, onChange }: RadioButtonGroupProps) => (
    <div className="flex flex-col px-2 mb-4">
        {options.map((option) => (
            <label key={option.value} className="flex items-center w-20 py-2 cursor-pointer">
                <input
                    type="radio"
                    name="customerInfo"
                    value={option.value}
                    className="mr-2 cursor-pointer"
                    checked={selectedValue === option.value}
                    onChange={onChange}
                />
                <span className="text-sm text-white">{option.label}</span>
            </label>
        ))}
    </div>
);

export const DropdownButton = ({ selectedValue, onClick }: DropdownButtonProps) => (
    <div className="relative bg-[#2E5783] flex cursor-pointer">
        <button
            className="rounded p-2 w-full text-left border-0"
            onClick={onClick}
        >
            {selectedValue ?? 'Select an option'}
        </button>
        <div>
            <FaAngleDown className='text-3xl' />
        </div>
    </div>
);

export const MaxChargeTextInput = ({ id, label, value, onChange }: MaxChargeTextInputProps) => (
    <div className="mb-4 mt-2">
        <label htmlFor={id} className="block text-sm text-white mb-2">
            {label}
        </label>
        <input
            id={id}
            type="text"
            name={id}
            value={value}
            onChange={onChange}
            className="bg-[#2E5783] border-0 w-full p-2 rounded text-white"
        />
    </div>
);

export const ToggleGroup = ({ settings, onChange }: ToggleGroupProps | any) => (
    <div className="flex flex-col px-2 mb-4">
        {Object.entries(settings).map(([key, value]) => {
            if (key === '_id') return null
            return <GeneralToggle
                key={key}
                label={formatLabel(key)}
                checked={value}
                onChange={() => onChange(key)}
            />
        })}
    </div>
);

export const QuickBookExportModal = ({ isOpen, onExport, users,setIsOpen }: ModalProps | any) => {

    const [exportType, setExportType] = useState('closeout');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedUser, setSelectedUser] = useState('');

    if (!isOpen) return null;

    const handleExport = () => {
        onExport(exportType, fromDate, toDate, selectedUser);
        setSelectedUser('')

    };
   
     const onClose:any =()=>{
        setIsOpen(!isOpen)
     }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#2A3769] p-6 md:p-8 rounded-lg shadow-lg w-11/12 md:w-96 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                <h2 className="text-lg text-white font-semibold mb-4">Export Data</h2>

                <div className="mb-4">
                    <label htmlFor='exportType' className="block text-white text-left text-sm mb-1">Export Type</label>
                    <select
                        value={exportType}
                        id='exportType'
                        name='exportType'
                        onChange={(e) => {
                            setExportType(e.target.value);
                            if (e.target.value !== 'payroll') setSelectedUser('');
                        }}
                        className="bg-[#2E5783] border-0 w-full rounded text-white"
                    >
                        <option value="closeout">Closeout Report</option>
                        <option value="payroll">Payroll Report</option>
                    </select>
                </div>

                {exportType === 'payroll' && ( // Show user selection only for Payroll
                    <div className="mb-4">
                        <label htmlFor='user' className="block text-white text-left text-sm mb-1">Select User</label>
                        <select
                            value={selectedUser}
                            name='user'
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="bg-[#2E5783] border-0 w-full rounded text-white"
                        >
                            <option value="">Select a user</option>
                            {users?.map((user:any) => (
                                <option key={user?._id} value={user?._id}>
                                    {user?.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="fromDate" className="block text-white text-left text-sm mb-1">From Date</label>
                    <input
                        type="date"
                        name='fromDate'
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-[#2E5783] border-0 w-full rounded text-white"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="todate" className="block text-white text-left text-sm mb-1">To Date</label>
                    <input
                        type="date"
                        name='todate'
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-[#2E5783] border-0 w-full rounded text-white"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-[#40658b] text-white px-4 py-2 rounded-lg mr-2 hover:bg-[#2d4b69]"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-[#40658b] text-white px-4 py-2 rounded-lg hover:bg-[#2d4b69]"
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ScaleModal = ({ onCloseSetupModal, scalPort, id, setPrinterSelectionState }: ScaleModal) => {
    const [scaleDetail, setScaleDetail] = useState({
        baudRate: '',
        dataBits: '',
        stopBits: '',
        parity: '',
        handshake: '',
    });

    const inputchange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setScaleDetail({ ...scaleDetail, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (scalPort) {
            setScaleDetail(scalPort);
        }
    }, [scalPort]);

    const handleSubmit = async () => {
        const payload = {
            scalPort: scaleDetail,
        };
        // setScaleDetail(scaleDetail)
        const response = await axios.patch(`${apiUrl}/setting/general/${id}`, payload);;
        setScaleDetail(response.data.data.scalPort)
        setPrinterSelectionState(response.data.data)
        onCloseSetupModal()
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-[#2A3769] p-6 md:p-8 rounded-lg shadow-lg w-11/12 md:w-96 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                    <h2 className="text-lg text-white font-semibold mb-4">Scale Modal</h2>

                    <div className="mb-4">
                        <label htmlFor="baud-rate" className="block text-sm text-white mb-1">Baud Rate</label>
                        <input
                            type="text"
                            id="baud-rate"
                            name='baudRate'
                            onChange={inputchange}
                            value={scaleDetail.baudRate} // Use scaleDetail for controlled input
                            className="bg-[#2E5783] text-white border-0 rounded p-2 w-full"
                            placeholder="Enter Baud Rate"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="data-bits" className="block text-sm text-white mb-1">Data Bits</label>
                        <input
                            type="text"
                            id="data-bits"
                            name="dataBits"
                            value={scaleDetail.dataBits} // Use scaleDetail for controlled input
                            onChange={inputchange}
                            className="bg-[#2E5783] text-white border-0 rounded p-2 w-full"
                            placeholder="Enter Data Bits"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="select1" className="block text-sm text-white mb-1">Stop Bits</label>
                        <select
                            id="select1"
                            name='stopBits'
                            onChange={inputchange}
                            value={scaleDetail.stopBits} // Use scaleDetail for controlled select
                            className="bg-[#2E5783] text-white border-0 rounded p-2 w-full"
                        >
                            <option value="" disabled>None</option>
                            <option value="one">One</option>
                            <option value="onePointFive">One Point Five</option>
                            <option value="two">Two</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="select2" className="block text-sm text-white mb-1">Parity</label>
                        <select
                            id="select2"
                            name='parity'
                            onChange={inputchange}
                            value={scaleDetail.parity} // Use scaleDetail for controlled select
                            className="bg-[#2E5783] text-white border-0 rounded p-2 w-full"
                        >
                            <option value="" disabled>None</option>
                            <option value="even">Even</option>
                            <option value="mark">Mark</option>
                            <option value="none">None</option>
                            <option value="odd">Odd</option>
                            <option value="space">Space</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="select3" className="block text-sm text-white mb-1">Handshake</label>
                        <select
                            id="select3"
                            name='handshake'
                            onChange={inputchange}
                            value={scaleDetail.handshake} // Use scaleDetail for controlled select
                            className="bg-[#2E5783] text-white border-0 rounded p-2 w-full"
                        >
                            <option value="" disabled>None</option>
                            <option value="even">Even</option>
                            <option value="mark">Mark</option>
                            <option value="none">None</option>
                            <option value="odd">Odd</option>
                            <option value="space">Space</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#46709c] text-white py-2 px-4 rounded hover:bg-slate-600 text-sm transition duration-150 ease-in-out"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCloseSetupModal}
                            className="bg-[#4977a8] text-white py-2 px-4 rounded hover:bg-slate-600 text-sm transition duration-150 ease-in-out"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};



