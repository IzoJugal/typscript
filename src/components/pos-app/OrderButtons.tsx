import { Fragment, useState } from "react";
import ConfirmModal from "../../hooks/ConfirmModal";
import RecallOrders from "./RecallOrders";
import apiClient from "../../utils/AxiosInstance";
import { usePOS } from "../../context/POSProvider";
import { createQueryParams } from "../../utils/functions";
import { MANAGER_ROLES } from "../../utils/common/constant";
import { useAuth } from "../../context/AuthProvider";
import SplitOrders from "./SplitOrders";
import { MdOutlineKeyboardDoubleArrowDown } from "react-icons/md";
import { getSplitOrders, prepareLocalData } from "../../utils/common/PosTerminalUtility";
import { Button, Modal } from "flowbite-react";
import { toast } from "react-toastify";
import SettingsPOS from "./SettingsPOS";

const btnStyle = "bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600";
const actionButtons = [
    {
        label: "Recall",
        color: btnStyle,
    },
    {
        label: "Cancel",
        color: "bg-BRAND-600 text-white hover:bg-BRAND-700",
    },
    {
        label: "Tax Exemption",
        color: "bg-BRAND-500 text-white hover:bg-BRAND-600",
    },
    {
        label: "Separator",
        color: btnStyle,
    },
    {
        label: "Order Note",
        color: btnStyle,
    },
    {
        label: "Split",
        color: btnStyle,
    },
    {
        label: "Offers",
        color: btnStyle,
    },
    {
        label: "Remove Modifier",
        color: btnStyle,
    },
    {
        label: "Discount",
        color: btnStyle,
    },
    {
        label: "Coupon",
        color: btnStyle,
    },
    {
        label: "Settings",
        color: btnStyle,
    },
];

