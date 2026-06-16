//@ts-nocheck
import { toast } from "react-toastify";
import { PosBottomActions } from "./constant";
import apiClient from "../AxiosInstance";

export const handleActionButton = (button: any, paramsData: any) => {
    const { rawPayload, userData, selectedRestaurant } = paramsData;
    let response;
    switch (button.action) {
        case PosBottomActions.REPRINT_RECEIPT:
            (window as any).reprintReceipt(rawPayload);
            break;
        case PosBottomActions.REPRINT_BAR_ORDER:
            reprintBarOrder(rawPayload);
            break;
        case PosBottomActions.REPRINT_KITCHEN_ORDER:
            reprintKitchenOrder(rawPayload);
            break;
        case PosBottomActions.RETURN:
            response = returnOrder(rawPayload);
            break;
        case PosBottomActions.VOID:
            return voidOrder(rawPayload);
        case PosBottomActions.ADD_TIP:
            return addTip(rawPayload);
        case PosBottomActions.RETURN_TIP:
            return returnTip(rawPayload);
        case PosBottomActions.PRE_AUTH:
            return preAuth(rawPayload);
        case PosBottomActions.POST_AUTH:
            return postAuth(rawPayload);
        case PosBottomActions.CLOSE_BATCH:
            return closeBatch(rawPayload);
        case PosBottomActions.CANCEL:
            return cancelOrder(rawPayload);
        case PosBottomActions.TRANSFER:
            return transferOrder(rawPayload);
        case PosBottomActions.OPEN_CLOSE_REGISTER:
            return openCloseRegister(rawPayload);
        case PosBottomActions.CLOSE_OUT:
            return closeOut(userData, selectedRestaurant);
        default:
            break;
    }
    return response;
};


export const reprintReceipt: any = ({ payload }: any) => {

};

export const reprintBarOrder = (rawPayload: any) => {
    console.log("Reprinting bar order...");
};

export const reprintKitchenOrder = (rawPayload: any) => {
    console.log("Reprinting kitchen order...");
};

export const returnOrder = (rawPayload: any) => {
    return {
        name: "Return Order",
        id: "return-order-modal",
        isOpenModal: true,
        message: "Are you sure you want to return this order?",
        onConfirm: async (selectedMethod: any) => {
            const payload = {
                paidId: selectedMethod?._id,
                isReturn: true,
                method: selectedMethod?.method,
                customer: rawPayload?.customer
            }
            const response = await apiClient.patch(`/payment/return-void-order/${rawPayload?._id}`, payload);
            return response;
        },
    };
};

export const voidOrder = (rawPayload: any) => {
    return {
        name: "Void Order",
        id: "void-order-modal",
        isOpenModal: true,
        message: "Are you sure you want to void this order?",
        onConfirm: async (selectedMethod: any) => {
            const payload = {
                paidId: selectedMethod?._id,
                isVoid: true,
                method: selectedMethod?.method,
                customer: rawPayload?.customer
            }
            const response = await apiClient.patch(`/payment/return-void-order/${rawPayload?._id}`, payload);
            return response;
        },
    };
};

export const addTip = (rawPayload: any) => {
    return {
        name: "Add Tip",
        id: "add-tip-modal",
        isOpenModal: true,
        onConfirm: async (selectedMethod: any) => {
            const payload = {
                tip: selectedMethod?.tipAmount,
            }
            const response = await apiClient.post(`/order/tip/${rawPayload?._id}`, payload);
            return response;
        },
    };
};

export const returnTip = (rawPayload: any) => {
    console.log("Returning tip...");
};

export const preAuth = (rawPayload: any) => {
    console.log("Pre-authorizing transaction...");
};

export const postAuth = (rawPayload: any) => {
    console.log("Post-authorizing transaction...");
};

export const closeBatch = (rawPayload: any) => {
    console.log("Closing batch...");
};

export const cancelOrder = (rawPayload: any) => {
    return {
        name: "Cancel Order",
        id: "cancel-order-modal",
        isOpenModal: true,
        onConfirm: async (selectedMethod: any) => {
            const payload = {
                canceledReason: selectedMethod?.canceledReason
            }
            const response = await apiClient.patch(`order/cancel-order/${rawPayload?._id}`, payload);
            return response;
        },
    };
};

export const transferOrder = (rawPayload: any) => {
    console.log("Transferring order...");
};

export const openCloseRegister = (rawPayload: any) => {
    console.log("Opening/Closing register...");
};

export const closeOut = async (userData: any, selectedRestaurant: any) => {
    try {
        const payload = {
            closedBy: userData?.staffMember?._id,
            company: userData?.staffMember?.company?._id,
            restaurant: selectedRestaurant?._id,
            isForceClose: true
        };

        const response = await apiClient.post("/close-out/close", payload);
        const { success, message } = response.data;

        if (success) {
            toast.success(message);
        } else {
            toast.warning(message);
        }
    } catch (error: any) {
        console.error("Close out failed:", error);
        toast.error("Something went wrong while closing out.");
    }
};