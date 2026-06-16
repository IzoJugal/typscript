import { Button, Checkbox, Modal } from "flowbite-react";
import { capitalized } from "../../utils/utility";
import { IoMdCart, IoMdCloseCircle } from "react-icons/io";
import OrderButtons from "./OrderButtons";
import { Fragment, useEffect, useRef, useState } from "react";
import { orderTypeMap } from "../../utils/common/constant";
import { usePOS } from "../../context/POSProvider";
import PaymentPage from "./PaymentPage";
import { MdOutlineKeyboardDoubleArrowDown } from "react-icons/md";
import SplitOrders from "./SplitOrders";
import { getSplitOrders } from "../../utils/common/PosTerminalUtility";
import { useLanguage } from "../../context/LanguageContext";
// import { GiHamburgerMenu } from "react-icons/gi";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import apiClient from "../../utils/AxiosInstance";
import ConfirmModal from "../../hooks/ConfirmModal";

const POSCart = ({ sendOrder, updateQuantity, setIsCartOpen, isCartOpen }: any) => {
    const { rawPayload, setRawPayload, cart, setCart, setPosLocalData, posLocalData, currency } = usePOS();
    const { languageCode } = useLanguage();
    const [_currentTime, setCurrentTime] = useState(new Date());
    const [isOpenProductModal, setIsOpenProductModal] = useState<any>(null);
    const [deleteProductModal, setDeleteProductModal] = useState<any>({ openModal: false, reason: '', isWaste: false });
    const [orderNote, setOrderNote] = useState(false);
    const [productNote, setProductNote] = useState(orderNote ? rawPayload.orderNote : '');
    const [footerHeight, setFooterHeight] = useState(0);
    const [openSplit, setOpenSplit] = useState(false);
    const [productRemoveModal, setProductRemoveModal] = useState<any>({ status: false, product: null });
    const [splitCarts, setSplitCarts] = useState([]);

    const footerRef: any = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (footerRef.current) {
                setFooterHeight(footerRef.current.offsetHeight);
            }
        });
        if (footerRef.current) resizeObserver.observe(footerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const formatDate = (date: any) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-GB', options);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedTime = `${hours % 12 || 12}:${minutes}:${seconds} ${period}`;
        return `${formattedTime}, ${formattedDate}`;
    };

    const addNote = (product: any, cartIndex: any) => {
        const item = cart.find((_prod: any, index: number) => index === cartIndex);
        setProductNote(item?.note || '');
        setIsOpenProductModal({ product, cartIndex });
    };

    const addProductNote = (params: any) => {
        if (orderNote) {
            setRawPayload((prev: any) => ({ ...prev, orderNote: productNote }));
        } else {
            cart.forEach((item: any, index: number) => {
                // if (item.product._id === params.product) {
                if (params.cartIndex === index) {
                    item.note = productNote;
                }
            });
            setCart([...cart]);
        }
        setProductNote('');
        setIsOpenProductModal(null);
        setOrderNote(false);
    };
    const handleRemoveSeparator = (item: any) => {
        const updatedCart = cart.map((cartItem: any) => {
            if (item.product === cartItem.product) {
                return { ...cartItem, isSeparate: false };
            }
            return cartItem;
        });
        setCart(updatedCart);
    }

    const orderTypeLabel = Object.entries(orderTypeMap).find(([, value]) => (rawPayload.orderType === 'table') ? value === rawPayload.orderType : value === rawPayload.productOrderType)?.[0] || 'Quick Service';

    const returnProduct = async () => {
        try {
            const item: any = productRemoveModal.product;
            const params = {
                order: rawPayload?._id ?? null,
                product: item?.product?._id ?? null,
                quantity: item?.quantity ?? 0,
                note: item?.note ?? "",
                position: item?.position ?? 0,
                reason: deleteProductModal?.reason,
                paidId: rawPayload?.multipleMethods?.[0]?._id ?? null,
                isWaste: deleteProductModal?.isWaste ?? false,
            };
            await apiClient.post(`/order/delete-product`, params);
        } catch (error: any) {
            console.error("Failed to return product:", error.response?.data?.message || error.message);
        } finally {
            setProductRemoveModal({ status: false, product: null });
            setDeleteProductModal({ openModal: false, reason: '', isWaste: false });
        }
    }

    return (
        <Fragment>
            <aside className="relative flex flex-col flex-1 lg:block w-full lg:w-full bg-white dark:bg-gray-800 p-0 shadow-lg h-full">
                {/* <span onClick={() => setIsCartOpen(!isCartOpen)} className="absolute -left-7 top-2 lg:hidden"><FaAnglesLeft /> Cart</span> */}
                <span onClick={() => setIsCartOpen(!isCartOpen)} className="absolute -left-16 top-2 flex lg:hidden bg-white rounded-full text-DARK-800 px-2">
                    {isCartOpen ? <FaAnglesRight className="my-auto mx-1" /> : <FaAnglesLeft className="my-auto mx-1" />} Cart
                </span>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-semibold flex gap-2 items-center text-gray-800 dark:text-gray-100">
                            <IoMdCart className="text-lg" /> Your Cart
                        </h2>
                        <div className="flex-col text-xs text-DARK-500 dark:text-DARK-200">
                            <span className="text-sm">{formatDate(new Date())}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-gray-600 dark:text-gray-300">
                        <span>{rawPayload?.orderName ?? 'Order#'}</span>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full my-auto">
                            {orderTypeLabel} | {posLocalData?.selectedPaymentProvider?.provider}
                        </span>
                    </div>
                </div>

                <div className="overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900" style={{ maxHeight: `calc(100vh - ${footerHeight + 80}px)`, minHeight: `calc(100vh - ${footerHeight + 80}px)` }}>
                    {cart?.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                Your cart is empty. Add some items to get started!
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {cart?.map((item: any, index: number) => (
                                <Fragment key={`${item?.product?._id}_${index}`}>
                                    <li className={`${rawPayload?.isSplitOrder && 'pointer-events-none'} relative flex flex-col sm:flex-row justify-between bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {item?.product?.nameMl?.[languageCode] ? capitalized(item?.product?.nameMl?.[languageCode]) : capitalized(item?.product?.name)} {/* {item?.position} */}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                {currency?.symbol || "$"}{item?.product?.price?.toFixed(2)} × {item?.quantity} (Stock: {item?.product?.stock})
                                            </p>
                                            {item?.modifiers?.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.modifiers.map((modi: any) => (
                                                        <span key={modi._id} className="border dark:border-DARK-500 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-1 py-0.3 rounded-full">
                                                            {capitalized(modi.name)} {modi.price > 0 ? `(${currency?.symbol || "$"}${modi.price})` : "(Free)"}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => addNote(item.product._id, index)}
                                                className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                                                aria-label={item.note ? `Edit note: ${item.note}` : "Add a note"}
                                            >
                                                {item.note ? `Note: ${item.note}` : "+ Add Note"}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={rawPayload?._id && cart.length <= 1}
                                                onClick={() => updateQuantity(item, -1, index)}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                                aria-label="Decrease quantity"
                                            >
                                                -
                                            </button>
                                            <span className="text-xs text-gray-900 dark:text-white w-7 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item, 1, index)}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>
                                        </div>
                                        {/* <span onClick={() => returnProduct(item)} className="absolute top-0 right-0 text-red-500 cursor-pointer" title="Remove or Return Product"><IoMdCloseCircle className="w-5 h-5" /></span> */}
                                        {(!rawPayload?._id || (rawPayload?._id && cart.length > 1)) && (
                                            <span onClick={() => {
                                                rawPayload?._id
                                                    ? setProductRemoveModal({ status: true, product: item })
                                                    : updateQuantity(item, -1, index);
                                            }}
                                                className="absolute bottom-1 right-1 text-red-500 hover:text-red-600 cursor-pointer text-xs font-semibold"
                                                title="Remove or Return Product"
                                            >
                                                Delete
                                            </span>
                                        )}


                                    </li>
                                    {item.isSeparate && (
                                        <div className="relative flex flex-col group">
                                            <Button
                                                onClick={() => {
                                                    setPosLocalData((prev: any) => {
                                                        const newData = { ...prev };
                                                        if (newData.hasOwnProperty('cartSeparatorIndex')) {
                                                            delete newData.cartSeparatorIndex;
                                                        } else {
                                                            newData.cartSeparatorIndex = index;
                                                        }
                                                        return newData;
                                                    });
                                                }}
                                                size="xs"
                                                className={`${typeof posLocalData.cartSeparatorIndex === 'number' && posLocalData.cartSeparatorIndex === index
                                                    ? "bg-yellow-400 hover:!bg-yellow-500 dark:bg-yellow-500 dark:hover:!bg-yellow-400"
                                                    : "bg-DARK-500 dark:bg-DARK-800 hover:!bg-DARK-600 dark:hover:!bg-DARK-700"}
                                                       self-center mb-1 p-0 focus:ring-0 rounded-md transition-colors duration-300 ease-in-out`}
                                                aria-label={typeof posLocalData.cartSeparatorIndex === 'number' && posLocalData.cartSeparatorIndex === index
                                                    ? "Remove cart separator"
                                                    : "Set cart separator"
                                                }
                                            >
                                                {typeof posLocalData.cartSeparatorIndex === 'number' && posLocalData.cartSeparatorIndex === index
                                                    ? "Adding Here"
                                                    : "Add Product"
                                                }
                                            </Button>

                                            <div className="relative flex items-center">
                                                <hr className="flex-grow border-2 border-gray-500 mr-4" />
                                                <IoMdCloseCircle
                                                    onClick={() => handleRemoveSeparator(item)}
                                                    className="w-4 h-4 text-red-500 hover:text-red-600 cursor-pointer absolute right-0 transform -translate-y-1/2 top-1/2 transition duration-150"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Fragment>
                            ))}
                        </ul>
                    )}
                </div>

                <div ref={footerRef} className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    {rawPayload?.orderNote && (
                        <div className="mb-2 text-xs text-gray-600 dark:text-gray-300 text-justify">
                            <span className="font-medium text-amber-600 dark:text-amber-400">Order Note:</span> {rawPayload?.orderNote}
                        </div>
                    )}
                    <OrderButtons {...{ setOrderNote, setProductNote }} />
                    {cart?.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Order Summary</h3>
                                <button
                                    onClick={() => setPosLocalData((prev: any) => ({ ...prev, isCartSummaryExpand: !prev?.isCartSummaryExpand }))}
                                    aria-expanded={posLocalData.isCartSummaryExpand}
                                    className="flex items-center text-sm text-DARK-800 dark:text-DARK-200 hover:underline transition group"
                                >
                                    <span className="mr-1">{posLocalData.isCartSummaryExpand ? "Show Less" : "Show More"}</span>
                                    <MdOutlineKeyboardDoubleArrowDown
                                        className={`w-5 h-5 transition-transform duration-300 ${posLocalData.isCartSummaryExpand ? "rotate-180" : ""} group-hover:scale-110`}
                                    />
                                </button>
                            </div>

                            <div
                                className={`overflow-hidden transition-max-height duration-500 ease-in-out`}
                                style={{
                                    maxHeight: posLocalData.isCartSummaryExpand ? "1000px" : "0",
                                }}
                            >
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>Sub Total</span>
                                        <span>{currency?.symbol || "$"}{rawPayload?.orderSubTotal}</span>
                                    </div>

                                    {rawPayload?.gratuity > 0 && (
                                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                            <span>Gratuity ({rawPayload?.gratuity}%)</span>
                                            <span>{currency?.symbol || "$"}{Number(rawPayload?.gratuityAmount || 0).toFixed(2)}</span>
                                        </div>
                                    )}

                                    {rawPayload.couponId && (
                                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                            <span>Coupon ({rawPayload?.couponCode})</span>
                                            <span className="text-green-600">-{currency?.symbol || "$"}{Number(rawPayload?.couponAmount || 0).toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 py-1">
                                        <span>Total Tax</span>
                                        {rawPayload.isTaxExemption ? (
                                            <span className="flex gap-2 items-center">
                                                <span className="line-through text-gray-500 text-xs">{currency?.symbol || "$"}{Number(rawPayload?.totalTax || 0).toFixed(2)}</span>
                                                <span className="text-green-600 font-semibold text-sm">Tax Free</span>
                                            </span>
                                        ) : (
                                            <span>{currency?.symbol || "$"}{Number(rawPayload?.totalTax || 0).toFixed(2)}</span>
                                        )}
                                    </div>

                                    {rawPayload?.paidAmount ? (
                                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 py-1">
                                            <span>Paid</span>
                                            <span>{currency?.symbol || "$"}{Number(rawPayload?.paidAmount || 0).toFixed(2)}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Always visible Total */}
                            <div className="flex justify-between text-base font-semibold border-t border-gray-300 dark:border-gray-500 pt-3 text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span>
                                    {currency?.symbol || "$"}
                                    {(
                                        (parseFloat(rawPayload?.orderSubTotal || 0) +
                                            parseFloat(rawPayload?.gratuityAmount || 0) +
                                            (rawPayload.isTaxExemption ? 0 : parseFloat(rawPayload?.totalTax || 0)) -
                                            parseFloat(rawPayload?.couponAmount || 0) -
                                            parseFloat(rawPayload?.paidAmount || 0)
                                        ).toFixed(2)
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {!rawPayload?.isSplitOrder ? (
                        <button
                            onClick={() => setPosLocalData((prev: any) => ({ ...prev, isOpenPayment: true }))}
                            disabled={!rawPayload?.cartItems?.length}
                            aria-label={`Pay ${currency?.symbol || "$"}${Number(rawPayload?.orderTotalAmount)?.toFixed(2) ?? '0.00'}`}
                            className="w-full bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition"
                        >
                            <div className="flex items-center justify-between px-4">
                                <span className="flex items-center gap-2 text-lg">
                                    <span aria-hidden="true" role="img" aria-label="Credit card">
                                        💳
                                    </span>
                                    Pay
                                </span>
                                <span className="text-lg font-mono tabular-nums">
                                    {currency?.symbol || "$"}
                                    {(
                                        parseFloat(rawPayload?.orderSubTotal || 0) +
                                        parseFloat(rawPayload?.gratuityAmount || 0) +
                                        (rawPayload.isTaxExemption ? 0 : parseFloat(rawPayload?.totalTax || 0)) -
                                        parseFloat(rawPayload?.couponAmount || 0) -
                                        parseFloat(rawPayload?.paidAmount || 0)
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                const mainOrderId = rawPayload.orderId || rawPayload._id;
                                getSplitOrders(mainOrderId, cart, setCart, setSplitCarts);
                                setOpenSplit(true);
                            }}
                            disabled={!rawPayload?.cartItems?.length}
                            aria-label={`Pay ${currency?.symbol || "$"}${Number(rawPayload?.orderTotalAmount)?.toFixed(2) ?? '0.00'}`}
                            className="w-full bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition"
                        >
                            <div className="flex items-center justify-between px-4 text-lg font-semibold">
                                <span>Open splits</span>
                                <span className="font-mono tabular-nums">{currency?.symbol || "$"}{rawPayload?.orderTotalAmount ? Number(rawPayload?.orderTotalAmount).toFixed(2) : '0.00'}</span>
                            </div>
                        </button>
                    )}
                </div>
            </aside>

            {/* Modals */}
            {openSplit && <SplitOrders {...{ openSplit, setOpenSplit, splitCarts, setSplitCarts }} />}
            <PaymentPage {...{ sendOrder }} />

            <Modal
                show={!!isOpenProductModal || !!orderNote}
                onClose={() => { setIsOpenProductModal(null); setOrderNote(false); }}
                className="backdrop-blur-sm bg-DARK-500/30 dark:bg-gray-900/30"
            >
                <Modal.Header className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base font-medium px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                    Add Note
                </Modal.Header>
                <Modal.Body className="flex flex-col sm:flex-row gap-3 items-center p-5 bg-gray-50 dark:bg-gray-900">
                    <input
                        type="text"
                        value={productNote}
                        onChange={(e) => setProductNote(e.target.value)}
                        className="w-full sm:flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder={orderNote ? 'Add note for Order' : 'Add note for product'}
                    />
                    {/* <button
                        onClick={() => addProductNote(isOpenProductModal)}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Add
                    </button> */}
                </Modal.Body>
                <Modal.Footer className="flex w-full justify-end p-2 bg-white dark:bg-gray-800">
                    <Button onClick={() => { setIsOpenProductModal(null); setOrderNote(false) }} color="failure" className="p-0 w-28">Cancel</Button>
                    <Button disabled={!productNote} onClick={() => addProductNote(isOpenProductModal)} className="p-0 w-28 bg-BRAND-500 hover:bg-BRAND-600 dark:bg-BRAND-500 hover:dark:!bg-BRAND-600">Add</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={deleteProductModal.openModal}
                onClose={() => { setDeleteProductModal({ openModal: false, reason: '' }); setProductRemoveModal({ status: false, product: null }) }}
                className="backdrop-blur-sm bg-DARK-500/30 dark:bg-gray-900/30"
            >
                <Modal.Header className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base font-medium px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                    Add Reason
                </Modal.Header>
                <Modal.Body className="items-center p-5 bg-gray-50 dark:bg-gray-900">
                    <input
                        type="text"
                        value={deleteProductModal.reason}
                        onChange={(e) => setDeleteProductModal((prev: any) => ({ ...prev, reason: e.target.value }))}
                        className="w-full sm:flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder={'Add reason for delete product'}
                    />
                    <label htmlFor="isWaste" className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                        <Checkbox
                            id="isWaste"
                            name="isWaste"
                            className="checked:!bg-BRAND-500 focus:ring-0"
                            onChange={() =>
                                setDeleteProductModal((prev: any) => ({
                                    ...prev,
                                    isWaste: !prev.isWaste,
                                }))
                            }
                        />
                        <span>Is this a waste product?</span>
                    </label>



                </Modal.Body>
                <Modal.Footer className="flex w-full justify-end p-2 bg-white dark:bg-gray-800">
                    <Button onClick={() => { setDeleteProductModal({ openModal: false }); setProductRemoveModal({ status: false, product: null }) }} color="failure" className="p-0 w-28">Cancel</Button>
                    <Button disabled={!deleteProductModal.reason} onClick={returnProduct} className="p-0 w-28 bg-BRAND-500 hover:bg-BRAND-600 dark:bg-BRAND-500 hover:dark:!bg-BRAND-600">Add</Button>
                </Modal.Footer>
            </Modal>
            <ConfirmModal
                isOpen={productRemoveModal.status}
                message={`Are you sure you want to remove product?`}
                // {productRemoveModal?.product?.nameMl?.[languageCode] ? capitalized(productRemoveModal?.product?.nameMl?.[languageCode]) : capitalized(productRemoveModal?.product?.name)}
                // subText="Note: This will change your order."
                onConfirm={() => setDeleteProductModal({ openModal: true })}
                onCancel={() => setProductRemoveModal({ status: false, product: null })}
            />
        </Fragment>
    );
};

export default POSCart;