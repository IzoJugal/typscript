import { Button, Table, } from "flowbite-react"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HiPencil } from "react-icons/hi"
import { useCallback, useEffect, useRef, useState } from "react"
import apiClient from "../../utils/AxiosInstance"
import { RiDeleteBin6Line } from "react-icons/ri"
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
import { FaAngleDown, FaAngleUp, FaFileDownload, FaFilter } from "react-icons/fa"
import { siteUrl } from "../../environment/env"
import { LuImport } from "react-icons/lu"
import ViewStaff from "./ViewStaff"
import { IoMdEye } from "react-icons/io";
import { createQueryParams } from "../../utils/functions"
import { capitalized, labelLayout } from "../../utils/utility"
import { useSocket } from "../../context/SocketProvider"
import * as XLSX from "xlsx";
import { BiExport } from "react-icons/bi"
import dayjs from "dayjs"
import ListLoader from "../../utils/common/ListLoader"
// import { useQuickBooks } from "../../context/QuickBooksProvider"
import QuickBooksSyncModel from "../../utils/QuickBooksSyncModel"
import { setTitle } from "../../utils/utility"
import AddActionButton from "../../utils/common/AddActionButton"
import ActionDropdown from "../../utils/common/ActionDropdown"
import SearchInput from "../../utils/common/SearchInput"

interface Staff {
  _id: string;
  name: string;
  position: string;
  role: { _id: "", name: "" };
  age: number;
  email: string;
  phone: string;
  salary: number;
  passcode: string;
  hireDate: Date;
  isActive: boolean
}


