import { Button, Table, } from "flowbite-react"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HiPencil } from "react-icons/hi"
import { useCallback, useEffect, useRef, useState } from "react"
import apiClient from "../../utils/AxiosInstance"
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "react-toastify"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import TableHeaders from "../../utils/common/TableHeaders"
import { useAuth } from "../../context/AuthProvider"
import { Filters } from "../../utils/common/Filters"
import NoData from "../../utils/common/NoData"
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN, MANAGER_ROLES, divContainerStyle } from "../../utils/common/constant"
import { createQueryParams } from "../../utils/functions"
import { useSocket } from "../../context/SocketProvider"
import * as XLSX from "xlsx";
import { BiExport } from "react-icons/bi"
import { capitalized, labelLayout } from "../../utils/utility"
import ListLoader from "../../utils/common/ListLoader"
// import { useQuickBooks } from "../../context/QuickBooksProvider"
import QuickBooksSyncModel from "../../utils/QuickBooksSyncModel"
import { setTitle } from "../../utils/utility"
import AddActionButton from "../../utils/common/AddActionButton"
import ActionDropdown from "../../utils/common/ActionDropdown"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../utils/common/SearchInput"

interface ICategory {
  _id: string
  name: string
  description: string,
  listingOrder: number | null,
  isActive: boolean
  isBarItem: boolean
  itemColor?: string
  fontColor?: string
  fontSize?: string
  fontType?: string
  background?: string
  mealPeriod?: { name?: string }
  isMeal?: boolean
  parent?: { name?: string }
}

