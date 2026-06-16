import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface ReprintReceiptComponentProps {
  payload: any;
  onClose?: () => void;
}

export const ReprintReceiptComponent: React.FC<ReprintReceiptComponentProps> = ({ 
  payload, 
  onClose 
}) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <div className="reprint-receipt-modal">
      <div className="receipt-content" ref={componentRef}>
        {/* Receipt content goes here */}
        <div className="receipt-header">
          <h2>Receipt</h2>
          <p>Order ID: {payload?._id}</p>
        </div>
        
        <div className="receipt-body">
          {/* Add your receipt template here */}
          <p>Customer: {payload?.customer?.name || 'Walk-in'}</p>
          <p>Date: {new Date(payload?.createdAt).toLocaleDateString()}</p>
          <p>Total: ${payload?.total?.toFixed(2) || '0.00'}</p>
          
          {/* Add more receipt details as needed */}
          {payload?.items?.map((item: any, index: number) => (
            <div key={index} className="receipt-item">
              <span>{item.name}</span>
              <span>${item.price?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="receipt-actions">
        <button onClick={handlePrint} className="print-btn">
          Print Receipt
        </button>
        {onClose && (
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        )}
      </div>
    </div>
  );
};
