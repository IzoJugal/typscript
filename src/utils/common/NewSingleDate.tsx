import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { IoCalendarOutline } from "react-icons/io5";
import { FaAngleDown } from "react-icons/fa6";
import "react-datepicker/dist/react-datepicker.css";
import './NewSingleDate.css';
import { registerLocale } from "react-datepicker";
import { enGB } from "date-fns/locale/en-GB";
import { formatDate } from "../utility";
import { useConfigs } from "../../context/SiteConfigsProvider";

registerLocale("custom-en", {
    ...enGB,
    options: {
        ...enGB.options,
        weekStartsOn: 0, // Ensure Sunday is the first day of the week
    }
});

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface SingleDatePickerProps {
    value?: DateRange | null;
    onChange?: (value: DateRange | null) => void;
    className?: string;
    allowPastDates?: boolean;
    label?: string;
}

const NewSingleDate: React.FC<SingleDatePickerProps> = ({
    value = { startDate: null, endDate: null },
    onChange,
    className,
    allowPastDates = false,
    label,
}) => {
    const [startDate, setStartDate] = useState<Date | null>(value?.startDate || null);
    const [isOpen, setIsOpen] = useState(false);
      const { configData } = useConfigs();

    useEffect(() => {
        setStartDate(value?.startDate || null);
    }, [value]);

    const handleDateChange = (date: any) => {
        const start = date;

        if (start) {
            const now = new Date();
            start.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        }

        setStartDate(start);

        if (onChange) {
            onChange({ startDate: start, endDate: null });
        }

        setIsOpen(false);
    };

    return (
        <div className="relative w-auto">
            <label
                htmlFor="DatePicker"
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 h-11 border border-BRAND-200 dark:border-DARK-600 rounded-xl bg-white dark:bg-DARK-700 dark:text-DARK-200 text-DARK-600 cursor-pointer flex justify-between items-center transition-all duration-200 hover:border-BRAND-400 dark:hover:bg-DARK-600 shadow-sm"
            >
                <div className="flex items-center gap-2 text-sm  font-medium truncate mr-2">
                    <IoCalendarOutline className="text-BRAND-500 text-lg" />
                    <span>
                        {startDate ? formatDate(startDate,configData?.dateFormat) : `Select ${label}`
}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-0 bg-transparent border-0 cursor-pointer flex items-center"
                >
                    <FaAngleDown className={`transition-transform duration-200 text-DARK-400 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </label>

            {isOpen && (
                <div className="absolute z-10 top-full mt-1 border border-BRAND-100 dark:border-DARK-600 rounded-xl shadow-xl overflow-hidden bg-white dark:bg-DARK-700">
                    <DatePicker
                        selected={startDate}
                        onChange={(date: any) => { handleDateChange(date) }}
                        startDate={startDate}
                        inline
                        className={className}
                        placeholderText="DD/MM/YYYY"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        locale="custom-en"
                        formatWeekDay={(day) => day.substring(0, 3)}
                        minDate={allowPastDates ? undefined : new Date()}
                    />
                </div>
            )}
        </div>
    );
};

export default NewSingleDate;
