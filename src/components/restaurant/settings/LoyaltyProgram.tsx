import { Button, Table } from "flowbite-react";
import TableHeaders from "../../../utils/common/TableHeaders";
import { useState } from "react";
import ListLoader from "../../../utils/common/ListLoader";
import NoData from "../../../utils/common/NoData";
import apiClient from "../../../utils/AxiosInstance";
import { apiUrl } from "../../../environment/env";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthProvider";
import ConfirmModal from "../../../hooks/ConfirmModal";
import { capitalized } from "../../../utils/utility";
import { deleteBtnStyle, editBtnStyle } from "../../../utils/common/constant";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import PageSize from "../../Pagination/PageSize";
import Pagination from "../../Pagination/Pagination";
import CommonInput from "../../../utils/common/CommonInput";
import NumberInputPOS from "../../../utils/common/NumberInputPOS";

interface LoyaltyProgramProps {
  restaurant: string | any;
  loyaltyList: any[];
  setLoyaltyList: React.Dispatch<React.SetStateAction<any[]>>;
  numOfRecords: number;
  handleLimit: any;
  filterParams: any;
  curPage: any;
  currency?: string;
  currencyName?: string;
  restaurantData?: any;
}

interface LoyaltyFormData {
  _id?: string;
  programName: string;
  programType: "points" | "visits" | "tiered" | "subscription";
  spentAmount: number | "";
  pointPerSpent: number | "";
  rewardPoints: number | "";
  discountType: "amount" | "percentage";
  benefitPerPoints: number | "";
  expirationDays: number | "";
  autoApply: boolean;
  isDefault: boolean;
  rewardDescription: string;
  restaurant: string;
  company: string;
}

