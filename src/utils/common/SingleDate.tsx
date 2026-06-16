import Datepicker from "react-tailwindcss-datepicker";

interface DateRange {
    startDate: Date | null;
    endDate: Date|null;
}

interface SingleDatePickerProps {
    value?: DateRange | null;
    onChange?: (value: DateRange | null) => void;
    useRange?: boolean;
    placeholder?: string;
    asSingle?: boolean;
}
const SingleDate: React.FC<SingleDatePickerProps> = ({
    value =  { startDate: null, endDate: null },
    onChange
}) => {
    // const [selectedDate, setSelectedDate] = useState<Date | null>(value);
    const handleDateChange = (newValue: any) => {
        // setSelectedDate(newValue);
        // if (onChange) onChange(newValue);
        if (onChange) {
            onChange(newValue); 
        }
    };
  return (
    <div>
      <Datepicker 
            primaryColor={"orange"}
            useRange={false}
            asSingle={true}
            value={value} 
            onChange={handleDateChange}
            inputClassName={`w-full p-2 border border-slate-300 focus:!border-BRAND-500 rounded-lg `}
            // toggleClassName="absolute bg-BRAND-400 rounded-r-lg text-white right-0 h-full px-3 text-DARK-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        /> 
    </div>
  )
}

export default SingleDate;
