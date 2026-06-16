import { Button, Table, } from "flowbite-react"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HiPencil } from "react-icons/hi"
import { useCallback, useEffect, useRef, useState } from "react"
import { RiDeleteBin6Line } from "react-icons/ri"
import { toast } from "react-toastify"
import apiClient from "../../../utils/AxiosInstance";
import ConfirmModal from "../../../hooks/ConfirmModal";
import TenderForm from "./TenderForm"
import { DetailHeaderPaths } from "../../../utils/HeaderPaths"
import Pagination from "../../Pagination/Pagination"
import PageSize from "../../Pagination/PageSize"
import TableHeaders from "../../../utils/common/TableHeaders"
import NoData from "../../../utils/common/NoData"
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant"
import { Filters } from "../../../utils/common/Filters"
import { useAuth } from "../../../context/AuthProvider"
import { createQueryParams } from "../../../utils/functions"
import { useSocket } from "../../../context/SocketProvider"
import { capitalized, labelLayout } from "../../../utils/utility"
import ListLoader from "../../../utils/common/ListLoader"
import AddActionButton from "../../../utils/common/AddActionButton"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../../utils/common/SearchInput"

interface ITender {
  _id: string;
  name: string;
  displayName: string;
  isCash: boolean;
  isSurcharge: boolean;
  surchargeAmount: number;
  amount: number;
  order: string;
  company: { _id: string, name: string };
  type: 'percentage' | 'fixed';
  isActive: boolean;
}
const Tender = () => {
  const { userData } = useAuth();
  const [tenderDetail, setTenderDetail] = useState<ITender[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tenderId, setTenderId] = useState('');
  const [tenderData, setTenderData] = useState<any>({});
  // const [nameFilter, setNameFilter] = useState('');
  // const [statusFilter, setStatusFilter] = useState('');
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
  });

  const [queryData, setQueryData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const queryDataRef = useRef(queryData);
  useEffect(() => {
    queryDataRef.current = queryData;
  }, [queryData]);

  const columnNames = loginRole === SUPER_ADMIN ? ["Sr.No.", "Tender Name", "Display As", "Business", "Order", "Status", "Actions"]
    : ["Sr.No.", "Tender Name", "Display As", "Order", "Status", "Actions"]

  const getTender = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...queryDataRef.current,
        ...searchFilterRef.current
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/tender/all${queryParams}`,)
      setTenderDetail(response.data.tenders)
      setNumOfRecords(response.data.count)
      setIsLoading(false)
    } catch (error) {
      setTenderDetail([])
      setIsLoading(false)
      console.error('~ getProduct error :-', error);
    }
  }, []);

  // useEffect(() => {
  //   if (Object.entries(tenderData).length > 0) {
  //     if (!tenderData?.update) {
  //       setTenderDetail((prevData: any) => {
  //         const updatedData = [...prevData];
  //         if (prevData?.length >= limit) {
  //           updatedData?.pop();
  //         }
  //         return [tenderData?.tender, ...updatedData];
  //       });
  //       setNumOfRecords((prev: any) => prev + 1);
  //     }
  //   }
  // }, [tenderData])


  useEffect(() => {
    if (Object.entries(tenderData).length > 0 && tenderData?.success) {
      getTender();
      setTenderData({});
    }
  }, [tenderData])

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getTender();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getTender, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setQueryData((prev) => ({ ...prev, limit: data }));
  };

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/tender/${updatedFormData.page}/${queryParams}`);
  };

  const curPage = (pageNum: any) => {
    if (pageNum !== page) {
      setIsLoading(true)
      setQueryData((prev) => {
        const updatedFormData = { ...prev, page: pageNum };
        updateURL(updatedFormData);
        return updatedFormData;
      });
    }
    setPage(pageNum);
  };

  useEffect(() => {
    if (Object.values(searchFilter).some((value) => value !== "") ||
      Object.values(searchFilter).every((value) => value === "")) {

      if (queryData?.page !== 1) {
        setQueryData((prev) => ({ ...prev, page: 1 }));
        setPage(1);
      }
    }
  }, [searchFilter]);


  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const limitFromURL = parseInt(searchParams.get("limit") || "10", 10);

    setQueryData((prev) => ({
      ...prev,
      page: pageFromURL,
      limit: limitFromURL,
    }));

    setPage(pageFromURL);
    setLimit(limitFromURL);
  }, []);

  const navigateSearchPrams = useCallback(() => {
    setIsLoading(true);
    updateURL(queryDataRef.current);
    setLimit(queryDataRef.current?.limit)
    setPage(queryDataRef.current?.page);
  }, [searchFilter, queryData]);

  useEffect(() => {
    navigateSearchPrams();
  }, [searchFilter, navigateSearchPrams]);


  const handleDelete = async () => {
    setIsModalOpen(false);
    const deleteId = selectedId;
    setSelectedId(null);
    if (!deleteId) return;
    try {
      setIsLoading(true)
      const response = await apiClient.post(`/tender/delete/${deleteId}`, {});
      setTenderDetail((prev: any) => {
        const updated = prev?.filter((item: any) => item._id !== deleteId) || [];
        if (updated.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return updated;
      });
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response?.data?.message);
      }
      setNumOfRecords((prev: any) => prev - 1);
      getTender();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete tender error:', error);
      toast.error('Failed to delete the tender. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const { pathname } = useLocation();
  const webView = ['/tender/app'];
  const appWebView = webView.includes(pathname);

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
    const addTender = (data: any) => {
      if (socketAllowDataPermission(data)) {
        setTenderDetail((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [data, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateTender = (data: any) => {
      setTenderDetail((prev: any) => prev.map((item: any) => item._id === data._id ? data : item));
    };
    const deleteTender = (data: any) => {
      setTenderDetail((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(data._id));
        if (!exists) return prev;
        const updated = prev.filter((item: any) => item._id !== data?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getTender();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addTender", addTender);
    socket.on("updateTender", updateTender);
    socket.on("deleteTender", deleteTender);

    return () => {
      socket.off("addTender", addTender);
      socket.off("updateTender", updateTender);
      socket.off("deleteTender", deleteTender);
    };
  }, [socket]);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilter = (value: string) => {
    setSearchFilter((prev: any) => ({ ...prev, company: value }))
  }


  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {appWebView === false && <DetailHeaderPaths label="Tender" />}
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
            {!showFilters && (
              <SearchInput
                value={searchFilter.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] self-center"
              />
            )}

            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
              <span onClick={() => setOpenModal(true)}>
                <AddActionButton text="Add a new tender" />
              </span>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="tax" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
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
            {!isLoading && tenderDetail && tenderDetail?.length > 0 ?
              tenderDetail?.map((tender, index) => {
                return <Table.Row key={tender?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(tender.name)}>{capitalized(tender.name) ?? '-'}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(tender.displayName)}>{capitalized(tender.displayName) ?? '-'}</Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(tender?.company?.name)}>{capitalized(tender?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={tender?.order}>{tender?.order ?? '-'}</Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={tender?.isActive ? 'Activated' : 'DeActivated'}>
                    <span className={`items-center px-2 inline-flex w-full justify-center text-xs leading-5 font-semibold rounded-full ${tender?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tender?.isActive ? 'Activated' : 'DeActivated'}
                    </span>
                  </Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={tender?.isActive ? 'Activated' : 'DeActivated'}>
                    {labelLayout(tender?.isActive ? 'Activated' : 'Deactivated')}
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => { setOpenModal(true); setTenderId(tender?._id); }} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => confirmDelete(tender?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              }) : isLoading === false && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Tenders Found"
                    message="No tender entries are available right now. Added tender entries will appear here."
                  />
                </Table.Cell>
              </Table.Row>}
          </Table.Body>
        </Table>
        {numOfRecords > 0 &&
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-DARK-200 dark:border-DARK-700">
            {numOfRecords > 10 && <div className="text-sm text-DARK-600 dark:text-DARK-300 mb-4 sm:mb-0">
              <PageSize
                handleLimit={handleLimit}
                limit={limit}
              />
            </div>}
            <div className="float-right">
              <Pagination
                className="pagination-bar"
                currentPage={page}
                totalCount={numOfRecords}
                pageSize={limit}
                onPageChange={(x: any) => curPage(x)}
              />
            </div>
          </div>}
      </div>
      <ConfirmModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this tender ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />

      <TenderForm setTenderId={setTenderId} openModal={openModal} setOpenModal={setOpenModal} tenderId={tenderId} setTenderData={setTenderData} setTenderDetail={setTenderDetail} setIsLoading={setIsLoading} />
    </div>
  )
}

export default Tender