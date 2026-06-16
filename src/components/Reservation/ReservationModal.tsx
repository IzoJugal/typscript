import { Modal, Button, Label, } from "flowbite-react";
import { useEffect, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { capitalized, convertTimeSlotTo12HourFormat, formatDate } from "../../utils/utility";
import { PlusIcon } from "lucide-react";
import FormLoader from "../../utils/common/FormLoader";
import { toast } from "react-toastify";
import PackageModal from "./PackageModal";
import { SUPER_ADMIN } from "../../utils/common/constant";
import { DropdownWithSearch } from "../../utils/common/Filters";
import PaymentModal from "./PaymentModal";
import { useConfigs } from "../../context/SiteConfigsProvider";

const initialFormData = {
  customer: "",
  guests: "",
  date: "",
  tableIds: [] as string[],
  timeSlot: "",
  status: "pending",
  type: "table",
  room: "",
  company: "",
  restaurant: "",
  notes: "",
  package: "",
  deposit: 0,
  isPay: false
}

interface ErrorState {
  customer?: string;
  guests?: string;
  date?: string;
  tableIds?: string;
  timeSlot?: string;
  status?: string;
  type?: string;
  room?: string;
  company?: string;
  restaurant?: string;
  notes?: string;
  package?: string;
  deposit?: string;
}

const ReservationModal = ({ openModal, setOpenModal, selectedObject, onSubmit, rooms, setSelectedRoom, setSelectedObject, loginRole, selectedCompany, selectedRestaurant, customers }: any) => {

    const { configData } = useConfigs();
  const [formData, setFormData] = useState<any>(initialFormData);
  const [packages, setPackages] = useState<Array<any>>([]);
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [onNext, setOnNext] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [errors, setErrors] = useState<any>({});
  const [openPackageModal, setOpenPackageModal] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [ispackageOpen, setIsPackageOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [displayCustomers, setDisplayCustomers] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>({});

  const reservationTypeData = [{ _id: "table", name: "Table" }, { _id: "venue", name: "Venue" }, { _id: "private", name: "Private" }, { _id: "outdoor", name: "Outdoor" }];

  useEffect(() => {
    setIsFormLoading(true);
    setFormData({ ...formData, room: selectedObject?.room?._id, date: selectedObject?.date, timeSlot: selectedObject?.timeSlot });
    if (loginRole === SUPER_ADMIN || selectedRestaurant) {
      setFormData((prev: any) => ({
        ...prev,
        company: selectedCompany?._id,
        restaurant: selectedRestaurant?._id
      }))
    }
    packagesAPI();
    if (customers.length > 0) {
      setDisplayCustomers(
        customers.map((cust: any) => ({
          _id: cust._id,
          name: `${cust?.firstName} ${cust?.lastName ? cust?.lastName : ''}`
        }))
      );
    }
  }, [selectedObject, selectedRestaurant, selectedCompany]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name as keyof ErrorState]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };


  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    if (isValid()) {
      const tablePayload = {
        date: formData.date,
        timeSlot: formData.timeSlot,
        room: formData.room,
        company: selectedCompany?._id || formData.company,
        restaurant: selectedRestaurant?._id || formData.restaurant,
      };
      await availableTablesAPI(tablePayload);
      setTimeout(() => {
        setBtnLoading(false);
        setOnNext(true);
      }, 500);
    }
    setTimeout(() => {
      setBtnLoading(false);
    }, 500);
  };


  const packagesAPI = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedCompany?._id) params.company = selectedCompany._id;
      if (selectedRestaurant?._id) params.restaurant = selectedRestaurant._id;
      const response = await apiClient.get('/packages', { params });
      if (response.data.success) {
        setPackages(response.data.packages);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        setIsFormLoading(false);
      }, 500);
    }
  };

  const isValid = () => {
    let isValid = true;
    const errors: any = {};
    /* if (!formData.customerName) {
      isValid = false;
      errors.customerName = "Customer Name is required";
    }
    if (!formData.customerPhone) {
      isValid = false;
      errors.customerPhone = "Customer Phone is required";
    } */
    if (!formData.customer) {
      isValid = false;
      errors.customer = "Customer is required";
    }

    if (!formData.guests || Number(formData.guests) <= 0) {
      isValid = false;
      errors.guests = "Guests must be greater than 0";
    }

    if (!formData.type) {
      isValid = false;
      errors.type = "Reservation Type is required";
    }

    setErrors(errors);
    return isValid;
  }

  const availableTablesAPI = async (formData: any) => {
    try {
      setIsFormLoading(true);
      const response = await apiClient.post('/reservations/available-tables', formData);
      if (response.data.success) {
        if (response.data.tables.length === 0) {
          setErrors({ tableIds: "No tables available in the selected Room" });
          toast.error("No tables available in the selected Room");
        } else {
          setErrors({ tableIds: "" });
          setAvailableTables(response.data.tables);
        }
      }
    } catch (error) {
      console.log(error);
      setErrors({ tableIds: "No tables available for the selected date and time" });
      toast.error("No tables available for the selected date and time");
    } finally {
      setTimeout(() => {
        setBtnLoading(false);
        setIsFormLoading(false);
      }, 500);
    }
  };

  const handleSubmit = async (paymentData: any) => {
    // e.preventDefault();
    setBtnLoading(true);
    try {

      if (!checkValidation()) {
        setBtnLoading(false);
        return;
      }
      let payload = formData;

      if (paymentData) {
        const updatedPayload = { ...paymentData, isPay: true };
        setFormData(updatedPayload);
        payload = updatedPayload;
      }
      await onSubmit(payload);
      setTimeout(() => {
        handleCancel();
      }, 500);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setTimeout(() => {
        setBtnLoading(false);
      }, 500);
      setOpenPaymentModal(false);
    }
  };

  const handleCancel = () => {
    setOpenModal(false);
    setFormData(initialFormData);
    setAvailableTables([]);
    setOnNext(false);
    setErrors({});
    setPackages([]);
    setOpenPackageModal(false);
    setBtnLoading(false);
  };

  const handlePackageSubmit = async (packageData: any) => {
    setPackages((prevPackages: any) => {
      const existingIndex = prevPackages.findIndex((pkg: any) => pkg._id === packageData._id);
      if (existingIndex !== -1) {
        return prevPackages.map((pkg: any) => (pkg._id === packageData._id ? packageData : pkg));
      } else {
        return [packageData, ...prevPackages];
      }
    });
  };

  const checkTablesInOtherRooms = (e: any) => {
    const room = rooms.find((room: any) => room._id === e.target.value);
    const NewFormData = { ...formData, room: e.target.value, tableIds: [] };
    setFormData(NewFormData);
    setSelectedRoom(e.target.value);
    setSelectedObject({ ...selectedObject, room: room });
    setAvailableTables([]);
    availableTablesAPI({
      ...NewFormData,
      company: selectedCompany?._id || formData.company,
      restaurant: selectedRestaurant?._id || formData.restaurant,
    });
  };

  const handleType = (value: string) => {
    setFormData((prev: any) => ({ ...prev, type: value }));
    if (errors.type) {
      setErrors((prev: any) => ({ ...prev, type: "" }));
    }
  };

  const handleCustomer = (value: string) => {
    setFormData((prev: any) => ({ ...prev, customer: value }));
    if (errors.customer) {
      setErrors((prev: any) => ({ ...prev, customer: "" }));
    }
  };

  const handlePackage = (value: string) => {
    const singlePackage = packages.find((x: any) => value === x?._id);
    setSelectedPackage(singlePackage);
    setFormData((prev: any) => ({ ...prev, package: value, amount: singlePackage?.price }));
    if (errors.package) {
      setErrors((prev: any) => ({ ...prev, package: "" }));
    }
  };

  const checkValidation = (): boolean => {
    const totalSeats = availableTables.reduce((acc: number, table: any) =>
      formData.tableIds.includes(table._id) ? acc + table.capacity : acc, 0
    );
    if (parseInt(formData.guests) > totalSeats) {
      setErrors((prev: any) => ({ ...prev, tableIds: "Selected tables do not have enough seats for the number of guests" }));
      return false;
    }
    return true;
  };

  return (
    <>
      <Modal show={openModal} onClose={handleCancel} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header className="bg-BRAND-100 dark:bg-DARK-800 text-white">
          Book reservation in the <span className="text-emerald-600 font-bold">{selectedObject?.room?.name}</span> room
        </Modal.Header>
        <Modal.Body className="pt-1 dark:bg-DARK-800">
          <div className="flex justify-between items-center mb-4 text-DARK-700 dark:text-DARK-300 font-semibold text-md">
            <span className="text-sm">Available Tables in <span className="text-emerald-500">{selectedObject?.room?.name}</span> room
              {formData.guests &&
                <span className="text-sm mx-1">for <span className="text-emerald-500">{formData?.guests}</span> members </span>
              }
            </span>
            <div className="flex flex-col">
              <span className="text-sm">Date: {formatDate(formData.date,configData?.dateFormat)} </span>
              <span className="text-sm">TimeSlot: {convertTimeSlotTo12HourFormat(formData.timeSlot)} </span>
            </div>
          </div>
          {onNext ? (
            <>
              {isFormLoading ? <FormLoader count={1} /> :
                <div className="flex flex-col gap-6">
                  {/* Room Selection */}
                  <div className="grid items-center w-1/2">
                    <label htmlFor="room" className="text-sm font-medium text-DARK-900 dark:text-DARK-100">
                      Change Room:
                    </label>
                    <select
                      onChange={(e) => checkTablesInOtherRooms(e)}
                      className="min-w-0 py-2 focus:ring-2 focus:ring-BRAND-500 w-full px-3  dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                      value={formData?.room}
                    >
                      {rooms?.map((room: any) => (
                        <option key={room?._id} value={room?._id}>
                          {room?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableTables.length > 0 ? availableTables.map((table: any) => {
                      const selected = formData.tableIds.includes(table._id);
                      return (
                        <div
                          key={table._id}
                          className={`relative p-4 border cursor-pointer rounded-lg shadow-md hover:shadow-lg 
                            ${selected
                              ? "bg-BRAND-100 border-BRAND-100"
                              : "bg-white dark:bg-DARK-500 dark:border-none"}`}
                          onClick={() => {
                            const updatedTableIds = selected
                              ? formData.tableIds.filter((id: string) => id !== table._id)
                              : [...formData.tableIds, table._id];
                            setFormData({ ...formData, tableIds: updatedTableIds });
                          }}
                        >
                          <label className="flex items-center space-x-3 cursor-pointer overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-5 h-5 text-BRAND-500 rounded dark:bg-DARK-400 border-DARK-300 dark:border-none focus:ring-BRAND-500 cursor-pointer focus:!ring-0"
                              onChange={(e) => {
                                const updatedTableIds = e.target.checked
                                  ? [...formData.tableIds, table._id]
                                  : formData.tableIds.filter((id: string) => id !== table._id);
                                setFormData({ ...formData, tableIds: updatedTableIds });
                              }}
                              checked={selected}
                            />
                            <div className="flex flex-col cursor-pointer">
                              <span className="font-medium text-DARK-900">{capitalized(table?.name)}</span>
                              <span className={`text-xs ${selected ? "font-semibold text-DARK-500" : "text-DARK-500 dark:text-DARK-300"}`}>Seats: {table.capacity}</span>
                            </div>
                          </label>
                        </div>
                      )
                    }) : <div className="text-center text-DARK-500 dark:text-DARK-300">No tables available</div>}
                  </div>
                </div>}
              {formData.tableIds.length > 0 && availableTables.reduce((acc: any, table: any) => {
                if (formData.tableIds.includes(table._id)) {
                  return acc + table.capacity;
                }
                return acc;
              }, 0) > formData.guests && (
                  <div className="text-yellow-400 font-semibold text-sm mt-2">
                    Warning: You have selected tables with more capacity than the number of guests ({formData?.guests}).
                  </div>
                )}

              {formData.tableIds.length >= 2 && (
                <div className="text-green-500 font-semibold text-sm mt-1">
                  Merged tables: {formData.tableIds.map((id: string) => {
                    const table: any = availableTables.find((table: any) => table._id === id);
                    return table ? capitalized(table?.name) : '';
                  }).join(', ')}
                </div>
              )}
              {errors.tableIds && <p className="text-red-500 text-sm mt-1 font-semibold">{errors.tableIds}</p>}
            </>
          ) : (
            <>
              {isFormLoading ? <FormLoader count={1} /> : <form className="space-y-4" >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label value="Customer" className="text-DARK-700" /><span className="text-red-500">*</span>
                    <DropdownWithSearch
                      setSelectedItem={setFormData}
                      selectedItem={displayCustomers?.find((r: any) => r._id === formData?.customer)?.name || ''}
                      items={displayCustomers}
                      title="Customer"
                      setIsDropdownOpen={setIsCustomerOpen}
                      isDropdownOpen={isCustomerOpen}
                      handleFilter={handleCustomer}
                      fieldKey="customer"
                    />
                    {errors.customer && <p className="text-red-500">{errors.customer}</p>}
                  </div>

                  {/* <div>
                    <Label value="Customer Name" className="text-DARK-700" /><span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="Enter Customer Name"
                      className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500 w-full px-3 py-2 dark:bg-DARK-700  dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border rounded-md"
                    />
                    {errors.customerName && <p className="text-red-500">{errors.customerName}</p>}
                  </div> */}

                  {/* <div>
                    <Label value="Customer Phone Number" className="text-DARK-700" /><span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="Enter Customer Phone Number"
                      className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500 w-full px-3 py-2 dark:bg-DARK-700  dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border  rounded-md"
                    />
                    {errors.customerPhone && <p className="text-red-500">{errors.customerPhone}</p>}
                  </div> */}

                  <div>
                    <Label value="Guests" className="text-DARK-700" /><span className="text-red-500">*</span>
                    <input
                      type="number"
                      name="guests"
                      min={1}
                      step={1}
                      value={formData.guests}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          // Remove leading zeros
                          const numValue = value === '' ? '' : String(Number(value));
                          setFormData({ ...formData, guests: numValue });

                          // Clear error only if value is valid (not 0, not empty)
                          if (numValue && Number(numValue) > 0 && errors.guests) {
                            setErrors((prev: any) => ({
                              ...prev,
                              guests: "",
                            }));
                          }
                        }
                      }}
                      placeholder="Enter Number of Guests"
                      className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500 w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:placeholder:text-DARK-400 dark:border-none border rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {errors.guests && <p className="text-red-500">{errors.guests}</p>}
                  </div>

                  <div>
                    {/* <Label value="Reservation Type" className="text-DARK-700" /><span className="text-red-500">*</span>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500"
                    >
                      <option value="">Select Reservation Type</option>
                      <option value="table">Table</option>
                      <option value="venue">Venue</option>
                      <option value="private">Private</option>
                      <option value="outdoor">Outdoor</option>
                    </Select> */}
                    <label className="text-DARK-700 dark:text-DARK-100">Reservation Type</label><span className="text-red-500">*</span>
                    <DropdownWithSearch
                      setSelectedItem={setFormData}
                      selectedItem={reservationTypeData?.find((r: any) => r._id === formData?.type)?.name || ''}
                      items={reservationTypeData}
                      title="Reservation Type"
                      setIsDropdownOpen={setIsTypeOpen}
                      isDropdownOpen={isTypeOpen}
                      handleFilter={handleType}
                      fieldKey="type"
                    />
                    {errors.type && <p className="text-red-500">{errors.type}</p>}
                  </div>
                  <div>
                    <Label value="Package" className="text-DARK-700" />
                    <div className="flex justify-between gap-1">
                      <DropdownWithSearch
                        setSelectedItem={setFormData}
                        selectedItem={packages?.find((p: any) => p._id === formData?.package)?.name || ''}
                        items={packages}
                        title="Package"
                        fieldKey="package"
                        handleFilter={handlePackage}
                        setIsDropdownOpen={setIsPackageOpen}
                        isDropdownOpen={ispackageOpen}
                      />

                      {/* <Select
                        name="package"
                        value={formData.package}
                        onChange={handleChange}
                        className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500 w-full"
                      >
                        <option value="">Select Package</option>
                        {packages?.map((pkg: any) => (
                          <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                        ))}
                      </Select> */}
                      <Button onClick={() => setOpenPackageModal(true)} color="gray" className="!ring-0 hover:!text-BRAND-500 focus:text-BRAND-500 dark:bg-DARK-700">
                        <PlusIcon className="w-4 h-4 my-auto " />
                      </Button>
                    </div>
                  </div>
                  {/* <div>
                    <Label value="Deposit" className="text-DARK-700" />
                    <input
                      type="number"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                      placeholder="Enter Deposit"
                      min={0}
                      className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500 w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:placeholder:text-DARK-400 dark:border-none border rounded-md"
                    />
                  </div> */}
                  <div>
                    <Label value="Notes" className="text-DARK-700" />
                    <input
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Enter Notes"
                      className="border-DARK-300 focus:border-BRAND-500 focus:ring-BRAND-500 w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:placeholder:text-DARK-400 dark:border-none border  rounded-md"
                    />
                  </div>
                </div>
              </form>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="dark:bg-DARK-800">
          {onNext ? (
            <div className="flex justify-end gap-3 w-full">
              <Button className="!ring-0 bg-SECONDARY dark:bg-DARK-700 hover:!bg-SECONDARY_HOVER  dark:hover:!bg-DARK-600 text-white hover:!text-white w-32" disabled={btnLoading} onClick={() => setOnNext(false)}>Back</Button>
              <Button
                onClick={() => handleSubmit(null)}
                type="button"
                disabled={btnLoading}
                className="!bg-BRAND-500 hover:!bg-BRAND-600 text-white focus:!ring-0 w-32"
              >
                {btnLoading ? "Submitting..." : "Submit"}
              </Button>
              {(formData?.package && formData?.amount > 0) ? (
                <Button
                  onClick={() => {
                    if (checkValidation()) setOpenPaymentModal(true);
                  }}
                  type="button"
                  className="!bg-green-500 hover:!bg-green-600 text-white focus:!ring-0 w-32"
                >
                  <span>{`Pay ${selectedRestaurant?.company?.currency?.symbol || "$"}${(formData?.amount || 0)}`}</span>
                </Button>
              ) : null}

            </div>
          ) : (
            <div className="flex justify-end gap-3 w-full">
              <Button className="!ring-0 bg-SECONDARY dark:bg-DARK-700 hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 text-white hover:!text-white w-32" disabled={btnLoading} onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={btnLoading}
                className="!bg-BRAND-500 hover:!bg-BRAND-600 text-white focus:!ring-0 w-32"
              >
                {btnLoading ? "Loading..." : "Next"}
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Modal>
      {openPackageModal && <PackageModal
        openPackageModal={openPackageModal}
        companyData={formData?.company}
        restaurantData={formData?.restaurant}
        setOpenPackageModal={setOpenPackageModal}
        submitHandler={handlePackageSubmit}
      />}
      {openPaymentModal && (
        // <PaymentModal {...{ openPaymentModal, setOpenPaymentModal, formData, setFormData }} />
        <PaymentModal
          open={openPaymentModal}
          onClose={() => setOpenPaymentModal(false)}
          formData={formData}
          setFormData={setFormData}
          onPaymentSubmit={async (paymentData) => handleSubmit(paymentData)}
          selectedPackage={selectedPackage}
          currency={selectedRestaurant?.company?.currency?.symbol}
        />
      )}

    </>
  );
};

export default ReservationModal;