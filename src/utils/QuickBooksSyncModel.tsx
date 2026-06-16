import { Button, Modal } from "flowbite-react"
import { useQuickBooks } from "../context/QuickBooksProvider"
import { useState } from "react"
import apiClient from "./AxiosInstance"
import { toast } from "react-toastify"
import { AiOutlineLoading } from "react-icons/ai"
import { useAuth } from "../context/AuthProvider"
import { SUPER_ADMIN } from "./common/constant"

interface QuickBooksSyncModelProps {
    openModal: boolean
    setOpenModal: (value: boolean) => void
    syncType: "product" | "categories" | "staff" | "customer" | "modifiers"
}

interface QuickBooksItem {
    _id: string
    company?: {
        _id?: string
        name?: string
    }
    restaurant?: {
        _id?: string
        name?: string
    }
}

const QuickBooksSyncModel: React.FC<QuickBooksSyncModelProps> = ({
    openModal,
    setOpenModal,
    syncType,
}) => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const { quickBooksData } = useQuickBooks() as { quickBooksData: QuickBooksItem[] }

    const [loadingItem, setLoadingItem] = useState<string | null>(null)

    const handleSubmit = async (item: QuickBooksItem) => {
        try {
            const company = item.company?._id ?? item.restaurant
            const restaurantId = item.restaurant?._id ?? item.restaurant

            if (!company || !restaurantId) {
                toast.error("Missing company or restaurant ID")
                return
            }

            setLoadingItem(item._id)

            let endpoint = ""
            switch (syncType) {
                case "categories":
                    endpoint = `/connection/category/add-multiple/${company}?restaurant=${restaurantId}`
                    break
                case "product":
                    endpoint = `/connection/item/add-multiple/${company}?restaurant=${restaurantId}`
                    break
                case "customer":
                    endpoint = `/connection/customer/add-multiple/${company}?restaurant=${restaurantId}`
                    break
                case "staff":
                    endpoint = `/connection/employee/add-multiple/${company}?restaurant=${restaurantId}`
                    break
                case "modifiers":
                    endpoint = `/connection/modifiers/add-multiple/${company}?restaurant=${restaurantId}`
                    break
            }

            const response = await apiClient.patch(endpoint)

            if (response?.data?.success) {
                toast.success(response?.data?.message || "Data synced successfully")
            } else {
                toast.error(response?.data?.message || "Sync failed")
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Something went wrong")
            console.error("QuickBooksSyncModel error:", error)
        } finally {
            setLoadingItem(null)
        }
    }

    const getTitle = () => {
        switch (syncType) {
            case "product":
                return "QuickBooks Product Sync"
            case "categories":
                return "QuickBooks Category Sync"
            case "staff":
                return "QuickBooks Staff Sync"
            case "customer":
                return "QuickBooks Customer Sync"
            case "modifiers":
                return "QuickBooks Modifiers Sync"
            default:
                return "QuickBooks Sync"
        }
    }

    return (
        <Modal
            show={openModal}
            onClose={() => setOpenModal(false)}
            size="lg"
            className="backdrop-blur-sm dark:bg-DARK-950"
        >
            <Modal.Header className="dark:bg-DARK-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {getTitle()}
                </h3>
            </Modal.Header>
            <Modal.Body className="dark:bg-DARK-800">
                {syncType === "product" && (
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-DARK-700 p-3 rounded">
                        <strong>Tip:</strong> First, sync your <b>Categories</b>. Then sync
                        your <b>Products</b>. This ensures products are correctly linked to
                        categories in QuickBooks.
                    </p>
                )}
                <p className="mb-3 text-sm text-yellow-600 bg-yellow-100  p-3 rounded">
                    <strong>Note:</strong>Syncing 50 items(lists) takes about 1-2 minutes. Larger items(lists) may need a bit more time.
                </p>
                <div className="space-y-3">
                    {quickBooksData?.length > 0 ? (
                        [...quickBooksData]
                            .sort((a, b) => {
                                const nameA = a?.company?.name?.toLowerCase() || ""
                                const nameB = b?.company?.name?.toLowerCase() || ""
                                return nameA.localeCompare(nameB)
                            })
                            .map((item) => {
                                const isLoading = loadingItem !== null
                                const isCurrent = loadingItem === item._id
                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between border rounded-lg p-3  dark:bg-DARK-700  dark:border-DARK-600"
                                    >
                                        {loginRole === SUPER_ADMIN ? (
                                            <div className="text-gray-700 dark:text-gray-200 flex flex-col">
                                                <span className="font-medium text-gray-500 text-xs">
                                                    {item?.company?.name}
                                                </span>
                                                <span className="font-medium">
                                                    {item?.restaurant?.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-gray-700 dark:text-gray-200 flex flex-col">
                                                <span className="font-medium text-DARK-500 dark:text-DARK-400 text-xs">
                                                    Restaurant
                                                </span>
                                                <span className="font-medium">
                                                    {item?.restaurant?.name ?? "N/A"}
                                                </span>
                                            </div>
                                        )}
                                        <Button
                                            size="sm"
                                            className="relative bg-gradient-to-r from-BRAND-600 to-BRAND-500 text-white font-medium rounded-md px-4 py-1 hover:opacity-90 transition"
                                            disabled={isLoading}
                                            isProcessing={isCurrent}
                                            onClick={() => handleSubmit(item)}
                                            processingSpinner={
                                                <AiOutlineLoading className="h-5 w-5 animate-spin" />
                                            }
                                        >
                                            {isCurrent ? "Syncing..." : "Sync"}
                                        </Button>
                                    </div>
                                )
                            })
                    ) : (
                        <div className="text-gray-500 text-center py-5">
                            No {syncType} found in QuickBooks.
                        </div>
                    )}
                </div>
            </Modal.Body>

        </Modal>
    )
}

export default QuickBooksSyncModel
