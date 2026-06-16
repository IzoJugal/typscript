import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createQueryParams } from "../../../utils/functions";
import apiClient from "../../../utils/AxiosInstance";
import { apiUrl } from "../../../environment/env";
import { useAuth } from "../../../context/AuthProvider";
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../../../utils/common/constant";
import ConfirmModal from "../../../hooks/ConfirmModal";
import { Button, Label, Table, ToggleSwitch, Tooltip } from "flowbite-react";
import TableHeaders from "../../../utils/common/TableHeaders";
import ListLoader from "../../../utils/common/ListLoader";
import NoData from "../../../utils/common/NoData";
import { capitalized, labelLayout } from "../../../utils/utility";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import PageSize from "../../Pagination/PageSize";
import Pagination from "../../Pagination/Pagination";
import { useParams } from "react-router-dom";

export interface CompanyPaymentTypeFormData {
  _id?: string;
  name: string;
  company?: string;
  isActive?: boolean;
}

const CompanyPaymentTypes = () => {

  const { id } = useParams();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [formData, setFormData] = useState<CompanyPaymentTypeFormData>({
    name: ''
  });
  const [paymentTypesList, setPaymentTypesList] = useState<any>([]);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const [filterParams, setFilterParams] = useState<any>({
    page: 1,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyPaymentTypeFormData, string>>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const columnNames = ["sr. no", "Name", "Status", "actions"]

  const handleLimit = (data: any) => {
    curPage(1);
    setFilterParams((prev: any) => ({ ...prev, limit: data }));
  }

  const curPage = (pageNum: any) => {
    setIsLoading(true);
    setFilterParams((prev: any) => {
      const updatedFormData = { ...prev, page: pageNum, };
      return updatedFormData;
    });
  };

  const getPaymentTypeList = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...filterParams,
        ...(loginRole === SUPER_ADMIN && { company: id })
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`${apiUrl}/payment-types/company/${queryParams}`);
      const { success, data, count } = response.data;
      if (success) {
        setPaymentTypesList(data);
        setNumOfRecords(count);
      }
    } catch (error) {
      console.error(error);
      toast.error("Network Error");
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [filterParams]);

  useEffect(() => {
    getPaymentTypeList();
  }, [getPaymentTypeList]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const isValid = () => {
    let isValid = true;
    const errors: any = {};

    if (!formData?.name) {
      errors.name = "Please Enter payment type name";
      isValid = false;
    }
    // if (loginRole === SUPER_ADMIN && !formData?.company) {
    //   errors.company = "Please select company";
    //   isValid = false;
    // }

    setErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) return;

    setBtnLoading(true);
    if (loginRole === SUPER_ADMIN) {
      formData.company = id;
    }

    const isEdit = Boolean(formData?._id);
    const endpoint = isEdit
      ? `${apiUrl}/payment-types/company/${formData._id}`
      : `${apiUrl}/payment-types/company`;

    const method: 'patch' | 'post' = isEdit ? 'patch' : 'post';

    try {
      const response = await apiClient[method](endpoint, formData);
      const { success, message, data } = response.data;

      if (!success) {
        toast.error(message);
        return;
      }

      toast.success(message);

      setPaymentTypesList((prev: any) => {
        const updatedList = prev.map((item: any) =>
          item._id === data._id ? data : item
        );

        // If it's a new entry, prepend it
        return isEdit ? updatedList : [data, ...updatedList];
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setBtnLoading(false);
      setFormData({ name: "" });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiClient.post(`${apiUrl}/payment-types/company/delete/${formData?._id}`);
      const { success, message } = response.data;

      if (success) {
        setPaymentTypesList((prev: any[]) => prev.filter(item => item._id !== formData?._id));
        setIsDeleteModalOpen(false);
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error(error?.response?.data?.message || "An error occurred while deleting the payment type.");
    } finally {
      setIsDeleteModalOpen(false);
      setFormData({ name: "" });
    }
  };

  const selectPaymentType = (item: any) => {
    if (item?._id !== formData?._id) {
      setFormData((prev: any) => ({
        ...prev,
        _id: item?._id || '',
        name: item?.name,
        isActive: item?.isActive,
        company: item?.company?._id,
      }))
    } else {
      setFormData({ name: "" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-DARK-100 dark:bg-gray-900 rounded-2xl -shadow-lg p-4">
      <div className="rounded-lg border-t-2 border-BRAND-400 dark:border-DARK-400 overflow-x-auto">
        <Table hoverable className="min-w-full">
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell colSpan={5} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {!isLoading && paymentTypesList.length === 0 && (
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell colSpan={5} className="text-center py-4 text-gray-500">
                  <NoData
                    title="No Payment Types Found"
                    message="No payment types are available right now. Added payment types will appear here."
                  />
                </Table.Cell>
              </Table.Row>
            )}
            {!isLoading &&
              paymentTypesList.map((item: any, index: any) => (
                <Table.Row
                  key={item._id}
                  className={`${formData?._id === item?._id
                    ? 'bg-BRAND-500/20'
                    : 'bg-white dark:border-DARK-700 dark:hover:bg-DARK-700 dark:bg-DARK-800'
                    }`}
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (filterParams.page - 1) * filterParams.limit}</Table.Cell>
                  <Table.Cell className="min-w-[120px] px-3 py-2">{capitalized(item.name)}</Table.Cell>
                  <Table.Cell className="min-w-[120px] px-3 py-2" title={item?.isActive ? 'Activated' : 'DeActivated'}>
                    {labelLayout(item?.isActive ? 'activated' : 'deactivated')}
                  </Table.Cell>

                  <Table.Cell className="min-w-32 flex flex-wrap items-center gap-2 px-3 py-2">
                    <Tooltip content="View/Edit payment type">
                      <Button onClick={() => selectPaymentType(item)} size="xs" color="gray" className={editBtnStyle.btn}>
                        <MdKeyboardDoubleArrowRight className={editBtnStyle.icon} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete payment type">
                      <Button type="button" onClick={() => { setIsDeleteModalOpen(true); setFormData(item) }} className={deleteBtnStyle.btn} size="xs">
                        <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                      </Button>
                    </Tooltip>
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table>
        {numOfRecords > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && (
              <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                <PageSize handleLimit={handleLimit} limit={filterParams.limit} />
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
        <form>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
            <div>
              <Label htmlFor="name" value="Name" className="text-sm font-medium text-gray-700 dark:text-gray-300" /><span className="text-red-500">*</span>
              <input
                type="text"
                id="name"
                name="name"
                value={formData?.name}
                onChange={handleInputChange}
                placeholder="e.g. Cash"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {errors.name && (
                <span className="text-red-500 text-sm">{errors.name}</span>
              )}
            </div>
            <div className="flex items-center space-x-4 col-span-full">
              <Label htmlFor="status" className="font-medium text-DARK-700">Status</Label>
              <ToggleSwitch
                checked={!!formData?.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e }))}
                color="success"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <Button
              type="button"
              disabled={btnLoading}
              onClick={() => { setFormData({ name: "" }); setErrors({}) }}
              className="bg-gray-200 hover:!bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:dark:!bg-gray-600 focus:!ring-0 w-24"
            >
              Clear
            </Button>
            <Button
              type="button"
              disabled={btnLoading}
              onClick={handleSubmit}
              className="bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 dark:hover:!bg-BRAND-600 text-white focus:!ring-0 w-24"
            >
              {btnLoading ? 'Processing...' : formData?._id ? 'Update' : 'Submit'}
            </Button>

          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        message="Are you sure you want to delete this payment type?"
        subText="Note: This action will permanently remove the payment type. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

    </div>
  )
}

export default CompanyPaymentTypes