const Staff = () => {
  setTitle("Staff");
  const socket: any = useSocket();
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const [staffDetail, setStaffDetail] = useState<Staff[] | any>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pages }: any = useParams<{ id: string }>();
  const [page, setPage] = useState<number>(+pages);
  const [numOfRecords, setNumOfRecords] = useState<number | any>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef: any = useRef<HTMLInputElement>(null);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const staffCompanyId = userData?.staffMember?.company?._id || "";
  const [searchFilter, setSearchFilter] = useState<any>({
    name: searchParams.get("name") || "",
    company: searchParams.get("company") || staffCompanyId,
    restaurant: searchParams.get("restaurant") || "",
    role: searchParams.get("role") || "",
    isActive: searchParams.get("isActive") || "",
  });

  const [formData, setFormData] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "10", 10),
    sortBy: 'createdAt',
    order: 'desc',
  });

  const baseColumns = ["Sr.No.", "Name", "Email", "Mobile number", "Finger Print", "Status", "Actions"];
  const superAdminColumns = [...baseColumns.slice(0, 2), "Business", ...baseColumns.slice(2)];
  const columnNames = loginRole === SUPER_ADMIN ? superAdminColumns : baseColumns;
  const sortColumn = ["Name"];


  const getStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedData = {
        ...formData,
        ...searchFilter
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/staff/web/all${queryParams}`,)
      if (response?.data?.status === true || response?.data?.success === true) {
        setStaffDetail(response.data?.data);
        setNumOfRecords(response.data?.count);
      } else {
        setStaffDetail([]);
        toast.error(response?.data?.message || 'There was an issue getting the product.');
      }

      setIsLoading(false);
    } catch (error) {
      setStaffDetail([])
      setIsLoading(false)
      console.error('~ getProduct error :-', error);
    }
  }, [formData, searchFilter,])

  useEffect(() => {
    // const myParam: any = new URLSearchParams(location.search).get("page");
    // if (myParam) {
    //   setPage(myParam - 1);
    // }
    const debounceDelay = setTimeout(() => {
      getStaff();
    }, 500);
    return () => clearTimeout(debounceDelay);
  }, [page, limit, getStaff, location.search]);

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
    const handleNewStaff = (newStaff: Staff) => {
      if (socketAllowDataPermission(newStaff)) {
        setStaffDetail((prevData: any) => {
          const updatedData = [...prevData];
          if (prevData?.length >= limit) {
            updatedData?.pop();
          }
          return [newStaff, ...updatedData];
        });
        setNumOfRecords((prev: any) => prev + 1);
      }
    };

    const handleUpdateStaff = (updatedStaff: Staff) => {
      setStaffDetail((prev: any) =>
        prev.map((staff: any) => (staff._id === updatedStaff._id ? updatedStaff : staff))
      );
    };

    const handleDeleteStaff = (deletedStaff: Staff) => {
      // setStaffDetail((prev: any) => prev.filter((staff: any) => staff._id !== deletedStaff._id));
      const exists = staffDetail?.some((item: any) => {
        return String(item._id) === String(deletedStaff._id)
      });
      if (!exists) {
        setIsLoading(false)
        return
      };
      const updatedStaff = staffDetail?.filter((staff: any) => staff._id !== deletedStaff?._id);
      setStaffDetail(updatedStaff);
      getStaff();
      if (updatedStaff.length === 0) {
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setNumOfRecords(numOfRecords - 1)
    };

    socket.on("newStaff", handleNewStaff);
    socket.on("updateStaff", handleUpdateStaff);
    socket.on("deleteStaff", handleDeleteStaff);

    return () => {
      socket.off("newStaff", handleNewStaff);
      socket.off("updateStaff", handleUpdateStaff);
      socket.off("deleteStaff", handleDeleteStaff);
    };
  }, [socket, setStaffDetail, staffDetail]);


  const handleLimit = (data: any) => {
    curPage(1)
    setLimit(data);
    setFormData((prev) => ({ ...prev, limit: data }))
  }

  const updateURL = (updatedFormData: any) => {
    const combinedData = { ...updatedFormData, ...searchFilter };
    const queryParams = createQueryParams(combinedData);

    setSearchParams(queryParams);
    navigate(`/staff/${updatedFormData.page}/${queryParams}`);
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
      const response = await apiClient.post(`/staff/${selectedId}`, {});
      if (response?.data?.success) {
        toast.success(response.data.message);
        // setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(response?.data?.message);
      }
      const updatedStaff = staffDetail?.filter((item: any) => item._id !== selectedId);
      setStaffDetail(updatedStaff);

      // toast.success(response.data.message);
      getStaff();
      if (updatedStaff.length === 0) {
        // curPage(page - 1)
        if (page > 1) {
          curPage(page - 1);
        } else {
          curPage(1);
        }
      }
      setTimeout(() => {
        setIsLoading(false)
        setNumOfRecords(numOfRecords - 1)
      }, 500);
    } catch (error) {
      setIsLoading(false)
      console.log('Delete staff error:', error);
      toast.error('Failed to delete the staff. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
      const response = await apiClient.post(`/import-data/staffs`, data, {
        headers: { 'Content-Type': 'multipart/form-data', }
      });
      if (response.data.success) {
        toast.success('Data imported successfully');
        getStaff();
      } else {
        toast.error(response?.data?.message || "Failed to import data");
      }
    } catch (error) {
      toast.error('An error occurred while importing data');
      console.error('Error importing products:', error);
    } finally {
      setIsBtnLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const showDetails = (id: string) => {
    setOpen(true);
    setId(id);
  };
  const [showFilters, setShowFilters] = useState(false);
  const [btnLoader, setBtnLoader] = useState(false);

  const exportToExcel = async () => {
    try {
      setBtnLoader(true);

      const combinedData = {
        ...searchFilter
      };
      const queryParams = createQueryParams(combinedData);
      const response = await apiClient.get(`/staff/web/all${queryParams}`,)

      const allCategory: Staff[] | any = response.data?.data;

      // Map the data to Excel sheet format
      const ws = XLSX.utils.json_to_sheet(allCategory?.map((item: any) => ({
        Name: item?.name,
        CompanyID: item?.company?._id || item?.company || '',
        RestaurantID: item?.restaurant?._id || item?.restaurant || '',
        Alias: item?.alias,
        Position: item?.position,
        Email: item?.email,
        Phone: item?.phone,
        HireDate: item?.hireDate ? `${dayjs(item?.hireDate).format("MM/DD/YYYY")}` : "",
        Salary: item?.salary,
        Pin: item?.pin,
        Password: item?.password,
        Profile: item?.profile,
        FingerPrint: item?.fingerPrint,
        Role: item?.role?.name,
        StaffColor: item?.staffColor,
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Staff");

      XLSX.writeFile(wb, "Staff.xlsx");
    } catch (error) {
      console.error('~ exportToExcel error :-', error);
    } finally {
      setBtnLoader(false);
    }
  };
  const [openModal, setOpenModal] = useState(false);


  return (
    <div className={divContainerStyle}>
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DetailHeaderPaths label="Staff" />
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
            {!showFilters &&
              <SearchInput
                value={searchFilter.name}
                onChange={(val) => setSearchFilter((prev: any) => ({ ...prev, name: val }))}
                placeholder="Search..."
                className="h-[42px] self-center"
              />
            }

            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
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
                    label: btnLoader ? "Exporting..." : "Export to Excel",
                    Icon: BiExport,
                    onClick: exportToExcel,
                  },
                  {
                    label: isBtnLoading ? "Importing..." : "Import Data",
                    Icon: LuImport,
                    onClick: handleButtonClick,
                  },
                  {
                    label: btnLoader ? "Excel Template downloading..." : "Excel Template",
                    Icon: FaFileDownload,
                    onClick: () => {
                      const link = document.createElement('a');
                      link.href = `${siteUrl}/files/staff_template.xlsx`;
                      link.download = 'staff_template.xlsx';
                      link.click();
                    }
                  },
                  // {
                  //   label: btnLoader ? "Syncing with QuickBooks..." : "Sync with QuickBooks",
                  //   Icon: FaSync,
                  //   onClick: () => { setOpenModal(true) },
                  //   hidden: quickBooksData?.length === 0,
                  // }
                ]}
              />

              <Link to="/staff/add" className="w-full">
                <AddActionButton text="Add a new staff member" />
              </Link>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          <div
            className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
              }`}
          >
            <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
              <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="staff" />
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
            {isLoading && (
              <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                <Table.Cell colSpan={11} className="text-center py-4">
                  <ListLoader />
                </Table.Cell>
              </Table.Row>
            )}
            {!isLoading && staffDetail?.length > 0
              ? staffDetail.map((staff: any, index: any) => (
                <Table.Row key={staff?._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white"> {index + 1 + (page - 1) * limit}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium  text-DARK-900 dark:text-white flex flex-col" title={capitalized(staff?.name) ?? ''}>
                    <span onClick={() => { showDetails(staff?._id) }}
                      className="cursor-pointer  hover:text-BRAND-500">
                      {capitalized(staff.name) ?? '-'}
                      <span className="text-DARK-500 dark:text-DARK-400  hover:text-BRAND-500 block">
                        {staff.roleId?.name ? `(${capitalized(staff.roleId?.name) ?? ''})` : `(${staff?.role?.name})`}
                      </span>
                    </span>
                  </Table.Cell>
                  {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(staff?.company?.name)}>{capitalized(staff?.company?.name) ?? '-'}</Table.Cell>}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={staff?.email}>{staff?.email || '-'}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={staff?.phone}>{staff?.phone || '-'}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={staff?.fingerPrint}>{staff?.fingerPrint || '-'}</Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={staff?.hireDate ? dayjs(staff?.hireDate).format('MM/DD/YYYY') : '-'}>{staff?.hireDate ? dayjs(staff?.hireDate).format('MM/DD/YYYY') : '-'}</Table.Cell> */}
                  <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={staff?.isActive ? 'Activated' : 'DeActivated'}>
                    {labelLayout(staff?.isActive ? 'activated' : 'deactivated')}
                  </Table.Cell>
                  {/* <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={staff?.isActive ? 'Activated' : 'DeActivated'}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staff?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {staff?.isActive ? 'Activated' : 'DeActivated'}
                    </span>
                  </Table.Cell> */}
                  <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button className={editBtnStyle.btn} onClick={() => showDetails(staff?._id)} size="xs"><IoMdEye className={editBtnStyle.icon} /></Button>
                    <Button className={editBtnStyle.btn} onClick={() => navigate(`/staff/edit/${staff?._id}`)} size="xs"><HiPencil className={editBtnStyle.icon} /></Button>
                    <Button title={userData?.staffMember?._id === staff?._id ? "Cannot Delete Yourself" : ""} disabled={userData?.staffMember?._id === staff?._id ? true : false} onClick={() => confirmDelete(staff?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                  </Table.Cell>
                </Table.Row>
              ))
              : !isLoading && (
                <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                  <Table.Cell colSpan={11} className="text-center py-4 text-DARK-500">
                    <NoData
                      title="No Staff Found"
                      message="No staff records are available right now. Added staff records will appear here."
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
      {openModal && <QuickBooksSyncModel syncType="staff" openModal={openModal} setOpenModal={setOpenModal} />}
      <ConfirmModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this staff ?"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
      {id && <ViewStaff
        open={open}
        setOpen={setOpen}
        id={id}
        setId={setId}
        permission={true}
      />}
    </div>
  )
}

export default Staff