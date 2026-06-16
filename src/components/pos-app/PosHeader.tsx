import { Button, Modal, Tooltip } from "flowbite-react"
import { useDarkMode } from "../../context/DarkModeProvider";
import { Fragment, useEffect, useState } from "react";
import { getTotal } from "../../utils/common/PosTerminalUtility";
import { orderTypeMap } from "../../utils/common/constant";
import apiClient from "../../utils/AxiosInstance";
import { usePOS } from "../../context/POSProvider";
import { LucideRefreshCw, MoonIcon, SunIcon } from "lucide-react";
import { toast } from "react-toastify";
// import { FaAnglesRight } from "react-icons/fa6";

const PosHeader = ({ sendOrder, setIsFloorPlanOpen, setTableRooms, initialAPIDataToLocal, setSelectedModifiers }: any) => {
    const { rawPayload, setRawPayload, cart, tables, selectedRestaurant, localApiData, clearPOS } = usePOS();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const emptyCart = cart ? (cart.length === 0 ? true : false) : true;

    const [gratuity, setGratuity] = useState<any>({});
    const orderTypeLabel = Object.entries(orderTypeMap).find(([, value]) => value === (rawPayload.orderType === 'table' ? rawPayload.orderType : rawPayload.productOrderType))?.[0];
    const [selected, setSelected] = useState(orderTypeLabel);

    const [selectedGratuity, setSelectedGratuity] = useState<number | null>(rawPayload?.gratuity || null);

    const addGratuity = () => {
        setGratuity((prev: any) => ({ ...prev, isOpenModal: true }));
    }

    useEffect(() => {
        if (orderTypeLabel != '') {
            setSelected(orderTypeLabel)
        }
    }, [orderTypeLabel]);


    const addGratuityValues = (percent: number) => {
        setSelectedGratuity((prev: any) => (Number(prev) == Number(percent) ? null : Number(percent)));

        setRawPayload((prev: any) => {
            const isSameGratuity = Number(prev.gratuity) === Number(percent);
            const updatedGratuity = isSameGratuity ? null : Number(percent);

            let updatedPayload = { ...prev, gratuity: updatedGratuity };

            if (updatedPayload.orderType === 'table') {
                const updatedCart = { ...prev, cartItems: cart, gratuity: updatedGratuity };
                const result = getTotal(updatedCart);

                const rawTable = {
                    table: tables[0]?._id,
                    room: tables[0]?.room,
                    mergedTables: tables
                        .filter((table: any) => table?._id)
                        .map((table: any) => table._id)
                };

                const cartItems = [{ products: result.cartItems, table: rawTable }];

                return {
                    ...prev,
                    ...result,
                    cartItems: cartItems,
                    gratuity: updatedGratuity
                };
            } else {
                const result = getTotal(updatedPayload);

                return {
                    ...prev,
                    ...result,
                    gratuity: updatedGratuity
                };
            }
        });
    };

    const getRooms = async () => {
        try {
            const { data } = await apiClient.get(`/table/tableroom?restaurant=${selectedRestaurant?._id}`);
            if (data.success) {
                setTableRooms(data.rooms);
            } else {
                setTableRooms([]);
            }
        } catch (error: any) {
            console.error("Failed to fetch initial data:", error.message);
        }
    }

    const resetPOSData = () => {
        clearPOS();
        initialAPIDataToLocal(localApiData);
        setSelectedModifiers([])
    }

    const printCheck = () => {
        if (rawPayload?._id) {
            if (rawPayload?.isPrintCheck) {
                toast.info("Already Printed!");
                return;
            }
            printCheckAPI(rawPayload?._id);
        } else {
            sendOrder({ updatedPayload: rawPayload, isPay: false, isPrintCheck: true })
        }
    }
    const printCheckAPI = async (orderId: string) => {
        try {
            const { data } = await apiClient.post(`/order/order-print-check/${orderId}`);
            if (data.success) {
                toast.success("Check printed successfully");
                setRawPayload((prev: any) => ({
                    ...prev,
                    isPrintCheck: true
                }))
            }
        } catch (error: any) {
            console.error("Failed to print check:", error.message);
        }
    }

    return (
        <Fragment>
            <div className="flex items-center justify-between gap-3- bg-DARK-100 dark:bg-DARK-900 px-4 py-2 rounded-lg shadow-sm text-sm">
                <a
                    href="/"
                    target="_blank"
                    aria-label="Firepay POS Home"
                    className="group flex items-center gap-2 cursor-pointer bg-gradient-to-l from-DARK-100/60 to-DARK-200/60 dark:from-DARK-800 dark:to-DARK-950/80 px-3 py-4 rounded-2xl shadow hover:shadow-[0_0_3px_rgba(59,130,246,0.5)] transition-all duration-500 ease-in-out backdrop-blur-xl hover:bg-gradient-to-r hover:from-DARK-200/80 hover:to-DARK-300/80 dark:hover:from-DARK-800/80 dark:hover:to-DARK-700/80 focus:outline-none focus:!ring-0"
                >
                    <div className="text-DARK-900 dark:text-DARK-50 text-2xl font-extrabold tracking-tight group-hover:scale-105 group-hover:text-BRAND-600 dark:group-hover:text-BRAND-400 transition-all duration-400 ease-out font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
                        POS
                    </div>
                    <div className="px-6 py-2 bg-gradient-to-r from-BRAND-500 to-BRAND-600 text-white text-lg font-bold rounded-full shadow-lg -group-hover:shadow-[0_0_15px_rgba(59,130,246,0.7)] group-hover:scale-110 -rotate-12 transition-all duration-400 ease-out transform focus:!ring-0">
                        Bucket
                    </div>
                </a>

                <div className="w-full flex flex-col 2xl:flex-row justify-center 2xl:justify-between items-start md:items-center gap-2 ms-3 xl:p-2 bg-white bg-gradient-to-l from-white to-DARK-100 dark:from-DARK-800 dark:to-DARK-900 rounded-2xl dark:shadow-lg">
                    <div className="flex flex-wrap gap-1 w-full 2xl:w-auto justify-center">
                        {Object.entries(orderTypeMap).map(([label, value]) => (
                            <Tooltip key={label} content={`Make order for ${label}`}>
                                <Button
                                    onClick={() => {
                                        if (value === "table") {
                                            getRooms();
                                            setIsFloorPlanOpen(true);
                                        }
                                        setSelected(label);
                                        setRawPayload((prev: any) => ({
                                            ...prev,
                                            orderType: value !== "table" ? "product" : "table",
                                            productOrderType: value !== "table" ? value : "quickService",
                                        }));
                                    }}
                                    className={`text-xs font-medium px-1 rounded-full transition-all duration-300
                            ${selected === label
                                            ? "!bg-BRAND-500 !text-white shadow-md hover:shadow-lg"
                                            : "!bg-DARK-200 !text-DARK-800 hover:!bg-DARK-300 dark:!bg-DARK-700 dark:!text-DARK-300 dark:hover:!bg-DARK-600"
                                        } focus:!ring-0`}
                                >
                                    {label}
                                </Button>
                            </Tooltip>
                        ))}
                        <Tooltip content="Reset all local storage data">
                            <Button
                                onClick={resetPOSData}
                                className="text-xs font-medium px-1 rounded-full !bg-DARK-200 !text-DARK-800 hover:!bg-DARK-300 dark:!bg-DARK-700 dark:!text-DARK-300 dark:hover:!bg-DARK-600 transition-all duration-300 focus:!ring-2 focus:!ring-BRAND-300 focus:!outline-none"
                                aria-label="Reset POS"
                            >
                                <LucideRefreshCw className="text-DARK-800 dark:text-DARK-300 w-5 h-5" />
                            </Button>
                        </Tooltip>
                    </div>

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto bg-DARK-50 dark:bg-DARK-900 p-3 rounded-xl shadow-inner">
                        <div className="flex flex-wrap gap-2">
                            <Tooltip content="Save order without payment!">
                                <Button
                                    onClick={() => sendOrder({ updatedPayload: rawPayload, isPay: false })}
                                    disabled={emptyCart}
                                    className={`
                            text-xs font-medium px-1 rounded-full !bg-DARK-200 !text-DARK-800
                            ${emptyCart ? '' : 'hover:!bg-DARK-300 dark:hover:!bg-DARK-600 hover:shadow-lg'}
                            dark:!bg-DARK-700 dark:!text-DARK-300 
                            transition-all duration-300 shadow-md focus:!ring-2 focus:!ring-BRAND-300 focus:!outline-none 
                            disabled:opacity-50
                        `}
                                >
                                    Send Order
                                </Button>
                            </Tooltip>

                            <Tooltip content="Add gratuity on current order!">
                                <Button
                                    onClick={addGratuity}
                                    disabled={emptyCart || rawPayload?.isSplitOrder}
                                    className={`
                            text-xs font-medium px-1 rounded-full !bg-DARK-200 !text-DARK-800
                            ${emptyCart ? '' : 'hover:!bg-DARK-300 dark:hover:!bg-DARK-600 hover:shadow-lg'}
                            dark:!bg-DARK-700 dark:!text-DARK-300 
                            transition-all duration-300 shadow-md focus:!ring-2 focus:!ring-BRAND-300 focus:!outline-none 
                            disabled:opacity-50
                        `}
                                >
                                    Gratuity
                                </Button>
                            </Tooltip>

                            <Tooltip content="Check printer">
                                <Button
                                    className="text-xs font-medium px-1 rounded-full !bg-DARK-200 !text-DARK-800 hover:!bg-DARK-300 dark:!bg-DARK-700 dark:!text-DARK-300 dark:hover:!bg-DARK-600 transition-all duration-300 shadow-md hover:shadow-lg focus:!ring-2 focus:!ring-BRAND-300 focus:!outline-none"
                                    disabled={emptyCart}
                                    onClick={() => printCheck()}
                                >
                                    Print Check
                                </Button>
                            </Tooltip>
                        </div>

                        <Tooltip content={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
                            <div
                                className="relative flex items-center bg-DARK-200 dark:bg-DARK-700 rounded-full p-1 w-16 h-8 shadow-inner cursor-pointer transition-colors duration-300"
                                onClick={toggleDarkMode}
                                role="switch"
                                aria-checked={isDarkMode}
                                aria-label="Toggle Dark Mode"
                            >
                                <div
                                    className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white dark:bg-DARK-500 shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-8' : 'translate-x-0'}`}
                                />
                                <div className="flex items-center justify-between w-full px-1">
                                    <SunIcon className="w-4 h-4 text-yellow-500 z-10" />
                                    <MoonIcon className="w-4 h-4 text-DARK-500 dark:text-blue-300 z-10" />
                                </div>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>


            <Modal
                show={!!gratuity.isOpenModal}
                onClose={() => setGratuity((prev: any) => ({ ...prev, isOpenModal: false }))}
                className="backdrop-blur-sm bg-DARK-500/30 dark:bg-DARK-950/70 transition-all duration-300"
            >
                <Modal.Header className="bg-white dark:bg-DARK-800 rounded-t-lg px-4 py-3 border-b dark:border-DARK-700">
                    <span className="text-base font-semibold text-DARK-800 dark:text-white">
                        Add Gratuity
                    </span>
                </Modal.Header>

                <Modal.Body className="bg-white dark:bg-DARK-900 px-4 py-4 rounded-b-lg space-y-4">
                    <div className="flex flex-row gap-2 overflow-x-auto">
                        {(selectedRestaurant?.gratuity?.length ? selectedRestaurant.gratuity : [18]).map((percent: number) => {
                            const isSelected = selectedGratuity === Number(percent);
                            return (
                                <button
                                    key={percent}
                                    onClick={() => addGratuityValues(percent)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition ${isSelected
                                        ? "bg-BRAND-500 text-white"
                                        : "bg-DARK-200 dark:bg-DARK-700 text-DARK-800 dark:text-white hover:bg-DARK-300 dark:hover:bg-DARK-600"
                                        }`}
                                >
                                    {percent}%
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end">
                        <Button
                            className="bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-700 dark:hover:!bg-DARK-800 text-white px-4 py-1 rounded shadow transition focus:!ring-0"
                            onClick={() => setGratuity((prev: any) => ({ ...prev, isOpenModal: false }))}
                        >
                            Confirm
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </Fragment>

    )
}

export default PosHeader
