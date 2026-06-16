import { X } from "lucide-react";


interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    clearable?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
    clearable = true,
}) => {
    return (
        <div className={`relative inline-block transition-all duration-500 ease-in-out ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-xl bg-slate-50 h-11 focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 w-full px-4 pr-10 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 shadow-sm transition-all"
            />

            {clearable && value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-DARK-400 hover:text-DARK-600 dark:hover:text-DARK-200 transition-colors"
                >
                    <X size={16} strokeWidth={2} />
                </button>
            )}
        </div>
    );
};

export default SearchInput