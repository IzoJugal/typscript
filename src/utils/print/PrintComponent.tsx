// components/PrintComponent.tsx
import React from "react";

interface PrintComponentProps {
  payload: any;
}

export const PrintComponent = React.forwardRef<HTMLDivElement, PrintComponentProps>(
  ({ payload }, ref) => {
    if (!payload) return null;

    return (
      <div ref={ref}>
        <h1>Receipt</h1>
        <p><strong>Order ID:</strong> {payload._id}</p>
        <p><strong>Customer:</strong> {payload.customerName}</p>
        <p><strong>Amount:</strong> ${payload.amount}</p>
        <p><strong>Date:</strong> {payload.date}</p>
      </div>
    );
  }
);