const Categories = () => {
  setTitle("Categories");
  const socket = useSocket();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const navigate = useNavigate();
  const [category, setCategory] = useState<ICategory[] | any>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
  });
  const [btnLoader, setBtnLoader] = useState(false);

  const socketAllowDataPermission = (data: any) => {
    let status = false
    if (loginRole === SUPER_ADMIN) {
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
    const addCategory = (category: any) => {
      if (socketAllowDataPermission(category)) {
        setCategory((prevData: any) => {
          const safeData = Array.isArray(prevData) ? prevData : [];
          const updatedData = [...safeData];
          if (safeData.length >= limit) {
            updatedData.pop();
          }
          return [category, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateCategory = (category: any) => {
      setCategory((prev: any) => prev?.map((item: any) => item._id === category._id ? category : item));
    };
    const deleteCategory = (categoryData: any) => {
      setCategory((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(categoryData._id));
        if (!exists) return prev;
        const updated = prev.filter((cat: any) => cat._id !== categoryData?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getCategory();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addProductCategory", addCategory);
    socket.on("updateProductCategory", updateCategory);
    socket.on("deleteProductCategory", deleteCategory);

    return () => {
      socket.off("addProductCategory", addCategory);
      socket.off("updateProductCategory", updateCategory);
      socket.off("deleteProductCategory", deleteCategory);
    };
  }, [socket]);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    sortBy: 'createdAt',
    order: 'desc',
  });


  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const columnNames = loginRole === SUPER_ADMIN
    ? ["Sr.No.", "Name", "Business", "Listing Order", "Item Type (Bar/Kitchen)", "Status", "Actions"]
    : ["Sr.No.", "Name", "Listing Order", "Item Type (Bar/Kitchen)", "Status", "Actions"];

  const sortColumn = ["Name"];
  const getCategory = useCallback(async () => {
    try {
      setIsLoading(true)
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/category${queryParams}`,);
      setCategory(response.data?.categories);
      setNumOfRecords(response.data.count)
      setIsLoading(false)
    } catch (error) {
      setCategory([])
      setIsLoading(false)
      console.error('~ getCategory error :-', error);
    }
  }, []);



  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getCategory();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getCategory, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }));
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/category/${updatedFormData.page}/${queryParams}`);
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
    updateURL(formDataRef.current);
    setLimit(formDataRef.current?.limit)
    setPage(formDataRef.current?.page);
  }, [searchFilter, formData]);

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
      const response = await apiClient.post(`/category/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      setCategory((prev: any) => {
        const updated = prev?.filter((c: any) => c._id !== deleteId) || [];
        if (updated.length === 0 && page > 1) {
          curPage(page - 1);
        }
        return updated;
      });
      setNumOfRecords((prev: any) => prev - 1);
      getCategory();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete category error:', error);
      toast.error('Failed to delete the category. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const exportToExcel = async () => {
    try {
      setBtnLoader(true);

      const queryParams = createQueryParams(searchFilterRef.current);
      const response = await apiClient.get(`/category${queryParams}`,);
      const { data } = response;
      if (!data?.success || !data?.categories?.length) {
        toast.error(data?.message || "No products found");
        return;
      }
      const allCategory: ICategory[] = response.data.categories;
      // Map the data to Excel sheet format
      const ws = XLSX.utils.json_to_sheet(allCategory?.map(item => ({
        Name: item?.name,
        Description: item?.description,
        listingOrder: item?.listingOrder,
        parentCategory: item?.parent?.name,
        mealPeriod: item?.mealPeriod?.name,
        background: item?.background,
        fontType: item?.fontType,
        fontSize: item?.fontSize,
        fontColor: item?.fontColor,
        itemColor: item?.itemColor,
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Categories");

      XLSX.writeFile(wb, "Categories.xlsx");

      setBtnLoader(false);

    } catch (error) {
      setBtnLoader(false);
      console.error('Error exporting to excel:', error);
    } finally {
      setBtnLoader(false);
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Categories" />
        </div>

        {/* Filter and Search Section */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="flex gap-4 items-center flex-1 sm:flex-initial">
              <button
                className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-BRAND-600 border border-BRAND-500 px-4 py-2.5 rounded-full bg-white dark:bg-DARK-800 dark:text-white dark:border-DARK-600 transition-all duration-300 hover:bg-BRAND-500 hover:text-white dark:hover:bg-DARK-500 dark:hover:text-white shrink-0"
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

            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
              <ActionDropdown
                actions={[
                  {
                    label: btnLoader ? "Exporting..." : "Export to Excel",
                    Icon: BiExport,
                    onClick: exportToExcel,
                  },
                ]}
              />

              <Link to="/category/add">
                <AddActionButton text="Add a new category" />
              </Link>
            </div>
          </div>

          {/* Collapsible Filters Expansion Panel */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters
                searchFilter={searchFilter}
                loginRole={loginRole}
                setSearchFilter={setSearchFilter}
                module="category"
                userData={userData}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          {/* <TableHeaders columnNames={columnNames} /> */}
          <TableHeaders
            columnNames={columnNames}
            formData={formData}
            setFormData={setFormData as React.Dispatch<React.SetStateAction<Record<string, any>>>}
            sortColumn={sortColumn}
          />

          <Table.Body className="divide-y">
            {isLoading ? (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4">
                  {/* <Loader /> */}
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            ) : category?.length > 0 ? (
              category?.map((categoryItem: any, index: number) => (
                <Table.Row key={categoryItem._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell title={capitalized(categoryItem.name)}>
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">{capitalized(categoryItem.name) ?? '-'}</span>
                      <span className="text-xs">{!categoryItem.parent ? 'Main category' : `Child category of ${categoryItem?.parent?.name}`}</span>
                    </div>
                  </Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(categoryItem?.company?.name)}>
                    {capitalized(categoryItem?.company?.name) ?? '-'}
                  </Table.Cell>}
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={categoryItem.description}>
                      {categoryItem.description ?? '-'}
                    </Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={categoryItem.listingOrder}>
                    {categoryItem.listingOrder}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={categoryItem.isBarItem ? 'Bar' : 'Kitchen'}>
                    {labelLayout(categoryItem.isBarItem ? 'bar' : 'kitchen')}
                  </Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={categoryItem.isBarItem ? 'Bar' : 'Kitchen'}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryItem.isBarItem ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {categoryItem.isBarItem ? 'Bar' : 'Kitchen'}
                    </span>
                  </Table.Cell> */}
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={categoryItem.isActive ? 'Activated' : 'Deactivated'}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {categoryItem.isActive ? 'Activated' : 'Deactivated'}
                    </span>
                  </Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={categoryItem.isActive ? 'Activated' : 'Deactivated'}>
                    {labelLayout(categoryItem.isActive ? 'activated' : 'deactivated')}
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/category/edit/${categoryItem._id}`)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => confirmDelete(categoryItem._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Categories Found"
                    message="No menu categories are available right now. Added categories will appear here."
                  />
                </Table.Cell>
              </Table.Row>
            )}
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
        message="Are you sure you want to delete this category ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      {openModal && <QuickBooksSyncModel syncType="categories" openModal={openModal} setOpenModal={setOpenModal} />}

    </div>
  )
}

export default Categories