const LoyaltyProgram = ({
  restaurant,
  loyaltyList,
  setLoyaltyList,
  numOfRecords,
  handleLimit,
  filterParams,
  curPage,
  currency = "$",
  currencyName = "Dollar",
  restaurantData,
}: LoyaltyProgramProps) => {
  const { userData } = useAuth();
  const initialData: LoyaltyFormData = {
    _id: "",
    programName: "",
    programType: "points",
    spentAmount: "",
    pointPerSpent: "",
    rewardPoints: "",
    discountType: "amount",
    benefitPerPoints: "",
    expirationDays: "",
    autoApply: false,
    isDefault: false,
    rewardDescription: "",
    restaurant,
    company:
      restaurantData?.company?._id || userData?.staffMember?.company?._id,
  };

  const [loyaltyFormData, setLoyaltyFormData] =
    useState<LoyaltyFormData>(initialData);
  const switchBtn = (
    <div className="relative w-11 h-6 bg-DARK-200 peer-focus:outline-none peer-focus:!ring-0 peer-focus:ring-emerald-500 dark:peer-focus:ring-emerald-400 rounded-full peer dark:bg-DARK-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-DARK-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoyaltyFormData, string>>
  >({});
  const [btnLoading, setBtnLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>({});

  const LoyaltyColumnNames = [
    "No.",
    "Program Name",
    "Type",
    "default",
    "Action",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    const decimalFields = ["spentAmount", "benefitPerPoints"];

    const integerFields = [
      "pointPerSpent",
      "rewardPoints",
      "expirationDays",
    ];

    // Decimal fields
    if (decimalFields.includes(name)) {
      // Empty allowed
      if (value === "") {
        setLoyaltyFormData((prev) => ({
          ...prev,
          [name]: "",
        }));

        setErrors((prev) => ({ ...prev, [name]: undefined }));
        return;
      }

      // Remove invalid chars automatically
      const cleanedValue = value.replace(/[^0-9.]/g, "");

      // Prevent multiple dots
      const parts = cleanedValue.split(".");
      const formattedValue =
        parts.length > 2
          ? `${parts[0]}.${parts.slice(1).join("")}`
          : cleanedValue;

      // Allow only 2 decimal places
      if (/^\d*\.?\d{0,2}$/.test(formattedValue)) {
        setLoyaltyFormData((prev) => ({
          ...prev,
          [name]: formattedValue,
        }));

        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }

      return;
    }

    // Integer fields
    if (integerFields.includes(name)) {
      // Empty allowed
      if (value === "") {
        setLoyaltyFormData((prev) => ({
          ...prev,
          [name]: "",
        }));

        setErrors((prev) => ({ ...prev, [name]: undefined }));
        return;
      }

      // Remove all non-digits
      const cleanedValue = value.replace(/\D/g, "");

      setLoyaltyFormData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));

      setErrors((prev) => ({ ...prev, [name]: undefined }));

      return;
    }

    // Other fields
    setLoyaltyFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /* const handleAutoApplyToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name } = e.target;
        setLoyaltyFormData((prev) => ({
            ...prev,
            [name]: e.target.checked,
        }));
    }; */

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoyaltyFormData, string>> = {};

    if (!loyaltyFormData.programName.trim()) {
      newErrors.programName = "Program name is required";
    }

    if (loyaltyFormData.spentAmount === "" || loyaltyFormData.spentAmount <= 0) {
      newErrors.spentAmount = "Amount spent must be greater than 0";
    }

    if (loyaltyFormData.pointPerSpent === "" || loyaltyFormData.pointPerSpent <= 0) {
      newErrors.pointPerSpent = "Points must be greater than 0";
    }

    if (loyaltyFormData.rewardPoints === "" || loyaltyFormData.rewardPoints <= 0) {
      newErrors.rewardPoints = "Reward points must be greater than 0";
    }

    if (loyaltyFormData.benefitPerPoints === "" || loyaltyFormData.benefitPerPoints <= 0) {
      newErrors.benefitPerPoints = "Reward value must be greater than 0";
    }

    /* if (loyaltyFormData.expirationDays <= 0) {
            newErrors.expirationDays = "Expiration days must be greater than 0";
        } */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    setIsLoading(true);

    try {
      if (!validateForm()) {
        return;
      }

      const isEdit = Boolean(loyaltyFormData?._id);
      const url = isEdit
        ? `${apiUrl}/loyalty-programs/${loyaltyFormData._id}`
        : `${apiUrl}/loyalty-programs/create`;

      const method = isEdit ? "patch" : "post";
      const response = await apiClient[method](url, loyaltyFormData);

      const {
        success,
        message,
        updatedLoyaltyProgram,
        loyaltyProgram: newLoyaltyProgram,
      } = response.data;

      const loyaltyProgram = isEdit ? updatedLoyaltyProgram : newLoyaltyProgram;

      if (success) {
        setLoyaltyList((prev) => {
          const updatedList = prev.map((item) => {
            if (item._id === loyaltyProgram._id) {
              return loyaltyProgram;
            }
            return loyaltyProgram.isDefault
              ? { ...item, isDefault: false }
              : item;
          });
          if (!isEdit) {
            return [loyaltyProgram, ...updatedList];
          }
          return updatedList;
        });

        toast.success(message);

        setLoyaltyFormData({
          programName: "",
          programType: "points",
          spentAmount: "",
          pointPerSpent: "",
          rewardPoints: "",
          discountType: "amount",
          benefitPerPoints: "",
          expirationDays: "",
          autoApply: false,
          isDefault: false,
          rewardDescription: "",
          restaurant,
          company: userData?.staffMember?.company?._id || "",
        });
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error("Error submitting loyalty program:", error);
      toast.error("Network Error");
    } finally {
      setBtnLoading(false);
      setIsLoading(false);
    }
  };

  const selectLoyalty = (item: any) => {
    if (item?._id !== loyaltyFormData?._id) {
      setLoyaltyFormData((prev: any) => ({
        ...prev,
        _id: item?._id || "",
        programName: item?.programName,
        programType: item?.programType,
        spentAmount: item?.spentAmount,
        pointPerSpent: item?.pointPerSpent,
        rewardPoints: item?.rewardPoints,
        discountType: item?.discountType,
        benefitPerPoints: item?.benefitPerPoints,
        expirationDays: item?.expirationDays,
        autoApply: item?.autoApply,
        isDefault: item?.isDefault,
        rewardDescription: item?.rewardDescription,
      }));
    } else {
      setLoyaltyFormData(initialData);
    }
  };

  const handleChangeDefault = async () => {
    const response = await apiClient.patch(
      `${apiUrl}/loyalty-programs/${selectedProgram?._id}`,
      selectedProgram
    );
    const { success } = response.data;
    if (success) {
      setLoyaltyList((prev: any[]) =>
        prev.map((item) => ({
          ...item,
          isDefault: item._id === selectedProgram?._id,
        }))
      );
      setIsDefaultModalOpen(false);
    }
  };

  const handleDeleteProgram = async () => {
    const response = await apiClient.post(
      `${apiUrl}/loyalty-programs/delete/${selectedProgram?._id}`
    );
    const { success, message } = response.data;
    if (success) {
      setLoyaltyList((prev: any[]) =>
        prev.filter((item) => item._id !== selectedProgram?._id)
      );

      setIsDeleteModalOpen(false);
      toast.success(message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-DARK-100 dark:bg-DARK-900 rounded-2xl p-4">
      <div className="rounded-lg border-t-2 border-BRAND-400 dark:border-DARK-400 overflow-x-auto">
        <Table hoverable className="min-w-full">
          <TableHeaders columnNames={LoyaltyColumnNames} />
          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={5} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {!isLoading && loyaltyList.length === 0 && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell
                  colSpan={5}
                  className="text-center py-4 text-DARK-500"
                >
                  <NoData
                    title="No Loyalty Programs Found"
                    message="No loyalty program entries are available right now. Added loyalty program entries will appear here."
                  />
                </Table.Cell>
              </Table.Row>
            )}
            {!isLoading &&
              loyaltyList.map((item, index) => (
                <Table.Row
                  key={item._id}
                  className={`${loyaltyFormData?._id === item?._id
                    ? "bg-BRAND-500/20"
                    : "bg-white dark:border-DARK-700 dark:hover:bg-DARK-700 dark:bg-DARK-800"
                    }`}
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {" "}
                    {index + 1 + (filterParams.page - 1) * filterParams.limit}
                  </Table.Cell>
                  <Table.Cell className="min-w-[120px] px-3 py-2">
                    {capitalized(item.programName)}
                  </Table.Cell>
                  <Table.Cell className="min-w-[100px] px-3 py-2">
                    {item.programType}
                  </Table.Cell>
                  <Table.Cell className="px-3 py-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isDefault}
                        onChange={() => {
                          setSelectedProgram({ ...item, isDefault: true });
                          setIsDefaultModalOpen(true);
                        }}
                        className="sr-only peer"
                      />
                      {switchBtn}
                    </label>
                  </Table.Cell>
                  <Table.Cell className="min-w-28 flex flex-wrap items-center gap-1 px-3 py-2">
                    <Button
                      onClick={() => selectLoyalty(item)}
                      size="xs"
                      className={editBtnStyle.btn}
                    >
                      <MdKeyboardDoubleArrowRight
                        className={editBtnStyle.icon}
                      />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedProgram({ ...item, isDefault: true });
                        setIsDeleteModalOpen(true);
                      }}
                      className={deleteBtnStyle.btn}
                      size="xs"
                    >
                      <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table>
        {numOfRecords > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && (
              <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                <PageSize
                  handleLimit={handleLimit}
                  limit={filterParams.limit}
                />
              </div>
            )}
            <div>
              <Pagination
                className="pagination-bar"
                currentPage={filterParams.page}
                totalCount={numOfRecords}
                pageSize={filterParams.limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 bg-white dark:bg-DARK-800 p-4 border-t-2 border-BRAND-400 dark:border-DARK-400 rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="programName"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Program Name <span className="text-red-500">*</span>
              </label>
              <CommonInput
                type="text"
                id="programName"
                name="programName"
                value={loyaltyFormData.programName}
                onChange={handleInputChange}
                placeholder="e.g. Reward Club"
              // className="w-full px-4 py-2.5 text-sm border border-DARK-300 dark:border-DARK-600 bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {errors.programName && (
                <span className="text-red-500 text-sm">
                  {errors.programName}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="programType"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Program Type <span className="text-red-500">*</span>
              </label>
              <select
                id="programType"
                name="programType"
                value={loyaltyFormData.programType}
                onChange={handleInputChange}
                className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
              // className="w-full px-4 py-2.5 text-sm border border-DARK-300 dark:border-DARK-600 bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="points">Points-based</option>
                <option value="visits">Visit-based</option>
                <option value="tiered">Tiered</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <label
                htmlFor="spentAmount"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Amount Spent ({currency}){" "}
                <span className="text-red-500">*</span>
              </label>
              <NumberInputPOS
                id="spentAmount"
                name="spentAmount"
                placeholder="e.g. 100"
                value={loyaltyFormData.spentAmount}
                allowDecimal={true}
                maxDecimalPlaces={2}
                onChange={(value) =>
                  handleInputChange({
                    target: {
                      name: "spentAmount",
                      value,
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              {errors.spentAmount && (
                <span className="text-red-500 text-sm">
                  {errors.spentAmount}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="pointPerSpent"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Points per {currencyName}{" "}
                <span className="text-red-500">*</span>
              </label>
              <NumberInputPOS
                id="pointPerSpent"
                name="pointPerSpent"
                placeholder="e.g. 10"
                allowDecimal={true}
                maxDecimalPlaces={2}
                value={loyaltyFormData.pointPerSpent}
                onChange={(value) =>
                  handleInputChange({
                    target: {
                      name: "pointPerSpent",
                      value,
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              {errors.pointPerSpent && (
                <span className="text-red-500 text-sm">
                  {errors.pointPerSpent}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <label
                htmlFor="rewardPoints"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Points for Reward <span className="text-red-500">*</span>
              </label>
              <NumberInputPOS
                id="rewardPoints"
                name="rewardPoints"
                placeholder="e.g. 100"
                allowDecimal={true}
                maxDecimalPlaces={2}
                value={loyaltyFormData.rewardPoints}
                onChange={(value) =>
                  handleInputChange({
                    target: {
                      name: "rewardPoints",
                      value,
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
              {errors.rewardPoints && (
                <span className="text-red-500 text-sm">
                  {errors.rewardPoints}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="benefitPerPoints"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Reward Value <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="discountType"
                  name="discountType"
                  value={loyaltyFormData.discountType}
                  onChange={handleInputChange}
                  className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
                // className="w-1/2 px-4 py-2.5 text-sm border border-DARK-300 dark:border-DARK-600 bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="amount">Amount ({currency})</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <NumberInputPOS
                  id="benefitPerPoints"
                  name="benefitPerPoints"
                  placeholder={loyaltyFormData.discountType === "amount" ? `e.g. ${currency}10` : "e.g. 10%"}
                  value={loyaltyFormData.benefitPerPoints}
                  onChange={(value) =>
                    handleInputChange({
                      target: {
                        name: "benefitPerPoints",
                        value,
                      },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  allowDecimal={true}
                  maxDecimalPlaces={0}
                />
              </div>
              {errors.benefitPerPoints && (
                <span className="text-red-500 text-sm">
                  {errors.benefitPerPoints}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 items-end">
            <div>
              <label
                htmlFor="expirationDays"
                className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
              >
                Points Expiration (Days){" "}
                {/* <span className="text-red-500">*</span> */}
              </label>
              <CommonInput
                type="text"
                inputMode="numeric"
                id="expirationDays"
                name="expirationDays"
                placeholder="e.g. 365"
                value={loyaltyFormData.expirationDays}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (
                    ["-", "e", "E", "+", ".", "ArrowUp", "ArrowDown"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                onWheelCapture={(e) => {
                  e.currentTarget.blur();
                }}
                step="0"
              // className="w-full px-4 py-2.5 text-sm border border-DARK-300 dark:border-DARK-600 bg-white
              // dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 rounded-lg focus:ring-2 focus:ring-blue-500
              // focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
              // [&::-webkit-inner-spin-button]:appearance-none "
              />
              {/* {errors.expirationDays && (
                                <span className="text-red-500 text-sm">{errors.expirationDays}</span>
                            )} */}
            </div>
            {/* <div className="flex justify-between gap-3">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isDefault"
                                    checked={loyaltyFormData.isDefault}
                                    onChange={handleAutoApplyToggle}
                                    className="sr-only peer"
                                />
                                {switchBtn}
                                <span className="ml-3 text-sm font-medium text-DARK-700 dark:text-DARK-300">
                                    Set Default
                                </span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="autoApply"
                                    checked={loyaltyFormData.autoApply}
                                    onChange={handleAutoApplyToggle}
                                    className="sr-only peer"
                                />
                                {switchBtn}
                                <span className="ml-3 text-sm font-medium text-DARK-700 dark:text-DARK-300">
                                    Auto Apply Reward
                                </span>
                            </label>
                        </div> */}
          </div>

          <div className="mt-6">
            <label
              htmlFor="rewardDescription"
              className="block text-sm font-medium text-DARK-700 dark:text-DARK-300 mb-1.5"
            >
              Reward Description
            </label>
            <textarea
              id="rewardDescription"
              name="rewardDescription"
              value={loyaltyFormData.rewardDescription}
              onChange={handleInputChange}
              placeholder={`e.g. Free Dessert, ${currency}5 Off`}
              rows={5}
              className="w-full -min-w-60 border-2 border-DARK-300 dark:border-none bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 disabled:cursor-not-allowed"
            // className="w-full px-4 py-2.5 text-sm border border-DARK-300 dark:border-DARK-600 bg-white dark:bg-DARK-700 text-DARK-900 dark:text-DARK-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <Button
              type="button"
              disabled={btnLoading}
              onClick={() => setLoyaltyFormData(initialData)}
              className="bg-DARK-300 hover:!bg-DARK-400 text-DARK-800 dark:bg-DARK-700 dark:text-DARK-300 hover:dark:!bg-DARK-600 focus:!ring-0 w-24"
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={btnLoading}
              className="bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-600 dark:hover:!bg-BRAND-700 text-white focus:!ring-0 w-24"
            >
              {btnLoading
                ? "Processing..."
                : loyaltyFormData?._id
                  ? "Update"
                  : "Submit"}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isDefaultModalOpen}
        message="Would you like to mark this program as the default?"
        onConfirm={handleChangeDefault}
        onCancel={() => setIsDefaultModalOpen(false)}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        message="Would you like to delete this program?"
        onConfirm={handleDeleteProgram}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default LoyaltyProgram;
