
import { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface InputProps {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    containerClass?: string;
}

interface ToggleSwitchProps {
    isChecked: boolean;
    onChange: () => void;
    label: string;
    labelText?: string; // Optional label text to display based on toggle state
}

export const ToggleSwitchHospit = ({ isChecked, onChange, label, labelText }: ToggleSwitchProps) => {

    return (
        <div className="flex-1">
            <div className="flex mt-3 gap-4">
                <span className="text-white">{label}</span>
                <label className="relative mt-1 inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={onChange}
                    />
                    <div className={`w-12 h-4 rounded-full shadow-inner ${isChecked ? 'bg-BRAND-300' : 'bg-DARK-600'}`}></div>
                    <div className={`dot absolute w-6 h-6 rounded-full shadow transform transition duration-200 ease-in-out ${isChecked ? 'translate-x-6 bg-BRAND-400' : 'bg-BRAND-400'}`}></div>
                </label>
            </div>
            {labelText && <span className={`text-white`}>{labelText}</span>}
        </div>
    );
};
export const TextInputField = ({ id, label, type = "text", value, onChange, containerClass }: Readonly<InputProps | any>) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    const inputType = type === "password" && !isPasswordVisible ? "password" : "text";
    const isInfoField = id === "info" || id === "slogan";
    return (
        <div className={containerClass}>
            <label htmlFor={id} className="block text-white">{label}</label>
            <div className="relative">
                {isInfoField ? (
                    <textarea
                        id={id}
                        name={id}
                        className="bg-[#2E5783] border-0 w-full p-2 text-white"
                        value={value}
                        onChange={onChange}
                        rows={4}
                    />
                ) : (
                    <input
                        type={inputType}
                        id={id}
                        name={id}
                        className="bg-[#2E5783] border-0 w-full p-2 text-white"
                        value={value}
                        onChange={onChange}
                    />
                )}
                {type === "password" && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        {isPasswordVisible ? <FaEyeSlash className="text-green-500" /> : <FaEye className="text-green-500" />}
                    </button>
                )}
            </div>
        </div>)
}