import { ChangeEvent, useState } from "react";

interface PrinterData {
    deviceName: string;
    bdAddress: string;
    macAddress: string;
    ipAddress: string;
    target: string;
    type: string;
}

interface ModalProps {
    isModalOpen: boolean;
    handleMolalToggle: () => void;
    inputChange: (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
    inputSubmit: () => void;
    printerData: PrinterData;
}

export const AddModal: React.FC<ModalProps | any> = ({
    isModalOpen,
    handleMolalToggle,
    inputChange,
    inputSubmit,
    printerData
}) => {

    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isModalOpen) return null;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!printerData?.deviceName?.trim()) {
            newErrors.deviceName = "Printer name is required";
        }

        if (!printerData?.type) {
            newErrors.type = "Type is required";
        }

        if (!printerData?.macAddress?.trim()) {
            newErrors.macAddress = "MAC Address is required";
        } else if (
            !/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(printerData.macAddress)
        ) {
            newErrors.macAddress = "Invalid MAC Address";
        }

        if (!printerData?.ipAddress?.trim()) {
            newErrors.ipAddress = "IP Address is required";
        } else if (
            !/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(printerData.ipAddress)
        ) {
            newErrors.ipAddress = "Invalid IP Address";
        }

        if (!printerData?.target?.trim()) {
            newErrors.target = "Target is required";
        }

        setErrors(newErrors);

        const firstError = Object.keys(newErrors)[0];

        if (firstError) {
            const field = document.getElementsByName(firstError)[0] as HTMLElement;
            field?.focus();
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (
        e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
        const { name } = e.target;
        let value = e.target.value;

        if (name === "macAddress") {
            value = value
                .replace(/[^a-fA-F0-9]/g, "")
                .match(/.{1,2}/g)
                ?.join(":")
                ?.substring(0, 17) || "";
        }

        if (name === "ipAddress") {
            if (!/^[0-9.]*$/.test(value)) {
                return;
            }
        }

        const updatedEvent = {
            ...e,
            target: {
                ...e.target,
                name,
                value
            }
        };

        inputChange(updatedEvent);

        setErrors((prev) => {
            const updated = { ...prev };

            if (value.trim()) {
                delete updated[name];
            }

            // MAC validation
            if (name === "macAddress") {
                if (
                    value &&
                    !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(value)
                ) {
                    updated.macAddress = "Invalid MAC Address";
                } else {
                    delete updated.macAddress;
                }
            }

            // IP validation
            if (name === "ipAddress") {
                if (
                    value &&
                    !/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value)
                ) {
                    updated.ipAddress = "Invalid IP Address";
                } else {
                    delete updated.ipAddress;
                }
            }

            return updated;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#2A3769] p-6 md:p-8 rounded-lg shadow-lg max-w-md w-full h-auto max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                <h2 className="text-lg text-white font-semibold mb-4">Add Remote Printer</h2>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();

                        if (validateForm()) {
                            inputSubmit();
                        }
                    }}
                >
                    {/* Remote Printer Name */}
                    <div className="mb-4">
                        <label htmlFor="deviceName" className="block text-white text-sm mb-1">Remote Printer Name</label>
                        <input
                            type="text"
                            name='deviceName'
                            value={printerData?.deviceName}
                            onChange={handleChange}
                            className="bg-[#2E5783] border-0 w-full rounded text-white p-2"
                        />
                        {errors.deviceName && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.deviceName}
                            </p>
                        )}
                    </div>

                    {/* Type Selection */}
                    <div className="mb-4">
                        <label htmlFor="type" className="block text-white text-sm mb-1">Type</label>
                        <select
                            name='type'
                            value={printerData?.type}
                            onChange={handleChange}
                            className="bg-[#2E5783] border-0 w-full rounded text-white p-2"
                        >
                            <option value="">Select Type</option>
                            <option value="Bar">Bar</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Invoice">Invoice</option>
                        </select>
                        {errors.type && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.type}
                            </p>
                        )}
                    </div>


                    {/* BD Address */}
                    {/* <div className="mb-4">
                    <label htmlFor="bdAddress" className="block text-white text-sm mb-1">BD Address</label>
                    <input
                        type="text"
                        name='bdAddress'
                        value={printerData?.bdAddress}
                        onChange={handleChange}
                        className="bg-[#2E5783] border-0 w-full rounded text-white p-2"
                    />
                </div> */}
                    {/* MAC Address */}
                    <div className="mb-4">
                        <label htmlFor="macAddress" className="block text-white text-sm mb-1">MAC Address</label>
                        <input
                            type="text"
                            name='macAddress'
                            value={printerData?.macAddress}
                            onChange={handleChange}
                            className="bg-[#2E5783] border-0 w-full rounded text-white p-2"
                        />
                        {errors.macAddress && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.macAddress}
                            </p>
                        )}
                    </div>

                    {/* IP Address */}
                    <div className="mb-4">
                        <label htmlFor="ipAddress" className="block text-white text-sm mb-1">IP Address</label>
                        <input
                            type="text"
                            name='ipAddress'
                            value={printerData?.ipAddress}
                            onChange={handleChange}
                            className="bg-[#2E5783] border-0 w-full rounded text-white p-2"
                        />
                        {errors.ipAddress && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.ipAddress}
                            </p>
                        )}
                    </div>

                    {/* Target */}
                    <div className="mb-4">
                        <label htmlFor="target" className="block text-white text-sm mb-1">Target</label>
                        <input
                            type="text"
                            name='target'
                            value={printerData?.target}
                            onChange={handleChange}
                            className="bg-[#2E5783] border-0 w-full rounded text-white p-2"
                        />
                        {errors.target && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.target}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-[#40658b] text-white px-4 py-2 rounded-lg hover:bg-[#2d4b69] transition"
                        >
                            Ok
                        </button>
                        <button
                            onClick={handleMolalToggle}
                            className="bg-[#40658b] text-white px-4 py-2 rounded-lg hover:bg-[#2d4b69] transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};