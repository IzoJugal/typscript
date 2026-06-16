// components/common/AddActionButton.tsx

import { Button, Tooltip } from "flowbite-react";
import { HiPlus } from "react-icons/hi";

interface Props {
  text: string;
}

const AddActionButton = ({
  text
}: Props) => {
  return (
    <Tooltip
      content={
        <span className="whitespace-nowrap">
          {text}
        </span>
      }
      placement="top"
      trigger="hover"
    >
      <div className="inline-block">
        <Button className="flex gap-1 justify-center items-center bg-BRAND-500 hover:!bg-BRAND-600 w-20 !ring-0 dark:bg-BRAND-500  dark:text-white">
          <HiPlus className="font-bold text-xl" />
          Add
        </Button>
      </div>
    </Tooltip>
  );
};

export default AddActionButton;