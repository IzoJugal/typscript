// components/PrintManager.tsx
import { useImperativeHandle, useRef, forwardRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintComponent } from "./PrintComponent";

export interface PrintManagerRef {
  print: (payload: any) => void;
}

export const PrintManager = forwardRef<PrintManagerRef>((_, ref) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const [payload, setPayload] = useState<any | null>(null);
  
    // ✅ useReactToPrint with type assertion to avoid TS error
    const handlePrint = useReactToPrint({
      content: () => componentRef.current,
      documentTitle: "Receipt",
      removeAfterPrint: true,
    } as Parameters<typeof useReactToPrint>[0]);
  
    // ✅ Expose `print()` function externally
    useImperativeHandle(ref, () => ({
      print(newPayload: any) {
        if (!newPayload) return;
        setPayload(newPayload);
  
        // Use requestAnimationFrame to ensure re-render before printing
        requestAnimationFrame(() => {
          handlePrint?.();
        });
      },
    }));
  
    return (
      <div style={{ display: "none" }}>
        <PrintComponent ref={componentRef} payload={payload} />
      </div>
    );
  });
