import React, { Fragment, useRef, useState } from "react";
import {
  actionButtons,
} from "../../utils/common/constant";
import { handleActionButton } from "../../utils/common/PosBottomActions";
import { usePOS } from "../../context/POSProvider";
import { useAuth } from "../../context/AuthProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import BottomMenuModal from "./Modals/BottomMenuModal";
import { toastAlert } from "../../utils/utility";


const BottomPanel = () => {
  const { userData } = useAuth();
  const { rawPayload, posLocalData, selectedRestaurant } = usePOS();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => { },
    onCancel: () => { }
  });
  const [buttonResponse, setButtonResponse] = useState<any>();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);
  const paramsData = {
    rawPayload,
    userData,
    posLocalData,
    selectedRestaurant
  }

  const handleClickButton = (button: any) => {
    if (!['closeOut'].includes(button.action)) { 
      if (!rawPayload?._id) {
        toastAlert('error', { message: "Please select a valid order to proceed."});
        return;
      }
    }
    
    if (button?.confirm) {
      setConfirmModal({
        isOpen: true,
        message: button?.message,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          const response = handleActionButton(button, paramsData);
          setButtonResponse(response);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      const response = handleActionButton(button, paramsData);
      setButtonResponse(response);
    }
  };

  return (
    <Fragment>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg p-4 z-50 rounded-lg md:bottom-8 md:left-8 md:right-8">
        <div
          ref={scrollRef}
          className={`flex gap-2 overflow-x-auto scroll-smooth cursor-${isDragging ? "grabbing" : "grab"} select-none transition-all duration-300 scrollbar-hide`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          role="region"
          aria-label="Action buttons toolbar"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && scrollRef.current?.focus()}
        >
          {actionButtons.map((button: any, index: number) => (
            <button
              key={index}
              className="min-w-[80px] max-w-[80px] xl:min-w-[110px] xl:max-w-[110px] xl:min-h-[75px] xl:py-3 xl:px-3 rounded-xl bg-gradient-to-b from-DARK-200 to-DARK-200 text-DARK-800 dark:from-DARK-800 dark:to-DARK-800 dark:text-white font-semibold text-sm hover:from-BRAND-500 hover:to-BRAND-600 hover:text-white dark:hover:from-BRAND-500 dark:hover:to-BRAND-600 hover:scale-105- hover:opacity-90"
              onClick={() => handleClickButton(button)}
              aria-label={`Action button: ${button.title}`}
            >
              {button.title}
            </button>
          ))}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
      <BottomMenuModal
        buttonResponse={buttonResponse}
        setButtonResponse={setButtonResponse}
      />
    </Fragment>
  );
};

export default BottomPanel;