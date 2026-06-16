import { Modal } from "flowbite-react";
import { useEffect, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { usePOS } from "../../context/POSProvider";
import { capitalized } from "../../utils/utility";

interface SettingsInterface {
    openSettings: boolean;
    setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>;
}

type ProviderType = "PAX" | "Dejavoo" | "NearbyPay" | "NumberPay";

const SettingsPOS = ({ openSettings, setOpenSettings }: SettingsInterface) => {
    const { selectedRestaurant, posLocalData, setPosLocalData, posDeviceId } = usePOS();
    const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);

    const [terminalOptions, setTerminalOptions] = useState<Record<ProviderType, any[]>>({
        PAX: [],
        Dejavoo: [],
        NearbyPay: [],
        NumberPay: [],
    });

    useEffect(() => {
        setSelectedProvider(posLocalData?.selectedPaymentProvider?.provider);
        filterTerminalsByProvider(posLocalData?.selectedPaymentProvider?.provider);
        // setTerminalOptions((prev) => ({ ...prev, [posLocalData?.selectedPaymentProvider?.provider]: posLocalData?.selectedPaymentProvider?.terminal }));
        if (selectedRestaurant?._id) {
            fetchPaymentTerminals();
        }

    }, [selectedRestaurant, posLocalData?.posDeviceDetails]);

    const fetchPaymentTerminals = async () => {
        try {
            const response = await apiClient.get(`payment/device-list/${selectedRestaurant?._id}/${posDeviceId}`);
            const { success, devices } = response.data;
            if (success) {
                setPosLocalData((prev: any) => ({
                    ...prev,
                    allPaymentProviders: devices,
                }));

            }
        } catch (error: any) {
            console.error("Error fetching payment terminals:", error?.message);
        }
    };

    const handleProviderChange = (provider: ProviderType) => {
        setSelectedProvider(provider);
        filterTerminalsByProvider(provider);
    };

    const filterTerminalsByProvider = (provider: ProviderType) => {
        const providers = posLocalData?.allPaymentProviders || [];
        const filtered = providers.filter((item: any) =>
            provider.toLowerCase() === "dejavoo" ? item?.dejavoo_tpn : !item?.dejavoo_tpn
        );
        setTerminalOptions((prev) => ({ ...prev, [provider]: filtered }));
    };

    const handleTerminalSelection = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const terminalId = e.target.value;
        const selected = posLocalData?.allPaymentProviders.find((item: any) => item?._id === terminalId);

        // call update API to update selected terminal
        if (selected) {
            const payload = {
                defaultProvider: selected?.terminalType,
                defaultTerminal: selected?._id,
                restaurant: selected?.restaurant,
                company: selected?.company
            }
            const podDeviceId = posLocalData?.posDeviceDetails?._id;
            await apiClient.patch(`device/${podDeviceId}`, payload);
            setTimeout(() => {
                setOpenSettings(false);
            }, 1000);
        }
        setPosLocalData((prev: any) => ({
            ...prev,
            selectedPaymentProvider: {
                provider: selectedProvider,
                terminal: selected,
            },
        }));
    };

    const availableProviders: ProviderType[] = ["PAX", "Dejavoo"];
    return (
        <Modal
            show={openSettings}
            onClose={() => setOpenSettings(false)}
            className="transition-all duration-300"
            size="3xl"
        >
            <Modal.Header className="sticky top-0 z-10 bg-white/90 dark:bg-DARK-800/90 backdrop-blur-md shadow-md px-6 py-4 rounded-t-xl">
                <span className="text-2xl font-semibold text-gray-800 dark:text-white">
                    Point of Sale Settings
                </span>
            </Modal.Header>

            <Modal.Body className="max-h-[75vh] overflow-y-auto bg-gradient-to-b from-white to-slate-100 dark:from-DARK-950 dark:to-DARK-800 p-8 rounded-b-xl">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                    <div className="bg-white dark:bg-DARK-800 p-3 rounded-xl border border-gray-200 dark:border-DARK-700 shadow hover:shadow-lg transition-all">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Set default Payment Provider</h3>
                            <h5 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">POS device: {posLocalData?.posDeviceDetails?.name}</h5>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Choose Provider
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {availableProviders.map((provider) => (
                                        <label
                                            key={provider}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all duration-200 ${selectedProvider?.toLowerCase() === provider?.toLowerCase()
                                                ? "bg-blue-100 dark:bg-BRAND-700/30 border-BRAND-500"
                                                : "bg-transparent border-gray-300 dark:border-gray-600"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="provider"
                                                value={provider}
                                                checked={selectedProvider?.toLowerCase() === provider?.toLowerCase()}
                                                onChange={() => handleProviderChange(provider)}
                                                className="h-4 w-4 text-BRAND-600 focus:ring-0"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                                {provider.replace(/([A-Z])/g, " $1").trim()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Terminal Selection */}
                            {selectedProvider && (
                                <div className="pt-4 border-t border-gray-200 dark:border-DARK-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Choose Terminal
                                    </label>
                                    <select
                                        value={posLocalData?.selectedPaymentProvider?.terminal?._id}
                                        onChange={handleTerminalSelection}
                                        className="w-full rounded-lg border border-gray-300 dark:border-DARK-600 dark:bg-DARK-700 dark:text-white px-4 py-2 focus:ring-0"
                                    >
                                        <option value="">{`Select a ${selectedProvider} terminal`}</option>
                                        {terminalOptions[selectedProvider]?.map((terminal, index) => (
                                            <option key={terminal?._id} value={terminal?._id}>
                                                {terminal?.name ? capitalized(terminal?.name) : `${selectedProvider}_Terminal_${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default SettingsPOS;
