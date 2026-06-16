import { Button, Modal, Table, Label, Tooltip } from "flowbite-react";
import TableHeaders from "../../../utils/common/TableHeaders";
import ListLoader from "../../../utils/common/ListLoader";
import { useState } from "react";
import NoData from "../../../utils/common/NoData";
import { useAuth } from "../../../context/AuthProvider";
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { HiOutlineCreditCard, HiEye, HiEyeOff } from "react-icons/hi";
import apiClient from "../../../utils/AxiosInstance";
import { apiUrl } from "../../../environment/env";
import { toast } from "react-toastify";
import ConfirmModal from "../../../hooks/ConfirmModal";
import PageSize from "../../Pagination/PageSize";
import Pagination from "../../Pagination/Pagination";
import { deleteBtnStyle, editBtnStyle } from "../../../utils/common/constant";
import { BsInfoCircleFill } from "react-icons/bs";
import TextInputPOS from "../../../utils/common/TextInputPOS";
import CommonInput from "../../../utils/common/CommonInput";

interface LoyaltyFormData {
    _id?: string;
    name: string;
    terminalType: string;
    dejavoo_tpn: string;
    dejavoo_auth_key: string;
    macAddress: string;
    destIP: string;
    deviceIds: any[];
    destPort: string;
    timeOut: string;
    isDefault: boolean;
    restaurant: string;
    company: string;
    source: string;
    deviceName?: string;
    clientId?: string;
    storeId?: string;
    merchantId?: string;
    securityToken?: string;
    paperPosId?: string;
}

export const terminalOptions = [
    { value: 'dejavoo', label: 'Dejavoo' },
    { value: 'pax', label: 'PAX' },
    { value: "pine_labs", label: "Pine Labs" }
];

