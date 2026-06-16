import { useCallback, useEffect, useRef, useState } from "react";
import { HiEye } from "react-icons/hi";
// import { BsEyeFill } from "react-icons/bs";
// import { FiEye } from "react-icons/fi";
// import { RiDeleteBin6Line } from "react-icons/ri";
import {
  Link,
  useLocation,
  // useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import apiClient from "../../utils/AxiosInstance";
import Pagination from "../Pagination/Pagination";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { Button, Checkbox, Table, ToggleSwitch } from "flowbite-react";
import PageSize from "../Pagination/PageSize";
import { createQueryParams } from "../../utils/functions";
import { useAuth } from "../../context/AuthProvider";
import { Filters } from "../../utils/common/Filters";
import NoData from "../../utils/common/NoData";
import { editBtnStyle, SUPER_ADMIN, MANAGER_ROLES, deleteBtnStyle, divContainerStyle, OWNER_ADMIN_ROLES } from "../../utils/common/constant";
import { capitalized, formatDate, formatTime, labelLayout, setTitle } from "../../utils/utility";
import { useSocket } from "../../context/SocketProvider";
import { IOrder } from "../../utils/common/Interface/OrderInterface";
import { TbTrash } from "react-icons/tb";
import ConfirmModal from "../../hooks/ConfirmModal";
import { toast } from "react-toastify";
import ListLoader from "../../utils/common/ListLoader";
import CustomerView from "../customers/CustomerView";
import ViewStaff from "../staff/ViewStaff";
import { MdCancelPresentation } from "react-icons/md";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

const Orders = () => {
  setTitle("Orders");
  const socket = useSocket();
  const { userData } = useAuth();
    const { configData } = useConfigs();
  // const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const {
    role: { name: loginRole } = { name: SUPER_ADMIN },
    permissions,
    _id: userId,
  } = userData?.staffMember;
  const featureConfig = userData?.featureConfig;
  const location = useLocation();
  const columnNames = [
    "SR.No.",
    "Order",
    "Customer",
    "Server",
    "Amount",
    "Tip",
    "Order Type",
    "Status",
    "Order Date",
    "Action",
  ];
  if (loginRole === SUPER_ADMIN) {
    const staffIndex = columnNames.indexOf("Server");
    if (staffIndex !== -1) {
      columnNames.splice(staffIndex + 1, 0, "Business");
    }
  }

  const shouldRemoveOrder =
    (featureConfig?.order_features?.remove_order === true &&
      OWNER_ADMIN_ROLES.includes(loginRole)) ||
    loginRole === SUPER_ADMIN;
  const [enableMultiRemove, setEnableMultiRemove] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const hideSidebarRoutes = ["/order/app"];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  const [ordersList, setOrdersList] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const staffCompanyId = loginRole !== SUPER_ADMIN
    ? (userData?.staffMember?.company?._id || "")
    : "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    status: searchParams.get("status") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    restaurant: searchParams.get("restaurant") || "",
    orderType: searchParams.get("orderType") || "",
  });
  const debounceRef = useRef<any | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    source: "web",
  });

  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [selectCustomerId, setSelectCustomerId] = useState("");
  const [openServerModal, setOpenServerModal] = useState(false);
  const [selectServerId, setSelectServerId] = useState("");
  const [selectCustomer, setSelectCustomer] = useState<any>(null);
  const [isRemoveBtnLoading, setISRemoveBtnLoading] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const formDataRef = useRef(formData);
  const searchFilterRef = useRef(searchFilter);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);


  const handleCustomerView = (customer: any) => {
    if (customer) {
      setOpenCustomerModal(true);
      setSelectCustomerId(customer?._id);
      setSelectCustomer(customer);
    }
  };
  const handleServerView = (id: any) => {
    if (id) {
      setOpenServerModal(true);
      setSelectServerId(id);
    }
  };

  const socketAllowDataPermission = (data: any) => {
    let status = false;
    if (loginRole === SUPER_ADMIN) {
      status = true;
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (
        userData?.staffMember?.company?._id ===
        (data?.company?._id || data?.company) ||
        permissions.includes("all_orders")
      ) {
        status = true;
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if (
        userId === (data?.server?._id || data?.server) ||
        permissions.includes("all_orders")
      ) {
        status = true;
      }
    }
    return status;
  };

  useEffect(() => {
    const saveOrder = (data: any) => {
      if (socketAllowDataPermission(data)) {
        setOrdersList((prevData: any) => {
          const existingIndex = prevData.findIndex(
            (item: any) => item._id === data._id
          );
          let updatedData = [...prevData];

          if (existingIndex !== -1) {
            updatedData[existingIndex] = data;
          } else {
            if (updatedData.length >= limit) {
              updatedData.pop();
            }
            updatedData = [data, ...updatedData];
          }

          return updatedData;
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };

    const multipleOrders = (data: any) => {
      if (socketAllowDataPermission(data[0])) {
        data.forEach((order: any) => {
          setOrdersList((prevData: any) => {
            let updatedData = [...prevData];
            const index = updatedData.findIndex(
              (item: any) => item._id === order._id
            );
            if (index !== -1) {
              updatedData[index] = order;
            } else {
              updatedData = [order, ...updatedData];
              if (updatedData.length > limit) {
                updatedData.pop();
              }
            }

            return updatedData;
          });
        });

        setNumOfRecords((prev: any) => prev + 1);
      }
    };

    const addTip = (data: any) => {
      setOrdersList((prev: IOrder[]) => {
        const updatedOrders = prev.map((order) =>
          order._id === data._id ? { ...order, tip: data.tip } : order
        );
        return updatedOrders;
      });
    };

    const mergedTableOrders = (data: {
      oldOrderIds: string[];
      orderResponse: IOrder | IOrder[];
    }) => {
      const { oldOrderIds = [], orderResponse } = data;

      setOrdersList((prevData: IOrder[]) => {
        const filteredOrders = prevData.filter(
          (order) => !oldOrderIds.includes(order._id)
        );
        const newOrdersArray = (
          Array.isArray(orderResponse) ? orderResponse : [orderResponse]
        ).filter(Boolean);
        const newOrders = newOrdersArray.filter(
          (newOrder) =>
            !filteredOrders.some(
              (existingOrder) => existingOrder._id === newOrder._id
            )
        );
        return [...newOrders, ...filteredOrders];
      });
    };

    const deMergedTableOrders = (data: {
      demergedOrders: IOrder[];
      demergedOrderId: string;
    }) => {
      const { demergedOrders = [], demergedOrderId } = data;
      setOrdersList((prevData: IOrder[]) => {
        const filteredData = prevData.filter(
          (order) => order._id !== demergedOrderId
        );
        const uniqueDemergedOrders = demergedOrders.filter(
          (newOrder) =>
            !filteredData.some(
              (existingOrder) => existingOrder._id === newOrder._id
            )
        );
        const updatedData = [...filteredData, ...uniqueDemergedOrders];
        return updatedData.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    };

    const testSocket = (data: any) => {
      if (data) {
        // console.log("data", data);
      }
    };

    const deleteProduct = (data: any) => {
      // console.log("data", data);
      const { orderData } = data;
      const cartItems = orderData?.cartItems || [];
      const updatedCart =
        orderData.orderType === "table"
          ? cartItems[0]?.products || []
          : cartItems;
      setOrdersList((prevData: any[]) => {
        return prevData.map((item: any) => {
          if (item._id === orderData._id) {
            return {
              ...item,
              ...orderData,
              cartItems: updatedCart,
            };
          }
          return item;
        });
      });
    };

    const removeOrder = (orderIds: any) => {
      if (!Array.isArray(orderIds) || orderIds.length === 0) return;

      setOrdersList((prevData: IOrder[]) => {
        // const removedOrders = prevData.filter(order => orderIds.includes(order._id));
        const updatedOrders = prevData.filter(
          (order) => !orderIds.includes(order._id)
        );

        // console.log("Removed orders:", removedOrders);

        return updatedOrders;
      });
      getOrders();
    };

    socket.on("newOrder", saveOrder);
    socket.on("newSocketOrder", saveOrder);
    socket.on("splitMainOrder", saveOrder);
    socket.on("multipleOrders", multipleOrders);
    socket.on("addTip", addTip);
    socket.on("mergedTableOrders", mergedTableOrders);
    socket.on("deMergedTableOrders", deMergedTableOrders);
    socket.on("testSocket", testSocket);
    socket.on("deleteProduct", deleteProduct);
    socket.on("removeOrder", removeOrder);

    return () => {
      socket.off("newOrder");
      socket.off("multipleOrders");
      socket.off("newSocketOrder");
      socket.off("addTip");
      socket.off("mergedTableOrders");
      socket.off("deMergedTableOrders");
      socket.off("splitMainOrder");
      socket.off("testSocket");
      socket.off("deleteProduct");
      socket.off("removeOrder");
    };
  }, [socket]);

  const getOrders = useCallback(async () => {
    try {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();

      setIsLoading(true);

      // Read directly from ref values to avoid stale closure
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current,
      };

      const queryParams = createQueryParams(combinedData);

      const response = await apiClient.get(`/order${queryParams}`, {
        signal: controllerRef.current.signal,
      });

      if (response.data.success) {
        setOrdersList(response.data.orders);
        setNumOfRecords(response.data.count);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        console.error("Error fetching orders:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setFormData(prev => ({
      ...prev,
      page: 1,
    }));
  }, [searchFilter]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      getOrders();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [page, limit, getOrders, searchFilter]);

  const handleLimit = (newLimit: number) => {
    const updatedFormData = {
      ...formDataRef.current,
      page: 1,
      limit: newLimit,
    };

    setPage(1);
    setLimit(newLimit);
    setFormData(updatedFormData);
    updateURL(updatedFormData);
  };


  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    // setSearchParams(queryParams);
    // navigate(`/order/${updatedFormData.page}${queryParams}`);
    setSearchParams(queryParams);
  };

  const curPage = (pageNum: any) => {
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setPage(pageFromURL);
    setLimit(limitFromURL);

    setFormData(prev => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));
  }, [searchParams]);

  useEffect(() => {
    const updatedFormData = {
      ...formDataRef.current,
      page: 1,
    };

    updateURL(updatedFormData);
  }, [searchFilter]);

  const saveTip = async (e: any, oId: string) => {
    const { value } = e.target;
    setOrdersList((prev: IOrder[]) =>
      prev.map((order: IOrder) =>
        order._id === oId ? { ...order, tip: value } : order
      )
    );

    try {
      const response: any = await apiClient.post(`/order/tip/${oId}`, {
        tip: value,
        source: "web",
      });
      if (response?.status === 200) {
        console.log("Tip saved successfully");
      }
    } catch (error) {
      console.error("Error saving tip:", error);
    }
  };

  const confirmCancel = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleCancelOrder = async () => {
    try {
      setIsLoadingBtn(true);
      const response: any = await apiClient.patch(
        `/order/cancel-order/${selectedId}`
      );
      const { success, order, message } = response.data;
      if (success) {
        setOrdersList((prev: IOrder[]) =>
          prev.map((o: IOrder) =>
            o._id === order._id ? { ...o, status: order.status } : o
          )
        );
        toast.success(message);
      } else {
        toast.warning(message);
      }
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast.error(error.message);
    } finally {
      setIsLoadingBtn(false);
      setIsModalOpen(false);
    }
  };

  const groupColorClasses = [
    "!border-l-4 !border-l-blue-500 dark:!border-l-blue-600",
    "!border-l-4 !border-l-green-500 dark:!border-l-green-600",
    "!border-l-4 !border-l-indigo-500 dark:!border-l-indigo-600",
    "!border-l-4 !border-l-amber-500 dark:!border-l-amber-600",
    "!border-l-4 !border-l-red-500 dark:!border-l-red-600",
  ];

  const orderGroups: Record<string, number> = {};
  let groupCounter = 0;

  ordersList.forEach((order) => {
    const groupKey = order.isSplitOrder
      ? order._id
      : order.splitOrderId ?? order._id;
    if (!orderGroups[groupKey]) {
      orderGroups[groupKey] = groupCounter++ % groupColorClasses.length;
    }
  });

  const HandleRemoveOrder = async () => {
    try {
      setISRemoveBtnLoading(true);
      const response: any = await apiClient.post(`/order/remove-order`, {
        orderIds: selectedOrders,
      });
      if (response?.data?.success) {
        toast.success(
          response?.data?.message ||
          "Order Remove process completed successfully."
        );
      }
    } catch (error: any) {
      console.error("~ remove order error :-", error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );
    } finally {
      setSelectAll(false);
      setSelectedOrders([]);
      setISRemoveBtnLoading(false);
      setIsRemoveModalOpen(false);
    }
  };


  return (
    <div className={divContainerStyle}>
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-1">
            {!shouldHideSidebar && (
              <div className="flex items-center">
                <DetailHeaderPaths label="Orders" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">

           <div className="flex gap-4 items-center">
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

              {!showFilters && (
                <SearchInput
                  value={searchFilter.name}
                  onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                  placeholder="Search..."
                  className="h-[42px] self-center"
                />
              )}
            </div>

            {shouldRemoveOrder && (
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <label className="flex items-center gap-2 text-sm font-medium text-DARK-700 dark:text-DARK-300 whitespace-nowrap">
                  Remove Order
                  <ToggleSwitch
                    color="success"
                    checked={enableMultiRemove}
                    onChange={(val) => {
                      setEnableMultiRemove(val);
                      if (!val) {
                        setSelectedOrders([]);
                        setSelectAll(false);
                      }
                    }}
                  />
                </label>

                {enableMultiRemove && (
                  <Button
                    color="blue"
                    className="!bg-BRAND-500 hover:!bg-BRAND-600 focus:!ring-0 w-28 h-10 flex items-center justify-center gap-1"
                    disabled={selectedOrders?.length === 0}
                    onClick={() => { setIsRemoveModalOpen(true) }}
                  >
                    <TbTrash className="h-5 w-5" />
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters
                searchFilter={searchFilter}
                loginRole={loginRole}
                setSearchFilter={setSearchFilter}
                module="orders"
              />
            </div>
          </div>
        </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto overflow-y-visible border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          {/* <TableHeaders columnNames={columnNames} /> */}
          <Table.Head>
            {enableMultiRemove && (
              <Table.HeadCell className="bg-BRAND-100 dark:bg-slate-700 dark:text-white select-none">
                <Checkbox
                  checked={selectAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);

                    if (checked) {
                      const allIds = ordersList.map((o) => o._id);
                      setSelectedOrders(allIds);
                    } else {
                      setSelectedOrders([]);
                    }
                  }}
                  className="cursor-pointer checked:!bg-BRAND-500 focus:!ring-0"
                />
              </Table.HeadCell>
            )}

            {columnNames.map((name) => (
              <Table.HeadCell
                className="bg-BRAND-100 dark:bg-slate-700 dark:text-white select-none"
                key={name}
              >
                {name}
              </Table.HeadCell>
            ))}
          </Table.Head>

          <Table.Body className="divide-y divide-DARK-200 dark:divide-DARK-800">
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={12} className="text-center py-6">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            ) : ordersList?.length > 0 ? (
              ordersList.map((order: IOrder, index: number) => {
                const groupKey = order.splitOrderId ?? order._id;

                if (!(groupKey in orderGroups)) {
                  orderGroups[groupKey] =
                    groupCounter++ % groupColorClasses.length;
                }

                const grpColorClass = groupColorClasses[orderGroups[groupKey]];
                return (
                  <Table.Row
                    key={order._id}
                    className={`${grpColorClass} ${order?.isSplitOrder
                      ? "bg-DARK-200 dark:bg-DARK-800"
                      : "bg-white dark:bg-DARK-900 hover:bg-DARK-50 dark:hover:bg-DARK-800"
                      } transition-colors duration-150`}
                  >
                    {enableMultiRemove && (
                      <Table.Cell className="w-10 text-center">
                        <Checkbox
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => {
                            if (selectedOrders.includes(order._id)) {
                              setSelectedOrders(
                                selectedOrders.filter((id) => id !== order._id)
                              );
                              setSelectAll(false);
                            } else {
                              const newSelected = [
                                ...selectedOrders,
                                order._id,
                              ];
                              setSelectedOrders(newSelected);
                              if (newSelected.length === ordersList.length) {
                                setSelectAll(true);
                              }
                            }
                          }}
                          className="cursor-pointer checked:!bg-BRAND-500 focus:!ring-0"
                        />
                      </Table.Cell>
                    )}
                    <Table.Cell className="py-4 px-6 font-medium text-DARK-900 dark:text-white">
                      {index + 1 + (page - 1) * limit}
                    </Table.Cell>
                    <Table.Cell
                      className="py-4 px-6 text-sm"
                      title={order?.orderName?.toString() ?? ""}
                    >
                      <Link
                        to={
                          !shouldHideSidebar
                            ? `/order/view/${order?._id}`
                            : `/order/app/${order?._id}`
                        }
                        className="flex flex-col text-DARK-900 dark:text-white hover:!text-BRAND-500 transition-colors duration-150 font-medium"
                      >
                        <span>{order?.orderName ?? "-"}</span>

                        {!order?.splitOrderId && order?.isSplitOrder ? (
                          <span className="text-xs font-normal text-DARK-500">
                            Main Order
                          </span>
                        ) : (
                          order?.splitOrderId && (
                            <span className="text-xs font-normal text-DARK-500">
                              Split #{order?.splitCount}
                            </span>
                          )
                        )}
                      </Link>
                    </Table.Cell>
                    <Table.Cell
                      onClick={() => {
                        handleCustomerView(order?.customerId);
                      }}
                      className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300 ${order?.customerId?._id
                        ? "hover:!text-BRAND-500 cursor-pointer"
                        : ""
                        }`}
                    >
                      {order.customerId?.firstName
                        ? capitalized(
                          `${order?.customerId?.firstName} ${order?.customerId?.lastName}`
                        )
                        : "Guest"}
                    </Table.Cell>
                    <Table.Cell
                      className={`py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300 ${order?.server?.name
                        ? "hover:!text-BRAND-500 cursor-pointer"
                        : ""
                        }`}
                      onClick={() => {
                        handleServerView(order?.server?._id);
                      }}
                    >
                      {capitalized(order.server?.name) ?? "-"}
                    </Table.Cell>
                    {loginRole === SUPER_ADMIN && (
                      <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                        {capitalized(order.company?.name) ?? "-"}
                      </Table.Cell>
                    )}
                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                      {order?.company?.currency?.symbol || "$"}
                      {order?.orderTotalAmount?.toFixed(2) ?? "-"}
                    </Table.Cell>
                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                      {order?.status === "completed" && !order?.isSplitOrder ? (
                        <div className="flex items-center space-x-1">
                          <span>{order?.company?.currency?.symbol || "$"}</span>
                          <input
                            onChange={(e) => saveTip(e, order._id)}
                            type="text"
                            value={order?.tip}
                            name="tip"
                            placeholder="Tip"
                            className="w-16 rounded-lg !border !border-DARK-300 dark:border-DARK-600 focus:ring-2 focus:!ring-BRAND-500 focus:border-transparent px-2 py-1 text-sm dark:bg-DARK-600 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span>{order?.company?.currency?.symbol || "$"}</span>
                          <input
                            type="text"
                            value={0}
                            className="w-16 rounded-lg border-0 bg-DARK-100 dark:bg-DARK-600 text-DARK-500 dark:text-DARK-400 px-2 py-1 text-sm"
                            disabled
                          />
                        </div>
                      )}
                    </Table.Cell>

                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                      {order?.orderType === "product" ? (
                        capitalized(order?.productOrderType)
                      ) : (
                        <span title={`Room: ${capitalized(order?.roomName)}`}>
                          <span className="mr-1">
                            {capitalized(order?.orderType)}
                          </span>
                          <span className="font-medium">
                            ({capitalized(order?.roomName)})
                          </span>
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="flex flex-col items-center justify-center py-4 px-6 text-sm text-center space-y-2">
                      <span>{labelLayout(order?.status)}</span>

                      {order?.canceledType?.toLowerCase() === "void" && (
                        <div className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-500/10 dark:text-amber-400">
                          Voided
                        </div>
                      )}

                      {order?.canceledType?.toLowerCase() === "return" && (
                        <div className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 shadow-sm dark:bg-red-500/10 dark:text-red-400">
                          Returned
                        </div>
                      )}
                    </Table.Cell>

                    <Table.Cell className="py-4 px-6 text-sm text-DARK-600 dark:text-DARK-300">
                      {/* {dayjs(order.orderDate).format("DD/MM/YYYY, hh:mm A") ??
                        "-"} */}
                      {order.orderDate ? (
                        <div className="flex flex-col">
                          {/* Date: Larger and bolder */}
                          <span className="text-xs font-semibold =">
                            {formatDate(order.orderDate,configData?.dateFormat || "DD/MM/YYYY")}
                          </span>
                          {/* Time: Smaller and slightly muted */}
                          <span className="text-xs opacity-80">
                            {formatTime(order.orderDate)}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </Table.Cell>
                    {/* <Table.Cell className="py-4 px-6 text-center flex gap-1">
                      <Link
                        to={
                          !shouldHideSidebar
                            ? `/order/view/${order?._id}`
                            : `/order/app/${order?._id}`
                        }
                      >
                        <Button
                          className={editBtnStyle.btn}
                          size="xs"
                          title="View Order"
                        >
                          <BsEyeFill   className={editBtnStyle.icon} />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                      <Button
                        onClick={() => confirmCancel(order?._id)}
                        className={deleteBtnStyle.btn}
                        size="xs"
                        disabled={
                          order?.status === "cancelled" ||
                          order?.status === "completed"
                        }
                        title="Cancel Order"
                      >
                        <MdCancelPresentation className={deleteBtnStyle.icon} />
                        <span className="sr-only">Order Cancel</span>
                      </Button>
                    </Table.Cell> */}
                    <Table.Cell className="py-4 px-6 text-center flex gap-1">
                      <Link
                        to={
                          !shouldHideSidebar
                            ? `/order/view/${order?._id}`
                            : `/order/app/${order?._id}`
                        }
                      >
                        <Button
                          className={editBtnStyle.btn}
                          size="xs"
                          title="View Order"
                        >
                          <HiEye className={editBtnStyle.icon} />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                      <Button
                        onClick={() => confirmCancel(order?._id)}
                        className={deleteBtnStyle.btn}
                        size="xs"
                        disabled={
                          order?.status === "cancelled" ||
                          order?.status === "completed"
                        }
                        title="Cancel Order"
                      >
                        <MdCancelPresentation className={deleteBtnStyle.icon} />
                        <span className="sr-only">Order Cancel</span>
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell
                  colSpan={11}
                  className="text-center py-10 text-DARK-500 dark:text-DARK-400"
                >
                  <NoData
                    title="No Orders Available"
                    message="No orders available displayed at the moment."
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        {/* Pagination */}
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
        isOpen={isModalOpen}
        message="Are you sure you want to cancel this order?"
        onConfirm={handleCancelOrder}
        onCancel={() => setIsModalOpen(false)}
        isLoadingBtn={isLoadingBtn}
      />
      <ConfirmModal
        isOpen={isRemoveModalOpen}
        message={`Are you sure you want to remove ${selectedOrders?.length} order?`}
        onConfirm={HandleRemoveOrder}
        onCancel={() => setIsRemoveModalOpen(false)}
        isLoadingBtn={isRemoveBtnLoading}
      />
      <CustomerView
        openCustomerModal={openCustomerModal}
        setOpenCustomerModal={setOpenCustomerModal}
        selectCustomerId={selectCustomerId}
        selectCustomer={selectCustomer}
        type={"order"}
      />
      <ViewStaff
        id={selectServerId}
        setId={setSelectServerId}
        open={openServerModal}
        setOpen={setOpenServerModal}
        permission={false}
      />
    </div>
  );
};

export default Orders;
