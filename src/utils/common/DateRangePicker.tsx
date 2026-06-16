import Datepicker from 'react-tailwindcss-datepicker';

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface DateRangePickerProps {
    value?: DateRange;
    onChange?: (value: DateRange) => void;
    startPlaceholder?: string;
    endPlaceholder?: string;
    disabledDates?: Date[] | any;
    minDate?: Date | any;
    maxDate?: Date;
    className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value = { startDate: null, endDate: null },
    onChange,
    disabledDates = [],
    minDate,
    className = ''
}) => {
    // const [dateRange, setDateRange] = useState<DateRange>(value);

    const handleDateChange = (newValue: any) => {
        // setDateRange(newValue);
        if (onChange) onChange(newValue);
    };

    const MAX_DATE = new Date();
    MAX_DATE.setDate(MAX_DATE.getDate());

    return (
        <Datepicker
            displayFormat="MM/DD/YYYY"
            value={value}
            primaryColor={"orange"}
            placeholder="Filter by date"
            onChange={handleDateChange}
            startFrom={minDate ? minDate.toISOString().split('T')[0] : undefined}
            disabledDates={disabledDates}
            showShortcuts={true}
            separator="to"
            maxDate={MAX_DATE}
            inputClassName={`w-full p-2 border border-slate-300 focus:!border-BRAND-500 rounded-lg ${className}`}
            toggleClassName="absolute bg-BRAND-400 rounded-r-lg text-white right-0 h-full px-3 text-DARK-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
    );
};

export default DateRangePicker;
