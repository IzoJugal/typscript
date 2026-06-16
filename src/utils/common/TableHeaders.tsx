import { Table } from "flowbite-react";
// import { FaSortUp, FaSortDown } from "react-icons/fa";
import { BiSortAlt2 } from "react-icons/bi";


interface TableHeadersProps {
    columnNames: string[];
    formData?: Record<string, any>;
    setFormData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    sortColumn?: string[];
}

const TableHeaders = ({ columnNames, setFormData, sortColumn }: TableHeadersProps) => {
    const handleSort = (column: string) => {
        if (!setFormData) return;

        setFormData((prev) => {
            const isSameColumn = prev.sortBy === column.toLowerCase();
            const newOrder = isSameColumn && prev.order === 'asc' ? 'desc' : 'asc';
            return {
                ...prev,
                sortBy: column.toLowerCase(),
                order: newOrder,
            };
        });
    };

    return (
        <Table.Head>
            {columnNames.map((header: string, index: number) => {
                // const isActive = formData.sortBy === header.toLowerCase();
                // const isAsc = formData.order === 'asc';
                const isSort = sortColumn?.includes(header) || false;
                return (
                    <Table.HeadCell
                        key={index}
                        onClick={isSort ? () => handleSort(header) : undefined}
                        className={`${isSort ? 'cursor-pointer' : null} bg-BRAND-100 dark:bg-slate-700 dark:text-white select-none`}
                    >
                        <div className="flex items-center gap-1">
                            <span>{header}</span>
                            {isSort && (
                                <BiSortAlt2 className="text-lg" />
                            )}
                            {/* {isActive && (
                                <>
                                    {isAsc ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />}
                                </>
                            )} */}
                        </div>
                    </Table.HeadCell>
                );
            })}
        </Table.Head>
    );
};

export default TableHeaders;
