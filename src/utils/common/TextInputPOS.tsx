import { Label, } from 'flowbite-react';
import React from 'react';

interface TextInputPOSProps {
  label?: string;
  name: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  style?: React.CSSProperties & { [key: string]: any };
}

const TextInputPOS: React.FC<TextInputPOSProps> = ({
  label,
  name,
  value,
  placeholder = '',
  type = 'text',
  onChange,
  onFocus,
  onBlur,
  required = false,
  disabled = false,
  className = '',
  error,
  style,
}) => {
  return (
    <div className="text-input">
      {label && <Label htmlFor={name} value={label} />}{required && <span className="text-red-600">*</span>}
      <input
        id={name}
        name={name}
        type={type === 'number' ? 'text' : type}
        value={value}
        inputMode={type === 'number' ? 'numeric' : undefined}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        style={style}
        className={`${className} form-control ${error ? 'is-invalid' : ''} w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md dark:placeholder:text-DARK-400`}
      />
      {error && <div className="invalid-feedback text-red-600">{error}</div>}
    </div>
  );
};

export default TextInputPOS;
