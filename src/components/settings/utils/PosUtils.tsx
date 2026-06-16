
import { FaAngleDown } from "react-icons/fa";
import { GeneralToggle } from "./functions";


export const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-xl font-semibold text-[#46a92a] mb-4">{title}</div>
);

// ToggleList.tsx
interface ToggleListProps<T> {
    settings: T;
    handleToggle: (key: keyof T) => void;
    formatLabel: (key: string) => string;
}

export const ToggleListPose = <T extends object>({ settings, handleToggle, formatLabel }: ToggleListProps<T> | any) => (
    <div className="space-y-4">
        {Object?.entries(settings)?.map(([key, value]) => (
            <GeneralToggle
                key={key}
                label={formatLabel(key)}
                checked={value as boolean}
                onChange={() => handleToggle(key as keyof T)}
            />
        ))}
    </div>
);

// ServiceDropdown.tsx
interface ServiceDropdownProps {
    selectedService: string;
    options: string[];
    isOpen: boolean;
    onSelect: (value: string) => void;
    onClose: () => void;
    onOpen: () => void;
}

export const ServiceDropdown = ({
    selectedService,
    options,
    isOpen,
    onSelect,
    onClose,
    onOpen,
}: ServiceDropdownProps) => (
    <div className="flex flex-col gap-4 mt-4 text-black">
        <div className="relative bg-[#2E5783] flex text-white cursor-pointer">
            <button className="rounded p-2 w-full text-left border-0" onClick={onOpen}>
                {options.includes(selectedService) ? selectedService : 'Select an option'}
            </button>
            <FaAngleDown className="text-3xl" />
        </div>
        {isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Select a Value</h2>
                    <div className="flex flex-col gap-3">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => onSelect(option)}
                                value={option}
                                className="border border-DARK-300 rounded-lg p-3 w-full text-left hover:bg-DARK-200 transition duration-200 ease-in-out"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-red-500 text-white p-3 rounded-lg hover:bg-ERROR_HOVER transition duration-200 ease-in-out"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}
    </div>
);


interface Option {
    value: string;
    label: string;
}

interface RadioGroupProps {
    options: Option[];
    name: string;
    selectedValue: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RadioGroup = ({ options, name, selectedValue, onChange }: RadioGroupProps) => (
    <div className="flex flex-col px-2 mb-4">
        {options.map(option => (
            <label key={option.value} className="flex items-center w-40 py-2 cursor-pointer">
                <input
                    type="radio"
                    name={name}
                    value={option.value}
                    className="mr-2 cursor-pointer"
                    checked={selectedValue === option.value}
                    onChange={onChange}
                />
                <span className="text-sm text-white">{option.label}</span>
            </label>
        ))}
    </div>
);

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: () => void;
}

export const ToggleSwitch = ({ label, checked, onChange }: ToggleSwitchProps) => (
    <label className="flex items-center space-x-3">
        <span className="text-white">{label}</span>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="cursor-pointer"
        />
    </label>
);


interface DropdownButtonProps {
    label: string;
    selectedValue?: string;
    onClick: () => void;
}

export const DropdownButton = ({ label, selectedValue, onClick }: DropdownButtonProps) => (
    <div className="relative bg-[#2E5783] flex cursor-pointer">
        <button
            className="rounded p-2 w-full text-left border-0"
            onClick={onClick}
        >
            {selectedValue || label}
        </button>
        <div>
            <FaAngleDown className="text-3xl" />
        </div>
    </div>
);


interface ModalProps {
    isOpen: boolean;
    title: string;
    options: number[];
    onOptionSelect: (value: number) => void;
    onClose: () => void;
}

export const Modal = ({ isOpen, title, options, onOptionSelect, onClose }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <div className="flex flex-col gap-3">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => onOptionSelect(option)}
                            className="border border-DARK-300 rounded-lg p-3 w-full text-left hover:bg-DARK-200 transition duration-200 ease-in-out"
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-red-500 text-white p-3 rounded-lg hover:bg-ERROR_HOVER transition duration-200 ease-in-out"
                >
                    Close
                </button>
            </div>
        </div>
    );
};


interface ModalProps {
    isOpen: boolean;
    title: string;
    options: number[];
    onOptionSelect: (value: number) => void;
    onClose: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ModifierModal = ({ isOpen, title, options, onOptionSelect, onClose }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <div className="flex flex-col gap-3">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => onOptionSelect(option)}
                            className="border border-DARK-300 rounded-lg p-3 w-full text-left hover:bg-DARK-200 transition duration-200 ease-in-out"
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-red-500 text-white p-3 rounded-lg hover:bg-ERROR_HOVER transition duration-200 ease-in-out"
                >
                    Close
                </button>
            </div>
        </div>
    )
}









