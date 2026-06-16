import { Label, Select } from "flowbite-react";

const PageSize = ({ handleLimit, limit = 10 }: {
    handleLimit: (value: number) => void,
    limit?: number ,
}) => {
    return (
        <div className="flex">
            <Label className="self-center mr-2" value="Page Size" />
            <Select value={limit} onChange={(e) => {
                handleLimit(Number(e.target.value));
            }}
                className="select-page-size">
                {[10, 25, 50, 100].map((size: number) => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </Select>
        </div >
    );
};

export default PageSize;
