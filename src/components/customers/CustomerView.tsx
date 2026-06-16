/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormLoader from "../../utils/common/FormLoader";
import { apiUrl, siteUrl } from "../../environment/env";
import { useAuth } from "../../context/AuthProvider";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { MdAddCard, MdHistory } from "react-icons/md";
import HouseCreditModal from "./HouseCreditModal";
import HistoryModal from "./HistoryModal";

interface Address {
  address1: string | null;
  address2: string | null;
  city: string | null;
  postalCode: string | null;
  state: string | null;
  country: string | null;
}

interface HouseAccount {
  creditlimit: number | null;
  dueBalance: number | null;
  currentBalance: number | null;
}

export interface Customer {
  _id?: string;
  firstName: string;
  lastName: string | null;
  customerProfile: string;
  email: string | null;
  phoneNumber: string | null;
  billingAddress: Address;
  shippingAddress: Address;
  taxExempt: boolean;
  taxId: string | null;
  priceLevel: string | null;
  storeCredit: number;
  pointsEarned: number;
  crmParameters: Record<string, any>;
  houseAccount: HouseAccount;
  mainPhone: string | null;
  homePhone: string | null;
  company: {
    _id: string;
    name: string;
    currency?: {
      _id: string;
      symbol: string;
      code?: string;
    };
  };
  restaurant: { _id: string; name: string };
  salutation: string | null;
  spouse: string | null;
  dateofBirth: string | null;
  dateofMarriage: string | null;
  fax: string | null;
  quickBookId: string;
}

interface CustomerViewProps {
  setOpenCustomerModal: (open: boolean) => void;
  openCustomerModal: boolean;
  selectCustomerId: string;
  selectCustomer: any;
  type?: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({
  setOpenCustomerModal,
  openCustomerModal,
  selectCustomerId,
  selectCustomer,
  type,
}) => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();

  const [isHouseCreditOpen, setIsHouseCreditOpen] = useState(false);
  const [isHouseHistoryOpen, setIsHouseHistoryOpen] = useState(false);

  /* const getCustomers = async () => {
        try {
            const response = await apiClient.get(`/customer/${selectCustomerId}`);
            console.log("customer? detail", response.data);

            if (response?.data?.status) {
                setTimeout(() => {
                    setCustomer(response.data.data);
                }, 500);
            }
        } catch (error) {
            console.log("customer? detail error", error);
        }
    }; */

  useEffect(() => {
    if (selectCustomerId) {
      // getCustomers();
      setCustomer(selectCustomer);
    }
  }, [openCustomerModal, selectCustomerId, isHouseCreditOpen]);

  const hasShippingAddress =
    customer?.shippingAddress &&
    Object.values(customer.shippingAddress).some(
      (val) => val && val.trim() !== ""
    );

  const hasHouseAccountInfo =
    customer?.houseAccount &&
    Object.values(customer.houseAccount).some((val) =>
      typeof val === "string"
        ? val.trim() !== ""
        : val !== null && val !== undefined
    );

  const NoImage = `${siteUrl}/images/download.png`;

  const profilePhoto = useMemo(() => {
    if (customer?.customerProfile) {
      return `${apiUrl}/${customer?.customerProfile}`;
    }
    return NoImage;
  }, [customer?.customerProfile]);

  const currencySymbol = customer?.company?.currency?.symbol || "₹";

