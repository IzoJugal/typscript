import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    message: string;
    subText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoadingBtn?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    message,
    subText,
    onConfirm,
    onCancel,
    isLoadingBtn
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm ">
            <div className="fixed inset-0 bg-black opacity-50"
                onClick={onCancel} />
            <div className="bg-white dark:bg-DARK-600 rounded-lg shadow-lg p-6 md:p-8 mx-4 max-w-sm md:max-w-lg z-10">
                <h2 className="text-xl font-semibold text-center mb-4 dark:text-DARK-100">{message} </h2>
                <p className="text-DARK-700 dark:text-DARK-300 text-center mb-6">{subText}</p>
                <div className="flex justify-center gap-4">
                    <button type='button' onClick={onConfirm}
                        disabled={isLoadingBtn}
                        className="text-white px-5 py-2 rounded-md transition duration-200 bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500"
                    >
                        {isLoadingBtn ? 'Loading...' : 'Yes'}
                    </button>
                    <button type='button' onClick={onCancel}
                        disabled={isLoadingBtn}
                        className="bg-DARK-300 text-DARK-800 px-5 py-2 rounded-md hover:bg-DARK-400 transition duration-200"
                    >
                        No
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ConfirmModal;
