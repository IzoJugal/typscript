import { Button, Table } from "flowbite-react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
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
import { capitalized, labelLayout, setTitle } from "../../utils/utility"
import ListLoader from "../../utils/common/ListLoader"
import AddActionButton from "../../utils/common/AddActionButton"
import ModifierCategoryModal from "./ModifierCategoryModal"
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa"
import SearchInput from "../../utils/common/SearchInput"


interface ICategory {
  _id: string
  name: string
  isActive: boolean
}

const ModifierCategories = () => {
  setTitle("Modifier Categories");
  const socket = useSocket();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [category, setCategory] = useState<ICategory[] | any>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
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
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
  });

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
    const addModifierCategory = (modifierCategory: any) => {
      if (socketAllowDataPermission(modifierCategory)) {
        setCategory((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limitRef.current) {
            updatedData?.pop();
          }
          return [modifierCategory, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateModifierCategory = (modifierCategory: any) => {
      setCategory((prev: any) => prev.map((item: any) => item._id === modifierCategory._id ? modifierCategory : item));
    };
    const deleteModifierCategory = (modifierCategory: any) => {
      const exists = categoryRef.current?.some((item: any) => {
        return String(item._id) === String(modifierCategory._id)
      });
      if (!exists) {
        setIsLoading(false)
        return
      };
      const updatedCategory = categoryRef.current?.filter((cat: any) => cat._id !== modifierCategory?._id);
      setCategory(updatedCategory);
      if (updatedCategory.length === 0) {
        if (pageRef.current > 1) {
          curPage(pageRef.current - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords((prev: number) => prev - 1)
    };

    socket.on("addModifierCategory", addModifierCategory);
    socket.on("updateModifierCategory", updateModifierCategory);
    socket.on("deleteModifierCategory", deleteModifierCategory);

    return () => {
      socket.off("addModifierCategory", addModifierCategory);
      socket.off("updateModifierCategory", updateModifierCategory);
      socket.off("deleteModifierCategory", deleteModifierCategory);
    };
  }, [socket]);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });
  const formDataRef = useRef(formData);
  const searchFilterRef = useRef(searchFilter);
  const categoryRef = useRef(category);
  const limitRef = useRef(limit);
  const pageRef = useRef(page);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { searchFilterRef.current = searchFilter; }, [searchFilter]);
  useEffect(() => { categoryRef.current = category; }, [category]);
  useEffect(() => { limitRef.current = limit; }, [limit]);
  useEffect(() => { pageRef.current = page; }, [page]);
  const columnNames = loginRole === SUPER_ADMIN
    ? ["Sr.No.", "Name", "Business", "Status", "Actions"]
    : ["Sr.No.", "Name", "Status", "Actions"];


  const getCategory = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current,
        name: (searchFilterRef.current?.name || "").toLowerCase().trim(),
      };

      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/modifier/category/all${queryParams}`);

      setCategory(response.data?.categories || []);
      setNumOfRecords(response.data.count || 0);
    } catch (error) {
      console.error('~ getCategory error :-', error);
      setCategory([]);
      setNumOfRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      getCategory();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [page, limit, searchFilter]);

  // Replace the old useEffect for search filter
  useEffect(() => {
    const hasSearchContent = Object.values(searchFilter).some(
      (value) => value !== "" && value !== null && value !== undefined
    );

    if (hasSearchContent && page !== 1) {
      setPage(1);
      setFormData(prev => ({ ...prev, page: 1 }));
    }
  }, [searchFilter, page]);

  const updateURL = useCallback((newPage: number) => {
    const combined = {
      page: newPage,
      limit,
      ...searchFilter
    };
    const queryParams = createQueryParams(combined);
    setSearchParams(queryParams);
    navigate(`/modifire/category/${newPage}${queryParams}`);
  }, [limit, searchFilter, navigate, setSearchParams]);

  const curPage = (pageNum: number) => {
    setPage(pageNum);
    setFormData(prev => ({ ...prev, page: pageNum }));
    updateURL(pageNum);
  };

  const handleLimit = (newLimit: number) => {
    setLimit(newLimit);
    setFormData(prev => ({ ...prev, limit: newLimit }));
    curPage(1); // reset to page 1
  };

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

  const handleDelete = async () => {
    setIsModalOpen(false);
    const deleteId = selectedId;
    setSelectedId(null);
    if (!deleteId) return;
    try {
      setIsLoading(true)
      const response = await apiClient.post(`/modifier/category/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      setCategory((prev: any) => {
        const updated = prev?.filter((category: any) => category._id !== deleteId) || [];
        if (updated.length === 0 && pageRef.current > 1) {
          curPage(pageRef.current - 1);
        }
        return updated;
      });
      setNumOfRecords((prev: number) => prev - 1);
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

  const [isModalOpenAdd, setIsModalOpenAdd] = useState(false);

  const handleOpenAddModal = () => {
    setSelectedId("");
    setIsModalOpenAdd(true);
  };

  const handleOpenEditModal = (id: string) => {
    setSelectedId(id);
    setIsModalOpenAdd(true);
  };

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Modifier Categories" />
        </div>

        {/* Filters Section */}
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

            <div className="shrink-0">
              <span onClick={handleOpenAddModal} className="cursor-pointer inline-block">
                <AddActionButton text="Add a new modifier category" />
              </span>
            </div>
          </div>

          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters
                searchFilter={searchFilter}
                loginRole={loginRole}
                setSearchFilter={setSearchFilter}
                module="modifierCategory"
              />
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
                {/* <Loader /> */}
                <ListLoader />
              </Table.Cell>
            </Table.Row>}
            {(category && category?.length > 0) && !isLoading ?
              category?.map((category: any, index: number) => (
                <Table.Row key={category?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(category.name)}>{capitalized(category.name) ?? '-'}</Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(category?.company?.name)}>
                    {capitalized(category?.company?.name) ?? '-'}
                  </Table.Cell>}
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={category.isActive ? 'Activated' : 'DeActivated'}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {category.isActive ? 'Activated' : 'DeActivated'}
                    </span>
                  </Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={category.isActive ? 'Activated' : 'DeActivated'}>
                    {labelLayout(category.isActive ? 'activated' : 'deactivated')}
                  </Table.Cell>

                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => handleOpenEditModal(category._id)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => confirmDelete(category._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : !isLoading && <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Modifier Categories Found"
                    message="No modifier categories are available right now. Added categories will appear here."
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
        message="Are you sure you want to delete this category ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      <ModifierCategoryModal
        isOpen={isModalOpenAdd}
        onClose={() => setIsModalOpenAdd(false)}
        categoryId={selectedId || ""}
      />
    </div>
  )
}

export default ModifierCategories