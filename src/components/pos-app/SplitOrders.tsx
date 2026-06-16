import { Fragment, useEffect, useState } from "react";
import { Modal, Button, Tooltip, Badge } from "flowbite-react";
import { HiPlus, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { usePOS } from "../../context/POSProvider";
import { apiUrl } from "../../environment/env";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoMdCloseCircle } from "react-icons/io";
import { prepareLocalData, prepareMultiPayload, recallOrder } from "../../utils/common/PosTerminalUtility";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import ConfirmModal from "../../hooks/ConfirmModal";
import { CgEnter } from "react-icons/cg";
import { useLanguage } from "../../context/LanguageContext";

const SplitOrders = ({ openSplit, setOpenSplit, splitCarts, setSplitCarts }: any) => {
    const { rawPayload, setRawPayload, cart, setCart, tables, setTables, clearPOS, setPosLocalData,
        selectedRestaurant,setSelectedRestaurant, setSelectedCustomer, localApiData, setLocalApiData, currency
    } = usePOS();
    const { languageCode } = useLanguage();
    const [splits, setSplits] = useState<any[]>(splitCarts.length > 0 ? splitCarts : [{ _id: "split-1", products: [] }]);
    const [openSplits, setOpenSplits] = useState<string[]>(["split-1"]);
    const [error, setError] = useState("");
    const [isConfirmUndo, setIsConfirmUndo] = useState(false);

    useEffect(() => {
        if (splitCarts.length > 0) {
            setSplits(splitCarts);
            setOpenSplits(splitCarts.map((split: any) => split._id));
        } else {
            setSplits([{ _id: "split-1", products: [] }]);
            setOpenSplits(["split-1"]);
        }
    }, [splitCarts]);

    const toggleSplit = (splitId: string) => {
        setOpenSplits((prev) =>
            prev.includes(splitId) ? prev.filter((id) => id !== splitId) : [...prev, splitId]
        );
    };

    const addSplit = () => {
        const newId = `split-${splits.length + 1}`;
        setSplits([...splits, { _id: newId, products: [] }]);
        setOpenSplits([...openSplits, newId]);
        setError("");
    };

    const removeSplit = (splitId: string) => {
        if (splits.length <= 1) {
            setError("At least one split is required.");
            return;
        }
        setSplits(splits.filter((split) => split._id !== splitId));
        setOpenSplits(openSplits.filter((id) => id !== splitId));
        setError("");
    };

    const moveProductToSplit = (productId: string, splitId: string, position: number) => {
        const updatedSplits = splits.map((split) => ({
            ...split,
            products: (split.products || []).filter(
                (p: any) => p.product._id !== productId || p.position !== position
            ),
        }));

        const product = cart.find((p: any) => p.product._id === productId && p.position === position);

        if (product) {
            const newProduct = {
                ...product,
                position,
            };

            const newSplits = updatedSplits.map((split) =>
                split._id === splitId
                    ? {
                        ...split,
                        products: [
                            ...(split.products || []),
                            { ...newProduct, position },
                        ],
                    }
                    : split
            );

            setSplits(newSplits);
            setError("");
        } else {
            setError("Product not found or position mismatch.");
        }
    };


    const clearAllAssignments = () => {
        setSplits(splits.map((split) => ({ ...split, products: [] })));
        setError("");
    };

    const clearAll = () => {
        setSplits([{ _id: "split-1", products: [] }]);
        setOpenSplits(["split-1"]);
        setError("");
        setSplitCarts([]);
    };

    const getAssignedSplit = (productId: string, position: number) => {
        const split = splits.find(s => (s.products || []).some((product: any) => product.product._id === productId && product.position === position));
        return split ? `Split ${split._id.split("-")[1]}` : "Unassigned";
    };

    const calculateSplitTotal = (split: any) => {
        return split?.products.reduce((total: number, p: any) => {
            const cartItem = cart.find((prod: any) => prod?.product?._id === p?.product?._id);
            return total + (cartItem?.product ? cartItem?.product?.price * p?.quantity : 0);
        }, 0).toFixed(2);
    };

    const assignedCount = cart.filter((item: any) =>
        splits.some((split) => (split.products || []).some((p: any) => p.product._id === item.product._id && p.position === item.position))
    ).length;

    const saveSplits = () => {
        const isValid = cart.every((item: any) =>
            splits.some((split) => (split.products || []).some((p: any) => p.product._id === item.product._id && p.position === item.position))
        );
        if (!isValid) {
            setError("All products must be assigned to a split.");
            return;
        }
     const enrichedPayload = {
            ...rawPayload,
            restaurant: rawPayload?.restaurant 
                || selectedRestaurant?._id 
                || selectedRestaurant
        };
        const multiPayload = prepareMultiPayload(enrichedPayload, splits, tables);

        saveMultipleOrders(multiPayload);
        clearAll();
    };

    const saveMultipleOrders = async (multiPayload: any) => {
        try {
            const { data } = await apiClient.post(`/order/multiplesave`, multiPayload);
            if (data.success) {
                toast.success(data.message);
                setOpenSplit(false);
                clearPOS();
                initialAPIDataToLocal(localApiData);
            } else {
                toast.warning(data.message);
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    }

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

    const unassignProduct = (productIdToUnassign: string) => {
        setSplits(
            splits.map((split) => ({
                ...split,
                products: split.products.filter(
                    (p: any) => p.product._id !== productIdToUnassign
                ),
            }))
        );
        setError("");
    };

    const undoSplit = async () => {
        try {
            const { data } = await apiClient.post(`/order/undo-split-order`, { order: rawPayload?._id });
            if (data.success) {

                const { order } = data;
                setRawPayload({
                    ...order,
                    restaurant: order.restaurant._id,
                    server: order.server._id,
                })
                if (order.orderType === 'table') {
                    setCart(order.cartItems[0].products);
                    setTables(order.cartItems[0].table.mergedTables);
                } else {
                    setCart(order.cartItems);
                }
                toast.success(data.message);
                clearAll();
                setOpenSplit(false);
            }
        } catch (error: any) {
            console.error("Error fetching products by category:", error.message);
        }
    }

    const handleRecallOrder = async (orderId: string) => {
        const currentMainOrderId = rawPayload?.orderId || rawPayload?._id;
        await recallOrder(orderId, {
            setPosLocalData,
            setRawPayload,
            setSelectedRestaurant,
            setSelectedCustomer,
            setCart,
            setTables,
        });
        // After recalling a split, re-establish the parent order context
        // so that saving updates the existing split instead of creating a new order
        setRawPayload((prev: any) => ({
            ...prev,
            isSplitOrder: true,
            orderId: currentMainOrderId,
            splitOrderId: prev._id,
        }));
        setOpenSplit(false);
    };

    return (
        <Modal
            show={openSplit}
            onClose={() => setOpenSplit(false)}
            size="7xl"
            className="backdrop-blur bg-DARK-500/30 dark:bg-DARK-950/50 transition-all duration-300"
        >
            <Modal.Header>
                <span className="text-xl font-bold">
                    Split Order{splits[0]?.orderName ? ` | ${splits[0].orderName}` : ''}
                </span>
            </Modal.Header>

            <Modal.Body className="space-y-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded shadow">{error}</div>
                )}

                <div className="flex justify-between">
                    <Tooltip content={`Clear assigned products`}>
                        <Button size="sm" color="warning" className="focus:!ring-0" onClick={clearAllAssignments}>
                            Clear Assignments
                        </Button>
                    </Tooltip>
                    <Tooltip content={`Clear assigned products and all splits`}>
                        <Button size="sm" color="failure" className="focus:!ring-0" onClick={clearAll}>
                            Clear All
                        </Button>
                    </Tooltip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Main Order</h3>
                            <Badge
                                color={assignedCount === cart.length ? "success" : "warning"}
                                className="text-sm px-2.5 py-1 rounded-full"
                            >
                                {assignedCount}/{cart.length} Assigned
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {cart.map((cartItem: any, index: number) => {
                                const { product } = cartItem;
                                const assignedStatus = getAssignedSplit(product._id, cartItem?.position);
                                const isAssigned = assignedStatus !== "Unassigned";

                                return (
                                    <Fragment key={`${product._id}_${index}`}>
                                        <div
                                            className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${isAssigned
                                                ? "bg-green-50 dark:bg-green-900 border-green-400"
                                                : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                                }`}
                                            role="region"
                                            aria-label={`Product: ${product.name}`}
                                        >
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <img
                                                    src={`${apiUrl}/${product.image}`}
                                                    alt={product.nameMl?.[languageCode] ? product.nameMl?.[languageCode] : product.name}
                                                    loading="lazy"
                                                    onError={(e: any) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/images/default_food.png";
                                                    }}
                                                    className="w-14 h-14 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                                                />
                                                <div>
                                                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {product.nameMl?.[languageCode] ? product.nameMl?.[languageCode] : product.name} {/* | Position: {cartItem.position} */}
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Qty: {cartItem.quantity} • {currency?.symbol || "$"}{product.price.toFixed(2)}
                                                    </p>
                                                    <p
                                                        className={`text-xs font-semibold mt-1 ${isAssigned
                                                            ? "text-green-600 dark:text-green-400"
                                                            : "text-gray-500 dark:text-gray-400"
                                                            }`}
                                                    >
                                                        {assignedStatus}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 justify-start md:justify-end w-full md:w-auto">
                                                {splits.map((split) => {
                                                    const splitNum = split._id.split("-")[1];
                                                    const assignedToThisSplit = assignedStatus === `Split ${splitNum}`;

                                                    return (
                                                        <Tooltip
                                                            key={`${product._id}-${split._id}`}
                                                            content={`${assignedToThisSplit ? "Assigned to" : "Move to"} Split ${splitNum}`}
                                                        >
                                                            <Button
                                                                color={assignedToThisSplit ? "success" : "light"}
                                                                size="xs"
                                                                onClick={() => moveProductToSplit(product._id, split._id, cartItem?.position)}
                                                                aria-label={`Assign ${product.nameMl?.[languageCode] ? product.nameMl?.[languageCode] : product.name} to Split ${splitNum}`}
                                                                className="transition-transform hover:scale-[1.03] focus:!ring-0"
                                                            >
                                                                Split {splitNum}
                                                            </Button>
                                                        </Tooltip>
                                                    );
                                                })}

                                                {isAssigned && (
                                                    <Tooltip content={`Remove ${product.nameMl?.[languageCode] ? product.nameMl?.[languageCode] : product.name} from ${assignedStatus}`}>
                                                        <Button
                                                            color="failure"
                                                            size="xs"
                                                            onClick={() => unassignProduct(product._id)}
                                                            aria-label={`Unassign ${product.nameMl?.[languageCode] ? product.nameMl?.[languageCode] : product.name}`}
                                                            className="transition-transform hover:scale-[1.03] focus:!ring-0 flex items-center"
                                                        >
                                                            <IoMdCloseCircle className="w-4 h-4 mr-1" />
                                                            Unassign
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>

                                        {cartItem.isSeparate && (
                                            <hr className="border-2 border-gray-700 dark:border-gray-200 my-2" />
                                        )}
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Splits */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Splits</h3>
                            <Button
                                size="sm"
                                onClick={addSplit}
                                disabled={splits.length >= cart.length}
                                className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${splits.length >= cart.length
                                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                                    : "bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-BRAND-600 dark:hover:!bg-BRAND-700"
                                    } focus:!ring-0`}
                            >
                                <HiPlus className="w-4 h-4" />
                                Add Split
                            </Button>
                        </div>

                        <div className="space-y-5">
                            {splits.map((split, index) => (
                                <div
                                    key={split._id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div
                                        className="flex justify-between items-center px-5 py-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                                        onClick={() => toggleSplit(split._id)}
                                    >
                                        <div className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                                            Split {index + 1} — <span className="text-BRAND-600 dark:text-BRAND-400">{currency?.symbol || "$"}{calculateSplitTotal(split)}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Tooltip content={`Open splitted orde`}>
                                                <button
                                                    onClick={() => handleRecallOrder(split?.splitOrderId)}
                                                    type="button"
                                                    disabled={!split?.splitOrderId}
                                                    className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs sm:text-sm rounded-md transition-colors ${split?.splitOrderId
                                                        ? 'bg-BRAND-500 hover:bg-BRAND-700 dark:bg-DARK-600 dark:hover:bg-DARK-500'
                                                        : 'bg-gray-300 dark:bg-DARK-700 cursor-not-allowed opacity-50'}`}
                                                >
                                                    <CgEnter className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Open</span>
                                                </button>
                                            </Tooltip>

                                            <Tooltip content={`Remove Split`}>
                                                <Button
                                                    size="xs"
                                                    color="failure"
                                                    className="focus:!ring-0"
                                                    onClick={(e: any) => {
                                                        e.stopPropagation();
                                                        removeSplit(split._id);
                                                    }}
                                                    disabled={splits.length === 1}
                                                >
                                                    <RiDeleteBin6Line className="w-4 h-4" />
                                                </Button>
                                            </Tooltip>

                                            {openSplits.includes(split._id) ? (
                                                <HiChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                                            ) : (
                                                <HiChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                                            )}
                                        </div>
                                    </div>

                                    {openSplits.includes(split._id) && (
                                        <div className="px-5 py-4 bg-white dark:bg-gray-900">
                                            {split.products.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No products assigned.</p>
                                            ) : (
                                                split.products.map((p: any) => {
                                                    const prod = cart.find((o: any) => o.product._id === p.product._id && o.position === p.position);
                                                    return (
                                                        <Fragment key={p.product._id}>
                                                            <div className="flex items-center justify-between gap-4 mb-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                                                                <div className="flex items-center gap-4">
                                                                    <img
                                                                        src={`${apiUrl}/${prod?.product?.image}`}
                                                                        alt={prod?.product?.nameMl?.[languageCode] ? prod?.product?.nameMl?.[languageCode] : prod?.product?.name}
                                                                        onError={(e: any) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = "/images/default_food.png";
                                                                        }}
                                                                        className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-700"
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{prod?.product.nameMl?.[languageCode] ? prod?.product.nameMl?.[languageCode] : prod?.product.name}</span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Quantity: {p.quantity}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {prod?.isSeparate && (
                                                                <hr className="my-3 border-2 border-gray-200 dark:border-gray-700" />
                                                            )}
                                                        </Fragment>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-gray-700 dark:text-gray-300">
                    Total Items: {cart.reduce((sum: any, p: any) => sum + p.quantity, 0)} | Total: {currency?.symbol || "$"}
                    {splits.reduce((sum, split) => sum + parseFloat(calculateSplitTotal(split)), 0).toFixed(2)}
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsConfirmUndo(true)} color="gray" className="focus:!ring-0">
                        Undo Split
                    </Button>
                    <Button color="gray" className="focus:!ring-0 text-red-500 dark:!text-red-500 dark:hover:!text-red-600" onClick={() => setOpenSplit(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="success"
                        className="focus:!ring-0"
                        onClick={saveSplits}
                        disabled={assignedCount !== cart.length}
                    >
                        Save Split
                    </Button>
                </div>
            </Modal.Footer>

            <ConfirmModal
                isOpen={isConfirmUndo}
                message="Are you sure you want to undo split?"
                subText="Note: This will remove split orders."
                onConfirm={undoSplit}
                onCancel={() => setIsConfirmUndo(false)}
            />
        </Modal>
    );
};

export default SplitOrders;
