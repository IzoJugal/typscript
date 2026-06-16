import { Button, Modal } from "flowbite-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/AxiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// import { CheckSquare, Square } from "lucide-react"; // Modern icons
import { useAuth } from "../../context/AuthProvider";
import { MANAGER_ROLES, OWNER_ADMIN_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { capitalized, formatDate, labelLayout } from "../../utils/utility";
import Permissions from "./Permissions";
import { HiLockClosed, HiPencil } from "react-icons/hi";
import { useConfigs } from "../../context/SiteConfigsProvider";

interface ViewStaffProps {
    id: string;
    setId: Dispatch<SetStateAction<string>>;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    permission: boolean;
}

/* const permissionsList = [
    "inventory",
    "orders",
    "Staffs",
    "kitchen",
    "reports",
    "taxes",
    "voidRetunTip",
    "customer",
    "closeout_report",
    "discounts",
    "settings",
    "payments",
    "all_orders",
    "restaurant_closeout",
]; */

const ViewStaff: React.FC<ViewStaffProps> = ({ id, setId, open, setOpen, permission }) => {
    const { setUserData, userData } = useAuth();
      const { configData } = useConfigs();
    const loginRole = userData?.staffMember?.role?.name || '';
    const [isLoading, setIsLoading] = useState(false);
    const [staffData, setStaffData] = useState<any>({});
    const [openPermission, setOpenPermission] = useState<boolean>(false);
    const [isBtnLoading, setIsBtnLoading] = useState<boolean>(false);
    const [isPasswordResetLoading, setIsPasswordResetLoading] = useState<boolean>(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const navigate = useNavigate();

    const getSingleStaff = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await apiClient.get(`/staff/${id}`);
            if (response.data.status) {
                const staff = response.data.data;
                staff.password !== null && delete staff.password;
                const formattedHireDate = formatDate(staff.hireDate,configData?.dateFormat);
                setStaffData((prev: any) => ({
                    ...prev,
                    ...staff,
                    hireDate: formattedHireDate,
                }))
            }
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            console.error('~ get staff details error :-', error);
        }
    }, [id, setIsLoading]);

    useEffect(() => {
        if (open === true) {
            getSingleStaff();
        }
    }, [getSingleStaff, open]);

    useEffect(() => {
        (openPermission === true) ? setIsBtnLoading(true) : setIsBtnLoading(false);
    }, [openPermission]);

    const handlePasswordReset = async (staffId: string) => {
        setIsPasswordResetLoading(true);
        try {
            const endpoint = !staffData?.password
                ? `/staff/send-set-password-link/${staffId}`
                : `/staff/send-reset-password-link/${staffId}`;

            const response = await apiClient.post(endpoint);
            if (response.data.status) {
                const message = !staffData?.password
                    ? "Set password link sent to staff's email."
                    : "Password reset link sent to staff's email.";
                toast.success(message);
            } else {
                toast.error(response.data.message || "Failed to send email.");
            }
        } catch (error: any) {
            console.error('~ password email error :-', error);
            toast.error(error.response?.data?.message || "Failed to send email. Please try again.");
        } finally {
            setIsPasswordResetLoading(false);
        }
    };

    const handleModalClose = () => {
        setStaffData({});
        setOpen(false);
        setId("");
    };
    // const permissionModalClose = () => {
    //     setOpenPermission(false);
    // };

    const handleEdit = (id: any) => {
        navigate(`/staff/edit/${id}`)
    };

    // const handleCheckboxChange = (permission: string) => {
    //     setSelectedPermissions((prev) =>
    //         prev.includes(permission)
    //             ? prev.filter((perm) => perm !== permission)
    //             : [...prev, permission]
    //     );
    // };


    // const savePermissions = async () => {
    //     try {
    //         setIsBtnLoading(true);
    //         const response = await apiClient.post(`/staff/change-permissions/${id}`, { permissions: selectedPermissions });
    //         const { success, staff, token } = response.data;
    //         if (success) {
    //             staff.password = ''
    //             const formattedHireDate = dayjs(staff.hireDate).format('YYYY-MM-DD');
    //             setStaffData((prev: any) => ({
    //                 ...prev,
    //                 ...staff,
    //                 hireDate: formattedHireDate,
    //             }));

    //             if (staff?._id.toString() === userData?.staffMember?._id.toString()) {
    //                 setUserData((prevData: any) => ({
    //                     ...prevData,
    //                     staffMember: staff,
    //                     token: token
    //                 }));
    //             }
    //         }
    //         setTimeout(() => {
    //             setIsBtnLoading(false);
    //             setOpenPermission(false);
    //         }, 1000);
    //     } catch (error) {
    //         setIsBtnLoading(false);
    //         console.error('~ save permissions error :-', error);
    //     }
    // }

    const canShowPermissionButton = (): boolean => {
        const loggedInId = userData?.staffMember?._id?.toString();
        const targetId = staffData?._id?.toString();
        const targetRole = staffData?.role?.name;

        if (loggedInId === targetId) return false;

        if (loginRole === SUPER_ADMIN) return true;

        if (MANAGER_ROLES.includes(loginRole) && OWNER_ADMIN_ROLES.includes(targetRole)) return false;

        if (OWNER_ROLES.includes(loginRole) && loggedInId !== targetId) return true;

        if (MANAGER_ROLES.includes(loginRole) && loggedInId !== targetId && !OWNER_ROLES.includes(targetRole)) return true;

        return false;
    };

    return (
        <>
            <Modal show={open} onClose={handleModalClose} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header className="dark:bg-DARK-800">
                    <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                        {isLoading ? (
                            <div className="h-10 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                        ) : (
                            staffData?.name?.toUpperCase() ?? "N/A"
                        )}
                    </span>
                </Modal.Header>
                <Modal.Body className="dark:bg-DARK-900">
                    {isLoading ? (
                        <div className="mb-6">
                            <div className="h-7 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div key={index} className="h-8 w-full bg-DARK-200 rounded-md animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        staffData && (
                            <div className="mb-6 max-w-4xl mx-auto">
                                <div
                                    className={`flex flex-col sm:flex-row sm:items-center gap-3 mb-4 ${staffData?.password === null
                                        ? "sm:justify-between"
                                        : "sm:justify-end"
                                        }`}
                                >
                                    {staffData?.password === null && (
                                        <Button
                                            className="!bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-700 dark:hover:!bg-BRAND-500 focus:!ring-0 w-fit"
                                            disabled={isPasswordResetLoading}
                                            size="sm"
                                            onClick={() => handlePasswordReset(staffData?._id)}
                                        >
                                            <HiLockClosed className="h-4 w-4 mr-2 my-auto" />
                                            {isPasswordResetLoading ? "Sending..." : "Set Password"}
                                        </Button>
                                    )}

                                    <div className="sm:ml-auto">
                                        {labelLayout(staffData?.isActive ? "Activated" : "Deactivated")}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-DARK-800 rounded-xl border dark:border-DARK-600 shadow-sm p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column */}
                                        <div className="space-y-5">
                                            {staffData?.name && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Name</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.name}</span>
                                                </div>
                                            )}
                                            {staffData?.email && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Email</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.email}</span>
                                                </div>
                                            )}
                                            {staffData?.role && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Role</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.role.name}</span>
                                                </div>
                                            )}
                                            {staffData?.company && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Company</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.company.name}</span>
                                                </div>
                                            )}
                                            {staffData?.restaurant && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Restaurant</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.restaurant.name}</span>
                                                </div>
                                            )}
                                            {staffData?.hireDate && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Hire Date</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">
                                                        {staffData.hireDate}
                                                    </span>
                                                </div>
                                            )}
                                            {staffData?.quickBookId && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">QuickBook ID</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.quickBookId}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-5">
                                            {staffData?.phone && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Phone</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.phone || "N/A"}</span>
                                                </div>
                                            )}
                                            {staffData?.position && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Position</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">{staffData.position || "N/A"}</span>
                                                </div>
                                            )}
                                            {staffData?.salary > 0 && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Salary</span>
                                                    <span className="text-base text-DARK-900 dark:text-DARK-300">${staffData.salary}</span>
                                                </div>
                                            )}

                                            {/* Permissions Section */}
                                            <div className="pt-2">
                                                <div className="flex flex-col space-y-3 bg-DARK-50 dark:bg-DARK-900 p-2 rounded-xl">
                                                    <span className="text-sm font-medium text-DARK-600 dark:text-DARK-100">Permissions</span>
                                                    <div className="">
                                                        {staffData?.permissions?.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 justify-between">
                                                                {staffData.permissions.map((perm: any, index: number) => (
                                                                    <span
                                                                        key={index}
                                                                        className="inline-flex items-center px-2 py-1 bg-white dark:bg-DARK-800 border dark:border-DARK-700 rounded-md text-sm text-DARK-700 dark:text-DARK-300 shadow-sm w-28 overflow-hidden"
                                                                        title={`${capitalized(perm)}`}                                                                    >
                                                                        {capitalized(perm)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-DARK-500 italic">
                                                                No permissions assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </Modal.Body>

                {permission && (
                    <Modal.Footer className="justify-end dark:bg-DARK-800">
                        {(!isLoading && canShowPermissionButton()) && (
                            <Button
                                className="!bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-700 dark:hover:!bg-BRAND-500 focus:!ring-0"
                                disabled={isBtnLoading}
                                size="sm"
                                onClick={() => { setOpenPermission(true), setSelectedPermissions(staffData?.permissions); setIsBtnLoading(true) }}
                            >
                                <HiLockClosed className="h-4 w-4 mr-2 my-auto" />
                                {isBtnLoading ? "Loading..." : "Open Permissions"}
                            </Button>
                        )}
                        <Button
                            className="w-32 !bg-BRAND-500 hover:!bg-BRAND-600 dark:!bg-DARK-700 dark:hover:!bg-BRAND-500 focus:!ring-0"
                            disabled={isBtnLoading}
                            size="sm"
                            onClick={() => { handleEdit(staffData?._id); setIsBtnLoading(true) }}
                        >
                            <HiPencil className="h-4 w-4 mr-2 my-auto" />
                            {isBtnLoading ? "Loading..." : "Edit"}
                        </Button>
                    </Modal.Footer>
                )}
            </Modal>

            <Permissions
                openPermission={openPermission}
                setOpenPermission={setOpenPermission}
                selectedPermissions={selectedPermissions}
                setSelectedPermissions={setSelectedPermissions}
                setStaffData={setStaffData}
                userData={userData}
                setUserData={setUserData}
                id={id}
            />
        </>
    )
}

export default ViewStaff;
