// FiltersModal.tsx
import React from 'react';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FiltersModal: React.FC<FiltersModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; 

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
          <button onClick={onClose} className="absolute top-4 right-4 text-DARK-500 hover:text-DARK-700">
            &times;
          </button>
          {children}
        </div>
      </div>
    </>
  );
};

export default FiltersModal;
