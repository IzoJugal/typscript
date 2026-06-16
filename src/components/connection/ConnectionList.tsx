import { Button, Table, } from "flowbite-react"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HiPencil } from "react-icons/hi"
import { useCallback, useEffect, useState } from "react"
import apiClient from "../../utils/AxiosInstance"
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import AddButton from "../../utils/common/AddButton"
import TableHeaders from "../../utils/common/TableHeaders"
import { useAuth } from "../../context/AuthProvider"
import { Filters } from "../../utils/common/Filters"
import NoData from "../../utils/common/NoData"
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN } from "../../utils/common/constant"
import { createQueryParams } from "../../utils/functions"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import { capitalized, labelLayout, setTitle } from "../../utils/utility"
import ListLoader from "../../utils/common/ListLoader"
import { useQuickBooks } from "../../context/QuickBooksProvider"
import { IoSettingsSharp } from "react-icons/io5"
import { VscDebugDisconnect } from "react-icons/vsc";
import SearchInput from "../../utils/common/SearchInput"



interface IConnection {
  _id: string
  name: string
  realmId: string
  size: number,
  company: {
    name: string
  };
  restaurant?: {
    name: string
  }
  isActive: boolean
}
const ConnectionList = () => {
  setTitle("Connections");
  const { userData } = useAuth();
  const { setQuickBooksData } = useQuickBooks()
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [data, setData] = useState<IConnection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisconnect, setIsDisconnect] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || "",
    isFree: searchParams.get("isFree") || "",
    restaurant: searchParams.get("restaurant") || "",
  });

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });
  const columnNames = loginRole === SUPER_ADMIN
    ? ["Sr.No.", "Name", "Business", "Restaurant", "Status", "Actions"]
    : ["Sr.No.", "Name", "Restaurant", "Status", "Actions"];

  const getConnection = useCallback(async () => {
    try {
      setIsLoading(true)
      const combinedData = {
        ...formData,
        ...searchFilter
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/connection${queryParams}`,);
      setTimeout(() => {
        setData(response.data?.connection);
        setNumOfRecords(response.data.count)
        setIsLoading(false)
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setData([]);
        setIsLoading(false)
      }, 500);
      console.error('~ getConnection error :-', error);
    }
  }, [formData, searchFilter,]);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getConnection();
    }, 500);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, getConnection, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }))
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/connection/${updatedFormData.page}/${queryParams}`);
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

  useEffect(() => {
    if (Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")) {

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
    updateURL(formData);
    setLimit(formData?.limit)
    setPage(formData?.page);
  }, [searchFilter, formData,]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);


  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    setSelectedId(null);

    try {
      setIsLoading(true)
      const response = await apiClient.post(`/connection/delete/${selectedId}`, {});
      const updatedItem = data?.filter(item => item._id !== selectedId);
      setData(updatedItem);
      setQuickBooksData(updatedItem)
      toast.success(response.data.message);
      getConnection();
      if (updatedItem?.length === 0) {
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
      console.log('Delete connection error:', error);
      toast.error('Failed to delete the connection. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!selectedId) return;
    setIsDisconnect(false);
    setSelectedId(null);

    try {
      setIsLoading(true)
      const response = await apiClient.get(`/connection/quickbook/disconnect?id=${selectedId}`);
      if (response.data.success) {
        toast.success(response.data.message);
        getConnection();
      } else {
        toast.error(response.data.message);
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setIsLoading(false)
      console.log('disconnect connection error:', error);
      toast.error('Failed to disconnect the connection. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const confirmDisconnect = (id: string) => {
    setSelectedId(id);
    setIsDisconnect(true);
  };

  const [showFilters, setShowFilters] = useState(false);
  return (
    <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
      {/* <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex">
        <DetailHeaderPaths label="Connection" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col xs:flex-row justify-between gap-2 mb-2">
        <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="connection" />
        <div className="group relative">
          <Link to="/connection/add">
            <AddButton msg="Add a new connection" />
          </Link>
        </div>
      </div> */}
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Connection" />

          
        </div>

        {/* Filters Section */}
        <div className="mt-0">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex gap-4 w-full sm:w-auto">
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
              {!showFilters &&
                <SearchInput
                  value={searchFilter.name}
                  onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                  placeholder="Search..."
                  className="h-[42px] self-center flex-1 sm:flex-none"
                />
              }
            </div>

         <div className="flex items-center sm:justify-end sm:ms-auto w-full sm:w-auto">
           <div className="group relative w-full sm:w-auto">
            <Link to="/connection/add" className="block w-full sm:w-auto">
              <AddButton msg="Add a new connection" />
            </Link>
          </div>
         </div>

          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="connection" />
            </div>
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
            {data && data?.length > 0 && !isLoading ?
              data?.map((item, index) => (
                <Table.Row key={item?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={`${index + 1}`}>{index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item?.name)}>
                    <span className="flex flex-col">
                      {capitalized(item?.name) ?? '-'}
                      {item?.realmId && <span className="text-xs text-end bg-BRAND-500 w-32 text-white rounded p-1">
                        QuickBook Connected
                      </span>}
                    </span>
                  </Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.company?.name)}>{capitalized(item?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(item?.restaurant?.name)}>{capitalized(item?.restaurant?.name) ?? '-'}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                    {labelLayout(item?.isActive ? 'activated' : 'deactivated')}
                  </Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Activated' : 'DeActivated'}
                    </span>
                  </Table.Cell> */}

                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/connection/settings/${item?._id}`)} size="xs"><IoSettingsSharp className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => navigate(`/connection/edit/${item?._id}`)} className={editBtnStyle.btn} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    {item?.realmId && <Button onClick={() => confirmDisconnect(item?._id)} className={deleteBtnStyle.btn} size="xs"><VscDebugDisconnect className={deleteBtnStyle.icon} /></Button>}
                    <Button onClick={() => confirmDelete(item?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Connections Found"
                    message="No connections are available right now. Added connections will appear here." />
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
        message="Are you sure you want to delete this item ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <ConfirmModal
        isOpen={isDisconnect}
        message="Are you sure you want to disconnect this item from QuickBooks?"
        onConfirm={handleDisconnect}
        onCancel={() => setIsDisconnect(false)}
      />
    </div>
  )
}

export default ConnectionList