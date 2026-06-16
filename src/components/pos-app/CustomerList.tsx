import { useState, useMemo, Fragment } from "react";
import { Button, Modal, TextInput, Tooltip } from "flowbite-react";
import { capitalized } from "../../utils/utility";
import { usePOS } from "../../context/POSProvider";
import CustomerFormModal from "../customers/CustomerFormModal";
import { SiTicktick } from "react-icons/si";
import { HiSearch } from "react-icons/hi";
import { IoHome } from "react-icons/io5";
import { FaInfoCircle } from "react-icons/fa";
import CustomerView from "../customers/CustomerView";
import clsx from "clsx";

interface CustomerListProps {
    isCustomerOpen: boolean;
    setIsCustomerOpen: (v: boolean) => void;
    customerList: any[];
}

// --- Customer Card ---
const CustomerCard = ({
    customer,
    isSelected,
    onSelect,
    onView,
}: {
    customer: any;
    isSelected: boolean;
    onSelect: () => void;
    onView: () => void;
}) => {
    return (
        <div
            onClick={onSelect}
            className={clsx(
                "relative rounded-xl border shadow-sm transition-all duration-200 cursor-pointer group hover:shadow-lg hover:scale-[1.02] overflow-hidden",
                isSelected
                    ? "border-2 border-BRAND-400 bg-BRAND-50 dark:border-BRAND-500 dark:bg-BRAND-900/50"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-DARK-800"
            )}
        >
            {/* Customer Image */}
            <div className="relative w-full h-40">
                {/* <img
                    src={`${apiUrl}/${customer.customerProfile}`}
                    alt={`${customer.firstName}'s avatar`}
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/default_customer.jpg";
                    }}
                    className="w-full h-full object-cover rounded-t-xl"
                /> */}

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-DARK-950 via-black/70 to-transparent px-3 pt-8 pb-3 flex justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white truncate drop-shadow-md">
                            {capitalized(customer.firstName)}
                        </h3>
                        <p className="text-xs text-gray-200 truncate drop-shadow-sm">
                            {customer.email}
                        </p>
                        <p className="text-xs text-gray-200 drop-shadow-sm mb-2">
                            {customer.phoneNumber}
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 flex-wrap justify-center my-auto">
                        {customer?.hasHouseAccount && (
                            <Tooltip content="House Account">
                                <span className="flex items-center px-2 py-2 rounded-full bg-BRAND-100 text-BRAND-700 dark:bg-red-500 dark:text-white">
                                    <IoHome className="h-4 w-4" />
                                </span>
                            </Tooltip>
                        )}
                        {customer?.taxExempt && (
                            <Tooltip content="Tax Exempt">
                                <span className="flex items-center px-2 py-2 rounded-full bg-green-100 text-green-700 dark:bg-green-600 dark:text-white">
                                    <SiTicktick className="h-4 w-4" />
                                </span>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Info Icon */}
                <div className="absolute top-2 right-2">
                    <Tooltip content="View Customer" placement="top">
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onView();
                            }}
                            className="text-DARK-900/80 hover:text-DARK-900 drop-shadow-lg cursor-pointer"
                        >
                            <FaInfoCircle className="h-5 w-5" />
                        </span>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

// --- Empty State ---
const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-12">
        <img
            src="/images/empty_state.svg"
            alt="No results"
            className="w-28 h-28 opacity-70 mb-4"
        />
        <p className="text-gray-500 dark:text-gray-400 text-lg">
            No customers match your search.
        </p>
    </div>
);

// --- Main Component ---
const CustomerList = ({
    isCustomerOpen,
    setIsCustomerOpen,
    customerList,
}: CustomerListProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [openCustomerForm, setOpenCustomerForm] = useState(false);
    const { setRawPayload, selectedCustomer, setSelectedCustomer } = usePOS();
    const [openCustomerModal, setOpenCustomerModal] = useState(false);
    const [selectCustomerId, setSelectCustomerId] = useState("");

    // Filtered customer list
    const filteredCustomers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return customerList.filter((c) =>
            [c.firstName, c.email, c.phoneNumber].some((field) =>
                field?.toLowerCase().includes(query)
            )
        );
    }, [searchQuery, customerList]);

    const handleCustomer = (customer: any, isViewDetails: boolean) => {
        setSelectedCustomer(customer);
        if (isViewDetails) {
            setSelectCustomerId(customer._id);
            setOpenCustomerModal(true);
        } else {
            setRawPayload((prev: any) => ({
                ...prev,
                customer: customer._id,
                isTaxExemption: customer?.taxExempt,
            }));
            setIsCustomerOpen(false);
        }
    };

    return (
        <Fragment>
            <Modal
                show={isCustomerOpen}
                onClose={() => setIsCustomerOpen(false)}
                size="7xl"
                className="backdrop-blur bg-DARK-500/30 dark:bg-DARK-950/50 transition-all duration-300"
            >
                {/* Header */}
                <Modal.Header className="bg-white dark:bg-DARK-800 py-5 px-6 rounded-t-xl border-b border-gray-200 dark:border-gray-700 flex justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Select a Customer
                    </span>
                </Modal.Header>

                <Modal.Body className="bg-gray-50 dark:bg-DARK-900 rounded-b-xl px-6 py-8 overflow-y-auto max-h-[80vh]">
                    {/* Top controls */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                        {/* Search */}
                        <div className="relative w-full md:w-2/3">
                            <HiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                            <TextInput
                                type="text"
                                placeholder="Search by name, email, or phone number"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 rounded-lg shadow-sm border-gray-300 dark:border-gray-600 dark:bg-DARK-800 dark:text-gray-100 focus:ring-BRAND-400 focus:border-BRAND-400"
                            />
                        </div>

                        {/* Add Customer Button */}
                        <Button
                            onClick={() => setOpenCustomerForm(true)}
                            className="w-full md:w-auto bg-gradient-to-r from-BRAND-400 to-BRAND-600 text-white font-semibold rounded-lg shadow-md hover:scale-105 active:scale-95 transition"
                        >
                            + Add Customer
                        </Button>
                    </div>

                    {/* Customer Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <CustomerCard
                                    key={customer._id}
                                    customer={customer}
                                    isSelected={selectedCustomer?._id === customer._id}
                                    onSelect={() => handleCustomer(customer, false)}
                                    onView={() => handleCustomer(customer, true)}
                                />
                            ))
                        ) : (
                            <EmptyState />
                        )}
                    </div>

                    {/* Add Customer Modal */}
                    <CustomerFormModal
                        openCustomerForm={openCustomerForm}
                        setOpenCustomerForm={setOpenCustomerForm}
                    />
                </Modal.Body>
            </Modal>

            {/* Customer Details View */}
            <CustomerView
                openCustomerModal={openCustomerModal}
                setOpenCustomerModal={setOpenCustomerModal}
                selectCustomerId={selectCustomerId}
                selectCustomer={selectedCustomer}
                type="order"
            />
        </Fragment>
    );
};

export default CustomerList;
