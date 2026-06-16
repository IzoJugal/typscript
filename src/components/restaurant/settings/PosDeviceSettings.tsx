import { Button, Label, Select, Table, Tooltip } from "flowbite-react";
import TableHeaders from "../../../utils/common/TableHeaders";
import { useState } from "react";
import ListLoader from "../../../utils/common/ListLoader";
import NoData from "../../../utils/common/NoData";
import { capitalized } from "../../../utils/utility";
import { deleteBtnStyle, editBtnStyle } from "../../../utils/common/constant";
import ConfirmModal from "../../../hooks/ConfirmModal";
import apiClient from "../../../utils/AxiosInstance";
import { apiUrl } from "../../../environment/env";
import { useAuth } from "../../../context/AuthProvider";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify";
import PageSize from "../../Pagination/PageSize";
import Pagination from "../../Pagination/Pagination";
import { terminalOptions } from "./PaymentSettings";
import { usePOS } from "../../../context/POSProvider";
import { getMachineID } from "../../../utils/common/PosTerminalUtility";
import CommonInput from "../../../utils/common/CommonInput";


interface PosSettingsProps {
    restaurant: string | any;
    posDeviceList: any[];
    setPosDeviceList: React.Dispatch<React.SetStateAction<any[]>>;
    numOfRecords: number,
    handleLimit: any;
    filterParams: any;
    curPage: any;
    deviceList: any[];
    restaurantData?: any;
}

export interface posFormData {
    _id?: string;
    name: string;
    deviceID: string;
    deviceNumber: string;
    defaultScreen: string;
    defaultProvider: string;
    defaultTerminal: string;
    restaurant: string;
    company: string;
}