const PaymentSettings = ({ restaurant, deviceList, setDeviceList, numOfRecords, handleLimit, filterParams, curPage, posDeviceList, restaurantData }: any) => {
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpenPaymentModal, setIsOpenPaymentModal] = useState(false);
    // const [isConfirmChangeDefaultPayment, setIsConfirmChangeDefaultPayment] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    // const [defaultTerminal, setDefaultTerminal] = useState<string>(restaurantData?.defaultPaymentMethod ?? '');
    const [showSecurityToken, setShowSecurityToken] = useState(false);

    const initialData: LoyaltyFormData = {
        name: '',
        terminalType: '',
        dejavoo_tpn: '',
        dejavoo_auth_key: '',
        macAddress: '',
        destIP: '',
        destPort: '',
        deviceIds: [],
        timeOut: '',
        isDefault: false,
        restaurant,
        company: restaurantData?.company?._id || userData?.staffMember?.company?._id,
        source: 'web',
        _id: undefined,
        deviceName: "",
        storeId: "",
        merchantId: "",
        clientId: "",
        securityToken: "",
        paperPosId: ""
    };

    const [formData, setFormData] = useState<LoyaltyFormData>(initialData);
    const paymentColumnNames = ["No.", "Name", "Device", "TimeOut", "Actions"];

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.terminalType) {
            errors.terminalType = 'Terminal type is required';
        }

        if (formData.terminalType === "pine_labs") {
            if (!formData.deviceName?.trim()) {
                errors.deviceName = "Device name is required";
            }
        } else {
            if (!formData.name?.trim()) {
                errors.name = "Terminal name is required";
            }
        }

        if (formData.terminalType === 'dejavoo') {
            if (!formData.dejavoo_tpn) {
                errors.dejavoo_tpn = 'Terminal id is required';
            } else if (!/^\d+$/.test(formData.dejavoo_tpn)) {
                errors.dejavoo_tpn = 'TPN must contain only positive numbers';
            }
            if (!formData.dejavoo_auth_key) errors.dejavoo_auth_key = 'Merchant id is required';
        }

        if (formData.terminalType === 'pax') {
            if (!formData.macAddress) errors.macAddress = 'MAC address is required';
            if (!formData.destIP) errors.destIP = 'Destination IP is required';
        }
        if (formData.destPort) {
            if (!/^\d+$/.test(formData.destPort)) {
                errors.destPort = 'Port must be a valid number';
            } else if (
                Number(formData.destPort) < 1
            ) {
                errors.destPort = 'Port must be valid number';
            }
        }
        if (formData?.terminalType !== "pine_labs") {
            if (!formData.timeOut) {
                errors.timeOut = 'Timeout is required';
            } else if (!/^\d+$/.test(formData.timeOut)) {
                errors.timeOut = 'Timeout must be a positive number (no decimals or symbols)';
            } else if (Number(formData.timeOut) <= 0) {
                errors.timeOut = 'Timeout must be greater than 0';
            }
        }
        if (formData.deviceIds.length === 0) errors.deviceIds = 'Please choose device';

        if (formData?.terminalType === "pine_labs") {
            if (!formData?.deviceName) errors.deviceName = "Device name is required";
            if (!formData?.clientId) errors.clientId = "Client id is required";
            if (!formData?.storeId) errors.storeId = "Store id is required";
            if (!formData?.merchantId) errors.merchantId = "Merchant id is required";
            if (!formData?.securityToken) errors.securityToken = "Security token is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: any) => {
        const { name, value, multiple, options } = e.target as HTMLSelectElement;

        let updatedValue: string | string[];

        if (multiple) {
            updatedValue = Array.from(options)
                .filter(option => option.selected)
                .map(option => option.value);
        } else {
            updatedValue = value;
        }

        setFormData(prev => ({
            ...prev,
            [name]: updatedValue,
        }));

        if (name === 'terminalType') {
            setFormErrors({});
        } else if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        if (name === "name") {
            setFormErrors((prev) => ({
                ...prev,
                dejavoo_auth_key: ""
            }));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        try {
            e.preventDefault();

            if (!validateForm()) {
                return;
            }
            let urlEndPoint = 'payment/terminals/add-update';
            /* if (formData.terminalType === 'pax') {
                urlEndPoint = 'pax/addOrUpdatePAX';
                console.log("Form submitted:", formData);
            } */

            if (formData?.terminalType === "pine_labs") {
                formData.source = "web";
            }

            setIsOpenPaymentModal(false);
            const response = await apiClient.post(`${apiUrl}/${urlEndPoint}`, formData);
            const { success, message, terminal } = response.data;
            if (success) {
                toast.success(message);
                setDeviceList((prevList: any[]) => {
                    const existingIndex = prevList.findIndex(item => item?._id === terminal?._id);

                    if (existingIndex !== -1) {
                        const updatedList = [...prevList];
                        updatedList[existingIndex] = terminal;
                        return updatedList;
                    } else {
                        return [terminal, ...prevList];
                    }
                });

            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleEdit = (method: any) => {
        setFormData({
            ...initialData,
            _id: method?._id,
            name: method?.name,
            terminalType: method?.deviceName ? "pine_labs" : method?.destIP ? 'pax' : 'dejavoo',
            dejavoo_tpn: method?.dejavoo_tpn || '',
            dejavoo_auth_key: method?.dejavoo_auth_key || '',
            macAddress: method?.macAddress || '',
            destIP: method?.destIP || '',
            deviceIds: method?.deviceIds || [],
            destPort: method?.destPort || '',
            timeOut: method?.timeOut || '',
            isDefault: method?.isDefault || false,
            restaurant,
            deviceName: method?.deviceName,
            clientId: method?.clientId,
            merchantId: method?.merchantId,
            storeId: method?.storeId,
            securityToken: method?.securityToken,
            paperPosId: method?.paperPosId,
            company: method?.company || userData?.staffMember?.company?._id || "",
        });
        setIsOpenPaymentModal(true);
        setFormErrors({});
    };

    const handleDelete = (method: any) => {
        setSelectedMethod(method);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        let deleteUrl = `payment/delete-dejavoo/${selectedMethod?._id}`;
        if (selectedMethod?.destIP) {
            deleteUrl = `pax/delete/${selectedMethod?._id}`;
        } else if (selectedMethod?.deviceName) {
            deleteUrl = `pine-lab/delete/${selectedMethod?._id}`;
        }

        try {
            const response = await apiClient.post(`${apiUrl}/${deleteUrl}`, {});
            const { success, message, data } = response.data;
            if (success) {

                toast.success(message);
                setDeviceList((prev: any[]) => prev.filter(item => item?._id !== data?._id));
            } else {
                toast.error(message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            // setIsConfirmChangeDefaultPayment(false)
            setTimeout(() => setIsLoading(false), 500);
        }
        setIsDeleteModalOpen(false);
    };

    /* const selectDefaultTerminal = async () => {
        try {
            const response = await apiClient.post(`${apiUrl}/payment/default-terminal`, { restaurant, defaultPaymentMethod: defaultTerminal });
            const { success, message } = response.data;
            if (success) {

                toast.success(message);
                setDeviceList((prev: any) => prev.filter((item: any) => item._id !== selectedMethod?._id));
            } else {
                toast.error(message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setIsConfirmChangeDefaultPayment(false)
            setTimeout(() => setIsLoading(false), 500);
        }
    } */

    return (
        <div className="p-4 bg-DARK-100 dark:bg-DARK-900 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-2 gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Terminals</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Configure and manage your payment terminals
                    </p>
                </div>
                <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                    {/* <Tooltip content={`Set default terminal for payments`}>
                        <div className="flex flex-col w-full sm:w-auto">
                            <label htmlFor="terminalSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Default Terminal {defaultTerminal.toUpperCase()}
                            </label>
                            <Select
                                id="terminalSelect"
                                onChange={(e: any) => { setDefaultTerminal(e.target.value); setIsConfirmChangeDefaultPayment(true) }}
                                value={defaultTerminal}
                                name="defaultTerminal"
                            >
                                <option value="" disabled>
                                    Select terminal type
                                </option>
                                {terminalOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </Tooltip> */}
                    <Tooltip content={`Add new payment terminal`}>
                        <button
                            type="button"
                            onClick={() => {
                                setFormData(initialData);
                                setIsOpenPaymentModal(true);
                                setFormErrors({});
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-BRAND-400 to-BRAND-500 text-white shadow-md hover:scale-105 transition-transform"
                            aria-label="Add new Payment method"
                        >
                            <HiOutlineCreditCard className="h-5 w-5" />
                            Add Terminal
                        </button>
                    </Tooltip>
                </div>

            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-t-2 border-BRAND-400 dark:border-DARK-400">
                <Table hoverable className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <TableHeaders columnNames={paymentColumnNames} />
                    <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading && (
                            <Table.Row className="bg-white dark:bg-gray-800">
                                <Table.Cell colSpan={6} className="text-center py-8">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {!isLoading && deviceList.length === 0 && (
                            <Table.Row className="bg-white dark:bg-gray-800">
                                <Table.Cell colSpan={6} className="text-center py-8">
                                    <NoData
                                        title="No Payment Terminals Found"
                                        message="No payment terminal entries are available right now. Added payment terminal entries will appear here."
                                    />
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {!isLoading &&
                            deviceList.map((item: any, index: number) => (
                                <Table.Row
                                    key={item?._id}
                                    className={`${formData?._id === item?._id
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (filterParams.page - 1) * filterParams.limit}</Table.Cell>
                                    <Table.Cell className="px-6 py-3 text-gray-700 dark:text-gray-300">
                                        {item?.deviceName ? item?.deviceName : item?.name ? item?.name : "N/A"}
                                    </Table.Cell>
                                    <Table.Cell className="px-6 py-3 text-gray-700 dark:text-gray-300">
                                        {item?.deviceName ? "Pine-Lab" : item?.destIP ? 'PAX' : 'Dejavoo'}
                                    </Table.Cell>
                                    <Table.Cell className="px-6 py-3 text-gray-700 dark:text-gray-300">
                                        {item?.timeOut || 'N/A'}
                                    </Table.Cell>

                                    <Table.Cell className="min-w-32 px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => handleEdit(item)} size="xs" color="gray" className={editBtnStyle.btn}>
                                                <RiEdit2Line className={editBtnStyle.icon} />
                                            </Button>
                                            <Button onClick={() => handleDelete(item)} className={deleteBtnStyle.btn} size="xs">
                                                <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                            </Button>
                                        </div>
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

            {/* Add/Edit Modal */}
            <Modal
                show={isOpenPaymentModal}
                onClose={() => setIsOpenPaymentModal(false)}
                size="xl"
                className="backdrop-blur-sm"
                dismissible
            >
                <Modal.Header className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <HiOutlineCreditCard className="w-6 h-6 text-blue-600" />
                        {formData._id ? "Edit Payment Terminal" : "Add New Payment Terminal"}
                    </div>
                </Modal.Header>

                <Modal.Body className="px-6 py-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="terminalType" value="Terminal Type" className="mb-2" />
                                <select
                                    id="terminalType"
                                    name="terminalType"
                                    value={formData.terminalType}
                                    onChange={handleChange}
                                    color={formErrors.terminalType ? 'failure' : 'gray'}
                                    className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border:gray-200 rounded-xl"
                                >
                                    <option value="" disabled>Select terminal type</option>
                                    {terminalOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.terminalType && <p className="mt-1 text-sm text-red-600">{formErrors.terminalType}</p>}
                            </div>
                            <TextInputPOS
                                label={formData?.terminalType === "pine_labs" ? "Device Name" : "Terminal Name"}
                                name={formData?.terminalType === "pine_labs" ? "deviceName" : "name"}
                                type="text"
                                value={
                                    formData?.terminalType === "pine_labs"
                                        ? (formData.deviceName || "")
                                        : (formData.name || "")
                                }
                                onChange={handleChange}
                                placeholder={
                                    formData?.terminalType === "pine_labs"
                                        ? "Enter device name"
                                        : "Enter terminal name"
                                }
                                className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                error={formErrors[formData?.terminalType === "pine_labs" ? "deviceName" : "name"] || ""}
                            />
                            <div className="mb-4">
                                <label htmlFor="deviceIds" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Choose Devices
                                </label>

                                {/* Display selected options */}
                                {formData.deviceIds.length > 0 && (
                                    <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                        <div className="flex flex-wrap gap-2">
                                            {formData.deviceIds.map(selectedId => {
                                                const selectedOption = posDeviceList.find((opt: any) => opt.deviceID === selectedId);
                                                return (
                                                    <span
                                                        key={selectedId}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900"
                                                    >
                                                        {selectedOption?.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newDeviceIds = formData.deviceIds.filter(id => id !== selectedId);
                                                                handleChange({ target: { name: 'deviceIds', value: newDeviceIds } });
                                                            }}
                                                            className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 dark:hover:text-blue-700"
                                                        >
                                                            <span className="sr-only">Remove</span>
                                                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Multi-select dropdown */}
                                <div
                                    className={`relative border ${formErrors.deviceIds ? 'border-gray-500' : 'border-gray-300 dark:border-gray-600'
                                        } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-40 bg-white dark:bg-gray-900 overflow-y-auto`}
                                >
                                    {posDeviceList.map((option: any) => (
                                        <label
                                            htmlFor={`device-${option.deviceID}`}
                                            className="ml-2 block text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none focus:!ring-0"
                                        >
                                            <div key={option.deviceID} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <input
                                                    type="checkbox"
                                                    id={`device-${option.deviceID}`}
                                                    checked={formData.deviceIds.includes(option.deviceID)}
                                                    onChange={() => {
                                                        const newDeviceIds = formData.deviceIds.includes(option.deviceID)
                                                            ? formData.deviceIds.filter((id: any) => id !== option.deviceID)
                                                            : [...formData.deviceIds, option.deviceID];
                                                        handleChange({ target: { name: 'deviceIds', value: newDeviceIds } });
                                                    }}
                                                    className="h-4 w-4 text-blue-600 rounded focus:!ring-0 mr-2"
                                                />

                                                {option.name}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {formErrors.deviceIds && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.deviceIds}</p>
                                )}
                            </div>

                            {formData.terminalType === 'dejavoo' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <TextInputPOS
                                        label="TPN"
                                        name="dejavoo_tpn"
                                        type="number"
                                        value={formData.dejavoo_tpn}
                                        onChange={handleChange}
                                        placeholder="e.g. 7893456"
                                        error={formErrors.dejavoo_tpn}
                                        className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                    />

                                    <TextInputPOS
                                        label="Auth Key"
                                        name="dejavoo_auth_key"
                                        type="text"
                                        value={formData.dejavoo_auth_key}
                                        onChange={handleChange}
                                        placeholder="e.g. 3x5d87s5dd"
                                        error={formErrors.dejavoo_auth_key}
                                        className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {formData.terminalType === 'pax' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <TextInputPOS
                                            label="MAC Address"
                                            name="macAddress"
                                            type="text"
                                            value={formData.macAddress}
                                            onChange={handleChange}
                                            placeholder="e.g. 00:1A:2B:3C:4D:5E"
                                            error={formErrors.macAddress}
                                            className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                        />
                                        <TextInputPOS
                                            label="Destination IP"
                                            name="destIP"
                                            type="text"
                                            value={formData.destIP}
                                            onChange={handleChange}
                                            placeholder="e.g. 192.168.0.1"
                                            error={formErrors.destIP}
                                            className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {formData.terminalType === 'pax' && (
                                    <TextInputPOS
                                        label="Destination Port"
                                        name="destPort"
                                        type="number"
                                        value={formData.destPort}
                                        onChange={handleChange}
                                        placeholder="e.g. 8080"
                                        error={formErrors.destPort}
                                        className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                    />
                                )}
                                {formData?.terminalType !== "pine_labs" && (
                                    <TextInputPOS
                                        label="Timeout (seconds)"
                                        name="timeOut"
                                        type="number"
                                        value={formData.timeOut}
                                        onChange={handleChange}
                                        placeholder="e.g. 30"
                                        error={formErrors.timeOut}
                                        className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                    />
                                )}
                            </div>
                            {formData?.terminalType === "pine_labs" && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <Label
                                            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Client ID
                                            <Tooltip content="Client Id of terminal" placement="top">
                                                <BsInfoCircleFill
                                                    className="w-4 h-4 text-gray-400 cursor-pointer"
                                                />
                                            </Tooltip>
                                        </Label>
                                        <TextInputPOS
                                            name="clientId"
                                            type="text"
                                            value={formData?.clientId || ""}
                                            onChange={handleChange}
                                            placeholder="Enter client Id"
                                            error={formErrors.clientId || ""}
                                            className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <Label
                                            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Store ID
                                            <Tooltip content="Store Id of terminal" placement="top">
                                                <BsInfoCircleFill
                                                    className="w-4 h-4 text-gray-400 cursor-pointer"
                                                />
                                            </Tooltip>
                                        </Label>
                                        <TextInputPOS
                                            name="storeId"
                                            type="text"
                                            value={formData?.storeId || ""}
                                            onChange={handleChange}
                                            placeholder={`Enter store Id`}
                                            error={formErrors.storeId || ""}
                                            className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label
                                            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Merchant ID
                                            <Tooltip content="Will be allotted by Pine Labs to the Merchant." placement="top">
                                                <BsInfoCircleFill
                                                    className="w-4 h-4 text-gray-400 cursor-pointer"
                                                />
                                            </Tooltip>
                                        </Label>
                                        <TextInputPOS
                                            name="merchantId"
                                            type="text"
                                            value={formData?.merchantId || ""}
                                            onChange={handleChange}
                                            placeholder={`Enter merchant Id`}
                                            error={formErrors.merchantId || ""}
                                            className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Security Token
                                            <Tooltip content="Will be allotted by Pine Labs to the Merchant." placement="top">
                                                <BsInfoCircleFill
                                                    className="w-4 h-4 text-gray-400 cursor-pointer"
                                                />
                                            </Tooltip>
                                        </Label>
                                        <div className="relative">
                                            <CommonInput
                                                id="securityToken"
                                                name="securityToken"
                                                type={showSecurityToken ? "text" : "password"}
                                                value={formData?.securityToken || ""}
                                                onChange={handleChange}
                                                placeholder={`Enter security token`}
                                                // className="w-full px-3 py-2 pr-10 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md dark:placeholder:text-DARK-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecurityToken((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-DARK-500 dark:text-DARK-300 hover:text-BRAND-500 dark:hover:text-BRAND-400"
                                            >
                                                {showSecurityToken ? <HiEye className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {formErrors.securityToken && <div className="invalid-feedback text-red-600 text-sm mt-1">{formErrors.securityToken}</div>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label
                                            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Paper Pos Id
                                            <Tooltip content="Pine Labs machine client id Will be allotted by Pine Labs to the Merchant." placement="top">
                                                <BsInfoCircleFill
                                                    className="w-4 h-4 text-gray-400 cursor-pointer"
                                                />
                                            </Tooltip>
                                        </Label>
                                        <TextInputPOS
                                            name="paperPosId"
                                            type="text"
                                            value={formData?.paperPosId || ""}
                                            onChange={handleChange}
                                            placeholder={`Enter paper pos id`}
                                            error={formErrors.paperPosId || ""}
                                            className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </>
                            )}
                        </div>


                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                color="light"
                                onClick={() => setIsOpenPaymentModal(false)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                gradientDuoTone="purpleToBlue"
                                className="transition-transform hover:scale-[1.02] bg-gradient-to-r from-BRAND-400 to-BRAND-500 "
                            >
                                {formData._id ? "Save Changes" : "Add Terminal"}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
            {/* <ConfirmModal
                isOpen={isConfirmChangeDefaultPayment}
                message="Would you like to change default payment?"
                onConfirm={selectDefaultTerminal}
                onCancel={() => setIsConfirmChangeDefaultPayment(false)}
            /> */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                message="Are you sure you want to delete terminal?"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default PaymentSettings;