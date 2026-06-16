import { Modal } from "flowbite-react";
import { capitalized } from "../../utils/utility";
import { usePOS } from "../../context/POSProvider";
import { IOrder } from "../../utils/common/Interface/OrderInterface";
import { recallOrder } from "../../utils/common/PosTerminalUtility";

const RecallOrders = ({ isRecallModalOpen, setIsRecallModalOpen, orders }: any) => {
    const { setRawPayload, setCart, setTables, setSelectedRestaurant, setSelectedCustomer, setPosLocalData, currency } = usePOS();
    const today = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });

    const groupColorClasses = [
        '!border-l-2 !border-l-blue-500 dark:!border-l-blue-600',
        '!border-l-2 !border-l-green-500 dark:!border-l-green-600',
        '!border-l-2 !border-l-indigo-500 dark:!border-l-indigo-600',
        '!border-l-2 !border-l-amber-500 dark:!border-l-amber-600',
        '!border-l-2 !border-l-red-500 dark:!border-l-red-600',
    ];
    const orderGroups: Record<string, number> = {};
    let groupCounter = 0;

    orders.forEach((order: IOrder) => {
        const groupKey = order.isSplitOrder ? order._id : order.splitOrderId ?? order._id;
        if (!orderGroups[groupKey]) {
            orderGroups[groupKey] = groupCounter++ % groupColorClasses.length;
        }
    });

    const handleRecallOrder = async (orderId: string) => {
        await recallOrder(orderId, {
            setPosLocalData,
            setRawPayload,
            setSelectedRestaurant,
            setSelectedCustomer,
            setCart,
            setTables,
        });

        setIsRecallModalOpen(false);
    };

    return (
        <Modal
            show={!!isRecallModalOpen}
            onClose={() => setIsRecallModalOpen(null)}
            className="backdrop-blur-md"
            size="7xl"
        >
            {/* Sticky Header */}
            <Modal.Header className="sticky top-0 z-10 bg-white/80 dark:bg-DARK-800/90 backdrop-blur-md shadow-md flex justify-between items-center px-6 py-4 rounded-t-xl">
                <div className="text-xl font-bold text-gray-900 dark:text-white">Recall Orders</div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Date: {today}</span>
            </Modal.Header>

            {/* Scrollable Body */}
            <Modal.Body className="max-h-[75vh] overflow-y-auto bg-slate-50 dark:bg-DARK-900 rounded-b-xl p-6">
                {orders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map((order: any, index: number) => {
                            const groupKey = order.splitOrderId ?? order._id;
                            const grpColorClass = groupColorClasses[orderGroups[groupKey]];

                            return (
                                <button
                                    key={index}
                                    // onClick={() => getSingleOrder(order._id)}
                                    onClick={() => handleRecallOrder(order._id)}
                                    aria-label={`Recall order ${order.orderName}`}
                                    className={`
                                                relative group p-5 rounded-2xl border shadow-sm hover:shadow-lg transform transition-all duration-200 ease-in-out
                                                text-left focus:outline-none
                                                ${grpColorClass}
                                                ${order.isSplitOrder
                                            ? 'border-DARK-400 dark:border-DARK-700 bg-gradient-to-b from-DARK-100 to-DARK-200 dark:from-DARK-900 dark:to-DARK-950'
                                            : 'border-gray-400 dark:border-DARK-700 bg-white dark:bg-DARK-900'}
                                            `}
                                >
                                    {/* Order Name and Split Tag */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{order.orderName}</h3>
                                        {(order.splitOrderId && !order.isSplitOrder) ? (
                                            <span className="text-xs font-medium text-white bg-yellow-400 dark:bg-yellow-700 px-2 py-0.5 my-auto rounded-full">Split #{order?.splitCount} {/* {order.splitOrderId} */}</span>
                                        ) : (!order.splitOrderId && order.isSplitOrder) ? (
                                            <span className="text-xs font-medium text-white bg-yellow-400 dark:bg-yellow-700 px-2 py-0.5 my-auto rounded-full">Main</span>
                                        ) : (
                                            <>
                                                {/* <span className="text-xs font-medium text-white bg-yellow-400 dark:bg-yellow-700 px-2 py-0.5 my-auto rounded-full">Single Order</span> */}
                                            </>
                                        )}
                                    </div>

                                    {/* Order Type + Amount */}
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                            {order.orderType !== 'table'
                                                ? capitalized(order.productOrderType)
                                                : capitalized(order.orderType)}
                                        </span>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {currency?.symbol || "$"}{order?.orderTotalAmount?.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Order Status Badge */}
                                    <div className="mb-2">
                                        <span className={`
                                                        inline-block text-xs font-semibold px-2 py-1 rounded-md uppercase
                                                        ${order.status === 'completed'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                                                : order.status === 'hold'
                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'}
                                                        `}>
                                            {capitalized(order.status)}
                                        </span>
                                    </div>

                                    {/* Timestamp */}
                                    {order.createdAt && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 block">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}

                                    {/* Hover Effect Layer */}
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:!ring-DARK-500 transition"></div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex justify-center w-full py-10">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No orders found.</p>
                    </div>
                )}
            </Modal.Body>
        </Modal>

    );
};

export default RecallOrders;
