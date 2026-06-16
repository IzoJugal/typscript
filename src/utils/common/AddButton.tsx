import { Button, Tooltip } from "flowbite-react";
import { HiPlus, } from "react-icons/hi"

const AddButton = ({ msg }: { msg?: string }) => {
    const button = (
        <Button className="bg-BRAND-500 text-white rounded-xl font-medium shadow-lg hover:!bg-BRAND-600 transition-all duration-300 flex items-center justify-center w-full sm:w-auto border-0 !ring-0 dark:bg-BRAND-500 dark:text-white">
            <HiPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 font-bold" />
            Add
        </Button>
    )

    if (msg) {
        return (
            <Tooltip
                content={msg}
                placement="top"
                animation="duration-300"
                theme={{
                    base: "absolute z-[99] inline-block rounded-lg shadow-lg",
                    content: "relative z-20 px-3 py-2 text-xs font-medium bg-black text-white dark:bg-DARK-700 whitespace-nowrap"
                }}
            >
                {button}
            </Tooltip>
        )
    }

    return button
}

export default AddButton
