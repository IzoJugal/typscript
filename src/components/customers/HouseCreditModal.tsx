import { Button, Modal } from "flowbite-react";
import { Customer } from "./CustomerView";
import { capitalized, checkAccess } from "../../utils/utility";
import { ModuleName } from "../../utils/common/constant";
import { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import CommonPaymentModal from "../../utils/common/CommonPaymentModal";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface HouseCreditProps {
  setOpenModal: (open: boolean) => void;
  openModal: boolean;
  customer: Customer;
  setCustomerViewModal: (open: boolean) => void;
}

interface IHouseCredits {
  customer: string;
  company?: string;
  restaurant?: string;
  amount?: number;
  change?: number;
  paymentMethod: {
    method: string;
    amount?: number;
    cardNumber?: string;
    cardType?: string;
  };
}

interface ErrorState {
  amount?: string;
}

const HouseCreditModal: React.FC<HouseCreditProps> = ({
  openModal,
  setOpenModal,
  customer,
  setCustomerViewModal,
}) => {
  const { userData } = useAuth();
  const hasPermission = checkAccess(ModuleName.PAYMENTS, userData);
  const [formData, setFormData] = useState<IHouseCredits>({
    customer: customer?._id || "",
    company: customer?.company?._id,
    restaurant: customer?.restaurant?._id,
    paymentMethod: {
      method: "",
      amount: 0,
    },
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const paymentMethods = ["Cash", "QR", "provider"];

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};

    if (!formData.amount) {
      errorMsg.amount = "Please enter a amount.";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...errorMsg }));
    return isValid;
  };

  // const handleChange = (e: any) => {
  //   const { name, value } = e.target;

  //   setFormData((prevForm: any) => ({
  //     ...prevForm,
  //     [name]: value,
  //   }));

  //   if (errors[name as keyof ErrorState]) {
  //     setErrors((prev) => ({ ...prev, [name]: "" }));
  //   }
  // };

  const handleSubmit = async (payload: any): Promise<void> => {
    if (isValid()) {
      try {
        const response = await apiClient.post(`/house-credits/save`, payload);

        if (response?.data?.success) {
          toast.success(
            response?.data?.message || "House credits added successfully!"
          );
        } else {
          toast.error(
            response?.data?.message || "Failed to add house credits!"
          );
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message);
      }
    }
  };

  const handleCancel = () => {
    setOpenModal(false);
    setCustomerViewModal(true);
    setErrors({});
    // setFormData({
    //     customer: '',
    //     amount: 0,
    //     paymentMethod: {
    //         method: ''
    //     },
    // });
    setFormData((prev) => ({
      ...prev,
      amount: 0,
      paymentMethod: {
        method: "",
      },
      change: 0,
    }));
  };

  const handlePaymentModalClose = () => {
    setOpenPaymentModal(false);
    setCustomerViewModal(true);
    setErrors({});
    // setFormData({
    //     customer: '',
    //     amount: 0,
    //     paymentMethod: {
    //         method: ''
    //     },
    // });
    setFormData((prev) => ({
      ...prev,
      amount: 0,
      paymentMethod: {
        method: "",
      },
      change: 0,
    }));
  };

  const handlePaymentModalOpen = () => {
    if (isValid()) {
      setOpenPaymentModal(true);
      setOpenModal(false);
    }
  };

  const currencySymbol = customer?.company?.currency?.symbol || "₹";

  return (
    <>
      <Modal
        show={openModal}
        onClose={() => handleCancel()}
        className="backdrop-blur-sm dark:bg-DARK-950"
      >
        <Modal.Header className="dark:bg-DARK-800">
          <h1 className="text-lg font-semibold dark:text-white">
            Add House Credit
          </h1>
        </Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          <div className="bg-DARK-200 dark:bg-DARK-700 rounded-lg p-4">
            <h3 className="text-xl font-semibold dark:text-white">
              {customer?.firstName ? capitalized(customer.firstName) : ""}{" "}
              {customer?.lastName ? capitalized(customer.lastName) : ""}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-DARK-500 dark:text-DARK-400">
                  Credit Limit
                </p>
                <p className="dark:text-white">
                  {typeof customer?.houseAccount?.creditlimit === "number"
                    ? `${currencySymbol}${customer.houseAccount.creditlimit.toFixed(
                      2
                    )}`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-DARK-500 dark:text-DARK-400">
                  Current Balance
                </p>
                <p className="dark:text-white">
                  {typeof customer?.houseAccount?.currentBalance === "number"
                    ? `${currencySymbol}${customer.houseAccount.currentBalance.toFixed(
                      2
                    )}`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-DARK-500 dark:text-DARK-400">
                  Due Balance
                </p>
                <p className="dark:text-white">
                  {typeof customer?.houseAccount?.dueBalance === "number"
                    ? `${currencySymbol}${customer.houseAccount.dueBalance.toFixed(
                      2
                    )}`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 my-3">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
              >
                Credit Amount<span className="text-ERROR_HOVER">*</span>
              </label>
              <NumberInputPOS
                id="amount"
                name="amount"
                // min={0}
                allowDecimal={true}
                maxDecimalPlaces={2}
                placeholder="Enter Credit Amount"
                value={formData.amount || ""}
                onChange={(value) =>
                  setFormData((prev:any) => ({
                    ...prev,
                    amount: value,
                  }))
                }
                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-ERROR_HOVER">{errors.amount}</p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          <Button
            type="button"
            onClick={() => handleCancel()}
            className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          {hasPermission && (
            <Button
              type="button"
              onClick={() => {
                handlePaymentModalOpen();
              }}
              className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Pay
              </span>
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      <CommonPaymentModal
        open={openPaymentModal}
        onClose={handlePaymentModalClose}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        amountKey="amount"
        paymentDataKey="paymentMethod"
        changeAmountKey="change"
        paymentMethods={paymentMethods}
      />
    </>
  );
};

export default HouseCreditModal;
