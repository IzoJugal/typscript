import { Button, Modal } from "flowbite-react";
import { usePOS } from "../../../context/POSProvider";
import { MdKeyboardReturn } from "react-icons/md";
import { Fragment, useState } from "react";
import ConfirmModal from "../../../hooks/ConfirmModal";
import { toastAlert } from "../../../utils/utility";

const OrderCard = ({ method, amount, onAction, actionText }: any) => {
    return (
        <div className="bg-white dark:bg-DARK-800 rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:scale-105 transition-transform duration-300 ease-in-out transform">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{method}</h3>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Paid Amount</span>
                <span className="text-xl font-semibold text-BRAND-600 dark:text-BRAND-400">${amount}</span>
            </div>
            <div className="flex justify-end">
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-red-600 rounded-full px-5 py-2.5 transition-colors duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                    <MdKeyboardReturn className="h-5 w-5" />
                    <span>{actionText}</span>
                </button>
            </div>
        </div>
    );
};

const ModalHeader = ({ title, orderName }: { title: string; orderName: string }) => (
    <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {title} <span className="text-lg text-gray-500 dark:text-gray-400">{orderName}</span>
    </div>
);

const BottomMenuModal = ({ buttonResponse, setButtonResponse }: any) => {
    const { rawPayload } = usePOS();
    const [isConfirmUndo, setIsConfirmUndo] = useState<boolean>(false);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);

    const handleActionClick = (item: any) => {
        setIsConfirmUndo(true);
        setSelectedMethod(item);
    };

    const handleReturnOrder = async () => {
        if (selectedMethod) {
            const response = await buttonResponse?.onConfirm(selectedMethod);
            const { success, message } = response?.data;
            if (success) {
                toastAlert('success', { message, position: "top-right", autoClose: 1500 });
                // toast.success(message, { position: "top-right", autoClose: 3000 });
                setButtonResponse({ ...buttonResponse, isOpenModal: false });
                setSelectedMethod(null);
            } else {
                toastAlert('error', { message, position: "top-right", autoClose: 1500 });
                // toast.error(message, { position: "top-right", autoClose: 3000 });
            }
        }
    };

    const renderOrderMethods = (actionText: string) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {rawPayload?.multipleMethods?.map((item: any, index: number) => (
                <OrderCard
                    key={index}
                    method={item?.method}
                    amount={item?.amount}
                    onAction={() => handleActionClick(item)}
                    actionText={actionText}
                />
            ))}
        </div>
    );

    const addTipMethods = () => (
        <div className="max-w-lg mx-auto p-6 bg-white dark:bg-DARK-800 rounded-2xl shadow-lg border border-DARK-300 dark:border-DARK-700 transition-all duration-300">
            <div className="flex flex-col gap-6">
                <div>
                    <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Enter Tip Amount
                    </label>
                    <input
                        id="tipAmount"
                        type="number"
                        value={selectedMethod?.tipAmount || ""}
                        onChange={(e) => setSelectedMethod({ ...selectedMethod, tipAmount: e.target.value })}
                        placeholder="0.00"
                        className="w-full bg-white dark:bg-DARK-900 border border-gray-300 dark:border-DARK-600 rounded-lg py-2.5 px-4 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-BRAND-500 focus:border-BRAND-500 transition-colors duration-200"
                    />
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setButtonResponse({ ...buttonResponse, isOpenModal: false });
                            setSelectedMethod(null);
                        }}
                        className="w-1/2 bg-DARK-500 hover:bg-DARK-600 dark:bg-DARK-700 dark:hover:bg-DARK-600 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-DARK-500 transition-colors duration-200"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleReturnOrder}
                        className="w-1/2 bg-BRAND-500 hover:bg-BRAND-600 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-BRAND-500 transition-colors duration-200"
                    >
                        Save Tip
                    </button>
                </div>
            </div>
        </div>
    );

    const cancelOrderMethods = () => (
        <div className="bg-white dark:bg-DARK-800 p-6 rounded-2xl shadow-lg border border-DARK-300 dark:border-DARK-700 max-w-xl mx-auto">
            <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Cancel Reason
                </label>
                <input
                    type="text"
                    value={selectedMethod?.canceledReason || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedMethod({ ...selectedMethod, canceledReason: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-DARK-900 border border-gray-300 dark:border-DARK-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-BRAND-500 focus:border-BRAND-500 transition-colors duration-200"
                    placeholder="Enter cancel reason"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        className="bg-DARK-500 hover:!bg-DARK-600 dark:bg-DARK-700 dark:hover:!bg-DARK-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-DARK-500 transition-colors duration-200"
                        onClick={() => setButtonResponse({ ...buttonResponse, isOpenModal: false })}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 dark:hover:!bg-BRAND-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-BRAND-500 transition-colors duration-200"
                        onClick={handleReturnOrder}
                    >
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Fragment>
            <Modal
                show={buttonResponse?.isOpenModal}
                onClose={() => setButtonResponse({ ...buttonResponse, isOpenModal: false })}
                size={buttonResponse?.id === 'add-tip-modal' ? 'xl' : buttonResponse?.id === 'cancel-order-modal' ? 'xl' : '7xl'}
                className="backdrop-blur-lg bg-DARK-500/30 dark:bg-DARK-950/50 transition-all duration-300 z-49"
                dismissible
            >
                <Modal.Header className="border-b border-DARK-300 dark:border-DARK-700">
                    <ModalHeader title={buttonResponse?.name} orderName={rawPayload?.orderName} />
                </Modal.Header>
                <Modal.Body className="space-y-8 bg-gray-50 dark:bg-DARK-900 rounded-lg p-6 sm:p-8">
                    {buttonResponse?.id === 'return-order-modal' ? renderOrderMethods('Return') :
                        buttonResponse?.id === 'void-order-modal' ? renderOrderMethods('Void') :
                            buttonResponse?.id === 'add-tip-modal' ? addTipMethods() :
                                buttonResponse?.id === 'cancel-order-modal' ? cancelOrderMethods() : null}
                </Modal.Body>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmUndo}
                message={buttonResponse?.message}
                subText={buttonResponse?.subText}
                onConfirm={() => {
                    handleReturnOrder();
                    setIsConfirmUndo(false);
                }}
                onCancel={() => setIsConfirmUndo(false)}
            />
        </Fragment>
    );
};

export default BottomMenuModal;