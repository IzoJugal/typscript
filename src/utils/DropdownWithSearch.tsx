import { useState } from "react";

const OLDDropdownWithSearch = ({ items, title, setIsDropdownOpen, isDropdownOpen, handleFilter }: any) => {
    const [selectedItem, setSelectedItem] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");

    const onchangeHandler = (item: any) => {
        setSelectedItem(item?.name)
        handleFilter(item?._id)
    }
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    return (
        <div className="relative">
            <button onClick={() => { setIsDropdownOpen(!isDropdownOpen) }} id="dropdownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom"
                className="w-60 text-white bg-BRAND-400 hover:bg-BRAND-500 focus:ring-4 focus:outline-none focus:ring-BRAND-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex justify-between mb-1 items-center dark:bg-BRAND-600 dark:hover:bg-BRAND-700 dark:focus:ring-BRAND-800" type="button">
                {selectedItem || `Select ${title}`}
                {!selectedItem && <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 1 4 4 4-4" />
                </svg>}
            </button>

            {isDropdownOpen && <div className="z-10 bg-white rounded-lg shadow w-60 dark:bg-DARK-700 absolute">
                <div className="p-3">
                    <label htmlFor="input-group-search" className="sr-only">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-DARK-500 dark:text-DARK-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { handleSearchChange(e) }}
                            className="block w-full p-2 ps-10 text-sm text-DARK-900 border border-DARK-300 rounded-lg bg-DARK-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-DARK-600 dark:border-DARK-500 dark:placeholder-DARK-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Search"
                        />
                    </div>
                </div>
                <ul className="max-h-60 h-auto px-4 pb-3 overflow-y-auto text-sm text-DARK-700 dark:text-DARK-200">
                    {items?.filter((item: any) => item?.name.toLowerCase().includes(searchTerm))?.map((item: any, index: number) => (
                        <div key={index} onClick={() => { onchangeHandler(item); setIsDropdownOpen(!isDropdownOpen) }}>
                            <li>
                                <div className="flex items-center rounded hover:bg-DARK-100 dark:hover:bg-DARK-600">
                                    <label
                                        htmlFor={`checkbox-item-${index}`}
                                        className="w-full py-2 text-sm font-medium text-DARK-900 rounded dark:text-DARK-300"
                                    >
                                        {item.name}
                                    </label>
                                </div>
                            </li>
                        </div>
                    ))}
                </ul>
            </div>}
        </div>
    )
}

export default OLDDropdownWithSearch
