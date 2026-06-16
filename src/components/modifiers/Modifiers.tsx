//@ts-nocheck
import { Button, Table } from "flowbite-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { HiPencil } from "react-icons/hi"
import { RiDeleteBin6Line } from "react-icons/ri"
import { Link, useLocation, useNavigate, useParams, useSearchParams, } from "react-router-dom"
import { toast } from "react-toastify"
import apiClient from "../../utils/AxiosInstance"
import ConfirmModal from "../../hooks/ConfirmModal"
import Pagination from "../Pagination/Pagination"
import { DetailHeaderPaths } from "../../utils/HeaderPaths"
import PageSize from "../Pagination/PageSize"
import TableHeaders from "../../utils/common/TableHeaders"
import { useAuth } from "../../context/AuthProvider"
import { Filters } from "../../utils/common/Filters"
import NoData from "../../utils/common/NoData"
import { deleteBtnStyle, editBtnStyle, SUPER_ADMIN, MANAGER_ROLES, divContainerStyle } from "../../utils/common/constant"
import { FaAngleDown, FaAngleUp, FaFileDownload, FaFilter } from "react-icons/fa"
import { LuImport } from "react-icons/lu"
import { siteUrl } from "../../environment/env"
import { createQueryParams } from "../../utils/functions"
import { useSocket } from "../../context/SocketProvider"
import { capitalized, labelLayout, setTitle } from "../../utils/utility"
import { BiExport } from "react-icons/bi"
import * as XLSX from "xlsx";
import ListLoader from "../../utils/common/ListLoader"
import QuickBooksSyncModel from "../../utils/QuickBooksSyncModel";
import SearchInput from "../../utils/common/SearchInput"
import AddActionButton from "../../utils/common/AddActionButton"
import ActionDropdown from "../../utils/common/ActionDropdown"


interface Category {
  name: string;
}
interface ItemModifiers {
  _id: string;
  category: Category;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isVeg: boolean;
  modifierCategory: Category;

}

