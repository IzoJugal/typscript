import { ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "flowbite-react";

type TransactionStatus = "Complete" | "Return" | "Void";

interface Transaction {
  _id: string;
  method: string;
  amount: number;
  cardNumber: string | null;
  cardType: string | null;
  referenceCode: string | null;
  authCode: string | null;
  giftCardCode: string | null;
  giftCardBalance: number;
  giftCardExpiry: string | null;
  isReturn: boolean;
  isVoid: boolean;
  expanded?: boolean;
  cashier?: any;
}

const statusColor = {
  Complete: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Return: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Void: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const getStatus = (transaction: Transaction): TransactionStatus => {
  if (transaction.isVoid) return "Void";
  if (transaction.isReturn) return "Return";
  return "Complete";
};

const TransactionsTable = ({ openTransaction, setOpenTransaction, orderTransactions: transactions, setOrderTransactions: setTransactions, orderData }: any) => {
  const toggleExpand = (index: number) => {
    const updated = [...transactions];
    updated[index].expanded = !updated[index].expanded;
    setTransactions(updated);
  };

  const formatAmount = (amount: number) => `${orderData?.company?.currency?.symbol || "$"}${amount?.toFixed(2)} ${orderData?.company?.currency?.code || "USD"}`;

  return (
    <Modal
      size="7xl"
      show={openTransaction}
      onClose={() => setOpenTransaction(false)}
      className="backdrop-blur-lg bg-black/40 dark:bg-black/60 transition-all duration-500 ease-out"
      aria-labelledby="transaction-modal-title"
    >
      <Modal.Header className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
        <h2 id="transaction-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {orderData?.orderName} Transactions
        </h2>
      </Modal.Header>
      <Modal.Body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-b-xl overflow-y-auto max-h-[80vh]">
        <div className="p-4 sm:p-6">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-5 items-center bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold py-4 px-6 rounded-t-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-opacity-90 backdrop-blur-sm">
            <span>Transaction ID</span>
            <span>Payment Method</span>
            <span>Status</span>
            <span>Amount</span>
            <span className="text-right">Details</span>
          </div>

          {/* Transaction List */}
          <div className="space-y-4 mt-4">
            {transactions.map((tx: any, i: number) => (
              <div
                key={tx._id}
                onClick={() => toggleExpand(i)}
                onKeyDown={(e) => e.key === 'Enter' && toggleExpand(i)}
                tabIndex={0}
                role="button"
                aria-expanded={tx.expanded}
                aria-label={`Toggle transaction details for ${tx._id}`}
                className={`transition-all duration-300 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg 
                  ${tx.expanded ? 'border-l-4 border-BRAND-500 dark:border-DARK-400' : ''} cursor-pointer overflow-hidden`}
              >
                {/* Collapsed Row - Mobile Card Layout */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-5 items-center gap-4 px-4 sm:px-6 py-4 transition-colors duration-200 
                    ${tx.expanded ? 'bg-gradient-to-r from-BRAND-50 to-white dark:from-DARK-700 dark:to-DARK-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <div className="flex justify-between items-center md:truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    <span className="block md:hidden font-semibold text-BRAND-500 dark:text-DARK-300">ID:</span>
                    <span className="truncate">{tx._id}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="block md:hidden font-semibold text-BRAND-500 dark:text-DARK-300">Method:</span>
                    <span>{tx.method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="block md:hidden font-semibold text-BRAND-500 dark:text-DARK-300">Status:</span>
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColor[getStatus(tx)]} capitalize`}
                    >
                      {getStatus(tx)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-DARK-900 dark:text-DARK-100">
                    <span className="block md:hidden font-semibold text-BRAND-500 dark:text-DARK-300">Amount:</span>
                    <span>{formatAmount(tx.amount)}</span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(i);
                      }}
                      className="p-2 rounded-full hover:bg-BRAND-100 dark:hover:bg-DARK-900/50 transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:text-BRAND-500 dark:hover:text-DARK-300"
                      aria-label={`Toggle details for transaction ${tx._id}`}
                    >
                      <span className={`transform transition-transform duration-300 ${tx.expanded ? 'rotate-180' : ''}`}>
                        {tx.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {tx.expanded && (
                  <div
                    className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out"
                    style={{ animation: 'slideDown 0.3s ease-in-out' }}
                  >
                    <div className="max-w-7xl mx-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Transaction Details Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                          <h4 className="text-lg font-semibold text-BRAND-500 dark:text-DARK-300 mb-4">
                            Transaction Details
                          </h4>
                          <div className="space-y-3">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span> {tx._id}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Method:</span> {tx.method}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>{' '}
                              {formatAmount(tx.amount)}
                            </p>
                            {tx.method === 'CASH' && orderData?.change > 0 && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Change:</span>{' '}
                                {formatAmount(orderData?.change)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Information Card */}
                        {tx.method === 'CARD' && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                            <h4 className="text-lg font-semibold text-BRAND-500 dark:text-DARK-300 mb-4">
                              Card Information
                            </h4>
                            <div className="space-y-3">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Card Number:</span>{' '}
                                {tx.cardNumber ?? 'N/A'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Card Type:</span>{' '}
                                {tx.cardType ?? 'N/A'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Auth Code:</span>{' '}
                                {tx.authCode ?? 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Cashier Information Card */}
                        {tx?.cashier && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                            <h4 className="text-lg font-semibold text-BRAND-500 dark:text-DARK-300 mb-4">Cashier</h4>
                            <div className="space-y-3">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>{' '}
                                {tx?.cashier?.name ?? 'N/A'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>{' '}
                                {tx?.cashier?.email ?? 'N/A'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Alias:</span>{' '}
                                {tx?.cashier?.alias ?? 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Gift Card Info Card */}
                        {tx?.giftCardCode && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                            <h4 className="text-lg font-semibold text-BRAND-500 dark:text-DARK-300 mb-4">
                              Gift Card Info
                            </h4>
                            <div className="space-y-3">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Code:</span>{' '}
                                {tx.giftCardCode ?? 'N/A'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Balance:</span> $
                                {tx.giftCardBalance?.toFixed(2) ?? '0.00'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Expiry:</span>{' '}
                                {tx.giftCardExpiry ?? 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Transaction Status Card */}
                        {(tx?.isReturn || tx?.isVoid) && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                            <h4 className="text-lg font-semibold text-BRAND-500 dark:text-DARK-300 mb-4">
                              Transaction Status
                            </h4>
                            <div className="space-y-3">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Is Return:</span>{' '}
                                {tx.isReturn ? 'Yes' : 'No'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Is Void:</span>{' '}
                                {tx.isVoid ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Reference Card */}
                        {tx?.referenceCode && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
                            <h4 className="text-lg font-semibold text-BRAND-500 dark:text-DARK-300 mb-4">Reference</h4>
                            <div className="space-y-3">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Reference Code:</span>{' '}
                                {tx.referenceCode ?? 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TransactionsTable;
