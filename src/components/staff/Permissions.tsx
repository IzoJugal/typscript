import { Button, Modal } from "flowbite-react";
import { CheckSquare, Square } from "lucide-react";
import { useState, useMemo } from "react";
import { capitalized, formatDate, toastAlert } from "../../utils/utility";
import apiClient from "../../utils/AxiosInstance";
import { MasterPermissions } from "../../utils/common/constant";
import { useConfigs } from "../../context/SiteConfigsProvider";

const Permissions = ({
    openPermission,
    setOpenPermission,
    selectedPermissions,
    setSelectedPermissions,
    setStaffData,
    userData,
    setUserData,
    id,
}: any) => {
    const [isBtnLoading, setIsBtnLoading] = useState(false);
      const { configData } = useConfigs();
    const handleCheckboxChange = (permission: string) => {
        setSelectedPermissions((prev: any) =>
            prev.includes(permission)
                ? prev.filter((perm: any) => perm !== permission)
                : [...prev, permission]
        );
    };

    const areAllPermissionsSelected = useMemo(
        () => selectedPermissions.length === Object.values(MasterPermissions).length,
        [selectedPermissions]
    );

    const savePermissions = async () => {
        try {
            setIsBtnLoading(true);
            const response = await apiClient.post(`/staff/change-permissions/${id}`, {
                permissions: selectedPermissions,
            });
            const { success, staff, token, message } = response.data;

            if (success) {
                const formattedHireDate = formatDate(staff?.hireDate,configData?.dateFormat);
                setStaffData((prev: any) => ({
                    ...prev,
                    ...staff,
                    company: staff?.company?._id,
                    restaurant: staff?.restaurant?._id,
                    role: staff?.role?._id,
                    hireDate: formattedHireDate,
                }));

                if (staff?._id.toString() === userData?.staffMember?._id.toString()) {
                    setUserData((prevData: any) => ({
                        ...prevData,
                        staffMember: staff,
                        token,
                    }));
                }
                toastAlert('success', { message, autoClose: 1000 });
                setOpenPermission(false);
            } else {
                toastAlert('error', { message, autoClose: 1000 });
            }
        } catch (error) {
            console.error("Error saving permissions:", error);
            toastAlert('error', { message: "Failed to save permissions", autoClose: 1000 });
        } finally {
            setIsBtnLoading(false);
        }
    };

    return (
        <Modal show={openPermission} onClose={() => setOpenPermission(false)} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">Staff Permissions</Modal.Header>
            <Modal.Body className="bg-DARK-50 dark:bg-DARK-800">
                <div className="max-w-3xl mx-auto bg-white dark:bg-DARK-900 rounded-xl border dark:border-DARK-600 shadow-sm p-6">
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-DARK-900 dark:text-DARK-100">
                            Permissions <span className="text-red-500">*</span>
                        </h3>
                        <p className="mt-1 text-sm text-DARK-600 dark:text-DARK-400">
                            Staff permissions define access levels for users, controlling their ability to manage specific resources.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-end gap-4 mb-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={areAllPermissionsSelected}
                                onChange={(e) =>
                                    setSelectedPermissions(e.target.checked ? Object.values(MasterPermissions) : [])
                                }
                                className="w-4 h-4 text-green-600 border-DARK-300 rounded focus:!ring-0"
                            />
                            <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                                Select All
                            </span>
                        </label>
                        <button
                            onClick={() => setSelectedPermissions([])}
                            className="text-sm font-medium text-ERROR_HOVER hover:text-red-700 hover:underline transition-colors"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                        {Object.values(MasterPermissions).map((permission) => {
                            const isSelected = selectedPermissions.includes(permission);
                            return (
                                <div
                                    key={permission}
                                    onClick={() => handleCheckboxChange(permission)}
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 w-full h-14 ${isSelected
                                        ? "bg-BRAND-50 border-2 border-BRAND-500 dark:bg-DARK-950 shadow-sm"
                                        : "bg-DARK-50 dark:bg-DARK-800 dark:hover:!bg-DARK-900 dark:border-DARK-500 border-DARK-200 hover:border-DARK-400"
                                        }`}
                                    title={capitalized(permission.replace(/_/g, " "))}
                                >
                                    <span className="text-sm font-medium text-DARK-900 dark:text-DARK-100 capitalize truncate">
                                        {permission.replace(/_/g, " ")}
                                    </span>
                                    {isSelected ? (
                                        <CheckSquare className="h-5 w-5 text-BRAND-500 flex-shrink-0" />
                                    ) : (
                                        <Square className="h-5 w-5 text-DARK-400 flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="justify-end dark:bg-DARK-800">
                <Button
                    className="w-32 !bg-BRAND-500 hover:!bg-BRAND-600 focus:!ring-0"
                    disabled={isBtnLoading}
                    size="sm"
                    onClick={savePermissions}
                >
                    {isBtnLoading ? "Loading..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Permissions;