const OrderButtons = ({ setOrderNote, setProductNote }: any) => {
    const { rawPayload, setRawPayload, setTables, clearPOS, selectedRestaurant, cart, setCart,
        setSelectedRestaurant, setSelectedCustomer, localApiData, setLocalApiData, setPosLocalData
    } = usePOS();
    const { userData } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isConfirmCancel, setIsConfirmCancel] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [clickedBtn, setClickedBtn] = useState<string | null>(null);
    const [orders, setOrders] = useState<any>([]);
    const [openSplit, setOpenSplit] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);
    const [splitCarts, setSplitCarts] = useState([]);
    const [canceledReason, setCanceledReason] = useState<string>('');
    const [confirmUndoSplit, setConfirmUndoSplit] = useState<boolean>(false);
    const [isTaxExemptModalOpen, setIsTaxExemptModalOpen] = useState<boolean>(false);
    const emptyCart = cart ? cart.length === 0 : true;

    actionButtons.forEach((btn: any) => {
        const disabledArr = ["Separator", "Offers", "Order Note", "Remove Modifier", "Discount", "Coupon", "Cancel", "Tax Exemption"];
        btn.disabled = disabledArr.includes(btn.label) ? emptyCart : false;
        btn.label = btn.label === 'Undo Split' ? 'Split' : btn.label;

        if (rawPayload?.isSplitOrder && btn.label === 'Split') {
            btn.label = 'Undo Split';
        }

        if (btn.label === "Tax Exemption") {
            btn.color = rawPayload?.isTaxExemption ? 'bg-green-500 text-white' : btnStyle;
        }

        if (btn.label === "Split") {
            btn.disabled = typeof cart?.length !== "number" || cart.length <= 1 ? true : false;
            if (rawPayload?.splitOrderId != null) {
                btn.disabled = true;
            }
        }

        if (["Order Note", "Separator", "Remove Modifier", "Discount", "Coupon"].includes(btn.label)) {
            if (rawPayload?.isSplitOrder) {
                btn.disabled = true;
            }
        }

        if (btn.label === "Cancel") {
            if (rawPayload?.status === 'cancelled' || rawPayload?.status === 'completed') {
                btn.disabled = true;
            }
        }
    });

    const handleActionClick = (action: string) => {
        setClickedBtn(action);
        if (action === "Cancel") {
            setIsConfirmCancel(true);
        }
        if (action === "Recall") {
            getOrders();
        }
        /*  if (action === "Split") {
             if (rawPayload?._id && rawPayload?.isSplitOrder) {
                 getSplitOrders();
             }
             setOpenSplit(true);
         } */
        if (action === "Undo Split") {
            if (rawPayload?.isSplitOrder) {
                setConfirmUndoSplit(true);
            } else {
                toast.warn("Only undo main split order")
            }
        }
        if (action === "Split") {
            if (rawPayload?._id && rawPayload?.isSplitOrder) {
                getSplitOrders(rawPayload._id, cart, setCart, setSplitCarts);
            }
            setOpenSplit(true);
        }

        if (action === "Order Note") {
            setOrderNote(true);
            setProductNote(rawPayload.orderNote);
            setRawPayload((prev: any) => ({ ...prev, orderNote: rawPayload.orderNote }))
        }

        if (action === "Settings") {
            setOpenSettings(true);
        }

        if (action === "Separator") {
            const updatedCart = cart.map((item: any, index: any) => {
                if (index === cart.length - 1) {
                    return { ...item, isSeparate: true };
                }
                return item;
            });
            setCart(updatedCart);
        }

        if (action === "Tax Exemption") {
            console.log("rawPayload", rawPayload);

            const updatedPayload = { ...rawPayload, isTaxExemption: !rawPayload.isTaxExemption };
            setRawPayload(updatedPayload);
            if (!rawPayload.isTaxExemption) {
                setIsTaxExemptModalOpen(true);
                setRawPayload((prev: any) => ({ ...prev, taxExemptionReason: '' }));
            }
        }
    };

    const handleCancelButton = async () => {
        try {
            const { data } = await apiClient.patch(`order/cancel-order/${rawPayload?._id}`, { canceledReason });
            if (data.success) {
                toast.success(data.message);
                setCanceledReason('');
                clearPOS();
                setIsModalOpen(false);
            } else {
                setIsModalOpen(false);
                setCanceledReason('');
                toast.error(data.message);
            }
        } catch (error: any) {
            setIsModalOpen(false);
            setCanceledReason('');
            console.error("Error cancelling order:", error.message);
        }
    }

    const handleButtonAction = () => {
        if (clickedBtn === "Cancel") {
            if (rawPayload?._id) {
                setIsModalOpen(true);
            } else {
                clearPOS();
                initialAPIDataToLocal(localApiData);
            }
        }
        setIsConfirmCancel(false);
        setClickedBtn(null);
    };

    const initialAPIDataToLocal = (categories: any) => {
        const { categories: allCategories, products, subCategories, selectedCategory } = prepareLocalData(categories);
        setPosLocalData((prev: any) => ({
            ...prev,
            categories: allCategories,
            products,
            subCategories,
            selectedCategory
        }));
        setLocalApiData(categories);
    }

    const handleUndoSplit = async () => {
        try {
            const payload = {
                order: rawPayload?._id
            }

            const response = await apiClient.post(`order/undo-split-order`, payload);
            const { success, order, message } = response.data;
            if (success) {
                clearPOS();
                setSelectedRestaurant((prev: any) => ({ ...prev, recalledOrder: order }));
                setRawPayload({
                    ...order,
                    restaurant: order.restaurant?._id,
                    server: order.server?._id,
                    couponId: order?.couponId?._id,
                    couponCode: order?.couponId?.code
                });
                setSelectedRestaurant(order.restaurant);
                setSelectedCustomer(order.customerId);

                if (order.orderType === 'table') {
                    setCart(order.cartItems[0].products);
                    setTables(order.cartItems[0].table.mergedTables);
                } else {
                    setCart(order.cartItems);
                }
                setSplitCarts([]);
                toast.success(message);
            }
        } catch (error: any) {
            console.log("error", error.message);
        } finally {
            setConfirmUndoSplit(false);
            setClickedBtn(null);
        }
    };

    const getOrders = async () => {
        try {
            const combinedData = {
                restaurant: selectedRestaurant?._id,
                server: !MANAGER_ROLES.includes(userData?.staffMember?.role?.name) ? userData?.staffMember?._id : null
            };
            const queryParams = createQueryParams(combinedData);
            const { data } = await apiClient.get(`/order${queryParams}`);
            if (data.success) {
                setOrders(data.orders);
                setIsRecallModalOpen(true);
            } else {
                console.log(data?.message);
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    };

    return (
        <Fragment>
            <div className="mb-1 rounded-xl border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900 shadow-sm">
                {/* Expand/Collapse Button */}
                <div className="flex justify-end mb-1">
                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="flex items-center gap-1 text-sm text-DARK-800 dark:text-DARK-200 hover:underline transition group"
                        aria-expanded={isExpanded}
                    >
                        <span>{isExpanded ? "Show Less" : "Show More"}</span>
                        <MdOutlineKeyboardDoubleArrowDown
                            className={`
                    w-4 h-4 transform transition-transform duration-300 
                    ${isExpanded ? "rotate-180" : ""}
                    group-hover:scale-110
                `}
                        />
                    </button>
                </div>

                {/* Buttons Grid */}
                <div
                    className={`
                                grid gap-2 transition-all duration-500 ease-in-out
                                grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5
                                overflow-hidden relative
                                ${isExpanded ? "max-h-[1000px]" : "max-h-16"}
                            `}
                >
                    {/* Fade overlay on collapsed state */}
                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
                    )}

                    {actionButtons.map(({ label, color, disabled }: any) => (
                        <button
                            key={label}
                            onClick={() => handleActionClick(label)}
                            disabled={disabled}
                            className={`
                                        h-10 px-3 py-1 rounded-xl text-xs font-medium transition-transform
                                        ${color}
                                        ${disabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:scale-[1.03] hover:shadow-md"}
                                    `}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modals */}
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="backdrop-blur-sm bg-DARK-500/30 dark:bg-DARK-950/70 transition-all duration-300"
                size="lg"
            >
                <Modal.Header className="bg-white dark:bg-DARK-800 rounded-t-lg px-5 py-3 border-b dark:border-DARK-700">
                    <span className="text-base font-semibold text-gray-800 dark:text-white">
                        Cancel Order
                    </span>
                </Modal.Header>

                <Modal.Body className="bg-white dark:bg-DARK-900 px-5 py-4 rounded-b-lg space-y-4">
                    <div className="flex flex-col gap-2 overflow-x-auto">
                        <label className="text-sm text-DARK-800 dark:text-DARK-100">Cancel Reason</label>
                        <input
                            type="text"
                            value={canceledReason}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCanceledReason(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter cancel reason"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            className="bg-DARK-500 hover:!bg-DARK-600 dark:!bg-DARK-700 dark:hover:!bg-red-500 text-white px-4 py-1.5 text-xs rounded shadow focus:!ring-0"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-700 dark:hover:!bg-BRAND-500 text-white px-4 py-1.5 text-xs rounded shadow focus:!ring-0"
                            onClick={handleCancelButton}
                        >
                            Confirm
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
            <Modal
                show={isTaxExemptModalOpen}
                onClose={() => setIsTaxExemptModalOpen(false)}
                className="backdrop-blur-sm bg-black/30 dark:bg-black/60 transition-all duration-300"
                size="lg"
            >
                {/* Header */}
                <Modal.Header className="bg-white dark:bg-gray-800 rounded-t-lg px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                        Add Tax Exemption Reason
                    </span>
                </Modal.Header>

                {/* Body */}
                <Modal.Body className="bg-white dark:bg-gray-900 px-5 py-4 rounded-b-lg space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-700 dark:text-gray-200">
                            Tax Exemption Reason
                        </label>
                        <input
                            type="text"
                            value={rawPayload?.taxExemptionReason}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRawPayload((prev: any) => ({
                                    ...prev,
                                    taxExemptionReason: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:!ring-0"
                            placeholder="Enter tax exemption reason"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            className="bg-gray-200 hover:!bg-gray-300 text-gray-800 dark:bg-red-500 dark:hover:!bg-red-600 dark:text-white px-2 text-sm rounded-xl shadow focus:ring-0"
                            onClick={() => setIsTaxExemptModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-BRAND-500 hover:!bg-BRAND-600 text-white dark:bg-green-500 dark:hover:!bg-green-600 px-2 text-sm rounded-xl shadow focus:ring-0"
                            onClick={() => setIsTaxExemptModalOpen(false)}
                        >
                            Add
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>


            {/* Other components remain unchanged */}
            <RecallOrders {...{ isRecallModalOpen, setIsRecallModalOpen, orders, setTables }} />
            <SplitOrders {...{ openSplit, setOpenSplit, splitCarts, setSplitCarts }} />
            <SettingsPOS {...{ openSettings, setOpenSettings }} />
            <ConfirmModal
                isOpen={isConfirmCancel}
                message="Are you sure you want to cancel this order?"
                onConfirm={handleButtonAction}
                onCancel={() => {
                    setIsConfirmCancel(false);
                    setClickedBtn(null);
                }}
            />
            <ConfirmModal
                isOpen={confirmUndoSplit}
                message="Are you sure you want to Undo Split?"
                onConfirm={handleUndoSplit}
                onCancel={() => {
                    setConfirmUndoSplit(false);
                    setClickedBtn(null);
                }}
            />
        </Fragment>
    );
};

export default OrderButtons;
