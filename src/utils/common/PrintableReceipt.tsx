// utils/common/PrintableReceipt.tsx
import { capitalized, formatDate } from '../../utils/utility';

interface PrintableReceiptProps {
    order: any;
    receiptConfig?: {
        title?: string;
        subtitle?: string;
        footerText?: string;
    };
}

const PrintableReceipt = ({ order, receiptConfig }: PrintableReceiptProps) => {
    if (!order) return null;

    const currencySymbol = order?.company?.currency?.symbol || '₹';

    const cartItems =
        order.orderType === 'table'
            ? order.cartItems?.flatMap((item: any) => item.products || [])
            : order.cartItems || [];

    const companyName = receiptConfig?.title || order?.company?.name || 'HAPPINESS';
    const subtitle = receiptConfig?.subtitle || 'Order Receipt';
    const footerText = receiptConfig?.footerText || 'Thank you for your purchase!';

    return (
        <div style={{ display: 'none' }}>
            <div id="print-receipt">
                {/* HEADER */}
                <div style={{ textAlign: 'center', paddingBottom: '10px', borderBottom: '1px dashed #000' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '3px' }}>
                        {companyName}
                    </div>
                    {order?.company?.address && (
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#333' }}>
                            {order.company.address}
                        </div>
                    )}
                    {order?.company?.phone && (
                        <div style={{ fontSize: '10px', color: '#333' }}>
                            Tel: {order.company.phone}
                        </div>
                    )}
                    <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>
                        *** {subtitle} ***
                    </div>
                </div>

                {/* ORDER INFO */}
                <div style={{ padding: '8px 0', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Order #</span>
                        <span style={{ fontWeight: 'bold' }}>{order.orderName || order._id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Date</span>
                        <span>{order.orderDate ? formatDate(order.orderDate) : '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Server</span>
                        <span>{order?.server?.name || 'N/A'}</span>
                    </div>
                    {order.orderType === 'table' && order.cartItems?.[0]?.table?.table?.name && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Table</span>
                            <span>{order.cartItems[0].table.table.name}</span>
                        </div>
                    )}
                </div>

                <hr />

                {/* CUSTOMER */}
                {order?.customerId && (
                    <div style={{ padding: '6px 0', fontSize: '12px' }}>
                        <div>
                            <span style={{ fontWeight: 'bold' }}>Customer: </span>
                            <span>
                                {order.customerId.firstName || order.customerId.lastName
                                    ? `${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`.trim()
                                    : 'Guest'}
                            </span>
                        </div>
                        {order.customerId.phoneNumber && (
                            <div style={{ fontSize: '10px', color: '#555' }}>
                                {order.customerId.phoneNumber}
                            </div>
                        )}
                    </div>
                )}

                <hr />

                {/* ITEMS HEADER */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #000',
                    paddingBottom: '4px',
                    marginBottom: '6px',
                }}>
                    <span style={{ flex: 1 }}>ITEM</span>
                    <span style={{ width: '30px', textAlign: 'center' }}>QTY</span>
                    <span style={{ width: '60px', textAlign: 'right' }}>AMOUNT</span>
                </div>

                {/* ITEMS */}
                {cartItems.map((item: any, index: number) => (
                    <div key={index} style={{ marginBottom: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ flex: 1, paddingRight: '8px' }}>
                                {capitalized(item?.product?.name || 'Item')}
                            </span>
                            <span style={{ width: '30px', textAlign: 'center' }}>
                                {item.quantity}
                            </span>
                            <span style={{ width: '60px', textAlign: 'right', fontWeight: 'bold' }}>
                                {currencySymbol}{(item.totalPrice || 0).toFixed(2)}
                            </span>
                        </div>
                        {item.modifiers?.length > 0 && (
                            <div style={{ fontSize: '10px', color: '#555', paddingLeft: '10px' }}>
                                + {item.modifiers.map((m: any) => m.name).join(', ')}
                            </div>
                        )}
                        <div style={{ fontSize: '10px', color: '#777', paddingLeft: '10px' }}>
                            @ {currencySymbol}{(item.unitPrice || item.price || 0).toFixed(2)} each
                        </div>
                    </div>
                ))}

                <hr />

                {/* TOTALS */}
                <div style={{ padding: '6px 0', fontSize: '12px' }}>
                    {order.orderDiscountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', color: '#555' }}>
                            <span>Discount</span>
                            <span>-{currencySymbol}{order.orderDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {order.couponAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', color: '#555' }}>
                            <span>Coupon{order.couponId?.code ? ` (${order.couponId.code})` : ''}</span>
                            <span>-{currencySymbol}{parseFloat(order.couponAmount).toFixed(2)}</span>
                        </div>
                    )}
                    {order.tax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                            <span>Tax</span>
                            <span>{currencySymbol}{(order.tax || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {order.gratuityAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                            <span>Gratuity ({order.gratuity}%)</span>
                            <span>{currencySymbol}{order.gratuityAmount.toFixed(2)}</span>
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        borderTop: '1px solid #000',
                        paddingTop: '6px',
                        marginTop: '6px',
                    }}>
                        <span>TOTAL</span>
                        <span>{currencySymbol}{(order.orderTotalAmount || 0).toFixed(2)}</span>
                    </div>

                    {order.tip > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#777', marginTop: '2px' }}>
                            <span>Tip</span>
                            <span>{currencySymbol}{order.tip.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {order.paymentMethod && (
                    <>
                        <hr />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>Payment</span>
                            <span style={{ fontWeight: 'bold' }}>{order.paymentMethod}</span>
                        </div>
                    </>
                )}

                {/* FOOTER */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#555',
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #000',
                }}>
                    <div>{footerText}</div>
                    <div style={{ fontWeight: 'bold', marginTop: '2px' }}>Visit Again!</div>
                </div>
            </div>
        </div>
    );
};

export default PrintableReceipt;