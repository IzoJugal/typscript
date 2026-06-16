import React from "react";

interface CommonSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string | number; label: string }[];
  loading?: boolean;
}

const CommonSelect: React.FC<CommonSelectProps> = ({
  options = [],
  value,
  onChange,
  loading = false,
  className = "",
  children,
  ...rest
}) => {
  return (
    <div className="relative w-full group">
      <select
        value={value}
        onChange={onChange}
        disabled={loading || rest.disabled}
        className={`min-w-60 text-sm bg-slate-50 text-DARK-700 border border-DARK-300 dark:border-DARK-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-BRAND-500 w-full pl-3 pr-10 py-2.5 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none appearance-none cursor-pointer disabled:cursor-not-allowed select-none ${className}`}
        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }} // Safetynet style bypass for native UI components
        {...rest}
      >
        {loading ? (
          <option disabled value="">
            Loading...
          </option>
        ) : children ? (
          children
        ) : (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default CommonSelect;