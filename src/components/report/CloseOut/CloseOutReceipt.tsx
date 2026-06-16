/* eslint-disable @typescript-eslint/no-explicit-any */
const CloseOutReceipt = ({ data }: any) => {
    const formatKey = (key: string): string =>
        key.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, char => char.toUpperCase());

    return (
        <div className="max-w-md mx-auto bg-white p-4 shadow-lg rounded-lg">
            {/* Transaction Total Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Transaction Total</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data?.transactionTotal).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{formatKey(key)}</span>
                            <span className="text-sm">{data.transactionTotal[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips and Gratuity Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Tips and Gratuity</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data.tipsAndGratuity).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{formatKey(key)}</span>
                            <span className="text-sm">{data.tipsAndGratuity[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expected Totals Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Expected Totals</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data.expectedTotals).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{formatKey(key)}</span>
                            <span className="text-sm">{data.expectedTotals[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Employee Stats Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Employee Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data.employeeStats).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{formatKey(key)}</span>
                            <span className="text-sm">{data.employeeStats[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Orders Summary Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Orders Summary</h3>
                {Object.keys(data.ordersSummary).map((sectionKey: any) => (
                    <div key={sectionKey} className="mb-4 flex justify-between">
                        <h4 className="font-medium">{formatKey(sectionKey)}({data.ordersSummary[sectionKey]?.count}) :</h4>
                        <span className="text-sm">${data.ordersSummary[sectionKey]?.amount}</span>
                    </div>
                ))}
            </div>

            {/* Gift Data Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Gift Data</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data.giftData).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm">{data.giftData[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Other Data Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Other Data</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data.otherData).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm">{data.otherData[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Void and Return Transactions</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(data.voidTransaction).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm">{data.voidTransaction[key] || '0.00'}</span>
                        </div>
                    ))}
                    {Object.keys(data.returnTransaction).map((key) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm">{data.returnTransaction[key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pay In / Pay Out Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Pay In / Pay Out</h3>
                <div className="flex justify-between">
                    <span className="text-sm font-medium">Pay In</span>
                    <span className="text-sm">{data.payIn || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-medium">Pay Out</span>
                    <span className="text-sm">{data.payOut || '0.00'}</span>
                </div>
            </div>

            {/* Employee Sales Section */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold mb-2">Employee Sales</h3>
                {data.employeeSales.length > 0 ? (
                    data.employeeSales.map((employee: any, index: any) => (
                        <div key={index} className="flex justify-between">
                            <h4 className="font-medium">{employee.serverName}({employee.totalOrderCount})</h4>
                            <span className="text-sm">{employee.totalAmount || '0.00'}</span>
                        </div>
                    ))
                ) : (
                    <span>No employee sales data available.</span>
                )}
            </div>
            <div className="text-center text-2xl font-bold text-slate-500">Thank You</div>
        </div>
    )
}

export default CloseOutReceipt
