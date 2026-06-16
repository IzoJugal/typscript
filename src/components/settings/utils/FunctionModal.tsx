
import { useEffect } from "react";
import { FaAngleDown, FaAngleUp, FaTimes } from "react-icons/fa";

interface App {
    name: string;
    order: number;
    visible: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    apps: ReadonlyArray<App>; // Mark apps as read-only
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;
    handleMoveUp: () => void;
    handleMoveDown: () => void;
    selectedAppValue: string
    handleSelectedAppValue: (appValue: string | null) => void; // Changed to receive the selected app
}

export function FunctionModal({
    isOpen,
    onClose,
    apps,
    handleMoveUp,
    handleMoveDown,
    selectedIndex,
    setSelectedIndex,
    handleSelectedAppValue,
    // selectedAppValue
}: Readonly<ModalProps>) {
    useEffect(() => {
        // Ensure the modal has a default selection if `selectedIndex` is initially unset
        if (isOpen && selectedIndex === null && apps.length > 0) {
            setSelectedIndex(0); // Default to the first item or any desired default index
        }
    }, [isOpen, selectedIndex, apps, setSelectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-[#2A3769] w-full max-w-md h-auto max-h-[95vh] p-4 rounded-lg shadow-lg z-60 overflow-hidden">
                <div className="flex justify-around relative items-center mb-4">
                    <h2 className="text-xl text-[#9FB5F1] font-bold">General Settings</h2>
                    <div className="flex space-x-2">
                        <button onClick={onClose} className="bg-[#991f1c] text-[#FFFFFF] py-1 px-3 rounded mr-2">Cancel</button>
                        <button
                            onClick={() => {
                                const selectedApp = selectedIndex !== null ? apps[selectedIndex]?.name : null;
                                handleSelectedAppValue(selectedApp);
                                onClose();
                            }}
                            className="bg-[#46a92a] text-[#FFFFFF] py-1 px-3 rounded"
                        >
                            Save
                        </button>
                    </div>
                    <button onClick={onClose} className="absolute top-[-14px] right-[-23px] text-white bg-[#3A709C] p-2 rounded-full mr-2">
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                <hr className="my-2" />

                <div className="flex items-center gap-2 justify-center mb-4">
                    <h3 className="text-white text-lg text-center">Re-Order POS Display</h3>
                    <button
                        onClick={handleMoveUp}
                        disabled={selectedIndex === null || selectedIndex === 0}
                        className="bg-[#F7A325] text-white px-3 py-1 rounded-md hover:bg-yellow-600 disabled:opacity-50 mr-2"
                    >
                        <FaAngleUp className="text-lg" />
                    </button>
                    <button
                        onClick={handleMoveDown}
                        disabled={selectedIndex === null || selectedIndex === apps.length - 1}
                        className="bg-[#F7A325] text-white px-3 py-1 rounded-md hover:bg-yellow-600 disabled:opacity-50"
                    >
                        <FaAngleDown className="text-lg" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                    <table className="w-full rounded-lg text-white">
                        <thead>
                            <tr className="bg-[#3A709C]">
                                <th className="py-2 px-4 text-left">Apps</th>
                                <th className="py-2 px-4 text-left">Display Order</th>
                                <th className="py-2 px-4 text-left">Visible</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apps.map((app, index) => (
                                <tr
                                    key={app.name}
                                    className={`hover:bg-[#3A709C] transition duration-150 ease-in-out ${
                                        selectedIndex !== null && apps[selectedIndex]?.name === app.name ? 'bg-[#75a6ce]' : ''
                                    } cursor-pointer`}
                                    onClick={() => setSelectedIndex(index)}
                                >
                                    <td className="py-2 px-4 text-left">{app.name}</td>
                                    <td className="py-2 px-4">{index + 1}</td>
                                    <td className="py-2 px-4">{app.visible}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
