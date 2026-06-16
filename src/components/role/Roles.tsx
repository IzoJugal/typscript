import { Button, Label, Modal, Table } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import ConfirmModal from "../../hooks/ConfirmModal";
import apiClient from "../../utils/AxiosInstance";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import Pagination from "../Pagination/Pagination";
import PageSize from "../Pagination/PageSize";
import { Filters } from "../../utils/common/Filters";
import TableHeaders from "../../utils/common/TableHeaders";
import NoData from "../../utils/common/NoData";
import { deleteBtnStyle, divContainerStyle, editBtnStyle, MANAGER_ROLES, OWNER_ROLES, STATIC_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { useSocket } from "../../context/SocketProvider";
import { capitalized, setTitle } from "../../utils/utility";
import ListLoader from "../../utils/common/ListLoader";
import SelectWithSearch from "../../utils/common/SelectWithSearch";
import AddActionButton from "../../utils/common/AddActionButton";
import { FaAngleDown, FaAngleUp, FaFilter } from "react-icons/fa";
import SearchInput from "../../utils/common/SearchInput";

type Permission = {
    _id: string;
    name: string;
    description: string;
};

const Roles = () => {
    setTitle("Roles");
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    let companyID = "";
    let restaurantID = "";
    if (loginRole !== SUPER_ADMIN) {
        companyID = `${userData?.staffMember?.company?._id}`;
    } else if (!OWNER_ROLES.includes(loginRole)) {
        restaurantID = `${userData?.staffMember?.restaurant?._id}`;
    }
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [roles, setRoles] = useState<any>([]);
    const [_permissionsList, setPermissionsList] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
    const [roleForm, setRoleForm] = useState<any>({ company: companyID, restaurant: restaurantID });
    const [errors, setErrors] = useState<any>({});
    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
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
        restaurant: searchParams.get("restaurant") || "",
    });

    const [formData, setFormData] = useState({
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "10", 10),
    });
    const [name, setName] = useState('');

    const searchFilterRef = useRef(searchFilter);
    useEffect(() => {
        searchFilterRef.current = searchFilter;
    }, [searchFilter]);

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const columnNames = loginRole === SUPER_ADMIN ? ["Sr.No.", "Name", "Business", "Actions"] : ["Sr.No.", "Name", "Actions"];

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies);
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    };

    const getRestaurant = useCallback(async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant);
                return response.data.restaurant;
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
        return [];
    }, []);

    useEffect(() => {
        if (!openModal) return;
        if (roleForm?.company) {
            getRestaurant(roleForm.company);
        }
    }, [roleForm?.company, getRestaurant, openModal]);

    useEffect(() => {
        if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
            setRoleForm((prev: any) => ({ ...prev, company: companies[0]._id }));
            setErrors((prev: any) => ({ ...prev, company: "" }));
        }
    }, [companies, loginRole]);

    useEffect(() => {
        if (restaurant?.length === 1) {
            setRoleForm((prev: any) => ({ ...prev, restaurant: restaurant[0]._id }));
            setErrors((prev: any) => ({ ...prev, restaurant: "" }));
        }
    }, [restaurant]);

    useEffect(() => {
        if (loginRole !== SUPER_ADMIN) {
            setRoleForm((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
        }
    }, [loginRole, userData]);

    useEffect(() => {
        if (!openModal) return;

        if (!roleForm?._id) {
            setRestaurant([]);
            setRoleForm(
                loginRole === SUPER_ADMIN
                    ? {}
                    : { company: companyID, restaurant: restaurantID }
            );
            setName("");
            setSelectedPermissions([]);
            setErrors({});
        }
    }, [openModal, roleForm?._id, loginRole, companyID, restaurantID]);

    const getRoles = useCallback(async () => {
        try {
            setIsLoading(true);
            const combinedData = {
                ...formDataRef.current,
                ...searchFilterRef.current
            };
            const queryParams = createQueryParams(combinedData);
            const response = await apiClient.get(`/role${queryParams}`);
            if (response.data.success) {
                setRoles(response?.data?.roles);
                setNumOfRecords(response.data.count);
            }
        } catch (error: any) {
            console.log("error", error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            getRoles();
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [page, limit, searchFilter, getRoles, location.search]);

    const handleLimit = (data: any) => {
        curPage(1);
        setLimit(data);
        setFormData((prev) => ({ ...prev, limit: data }));
    };

    const updateURL = (updatedFormData: any) => {
        const combinedData = { ...updatedFormData, ...searchFilterRef.current };
        const queryParams = createQueryParams(combinedData);
        setSearchParams(queryParams);
        navigate(`/role/${updatedFormData.page}/${queryParams}`);
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
        setLimit(formDataRef.current?.limit);
        setPage(formDataRef.current?.page);
    }, [searchFilter, formData]);

    useEffect(() => {
        navigateSearchPrams();
    }, [searchFilter, navigateSearchPrams]);

    useEffect(() => {
        if (loginRole === SUPER_ADMIN && openModal) {
            getCompany();
        }
    }, [loginRole, openModal]);

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        setIsModalOpen(false);
        const deleteId = selectedId;
        setSelectedId(null);
        if (!deleteId) return;

        try {
            setIsLoading(true);
            const response = await apiClient.post(`/role/delete/${deleteId}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response?.data?.message);
            }
            setRoles((prev: any) => {
                const updated = prev?.filter((role: any) => role._id !== deleteId) || [];
                if (updated.length === 0 && page > 1) {
                    curPage(page - 1);
                }
                return updated;
            });
            setNumOfRecords((prev: any) => prev - 1);
            getRoles();
        } catch (error: any) {
            toast.error(error || 'Failed to delete the role. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const openModel = async (role: any) => {
        permissions();
        setErrors({});
        if (role) {
            setRoleForm(role);
            setName(role?.name);
            if (role?.company?._id) {
                setRoleForm((pre: any) => ({ ...pre, company: role?.company?._id }));
            }
            if (role?.restaurant?._id) {
                setRoleForm((pre: any) => ({ ...pre, restaurant: role?.restaurant?._id }));
            }
            setSelectedPermissions(role?.permissions);
        } else {
            setRestaurant([]);
            setRoleForm(
                loginRole === SUPER_ADMIN
                    ? {}
                    : { company: companyID, restaurant: restaurantID }
            );
            setName("");
            setSelectedPermissions([]);
        }
        setOpenModal(true);
    };

    const permissions = async () => {
        try {
            const response = await apiClient.get(`/permission`);
            if (response.status === 200) {
                setPermissionsList(response?.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setErrors((pre: any) => ({ ...pre, [name]: "" }));
        setRoleForm((prevForm: any) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleRoleName = (id: string) => {
        setRoleForm((prev: any) => ({
            ...prev,
            name: id
        }));
        setErrors((prev: any) => ({ ...prev, 'name': "" }));
    };

    const handleSaveRole = async () => {
        if (loginRole !== SUPER_ADMIN) {
            roleForm.company = `${userData?.staffMember?.company?._id}`;
        } else if (!OWNER_ROLES.includes(loginRole)) {
            roleForm.restaurant = `${userData?.staffMember?.restaurant?._id}`;
        }
        const roleData = {
            name: roleForm.name,
            company: roleForm.company || null,
            restaurant: roleForm.restaurant || null,
            permissionIds: selectedPermissions.map((permission) => permission._id),
        };
        if (isValid()) {
            setIsSubmitting(true);
            if (roleForm._id) {
                await updateRole(roleForm._id, roleData);
            } else {
                await insertRole(roleData);
            }
        }
    };

    const isValid = () => {
        const errorMsg: any = {};
        let isValid = true;
        if (!roleForm.name) {
            errorMsg.name = "Please select role name";
            isValid = false;
        }

        if (loginRole === SUPER_ADMIN) {
            if (!roleForm?.company) {
                errorMsg.company = "Please select business.";
                isValid = false;
            }
        }
        if (loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) {
            if (!roleForm?.restaurant) {
                errorMsg.restaurant = "Please select restaurant.";
                isValid = false;
            }
        }

        setErrors(errorMsg);
        return isValid;
    };

    const insertRole = async (roleData: any) => {
        try {
            const response = await apiClient.post(`/role/add`, roleData);
            if (response.status === 201) {
                toast.success(response.data.message);
                onCloseModal();
                getRoles();
            } else {
                toast.warning(response.data.message);
            }
        } catch (error) {
            console.error('Error creating role:', error);
            toast.error("Failed to add role.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateRole = async (roleId: string, roleData: any) => {
        try {
            const response = await apiClient.patch(`/role/update/${roleId}`, roleData);
            if (response.status === 200 && response.data.success) {
                toast.success(response.data.message);
                onCloseModal();
                getRoles();
            } else {
                toast.warning(response.data.message);
            }
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error("Failed to update role.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onCloseModal = () => {
        setOpenModal(false);
        setRoleForm(
            loginRole === SUPER_ADMIN
                ? {}
                : { company: companyID, restaurant: restaurantID }
        );
        setName("");
        setSelectedPermissions([]);
        setPermissionsList([]);
        if (loginRole === SUPER_ADMIN) {
            setRestaurant([]);
        }
        setErrors({});
    };

    const socket = useSocket();

    const socketAllowDataPermission = (data: any) => {
        let status = false;
        if (loginRole === "Super Admin") {
            status = true;
        } else if (MANAGER_ROLES.includes(loginRole)) {
            if (userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) {
                status = true;
            }
        } else if (!MANAGER_ROLES.includes(loginRole)) {
            if ((userData?.staffMember?.company?._id === (data?.company?._id || data?.company)) && userData?.staffMember?.restaurant?._id === (data?.restaurant?._id || data?.restaurant)) {
                status = true;
            }
        }
        return status;
    };

    useEffect(() => {
        const addRole = (roleData: any) => {
            if (socketAllowDataPermission(roleData)) {
                setRoles((prevData: any) => {
                    const updatedData = [...prevData];
                    if (prevData?.length >= limit) {
                        updatedData?.pop();
                    }
                    return [roleData, ...updatedData];
                });
                setNumOfRecords((prev: any) => prev + 1);
            }
        };
        const updatedRole = (roleData: any) => {
            setRoles((prev: any) => prev.map((item: any) => item._id === roleData._id ? roleData : item));
        };
        const deleteRole = (roleData: any) => {
            setRoles((prev: any) => {
                const exists = prev?.some((item: any) => String(item._id) === String(roleData._id));
                if (!exists) return prev;
                const updated = prev.filter((role: any) => role._id !== roleData?._id);
                if (updated.length === 0) {
                    if (page > 1) {
                        curPage(page - 1);
                    } else {
                        curPage(1);
                    }
                }
                return updated;
            });
            getRoles();
            setNumOfRecords((prev: any) => prev - 1);
        };

        socket.on("addRole", addRole);
        socket.on("updateRole", updatedRole);
        socket.on("deleteRole", deleteRole);

        return () => {
            socket.off("addRole", addRole);
            socket.off("updateRole", updatedRole);
            socket.off("deleteRole", deleteRole);
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
                    <DetailHeaderPaths label="Roles" />
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
                            <span onClick={() => openModel(null)}>
                                <AddActionButton text="Add a new role" />
                            </span>
                        </div>
                    </div>

                    {/* Collapsible Filters Section */}
                    <div
                        className={`transition-all duration-500 ease-in-out ${showFilters ? "max-h-screen opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
                            }`}
                    >
                        <div className="bg-white dark:bg-DARK-800 rounded-lg shadow-md p-4">
                            <Filters searchFilter={searchFilter} loginRole={loginRole} setSearchFilter={setSearchFilter} module="role" setIsDropdownOpen={setIsDropdownOpen} isDropdownOpen={isDropdownOpen} handleFilter={handleFilter} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-DARK-800 rounded-xl shadow-sm overflow-x-auto border-t-2 border-BRAND-300 dark:border-DARK-400">
                <Table hoverable>
                    <TableHeaders columnNames={columnNames} />
                    <Table.Body className="divide-y">
                        {isLoading ? (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={8} className="text-center py-4">
                                    <ListLoader />
                                </Table.Cell>
                            </Table.Row>
                        ) : !isLoading && roles?.length > 0 ? (
                            roles?.map((elem: any, index: number) => (
                                <Table.Row key={elem._id} className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white">
                                        {index + 1 + (page - 1) * limit}
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-DARK-900 dark:text-white" title={elem?.name}>
                                        {elem?.name ?? '-'}
                                    </Table.Cell>
                                    {loginRole === SUPER_ADMIN && <Table.Cell className="whitespace-nowrap text-sm text-DARK-500 dark:text-DARK-300" title={capitalized(elem?.company?.name)}>
                                        {capitalized(elem?.company?.name) ?? '-'}
                                    </Table.Cell>}
                                    <Table.Cell className="flex space-x-2 px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button onClick={() => openModel(elem)} size="xs" className={editBtnStyle.btn}><HiPencil className={editBtnStyle.icon} /></Button>
                                        <Button onClick={() => confirmDelete(elem?._id)} className={deleteBtnStyle.btn} size="xs"><RiDeleteBin6Line className={deleteBtnStyle.icon} /></Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row className="bg-white dark:border-DARK-700 dark:bg-DARK-800">
                                <Table.Cell colSpan={10} className="text-center py-4 text-DARK-500">
                                    <NoData
                                        title="No Roles Found"
                                        message="No role entries are available right now. Added role entries will appear here."
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
                message="Are you sure you want to delete this Role ?"
                onConfirm={handleDelete}
                onCancel={() => setIsModalOpen(false)}
            />
            <Modal show={openModal} onClose={() => onCloseModal()} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header className="dark:bg-DARK-800">Role Form</Modal.Header>
                <Modal.Body className="dark:bg-DARK-800">
                    <form className="flex max-w-full flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                        <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
                            {loginRole === SUPER_ADMIN && (
                                <div className="flex flex-col">
                                    <CompanyField
                                        companies={companies}
                                        selectedCompanyId={roleForm?.company}
                                        handleChange={handleChange}
                                        error={errors.company}
                                    />
                                </div>
                            )}
                            {(loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole)) && (
                                <div className="flex flex-col">
                                    <RestaurantField
                                        restaurants={restaurant}
                                        selectedRestaurantId={roleForm?.restaurant}
                                        handleChange={handleChange}
                                        error={errors.restaurant}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="name" value="Role Name" /><span className="text-ERROR_HOVER">*</span>
                            </div>
                            <SelectWithSearch
                                items={STATIC_ROLES}
                                title="Name"
                                displayKey="label"
                                searchKey="label"
                                valueKey="value"
                                selectedItem={name}
                                setSelectedItem={setName}
                                handleChange={handleRoleName}
                            />
                            <span className="text-ERROR_HOVER">{errors?.name}</span>
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer className="justify-end dark:bg-DARK-800">
                    <Button
                        type="button"
                        onClick={() => onCloseModal()}
                        disabled={isSubmitting}
                        className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSaveRole}
                        disabled={isSubmitting}
                        isProcessing={isSubmitting}
                        processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                        className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        Submit
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Roles;