import { Button, Table, } from "flowbite-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HiPencil, } from "react-icons/hi"
import { useCallback, useEffect, useRef, useState } from "react"
import apiClient from "../../utils/AxiosInstance"
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import { useAuth } from "../../context/AuthProvider"
import TableHeaders from "../../utils/common/TableHeaders"
import { Filters } from "../../utils/common/Filters"
import NoData from "../../utils/common/NoData"
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../utils/common/constant"
import { createQueryParams } from "../../utils/functions"
import { capitalized, labelLayout } from "../../utils/utility"
import { useSocket } from "../../context/SocketProvider"
import ListLoader from "../../utils/common/ListLoader"
import { setTitle } from "../../utils/utility"
import AddActionButton from "../../utils/common/AddActionButton"
import SearchInput from "../../utils/common/SearchInput"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"


interface Room {
  name: string
}
interface ITable {
  _id: string
  name: string
  number: number
  capacity: number
  isFree: boolean
  room: Room
  company: Room
}

const Tables = () => {
  setTitle("Tables");
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [tables, setTables] = useState<ITable[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  // const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);

  const staffCompanyId = loginRole !== SUPER_ADMIN
    ? (userData?.staffMember?.company?._id || "")
    : "";
  // const staffRestaurantId = loginRole !== SUPER_ADMIN && !OWNER_ROLES.includes(loginRole)
  //   ? (userData?.staffMember?.restaurant?._id || "")
  //   : "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    isFree: searchParams.get("isFree") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
    room: searchParams.get("room") || "",
  });
  const debounceRef = useRef<any | null>(null);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });

  const COLUMN_CONFIG = {
    base: [
      "Sr.No.",
      "Name",
      "Room",
      "Table Number",
      "Table Status",
      "Actions"
    ],
    superAdminExtras: ["Business"]
  };
  const columnNames = loginRole === SUPER_ADMIN
    ? [...COLUMN_CONFIG.base.slice(0, 2), ...COLUMN_CONFIG.superAdminExtras, ...COLUMN_CONFIG.base.slice(2)]
    : COLUMN_CONFIG.base;


  const getTables = useCallback(async () => {
    try {
      setIsLoading(true);

      const combinedData = {
        ...formData,
        ...searchFilter,
      };

      const queryParams = createQueryParams(combinedData);

      const response = await apiClient.get(`/table${queryParams}`);

      setTables(response.data?.tables || []);
      setNumOfRecords(response.data?.count || 0);
    } catch (error) {
      setTables([]);
      console.error("~ getTables error :-", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, searchFilter]);

  // useEffect(() => {
  //   const debounceDelay = setTimeout(() => {
  //     getTables();
  //   }, 500);
  //   return () => clearTimeout(debounceDelay);
  // }, [page, limit, getTables, location.search]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      getTables();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [page, limit, searchFilter, formData]);

  const handleLimit = (data: number) => {
    const updatedFormData = {
      page: 1,
      limit: data,
    };

    setLimit(data);
    setPage(1);
    setFormData(updatedFormData);

    updateURL(updatedFormData);
  };

  // const handleLimit = (data: any) => {
  //   curPage(1)
  //   setLimit(data);
  //   setFormData((prev) => ({ ...prev, limit: data }))
  // }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/table/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    setIsLoading(true)
    setFormData((prev) => {
      const updatedFormData = { ...prev, page: pageNum };
      updateURL(updatedFormData);
      return updatedFormData;
    });
    setPage(pageNum);
  };

  // useEffect(() => {
  //   if (Object.values(searchFilter).some((value) => value !== "") ||
  //     Object.values(searchFilter).every((value) => value === "")) {

  //     if (formData?.page !== 1) {
  //       setFormData((prev) => ({ ...prev, page: 1 }));
  //       setPage(1);
  //     }
  //   }
  // }, [searchFilter]);

  useEffect(() => {
    const updatedFormData = {
      ...formData,
      page: 1,
    };

    setPage(1);
    setFormData(updatedFormData);

    updateURL(updatedFormData);
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

  // const navigateSearchPrams = useCallback(() => {
  //   setIsLoading(true);
  //   updateURL(formData);
  //   setLimit(formData?.limit)
  //   setPage(formData?.page);
  // }, [searchFilter, formData,]);

  // useEffect(() => {
  //   navigateSearchPrams();
  // }, [searchFilter, navigateSearchPrams]);


  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    setSelectedId(null);

    try {
      setIsLoading(true)
      const response = await apiClient.post(`/table/${selectedId}`, {});
      const updatedTables = tables?.filter(table => table._id !== selectedId);
      setTables(updatedTables);

      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      getTables();
      if (updatedTables?.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setTimeout(() => {
        setIsLoading(false);
        setNumOfRecords(numOfRecords - 1)
      }, 500);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete table error:', error);
      toast.error('Failed to delete the table. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const socket = useSocket()
  const socketAllowDataPermission = (data: any) => {
    let status = false
    if (loginRole === "Super Admin") {
      status = true
    } else if (MANAGER_ROLES.includes(loginRole)) {
      if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
        status = true
      }
    } else if (!MANAGER_ROLES.includes(loginRole)) {
      if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
        status = true
      }
    }
    return status
  }

  useEffect(() => {
    const addTable = (tableData: any) => {
      if (!socketAllowDataPermission(tableData)) return;

      setTables((prev: any) => {
        const prevTables = Array.isArray(prev) ? prev : [];

        const updated = [tableData, ...prevTables];

        if (updated.length > limit) {
          updated.pop();
        }

        return updated;
      });

      setNumOfRecords((prev: number) => prev + 1);
    };

    const updateTable = (tableData: any) => {
      setTables((prev: any) =>
        prev.map((item: any) =>
          item._id === tableData._id ? tableData : item
        )
      );
    };

    const deleteTable = (data: any) => {
      setTables((prev: any) => {
        const updated = prev.filter(
          (item: any) => String(item._id) !== String(data._id)
        );

        return updated;
      });

      setNumOfRecords((prev: number) =>
        prev > 0 ? prev - 1 : 0
      );
    };

    socket.on("addTable", addTable);
    socket.on("updateTable", updateTable);
    socket.on("deleteTable", deleteTable);

    return () => {
      socket.off("addTable", addTable);
      socket.off("updateTable", updateTable);
      socket.off("deleteTable", deleteTable);
    };
  }, [socket, limit]);

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Tables" />
        </div>

        {/* Filters Section */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <button
              className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white whitespace-nowrap"
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

          <div className="w-full sm:w-auto flex justify-start sm:justify-end">
            <Link to="/table/add" className="w-full sm:w-auto">
              <AddActionButton text="Add a new table" />
            </Link>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mb-4" : "max-h-0 opacity-0 overflow-hidden"
            }`}
        >
          <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
            <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="tables" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />
          <Table.Body className="divide-y">
            {isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
              <Table.Cell colSpan={8} className="text-center py-4">
                <ListLoader />
              </Table.Cell>
            </Table.Row>}
            {tables && tables?.length > 0 && !isLoading ?
              tables?.map((table, index) => (
                <Table.Row key={table?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={`${index + 1}`}>{index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(table?.name)}>{capitalized(table?.name) ?? '-'}</Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(table?.company?.name)}>{capitalized(table?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(table?.room?.name)}>{capitalized(table?.room?.name) ?? '-'}</Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${table.capacity}`}>{table.capacity ?? '-'}</Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={`${table.number}`}>{table.number ?? '-'}</Table.Cell>

                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 py-4 justify-center" title={`${table.isFree ? 'Free' : 'Booked'}`}>
                    {labelLayout(table.isFree ? 'Free' : 'Booked')}
                  </Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300 py-4 justify-center" title={`${table.isFree ? 'Free' : 'Booked'}`}>
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full truncate min-w-16 justify-center ${table.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {table.isFree ? 'Free' : 'Booked'}
                    </span>
                  </Table.Cell> */}
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button onClick={() => navigate(`/table/edit/${table?._id}`)} className={editBtnStyle.btn} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => confirmDelete(table?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Tables Found"
                    message="No table entries are available right now. Added table entries will appear here."
                  />
                </Table.Cell>
              </Table.Row>}
          </Table.Body>
        </Table>
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
        message="Are you sure you want to delete this table ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default Tables