const Modifiers = () => {
  setTitle("Modifiers");
  const socket = useSocket();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const navigate = useNavigate();
  const [modifiersDetail, setModifiersDetail] = useState<ItemModifiers[] | any>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // const { isLoading, setIsLoading } = useLoading();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [statusFilter, setStatusFilter] = useState('');
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const fileInputRef: any = useRef<HTMLInputElement>(null);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
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
    modifiercategory: searchParams.get("modifiercategory") || "",
    isAvailable: searchParams.get("isAvailable") || "",
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
    const addModifier = (modifier: any) => {
      if (socketAllowDataPermission(modifier)) {
        setModifiersDetail((prevData: any) => {
          const updatedData = [...(prevData || [])];
          if (updatedData.length >= limit) {
            updatedData.pop();
          }
          return [modifier, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };
    const updateModifier = (modifier: any) => {
      setModifiersDetail((prev: any) => (prev || []).map((item: any) => item._id === modifier._id ? modifier : item));
    };
    const deleteModifier = (modifier: any) => {
      setModifiersDetail((prev: any) => {
        const exists = prev?.some((item: any) => String(item._id) === String(modifier._id));
        if (!exists) return prev;
        const updated = prev.filter((cat: any) => cat._id !== modifier?._id);
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      getModifiers();
      setNumOfRecords((prev: any) => prev - 1);
    };

    socket.on("addModifier", addModifier);
    socket.on("updateModifier", updateModifier);
    socket.on("deleteModifier", deleteModifier);
    return () => {
      socket.off("addModifier", addModifier);
      socket.off("updateModifier", updateModifier);
      socket.off("deleteModifier", deleteModifier);
    };
  }, [socket]);

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
  });

  const [btnLoader, setBtnLoader] = useState(false);

  const searchFilterRef = useRef(searchFilter);
  useEffect(() => {
    searchFilterRef.current = searchFilter;
  }, [searchFilter]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const columnNames = loginRole === SUPER_ADMIN
    ? ["Sr.No.", "Name", "Business", "Price", "Modifier Category", "Status", "Actions"]
    : ["Sr.No.", "Name", "Price", "Modifier Category", "Status", "Actions"];

  const getModifiers = useCallback(async () => {
    try {
      setIsLoading(true)
      const combinedData = {
        ...formDataRef.current,
        ...searchFilterRef.current
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/modifier${queryParams}`)
      setIsLoading(false)
      setModifiersDetail(response.data.modifiers)
      setNumOfRecords(response.data.count)
    } catch (error) {
      setIsLoading(false)
      setModifiersDetail([])
      console.error('~ getProduct error :-', error);
    }
  }, [])


  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      getModifiers();
    }, 300);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, searchFilter, getModifiers, location.search]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }));
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilterRef.current };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/modifier/${updatedFormData.page}/${queryParams}`);
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
      const response = await apiClient.post(`/modifier/${deleteId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      setModifiersDetail((prev: any) => {
        const updated = prev?.filter((item: any) => item?._id !== deleteId) || [];
        if (updated.length === 0) {
          if (page > 1) {
            curPage(page - 1);
          } else {
            curPage(1);
          }
        }
        return updated;
      });
      setNumOfRecords((prev: any) => prev - 1);
      getModifiers();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete modifier error:', error);
      toast.error('Failed to delete the modifier. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      importProductData(file);
    }
  };

  const importProductData = async (file: any) => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('name', file.name);

    try {
      setIsBtnLoading(true);
      const response = await apiClient.post(`/import-data/modifiers`, data, {
        headers: { 'Content-Type': 'multipart/form-data', }
      });
      if (response.data.success) {
        toast.success('Data imported successfully');
        getModifiers();
      } else {
        toast.error(response?.data?.message || 'Failed to import data');
      }
      console.log('Data imported successfully', response);
    } catch (error) {
      toast.error('An error occurred while importing data');
      console.error('Error importing products:', error);
    } finally {
      setIsBtnLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const exportToExcel = async () => {
    try {
      setBtnLoader(true);

      const queryParams = createQueryParams(searchFilterRef.current);
      const response = await apiClient.get(`/modifier${queryParams}`)
      const { data } = response;
      if (!data?.success || !data?.modifiers?.length) {
        toast.error(data?.message || "No products found");
        return;
      }
      const allModifiers: ItemModifiers[] = response.data.modifiers;
      // Map the data to Excel sheet format
      const ws = XLSX.utils.json_to_sheet(allModifiers.map(item => ({
        Name: item?.name,
        Description: item?.description,
        Price: item?.price,
        Category: item?.category?.name,
        CategoryID: item?.category?._id || '',
        modifierCategory: item?.modifierCategory?.name,
        ModifierCategoryID: item?.modifierCategory?._id || '',
        CompanyID: item?.company?._id || item?.company || '',
        RestaurantID: item?.restaurant?._id || item?.restaurant || '',
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Modifiers");

      XLSX.writeFile(wb, "Modifiers.xlsx");

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
          <DetailHeaderPaths label="Modifiers" />
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

            <div className="flex items-center gap-3 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".csv, .xlsx, .xls"
                disabled={isBtnLoading}
              />

              <ActionDropdown
                actions={[
                  {
                    label: btnLoader ? "Exporting..." : "Export",
                    Icon: BiExport,
                    onClick: exportToExcel,
                    loading: btnLoader,
                  },
                  {
                    label: isBtnLoading ? "Importing..." : "Import",
                    Icon: LuImport,
                    onClick: handleButtonClick,
                    loading: isBtnLoading,
                  },
                  {
                    label: "Template",
                    Icon: FaFileDownload,
                    onClick: () => {
                      const link = document.createElement("a");
                      link.href = `${siteUrl}/files/modifiers_template.xlsx`;
                      link.download = "modifiers_template.xlsx";
                      link.click();
                    },
                  },
                ]}
              />

              <Link to="/modifier/add">
                <AddActionButton text="Add a new modifier" />
              </Link>
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
                module="modifier"
                setIsDropdownOpen={setIsDropdownOpen}
                isDropdownOpen={isDropdownOpen}
              />
            </div>
          </div>
        </div>
      </div>

      {/* <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <div className="w-full sm:w-auto"><Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="modifier" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} /></div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative group"><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv, .xlsx, .xls" disabled={isBtnLoading} /><Button onClick={handleButtonClick} className="bg-gradient-to-r from-BRAND-600 to-BRAND-500 border-0 !ring-0 import-btn whitespace-nowrap">{isBtnLoading ? (<span className="flex items-center"><div className="w-5 h-5 border-4 border-t-transparent border-BRAND-500 border-solid rounded-full animate-spin"></div><span className="ml-2">Importing...</span></span>) : (<>Import Data <LuImport className="inline font-bold text-xl mx-1" /></>)}</Button><span className="absolute left-1/2 transform -translate-x-1/2 bottom-12 z-[11] opacity-0 invisible group-hover:opacity-100 group-hover:visible text-white bg-black text-xs rounded-lg py-2 px-4 transition-opacity duration-200 ease-in-out shadow-lg scale-95 group-hover:scale-100 origin-top w-auto whitespace-nowrap">Import data in excel<span className="absolute left-1/2 transform -translate-x-1/2 bottom-[-8px] w-4 h-4 rotate-45 bg-black"></span></span></div>
          <div className="relative group"><Button onClick={() => { const link = document.createElement('a'); link.href = `${siteUrl}/files/modifiers_template.xlsx`; link.download = 'modifiers_template.xlsx'; link.click(); }} className="bg-gradient-to-r from-BRAND-600 to-BRAND-500 border-0 !ring-0 import-btn whitespace-nowrap flex items-center">Excel Template <FaFileDownload className="ml-2" /></Button><span className="absolute left-1/2 transform -translate-x-1/2 bottom-12 z-[11] opacity-0 invisible group-hover:opacity-100 group-hover:visible text-white bg-black text-xs rounded-lg py-2 px-2 transition-opacity duration-200 ease-in-out shadow-lg scale-95 group-hover:scale-100 origin-top w-auto whitespace-nowrap">Download Excel template<span className="absolute left-1/2 transform -translate-x-1/2 bottom-[-8px] w-4 h-4 rotate-45 bg-black"></span></span></div>
          <div className="relative group"><Link to="/modifier/add" className="block"><AddButton msg=" Add a new modifier" /></Link></div>
        </div>
      </div> */}

      <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
        <Table hoverable>
          <TableHeaders columnNames={columnNames} />

          <Table.Body className="divide-y">
            {isLoading ? (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4">
                  {/* <Loader /> */}
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            ) : modifiersDetail?.length > 0 ? (
              modifiersDetail.map((item: any, index: any) => (
                <Table.Row key={item._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                    {index + 1 + (page - 1) * limit}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={capitalized(item.name)}>
                    {capitalized(item.name) ?? '-'}
                  </Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item?.company?.name}>
                    {item?.company?.name ?? '-'}
                  </Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item.price}>
                    {item?.company?.currency?.symbol || "$"}{item.price ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item?.modifierCategory?.name}>
                    {item?.modifierCategory?.name ?? '-'}
                  </Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item?.isAvailable ? 'Available' : 'Not available'}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {item?.isAvailable ? 'Available' : 'Not available'}
                    </span>
                  </Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={item.isAvailable ? 'Available' : 'Unavailable'}>
                    {labelLayout(item.isAvailable ? 'Available' : 'Unavailable')}
                  </Table.Cell>
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/modifier/edit/${item._id}`)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button onClick={() => confirmDelete(item._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                  <NoData
                    title="No Modifiers Found"
                    message="No modifiers are available right now. Added modifiers will appear here."
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
        message="Are you sure you want to delete this modifier ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      {openModal && <QuickBooksSyncModel syncType="modifiers" openModal={openModal} setOpenModal={setOpenModal} />}
    </div>
  )
}

export default Modifiers