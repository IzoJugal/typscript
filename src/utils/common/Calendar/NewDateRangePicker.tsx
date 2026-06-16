import { Datepicker } from "flowbite-react";
import "./DatePicker.css";

const NewDateRange = () => {
    const customTheme = {
        popup: {
            root: {
                inner: "inline-block rounded-lg bg-white p-4 shadow-lg dark:bg-DARK-800 border border-BRAND-500"
            },
        },
        views: {
            days: {
                items: {
                    item: {
                        selected: "bg-[#ea580c] text-white hover:bg-[#ea580c]",
                        hover: "bg-[#ea580c] text-white",
                    },
                },
            },
        },
        footer: {
            base: "mt-2 flex space-x-2",
            button: {
                today: "bg-[#ea580c] text-white hover:bg-[#d95f0f] dark:bg-[#ea580c] dark:hover:bg-[#d95f0f] focus:outline-none",
            },
        },
    };

    return (
        <div className="pick-date">
            <Datepicker
                multiple={true}
                theme={customTheme}
            />
        </div>
    );
};

export default NewDateRange;
