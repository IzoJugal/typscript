import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoCalendarOutline } from "react-icons/io5";
import { registerLocale } from "react-datepicker";
import { enGB } from "date-fns/locale/en-GB";
import { FaAngleDown } from "react-icons/fa";
import { formatDate } from "../utility";
import { useConfigs } from "../../context/SiteConfigsProvider";

// Register custom locale with first day of the week set to Sunday
registerLocale("custom-en", {
    ...enGB,
    options: {
        ...enGB.options,
        weekStartsOn: 0, // Sunday
    }
});

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface DateRangePickerProps {
    value?: DateRange;
    onChange?: (value: DateRange) => void;
    disabledDates?: Date[];
    minDate?: Date;
    maxDate?: Date;
    className?: string;
}

const NewDateRangePicker: React.FC<DateRangePickerProps> = ({
    value = { startDate: null, endDate: null },
    onChange,
    disabledDates = [],
    minDate,
    maxDate = new Date(),
    className = "",
}) => {
      const { configData } = useConfigs();
    const [startDate, setStartDate] = useState<Date | null>(value.startDate);
    const [endDate, setEndDate] = useState<Date | null>(value.endDate);
    const [isOpen, setIsOpen] = useState(false);

    // Update startDate and endDate whenever the `value` prop changes
    useEffect(() => {
        setStartDate(value.startDate ?? null);
        setEndDate(value.endDate ?? null);
    }, [value]);

    // Handle date range selection
    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;

        if (start) {
            const now = new Date();
            start.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        }
        if (end) {
            const now = new Date();
            end.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        }

        setStartDate(start);
        setEndDate(end);

        // Call onChange callback if provided
        onChange?.({ startDate: start, endDate: end });
    };

  return (
  <div className={`${className} relative min-w-60 sm:min-w-56`}>
    <label
      htmlFor="DatePicker"
      onClick={() => setIsOpen(true)}
      className="px-4 h-11 border border-BRAND-200 dark:border-DARK-600 rounded-xl bg-slate-50 dark:bg-DARK-700 dark:text-DARK-200 text-DARK-600 cursor-pointer w-full flex justify-between items-center hover:border-BRAND-400 dark:hover:bg-DARK-600 transition-all duration-200 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm font-medium truncate">
        <IoCalendarOutline className="text-BRAND-500 text-lg" />

        <span>
          {startDate
            ? formatDate(startDate,configData?.dateFormat)
            : "Start Date"}{" "}
          -{" "}
          {endDate
            ? formatDate(endDate,configData?.dateFormat)
            : "End Date"}
        </span>
      </div>

      <FaAngleDown
        className={`transition-transform duration-200 text-DARK-400 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </label>

    <div className="absolute z-50 mt-2">
      <DatePicker
        id="DatePicker"
        selected={startDate}
        onChange={(dates: [Date | null, Date | null]) => {
          handleDateChange(dates);

          const [start, end] = dates;

          // close after range selected
          if (start && end) {
            setIsOpen(false);
          }
        }}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        open={isOpen}
        onClickOutside={() => setIsOpen(false)}
        shouldCloseOnSelect={false}
        minDate={minDate}
        maxDate={maxDate}
        excludeDates={disabledDates}
        popperClassName="date-range-popper"
        className="cursor-pointer w-full items-center rounded date-picker-input dark:bg-DARK-700 dark:text-white dark:border-DARK-600"
        locale="custom-en"
        formatWeekDay={(day) => day.substring(0, 3)}
      />
    </div>
  </div>
);
};

export default NewDateRangePicker;