  return (
    <>
      <Modal
        show={openCustomerModal}
        onClose={() => {
          setOpenCustomerModal(false);
          setCustomer(null);
        }}
        className="backdrop-blur-sm dark:bg-DARK-950"
      >
        <Modal.Header className="dark:bg-DARK-800">
          <div className="flex gap-2 items-center">
            <img
              src={profilePhoto || "images/download.png"}
              alt="Profile Preview"
              className="w-14 h-14 object-cover rounded-full border-2 border-DARK-300  shadow-2xl"
              onError={(e) => (e.currentTarget.src = NoImage)}
            />
            <h2>
              {customer?.firstName} {customer?.lastName || ""}
            </h2>
          </div>
        </Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          {customer ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  Business Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {customer?.company?.name && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Company
                      </p>
                      <p className="dark:text-white">
                        {customer?.company?.name || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.restaurant?.name && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Restaurant
                      </p>
                      <p className="dark:text-white">
                        {customer?.restaurant?.name || "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {customer?.firstName && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Name
                      </p>
                      <p className="dark:text-white">
                        {customer?.firstName} {customer?.lastName || ""}
                      </p>
                    </div>
                  )}
                  {customer?.salutation && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Salutation
                      </p>
                      <p className="dark:text-white">
                        {customer?.salutation || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.email && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Email
                      </p>
                      <p className="dark:text-white">
                        {customer?.email || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.mainPhone && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Main Phone
                      </p>
                      <p className="dark:text-white">
                        {customer?.mainPhone || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.homePhone && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Home Phone
                      </p>
                      <p className="dark:text-white">
                        {customer?.homePhone || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.dateofBirth && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Date of Birth
                      </p>
                      <p className="dark:text-white">
                        {customer?.dateofBirth || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.spouse && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Spouse
                      </p>
                      <p className="dark:text-white">
                        {customer?.spouse || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.dateofMarriage && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Date of Marriage
                      </p>
                      <p className="dark:text-white">
                        {customer?.dateofMarriage || "-"}
                      </p>
                    </div>
                  )}
                  {customer?.fax && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Fax
                      </p>
                      <p className="dark:text-white">{customer?.fax || "-"}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  Addresses
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-DARK-500 dark:text-DARK-400">
                      Billing Address
                    </p>
                    <p className="dark:text-white">
                      {customer?.billingAddress?.address1 || ""}
                      {customer?.billingAddress?.address2
                        ? `, ${customer?.billingAddress?.address2}`
                        : ""}
                      {customer?.billingAddress?.city
                        ? `, ${customer?.billingAddress?.city}`
                        : ""}
                      {customer?.billingAddress?.state
                        ? `, ${customer?.billingAddress?.state}`
                        : ""}
                      {customer?.billingAddress?.postalCode
                        ? ` ${customer?.billingAddress?.postalCode}`
                        : ""}
                      {customer?.billingAddress?.country
                        ? `, ${customer?.billingAddress?.country}`
                        : "-"}
                    </p>
                  </div>
                  {hasShippingAddress && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Shipping Address
                      </p>
                      <p className="dark:text-white">
                        {customer?.shippingAddress?.address1 || ""}
                        {customer?.shippingAddress?.address2
                          ? `, ${customer?.shippingAddress?.address2}`
                          : ""}
                        {customer?.shippingAddress?.city
                          ? `, ${customer?.shippingAddress?.city}`
                          : ""}
                        {customer?.shippingAddress?.state
                          ? `, ${customer?.shippingAddress?.state}`
                          : ""}
                        {customer?.shippingAddress?.postalCode
                          ? ` ${customer?.shippingAddress?.postalCode}`
                          : ""}
                        {customer?.shippingAddress?.country
                          ? `, ${customer?.shippingAddress?.country}`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  Account Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {customer?.taxExempt !== undefined && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Tax Exempt
                      </p>
                      <p className="dark:text-white">
                        {customer?.taxExempt ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                  {customer?.taxId && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Tax ID
                      </p>
                      <p className="dark:text-white">{customer?.taxId}</p>
                    </div>
                  )}
                  {customer?.priceLevel && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Price Level
                      </p>
                      <p className="dark:text-white">{customer?.priceLevel}</p>
                    </div>
                  )}
                  {customer?.storeCredit !== undefined && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Store Credit
                      </p>
                      <p className="dark:text-white">
                        {currencySymbol}
                        {customer?.storeCredit?.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {customer?.pointsEarned !== undefined && (
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Points Earned
                      </p>
                      <p className="dark:text-white">
                        {currencySymbol}
                        {customer?.pointsEarned?.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {hasHouseAccountInfo && (
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">
                    House Account
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
                    <div>
                      <p className="text-sm text-DARK-500 dark:text-DARK-400">
                        Credit Limit
                      </p>
                      <p className="dark:text-white">
                        {customer?.houseAccount?.creditlimit
                          ? `${currencySymbol}${customer?.houseAccount?.creditlimit.toFixed(
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
                        {customer?.houseAccount?.dueBalance != null
                          ? `${currencySymbol}${customer.houseAccount.dueBalance.toFixed(
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
                        {customer?.houseAccount?.currentBalance != null
                          ? `${currencySymbol}${customer?.houseAccount?.currentBalance.toFixed(
                            2
                          )}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsHouseCreditOpen(true);
                        setOpenCustomerModal(false);
                      }}
                      className="h-10 px-3 py-0.5 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <MdAddCard className="text-lg" />
                      <span>Add House Credit</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        setIsHouseHistoryOpen(true);
                        setOpenCustomerModal(false);
                      }}
                      className="h-10 px-3 py-0.5 bg-BRAND-500 dark:bg-BRAND-600 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 dark:hover:!bg-BRAND-500 focus:!ring-0 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <MdHistory className="text-lg" />
                      <span>History</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <FormLoader />
          )}
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          <Button
            type="button"
            onClick={() => {
              setOpenCustomerModal(false);
              setCustomer(null);
            }}
            className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          {((type &&
            (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole))) ||
            !type) && (
              <Button
                type="button"
                onClick={() => {
                  setOpenCustomerModal(false);
                  navigate(`/customer/edit/${selectCustomerId}`);
                }}
                className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Edit
                </span>
              </Button>
            )}
        </Modal.Footer>
      </Modal>
      {customer && (
        <HouseCreditModal
          openModal={isHouseCreditOpen}
          setOpenModal={setIsHouseCreditOpen}
          customer={customer}
          setCustomerViewModal={setOpenCustomerModal}
        />
      )}

      {customer && (
        <HistoryModal
          openModal={isHouseHistoryOpen}
          setOpenModal={setIsHouseHistoryOpen}
          customer={customer}
          setCustomerViewModal={setOpenCustomerModal}
        />
      )}
    </>
  );
};

export default CustomerView;
