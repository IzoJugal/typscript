import React from "react";

interface CommonInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
    ref?: React.Ref<HTMLInputElement>;
}

const CommonInput = ({
    label,
    error,
    className = "",
    ref,
    ...props
}: CommonInputProps) => {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-DARK-700 mb-1">
                    {label}
                </label>
            )}

            <input
                {...props}
                ref={ref}
               className={`w-full -min-w-60 placeholder:text-BRAND-400 text-sm bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl px-4 py-2.5 border-2 border-DARK-300 dark:border-none focus:outline-none focus:ring-0 placeholder-DARK-400 dark:placeholder-DARK-300`}
            />

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default CommonInput;