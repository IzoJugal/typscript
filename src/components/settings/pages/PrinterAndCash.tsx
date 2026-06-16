
import axios from "axios";
import { useEffect, useState } from "react";
import { FaPlus, FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { apiUrl } from "../../../environment/env";
import ConfirmModal from "../../../hooks/ConfirmModal";
import { AddModal } from "../utils/PrinterAndCashUtils";
import { formatLabel } from "./Pos";
import { useAuth } from "../../../context/AuthProvider";

function PrinterAndCash() {
    const { userData } = useAuth();

    const [cashdrawer, setCashdrawer] = useState<any>({
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [printerData, setPrinterData] = useState<any>({
        deviceName: '',
        bdAddress: '',
        macAddress: '',
        ipAddress: '',
        target: '',
        type: ''
    });
    const [printersCash, setPrintersCash] = useState<any>([]);
    const [currentPrinter, setCurrentPrinter] = useState<any>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState(false)

    const handleNewCashDrawerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value } = e.target;

        const updatedCashDrawer = { ...cashdrawer, [name]: type === "checkbox" ? checked : value };
        setCashdrawer(updatedCashDrawer);
        try {
            await axios.patch(`${apiUrl}/setting/cashdrawers/${cashdrawer._id}`, updatedCashDrawer);
        } catch (error) {
            console.error("Error updating cash drawer:", error);
        }
    };

    const handleModalToggle:any = (printer:any) => {
        setPrinterData(printer)
        setCurrentPrinter(printer);
        setIsModalOpen(!isModalOpen);
    };

    const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPrinterData((prevData:any) => ({
            ...prevData,
            [name]: value
        }));
    };

    const getPrinterCash = async () => {
        try {
            const response = await axios.get(`${apiUrl}/setting/cashdrawers-printer`);
            setPrintersCash(response.data.data.printersCash)
            setCashdrawer(response.data.data.cashDrawers)

        } catch (error) {
            console.log("~ error :-", error);
        }
    };

    useEffect(() => {
        getPrinterCash();
    }, []);

    const onAddSuccess = (printer:any) => {
        setPrintersCash((prev:any) => {
            const existingIndex = prev.findIndex((p:any) => p?._id === printer?._id);
            if (existingIndex !== -1) {
                const updatedPrinters = [...prev];
                updatedPrinters[existingIndex] = printer;
                return updatedPrinters;
            }
            return [printer, ...prev];
        });
    };

    const onDeleteSuccess = (id: string) => {
        const newList = printersCash.filter((printer:any) => printer?._id !== id)
        setPrintersCash(newList)
    }

    const inputSubmit = async () => {
        // e.preventDefault();
        try {
            if (!printerData?.deviceName) {
                return toast.error('Please enter the remote printer name!');
            }
            if (!printerData?.type) {
                return toast.error('Please select the type!');
            }
            if (!printerData?.macAddress) {
                return toast.error('Please enter the MAC address!');
            }
            if (!printerData?.ipAddress) {
                return toast.error('Please enter the IP address!');
            }
            if (!printerData?.target) {
                return toast.error('Please enter the target!');
            }

            const validTypes = ['Bar', 'Kitchen', 'Invoice'];
            if (!validTypes.includes(printerData.type)) {
                return toast.error('Invalid printer type selected!');
            }

            const payload = {
                ...printerData
            };

            if (currentPrinter) {
                const response = await axios.patch(`${apiUrl}/setting/printer/${currentPrinter?._id}`, payload);
                if (response.status === 200) {
                    toast.success(response.data.message);
                    onAddSuccess(response.data.data)
                    setIsModalOpen(false);
                    setPrinterData({})
                }
            } else {
                const response = await axios.post(`${apiUrl}/setting/printer/add`, payload);
                if (response.status === 201) {
                    setIsModalOpen(false);
                    toast.success(response.data.message);
                    onAddSuccess(response.data.data)
                    setPrinterData({})
                } else {
                    toast.info(response.data.message);
                }
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    toast.error(`Failed to save data: ${error.response.data.message ?? 'An unexpected error occurred'}`);
                }
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        setDeleteModal(false);
        setSelectedId(null);
        try {
            const response = await axios.post(`${apiUrl}/setting/printer/${selectedId}`, {});
            if (response.status === 200) {
                toast.success(response.data.message);
                onDeleteSuccess(selectedId)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    toast.error(error.response.data.message ?? 'An unexpected error occurred');
                }
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }
        }
    }

    return (
        <>
            <div className='grid grid-cols-2 gap-4 '>
                <div className='lg:h-[500px] h-[50vh]'>
                    <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Remote Printer Settings</h3>
                    <div className="flex justify-end mb-4">
                        <div className="flex space-x-2">
                            <button onClick={() => handleModalToggle()} className="bg-[#46a92a] flex gap-2 text-white py-2 px-4 rounded hover:bg-green-600">
                                <FaPlus className='mt-1' />  Add
                            </button>
                        </div>
                    </div>

                    <div className="text-lg font-medium bg-[#638ECA] px-4 py-2 text-[#FFF5F5]">Remote Printer Name</div>
                    <div className={`bg-[#2E5783] h-[44vh] lg:h-[${userData ? '283px' : '320px'}] text-white overflow-auto`}>
                        <table className="w-full">
                            <tbody>
                                {printersCash.length > 0 ? (
                                    printersCash.map((item:any) => (
                                        <tr key={item?._id} className="border-b border-[#fff5]">
                                            <td className="py-2 px-2 truncate max-w-96" title={item?.deviceName}>{item?.deviceName}</td>
                                            <td className="py-2 px-2 flex justify-end">
                                                <button
                                                    onClick={() => handleModalToggle(item)}
                                                    className="bg-[#638ECA] flex text-white p-2 rounded hover:bg-[#6c84a5] mr-2">
                                                    <FaRegEdit className='mt-1' />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(item?._id)}
                                                    className="bg-red-800 flex text-white p-2 rounded hover:bg-red-700">
                                                    <FaRegTrashAlt className='mt-1' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="text-center p-4 bg-[#2E5783] text-white">
                                        <td>Printer not found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={`bg-[#2E5783] h-[36vh] lg:h-[${userData ? '428px' : '460px'}] text-white overflow-auto`}>
                    <table className="text-lg font-medium text-[#FFF5F5] w-full border-collapse">
                        <thead className="bg-[#638ECA]">
                            <tr className="mb-4">
                                <th className="px-2 text-left">Sr.No.</th>
                                <th className="px-4 text-left py-2">Printer Name</th>
                                <th className="px-4 text-left py-2">Type</th>
                                <th className="px-4 text-left py-2">Mac Address</th>
                                <th className="px-4 text-left py-2">IP Address</th>
                                <th className="px-4 text-left py-2">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {printersCash.length > 0 ? (
                                printersCash.map((item:any, index:any) => (
                                    <tr key={item?._id} className="border-b border-[#ffffff30] hover:bg-[#2E5783] transition ease-in-out">
                                        <td className="px-4 truncate max-w-44" >{index + 1}</td>
                                        <td className="px-6 py-4 truncate max-w-44" title={item?.deviceName}>{item?.deviceName}</td>
                                        <td className="px-6 py-4 truncate max-w-44" title={item?.type}>{item?.type}</td>
                                        <td className="px-6 py-4 truncate max-w-44" title={item?.macAddress}>{item?.macAddress}</td>
                                        <td className="px-6 py-4 truncate max-w-44" title={item?.ipAddress}>{item?.ipAddress}</td>
                                        <td className="px-6 py-4 truncate max-w-44" title={item?.target}>{item?.target}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="text-center p-6 bg-[#2E5783] text-white">
                                    <td>Printer not found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
            <div className={`fixed ${userData ? 'w-[calc(100%-256px)]' : 'w-full'} right-0 bottom-0  p-2 bg-[#2A3769]`}>
                <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Cash Drawer Settings</h3>
                <div className='flex gap-4'>
                    <div>
                        <label htmlFor='cashdrawer' className="block text-white">Cash Drawer Code</label>
                        <input
                            type="text"
                            id='cashdrawer'
                            name='cashdrawer'
                            value={cashdrawer.cashdrawer}
                            onChange={handleNewCashDrawerChange}
                            className="bg-[#2E5783] border-0 w-full h-8 p-2 rounded text-white"
                        />
                    </div>
                    <div>
                        <div className='text-white'>Cash Drawer Open for</div>
                        <div className='flex space-x-4'>
                            {Object.entries(cashdrawer).map(([key, value]) => {
                                // Exclude ID from rendering
                                if (key === '_id' || key === 'cashdrawer' || key === 'updatedAt' || key === 'createdAt' || key === '__v') return null;

                                return (<div key={key} className="flex items-center gap-2">
                                    <span className="text-sm text-white">{formatLabel(key)}</span>
                                    <label htmlFor="checkbox" className="relative inline-flex items-center ml-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(value)}
                                            onChange={() => handleNewCashDrawerChange({
                                                target: {
                                                    name: key,
                                                    type: 'checkbox',
                                                    checked: !value
                                                }
                                            } as React.ChangeEvent<HTMLInputElement>)}
                                            className="sr-only"
                                        />
                                        <div className={`w-12 h-4 rounded-full shadow-inner ${value ? 'bg-BRAND-300' : 'bg-DARK-600'}`}></div>
                                        <div className={`dot absolute w-6 h-6 rounded-full shadow transform transition duration-200 ease-in-out ${value ? 'translate-x-6 bg-BRAND-400' : 'bg-BRAND-400'}`}></div>
                                    </label>
                                </div>);
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <AddModal
                isModalOpen={isModalOpen}
                handleMolalToggle={handleModalToggle}
                inputChange={inputChange}
                inputSubmit={inputSubmit}
                printerData={printerData}
            />

            <ConfirmModal
                isOpen={deleteModal}
                message="Are you sure you want to delete this printer ?"
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal(false)}
            />
        </>
    );
}

export default PrinterAndCash;