const PosDeviceSettings = ({ restaurant, posDeviceList, setPosDeviceList, numOfRecords, handleLimit, filterParams, curPage, deviceList, restaurantData }: PosSettingsProps) => {
    const { userData } = useAuth();
    const { posDeviceId, setPosDeviceId } = usePOS();
    const PosColumnNames = ["sr. no", "Name", "device Id", "Device Number", "actions"];
    const initialData: posFormData = {
        _id: '',
        name: '',
        deviceID: '',
        defaultScreen: 'Quick Service',
        defaultProvider: 'pax',
        defaultTerminal: '',
        deviceNumber: "",
        restaurant: restaurant,
        company: restaurantData?.company?._id || userData?.staffMember?.company?._id,
    }
    const [isLoading, _setIsLoading] = useState<boolean>(false);
    const [btnLoading, setBtnLoading] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [posFormData, setPosFormData] = useState<posFormData>(initialData);
    const [errors, setErrors] = useState<Partial<Record<keyof posFormData, string>>>({});

    const terminalList = deviceList.filter((item: any) => posFormData.defaultProvider === "dejavoo" ? item?.dejavoo_tpn : !item?.dejavoo_tpn);
    // useEffect(() => {
    //     deviceList.filter((item: any) => posFormData.defaultProvider === "dejavoo" ? item?.dejavoo_tpn : !item?.dejavoo_tpn);
    // }, [posFormData.defaultProvider]);
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        let updatedValue: any = value;

        if (name === "deviceNumber") {
            // allow only max 2 digits
            if (/^\d{0,2}$/.test(value)) {
                updatedValue = value;
            } else {
                return;
            }
        }
        setPosFormData((prev: any) => ({
            ...prev,
            [name]: updatedValue
        }));

        setErrors((prev) => {
            const updated = { ...prev };
            delete updated[name as keyof posFormData];
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid()) return;

        setBtnLoading(true);

        const isEdit = Boolean(posFormData?._id);
        const endpoint = isEdit
            ? `${apiUrl}/device/${posFormData._id}`
            : `${apiUrl}/device/add`;

        const method: 'patch' | 'post' = isEdit ? 'patch' : 'post';

        try {
            const response = await apiClient[method](endpoint, posFormData);
            const { success, message, data } = response.data;

            if (!success) {
                toast.error(message);
                return;
            }

            toast.success(message);

            setPosDeviceList((prev) => {
                const updatedList = prev.map((item) =>
                    item._id === data._id ? data : item
                );

                // If it's a new entry, prepend it
                return isEdit ? updatedList : [data, ...updatedList];
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setBtnLoading(false);
            setPosFormData(initialData);
        }
    };


    const isValid = () => {
        let isValid = true;
        let errors: any = {};

        if (!posFormData.name) {
            errors.name = "Please enter device name";
            isValid = false;
        }
        if (!posFormData.deviceID?.trim()) {
            errors.deviceID = "Please enter device Id";
            isValid = false;
        }
        if (!posFormData.deviceNumber || Number(posFormData.deviceNumber) <= 0) {
            errors.deviceNumber = "Device number must be greater than 0";
            isValid = false;
        }
        setErrors(errors);
        return isValid;
    }

    const handleDeleteProgram = async () => {
        try {
            const response = await apiClient.post(`${apiUrl}/device/delete/${posFormData?._id}`);
            const { success, message } = response.data;

            if (success) {
                setPosDeviceList((prev: any[]) => prev.filter(item => item._id !== posFormData?._id));
                setIsDeleteModalOpen(false);
                toast.success(message);
            } else {
                toast.error(message);
            }
        } catch (error: any) {
            console.error("Delete failed:", error);
            toast.error(error?.response?.data?.message || "An error occurred while deleting the device.");
        } finally {
            setIsDeleteModalOpen(false);
            setPosFormData(initialData);
        }
    };

    const selectPosItem = (item: any) => {
        if (item?._id !== posFormData?._id) {
            setPosFormData((prev: any) => ({
                ...prev,
                _id: item?._id || '',
                name: item?.name,
                deviceID: item?.deviceID,
                deviceNumber: item?.deviceNumber,
                restaurant: item?.restaurant?._id,
                company: item?.company?._id,
                defaultProvider: item?.defaultProvider,
                defaultTerminal: item?.defaultTerminal?._id,
            }))
        } else {
            setPosFormData(initialData);
        }
    }

    const fetchDeviceId = () => {
        let deviceId = posDeviceId
        if (!posDeviceId) {
            deviceId = getMachineID();
            setPosDeviceId(deviceId);
        }
        setPosFormData((prev: any) => ({ ...prev, deviceID: deviceId }));
        setErrors((prev) => {
            const updated = { ...prev };
            delete updated.deviceID;
            return updated;
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-DARK-100 dark:bg-gray-900 rounded-2xl -shadow-lg p-4">
            <div className="rounded-lg border-t-2 border-BRAND-400 dark:border-DARK-400 overflow-x-auto">
                <Table hoverable className="min-w-full">
                    <TableHeaders columnNames={PosColumnNames} />
                    <Table.Body className="divide-y">
                        {isLoading && (
                            <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <Table.Cell colSpan={5} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {!isLoading && posDeviceList.length === 0 && (
                            <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <Table.Cell colSpan={5} className="text-center py-4 text-gray-500">
                                    <NoData
                                        title="No POS Devices Found"
                                        message="No POS device entries are available right now. Added POS device entries will appear here."
                                    />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {!isLoading &&
                            posDeviceList.map((item, index) => (
                                <Table.Row
                                    key={item._id}
                                    className={`${posFormData?._id === item?._id
                                        ? 'bg-BRAND-500/20'
                                        : 'bg-white dark:border-DARK-700 dark:hover:bg-DARK-700 dark:bg-DARK-800'
                                        }`}
                                >
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (filterParams.page - 1) * filterParams.limit}</Table.Cell>
                                    <Table.Cell className="min-w-[120px] px-3 py-2">{capitalized(item.name)}</Table.Cell>
                                    <Table.Cell className="min-w-[100px] px-3 py-2">{item.deviceID}</Table.Cell>
                                    <Table.Cell className="min-w-[100px] px-3 py-2">{item.deviceNumber}</Table.Cell>

                                    <Table.Cell className="min-w-32 flex flex-wrap items-center gap-2 px-3 py-2">
                                        <Tooltip content="View/Edit POS Device">
                                            <Button onClick={() => selectPosItem(item)} size="xs" color="gray" className={editBtnStyle.btn}>
                                                <MdKeyboardDoubleArrowRight className={editBtnStyle.icon} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Delete POS Device">
                                            <Button onClick={() => { setIsDeleteModalOpen(true); setPosFormData(item) }} className={deleteBtnStyle.btn} size="xs">
                                                <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                            </Button>
                                        </Tooltip>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table>
                {numOfRecords > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
                        {numOfRecords > 10 && (
                            <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                                <PageSize handleLimit={handleLimit} limit={filterParams.limit} />
                            </div>
                        )}
                        <div>
                            <Pagination
                                className="pagination-bar"
                                currentPage={filterParams.page}
                                totalCount={numOfRecords}
                                pageSize={filterParams.limit}
                                onPageChange={(x: any) => curPage(x)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6 bg-white dark:bg-DARK-800 p-4 border-t-2 border-BRAND-400 dark:border-DARK-400 rounded-lg">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="deviceName" value="Device Name" className="text-sm font-medium text-gray-700 dark:text-gray-300" /><span className="text-red-500">*</span>
                            <CommonInput
                                type="text"
                                id="deviceName"
                                name="name"
                                value={posFormData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Device Name"
                                // className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            {errors.name && (
                                <span className="text-red-500 text-sm">{errors.name}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex justify-between">
                                <span><Label htmlFor="deviceID" value="Device Id" className="text-sm font-medium text-gray-700 dark:text-gray-300" /><span className="text-red-500">*</span></span>
                                <Tooltip content="Click to add the device ID of the current device.">
                                    <span
                                        onClick={() => {
                                            if (!posFormData._id) fetchDeviceId();
                                        }}
                                        className={`text-xs font-bold text-BRAND-400 cursor-pointer underline ${posFormData._id ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        Fetch Device Id
                                    </span>
                                </Tooltip>
                            </div>
                            <CommonInput
                                type="text"
                                id="deviceID"
                                name="deviceID"
                                placeholder="Enter unique device id"
                                value={posFormData.deviceID}
                                onChange={handleInputChange}
                                disabled={!!posFormData._id}
                                // className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                                // disabled:bg-gray-50 disabled:text-gray-700 disabled:border-gray-200 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:disabled:border-gray-700"
                            />
                            {errors.deviceID && (
                                <span className="text-red-500 text-sm">{errors.deviceID}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                        <div>
                            <Label htmlFor="deviceNumber" value="Device Number" className="text-sm font-medium text-gray-700 dark:text-gray-300" /><span className="text-red-500">*</span>
                            <CommonInput
                                id="deviceNumber"
                                name="deviceNumber"
                                type="text"
                                placeholder="Device Number"
                                value={posFormData.deviceNumber}
                                onChange={handleInputChange}
                                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                            />
                            {errors.deviceNumber && (
                                <span className="text-red-500 text-sm">{errors.deviceNumber}</span>
                            )}
                        </div>


                        <div className="flex flex-col w-full sm:w-auto">
                            <label htmlFor="defaultScreen" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Default Screen                            </label>
                            <Select
                                id="defaultScreen"
                                onChange={handleInputChange}
                                value={posFormData.defaultScreen}
                                name="defaultScreen"
                            >
                                <option value="" disabled>
                                    Select Screen
                                </option>
                                {["Quick Service"].map(screen => (
                                    <option key={screen} value={screen}>
                                        {screen}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                        <div>
                            <Label htmlFor="defaultProvider" value="Default Payment Provider" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                            <Select
                                id="defaultProvider"
                                onChange={handleInputChange}
                                value={posFormData.defaultProvider}
                                name="defaultProvider"
                            >
                                <option value="" disabled>
                                    Select terminal type {posFormData.defaultProvider}
                                </option>
                                {terminalOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="defaultTerminal" value="Default Terminal" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                            <Select
                                id="defaultTerminal"
                                onChange={handleInputChange}
                                value={posFormData?.defaultTerminal}
                                name="defaultTerminal"
                            >
                                <option value="" disabled>
                                    Select Terminal
                                </option>
                                {terminalList.map((item: any, index: number) => (
                                    <option key={item?._id} value={item?._id}>
                                        {item?.name ? capitalized(item?.name) : `Terminal_${index + 1}`}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6 gap-3">
                        <Button
                            type="button"
                            disabled={btnLoading}
                            onClick={() => { setPosFormData(initialData); setErrors({}) }}
                            className="bg-gray-200 hover:!bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:dark:!bg-gray-600 focus:!ring-0 w-24"
                        >
                            Clear
                        </Button>
                        <Button
                            type="submit"
                            disabled={btnLoading}
                            className="bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 dark:hover:!bg-BRAND-600 text-white focus:!ring-0 w-24"
                        >
                            {btnLoading ? 'Processing...' : posFormData?._id ? 'Update' : 'Submit'}
                        </Button>

                    </div>
                </form>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                message="Are you sure you want to delete this device?"
                subText="Note: This action will permanently remove the device and all associated terminal connections. This cannot be undone."
                onConfirm={handleDeleteProgram}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

        </div>
    )
}

export default PosDeviceSettings