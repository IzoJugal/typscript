import React from "react";

interface NumberInputProps {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (value: string) => void;

  // Validation options
  allowDecimal?: boolean;
  allowNegative?: boolean;
  maxDecimalPlaces?: number;
  inputRef?: React.Ref<HTMLInputElement>;

  // Native input props
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const NumberInputPOS: React.FC<NumberInputProps> = ({
  id,
  name,
  value,
  onChange,
  allowDecimal = true,
  allowNegative = false,
  maxDecimalPlaces,
  placeholder,
  disabled = false,
  className = "",
  inputRef,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    let regex = allowDecimal ? /[^0-9.-]/g : /[^0-9-]/g;
    input = input.replace(regex, "");

    if (!allowNegative) {
      input = input.replace(/-/g, "");
    } else {
      input = input.replace(/(?!^)-/g, "");
    }

    if (allowDecimal) {
      const parts = input.split(".");

      if (parts.length > 2) {
        input = `${parts[0]}.${parts.slice(1).join("")}`;
      }

      if (
        maxDecimalPlaces !== undefined &&
        parts[1]?.length > maxDecimalPlaces
      ) {
        input = `${parts[0]}.${parts[1].slice(0, maxDecimalPlaces)}`;
      }
    } else {
      input = input.replace(/\./g, "");
    }

    onChange(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(e.key)) return;

    if (/^[0-9]$/.test(e.key)) return;

    if (
      allowDecimal &&
      e.key === "." &&
      !String(value).includes(".")
    ) {
      return;
    }

    if (
      allowNegative &&
      e.key === "-" &&
      String(value).length === 0
    ) {
      return;
    }

    e.preventDefault();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none ${className}`}
    //       className={`
    //   w-full px-3 py-2 text-sm
    //   border
    //   dark:text-DARK-200 dark:border-none
    //   rounded-xl
    //   focus:outline-none focus:ring-1 focus:ring-blue-500
    //   disabled:bg-gray-100 disabled:cursor-not-allowed
    //   ${className}
    // `}
    />
  );
};

export default NumberInputPOS;