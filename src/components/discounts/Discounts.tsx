/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Table } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import ConfirmModal from "../../hooks/ConfirmModal";
import Pagination from "../Pagination/Pagination";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import PageSize from "../Pagination/PageSize";
import TableHeaders from "../../utils/common/TableHeaders";
import { Filters } from "../../utils/common/Filters";
import { useAuth } from "../../context/AuthProvider";
import NoData from "../../utils/common/NoData";
import {
  deleteBtnStyle,
  editBtnStyle,
  SUPER_ADMIN,
} from "../../utils/common/constant";
import { createQueryParams } from "../../utils/functions";
import { capitalized, formatDate, setTitle } from "../../utils/utility";
import { useSocket } from "../../context/SocketProvider";
import ListLoader from "../../utils/common/ListLoader";
import { useConfigs } from "../../context/SiteConfigsProvider";
import AddActionButton from "../../utils/common/AddActionButton";
import DiscountFormModal from "./DiscountFormModal";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";

interface IDiscount {
  _id: string;
  discountAmount: number;
  discountType: string;
  startDate: string;
  endDate: string;
  company?: {
    _id: string;
    name?: string;
    currency?: { id: string; code: string; symbol: string };
  };
}

const Discounts = () => {
  setTitle("Discounts");
  const [discounts, setDiscounts] = useState<IDiscount[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages || 1);
  const [numOfRecords, setNumOfRecords] = useState<number>(0);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const { configData } = useConfigs();
  const { userData } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";
  const [searchFilter, setSearchFilter] = useState<any>({
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
    discountType: searchParams.get("discountType") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
  });

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });

  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const openAddModal = () => {
    setSelectedDiscountId(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setSelectedDiscountId(id);
    setIsFormModalOpen(true);
  };

  const currencySymbol = discounts?.[0]?.company?.currency?.symbol || "$";

  const columnNames = [
    "Sr.No.",
    "Discount Type",
    `Discount Amount (${currencySymbol})`,
    "Start Date",
    "End Date",
    "Actions",
  ];
  if (loginRole === SUPER_ADMIN) {
    const staffIndex = columnNames.indexOf("Discount Type");
    if (staffIndex !== -1) {
      columnNames.splice(staffIndex + 1, 0, "Business");
    }
  }

  const getDiscounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current,
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/discount${queryParams}`);
      setIsLoading(false);
      setDiscounts(response.data.discounts);
      setNumOfRecords(response.data.count);
    } catch (error) {
      setIsLoading(false);
      setDiscounts([]);
      console.error("~ getDiscounts error :-", error);
    }
  }, []);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getDiscounts();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getDiscounts, location.search]);

  const handleLimit = (data: any) => {
    curPage(1);
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }));
  };

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/discount/${updatedFormData.page}${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true);
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    if (
      Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")
    ) {
      if (formData?.page !== 1) {
        setFormData((prev) => ({ ...prev, page: 1 }));
        setPage(1);
      }
    }
  }, [searchFilter]);

  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setFormData((prev) => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));

    setPage(pageFromURL);
    setLimit(limitFromURL);
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(formDataRef.current);
    setLimit(formDataRef.current?.limit);
    setPage(formDataRef.current?.page);
  }, [searchFilter, formData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);

  const handleDelete = async () => {
    setIsConfirmModalOpen(false);
    const deleteId = selectedId;
    setSelectedId(null);
    if (!deleteId) return;
    try {
      setIsLoading(true);
      const response = await apiClient.post(`/discount/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      setDiscounts((prev: any) => {
        const updated = prev?.filter((item: any) => item._id !== deleteId) || [];
        if (updated.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return updated;
      });
      setNumOfRecords((prev: any) => prev - 1);
      getDiscounts();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log("Delete discounts error:", error);
      toast.error("Failed to delete the discounts. Please try again.");
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsConfirmModalOpen(true);
  };

  const socket = useSocket();

  useEffect(() => {
    const addDiscount = (discountData: any) => {
      setDiscounts((prevData: any) => {
        const updatedData = [...prevData];
        if (prevData?.length >= limit) {
          updatedData?.pop();
        }
        return [discountData, ...updatedData];
      });
      setNumOfRecords((prev: any) => prev + 1);
    };

    const updateDiscount = (discountData: any) => {
      setDiscounts((prev: any) =>
        prev.map((item: any) =>
          item._id === discountData._id ? discountData : item
        )
      );
    };
    const deleteDiscount = (discountData: any) => {
      setDiscounts((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(discountData._id));
        if (!exists) return prev;
        const updated = prev.filter((item: any) => item._id !== discountData?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getDiscounts();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addDiscount", addDiscount);
    socket.on("updateDiscount", updateDiscount);
    socket.on("deleteDiscount", deleteDiscount);

    return () => {
      socket.off("addDiscount", addDiscount);
      socket.off("updateDiscount", updateDiscount);
      socket.off("deleteDiscount", deleteDiscount);
    };
  }, [socket, page, limit, getDiscounts]);

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Discounts" />
        </div>

        {/* Filters Section */}
        <div className="mt-4">
          <div className="flex gap-4">
            <button
              className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="text-sm" />
              Filters
              {showFilters ? (
                <FaAngleUp className="transition-transform duration-300 h-4 w-4" />
              ) : (
                <FaAngleDown className="transition-transform duration-300 h-4 w-4" />
              )}
            </button>

            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
              <span onClick={openAddModal}>
                <AddActionButton text="Add a new discount" />
              </span>
            </div>
          </div>


          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="discounts" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={loginRole === SUPER_ADMIN ? 7 : 6} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {discounts && discounts.length > 0 && !isLoading ? (
              discounts.map((item: IDiscount, index) => {
                return (
                  <Table.Row
                    key={item?._id}
                    className="bg-white dark:border-DARK-700 dark:bg-DARK-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                      {index + 1 + (page - 1) * limit}
                    </Table.Cell>
                    <Table.Cell
                      className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"
                      title={capitalized(item.discountType)}
                    >
                      {capitalized(item.discountType) ?? "-"}
                    </Table.Cell>
                    {loginRole === SUPER_ADMIN && (
                      <Table.Cell
                        className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                        title={item?.company?.name?.toString() ?? "-"}
                      >
                        {capitalized(item?.company?.name) ?? "-"}
                      </Table.Cell>
                    )}
                    <Table.Cell
                      className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                      title={
                        item.discountAmount !== undefined && item.discountAmount !== null
                          ? `${item?.discountType === "percentage" ? "" : `${currencySymbol}`}${item.discountAmount}${item?.discountType === "percentage" ? "%" : ""}`
                          : "-"
                      }
                    >
                      {item.discountAmount !== undefined && item.discountAmount !== null
                        ? `${item?.discountType === "percentage" ? "" : `${currencySymbol}`}${item.discountAmount}${item?.discountType === "percentage" ? "%" : ""}`
                        : "-"}
                    </Table.Cell>
                    <Table.Cell
                      className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                      title={formatDate(item?.startDate, configData?.dateFormat)}
                    >
                      {formatDate(item?.startDate, configData?.dateFormat) ?? "-"}
                    </Table.Cell>
                    <Table.Cell
                      className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300"
                      title={formatDate(item?.endDate, configData?.dateFormat)}
                    >
                      {formatDate(item?.endDate, configData?.dateFormat) ?? "-"}
                    </Table.Cell>
                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        className={editBtnStyle.btn}
                        onClick={() => openEditModal(item?._id)}
                        size="xs"
                      >
                        <HiPencil className={editBtnStyle.icon} />
                      </Button>
                      <Button
                        onClick={() => confirmDelete(item?._id)}
                        className={deleteBtnStyle.btn}
                        size="xs"
                      >
                        <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            ) : (
              !isLoading && (
                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell
                    colSpan={loginRole === SUPER_ADMIN ? 7 : 6}
                    className="text-center py-4 text-DARK-500"
                  >
                    <NoData
                      title="No Discounts Found"
                      message="No discounts are available right now. Added discounts will appear here."
                    />
                  </Table.Cell>
                </Table.Row>
              )
            )}
          </Table.Body>
        </Table>

        {/* Pagination Section */}
        {numOfRecords > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && (
              <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
                <PageSize handleLimit={handleLimit} limit={limit} />
              </div>
            )}
            <div>
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="Are you sure you want to delete this discount ?"
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

      {isFormModalOpen && (
        <DiscountFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          discountId={selectedDiscountId}
          onSuccess={getDiscounts}
        />
      )}
    </div>
  );
};

export default Discounts;