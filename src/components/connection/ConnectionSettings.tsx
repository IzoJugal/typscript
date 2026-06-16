import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { useAuth } from "../../context/AuthProvider";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import FormLoader from "../../utils/common/FormLoader";
import { Button, Label, } from "flowbite-react";
import { SUPER_ADMIN } from "../../utils/common/constant";

import CryptoJS from "crypto-js";
import { SECRET_PASSPHRASE_QUICKBOOKS } from "../../environment/env";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface IConnection {
    _id: string;
    name: string;
    clientId: string;
    platForm: string;
    clientSecret: string;
    addedBy: string
    company: string;
    restaurant: string;
    realmId: string;
    apiEndPoint: string;
    isActive: boolean
    isProduction: boolean
    incomeAccount: String;
    expenseAccount: String;
    assetAccount: String;
    depositAccount: String;
}

const ConnectionSettings = () => {
    const { id } = useParams();
    const { userData } = useAuth();
    const allowedRoles = ["Owner/ Admin", "Owner/Admin", "Owner", "Manager", "Super Admin"];
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    const navigate = useNavigate();
    const [formData, setFormData] = useState<IConnection>({
        _id: "",
        name: "",
        realmId: "",
        clientId: "",
        platForm: "",
        apiEndPoint: "",
        incomeAccount: "",
        expenseAccount: "",
        assetAccount: "",
        depositAccount: "",
        isActive: true,
        isProduction: false,
        addedBy: userData?.staffMember?._id,
        clientSecret: "",
        company: loginRole !== SUPER_ADMIN ? `${userData?.staffMember?.company?._id}` : "",
        restaurant: !allowedRoles.includes(loginRole) ? `${userData?.staffMember?.restaurant?._id}` : "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();

    const [isQuickBookLoader, setIsQuickBookLoader] = useState(false);

    const [incomeAccount, setIncomeAccount] = useState<any>([]);
    const [expenseAccount, setExpenseAccount] = useState<any>([]);
    const [assetAccount, setAssetAccount] = useState<any>([]);
    const [depositAccount, setDepositAccount] = useState<any>([]);

    const handleIncomeAccount = (value: any) => {
        setFormData((prev) => ({ ...prev, incomeAccount: value }))
        setErrors((prev) => ({
            ...prev,
            incomeAccount: "",
        }));
    }
    const handleExpenseAccount = (value: any) => {
        setFormData((prev) => ({ ...prev, expenseAccount: value }))
        setErrors((prev) => ({
            ...prev,
            expenseAccount: "",
        }));
    }

    const handleAssetAccount = (value: any) => {
        setFormData((prev) => ({ ...prev, assetAccount: value }))
        setErrors((prev) => ({
            ...prev,
            assetAccount: "",
        }));
    }

    const handleDepositAccount = (value: any) => {
        setFormData((prev) => ({ ...prev, depositAccount: value }))
        setErrors((prev) => ({
            ...prev,
            depositAccount: "",
        }));
    }

    const isValid = (): boolean => {
        const errorMsg: Record<string, string> = {};
        let isValid = true;

        if (!formData?.assetAccount) {
            errorMsg.assetAccount = "Please selected a asset account.";
            isValid = false;
        }
        if (!formData?.incomeAccount) {
            errorMsg.incomeAccount = "Please selected a income account.";
            isValid = false;
        }
        if (!formData?.expenseAccount) {
            errorMsg.expenseAccount = "Please selected a expense account.";
            isValid = false;
        }
        if (!formData?.depositAccount) {
            errorMsg.depositAccount = "Please select a deposit account.";
            isValid = false;
        }

        setErrors(errorMsg);
        return isValid;
    };

    const getConnection = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/connection/${id}`);
            const connection = response.data?.connection ?? {};
            const { clientId, clientSecret, ...rest } = connection;

            const decryptedClientId = CryptoJS.AES.decrypt(clientId, SECRET_PASSPHRASE_QUICKBOOKS)
                .toString(CryptoJS.enc.Utf8);

            const decryptedClientSecret = CryptoJS.AES.decrypt(clientSecret, SECRET_PASSPHRASE_QUICKBOOKS)
                .toString(CryptoJS.enc.Utf8);

            setFormData((prev) => ({
                ...prev,
                ...rest,
                clientId: decryptedClientId,
                clientSecret: decryptedClientSecret,
            }));

            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        } catch (error) {
            console.error("~ getConnection error:", error);
        }
    }, [setIsLoading, id]);

    const getQuicBooksAccounts = useCallback(async () => {
        try {
            setIsQuickBookLoader(true)
            const response = await apiClient.get(`/connection/quickbooks/account/${id}`);
            const account = response?.data?.data

            if (account?.length > 0) {
                const income: any = account?.filter((item: any) => item.accountType === "Income") || [];
                income.push(...account?.filter((item: any) => item.accountType === "Other Income"))

                const expense: any = account?.filter((item: any) => item.accountType === "Cost of Goods Sold") || [];
                expense.push(...account?.filter((item: any) => item.accountType === "Expense"))

                const asset: any = account?.filter((item: any) => item.accountType === "Other Current Asset") || [];
                asset.push(...account?.filter((item: any) => item.accountType === "Fixed Asset"))

                const deposit: any = account?.filter((item: any) => item.accountType === "Bank") || [];
                deposit.push(...account?.filter((item: any) => item.accountSubType === "BankCharges"));


                setIncomeAccount(income)
                setExpenseAccount(expense)
                setAssetAccount(asset)
                setDepositAccount(deposit)
            }
            setIsQuickBookLoader(false)
        } catch (error) {
            false
            console.error("~ getConnection error:", error);
        }
    }, [setIsLoading, id]);




    useEffect(() => {
        if (id) {
            getConnection();
            getQuicBooksAccounts()
        }
    }, [id, getConnection, loginRole, getQuicBooksAccounts]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isValid()) return;

        try {
            setIsButtonLoading(true);
            if (id) {
                const response = await apiClient.patch(`/connection/quickbooks/account/${id}`, formData)
                setTimeout(() => {
                    if (response.data?.success) {
                        navigate(-1)
                        toast.success(response.data?.message)

                    } else {
                        toast.error(response.data?.message)
                        setIsButtonLoading(false);
                    }
                }, 500);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "An error occurred.");
            console.error("Error during form submission:", error);
        } finally {
            setTimeout(() => {
                setIsButtonLoading(false);
            }, 500);
        }
    };

    return (
        <>
            <FormHeaderPaths page={id ? "QuickBook Account Settings" : "QuickBook Account Settings"} prevLink="/connection/1" prevPage="Connection" />
            <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
                <div className="mb-6 space-x-1 flex items-center justify-center">
                    <h1 className="text-2xl font-bold dark:text-DARK-100  flex justify-center">
                        QuickBook Account Settings
                    </h1>
                    {formData?.realmId && <span className="text-xs text-end bg-BRAND-500 text-white rounded p-1">
                        QuickBook Connected
                    </span>}
                </div>
                {isLoading && <FormLoader count={1} />}
                {!isLoading && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className={`grid gap-4`}>
                            <div>
                                <div className="mb-2 block">
                                    <div className="flex items-center gap-3 h-6 w-full">
                                        <div>
                                            <Label
                                                className="text-sm font-medium text-DARK-700 mb-1">
                                                QuickBooks Income Account
                                            </Label>
                                            <span className="text-ERROR_HOVER">*</span>
                                        </div>
                                        {(isQuickBookLoader) && <samp><AiOutlineLoading3Quarters className="h-6 w-6 font-bold animate-spin text-PRIMARY" /></samp>}
                                    </div>
                                </div>
                                <div className={`${isQuickBookLoader ? "!cursor-not-allowed" : ""}`}>
                                    <DropdownWithSearch
                                        setSelectedItem={() => { }}
                                        selectedItem={incomeAccount?.find((c: any) => c._id === formData.incomeAccount)?.name || ''}
                                        items={incomeAccount}
                                        title="QuickBooks income account"
                                        handleFilter={handleIncomeAccount}
                                        fieldKey="QuickBooks income account"
                                        isAllow={isQuickBookLoader}
                                    />
                                    {errors?.incomeAccount && <p className="mt-1 text-sm text-red-600">{errors?.incomeAccount}</p>}
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <div className="flex items-center gap-3 h-6 w-full">
                                    <div>
                                        <Label
                                            className="text-sm font-medium text-DARK-700 mb-1">
                                            QuickBooks Expense Account
                                        </Label>
                                        <span className="text-ERROR_HOVER">*</span>
                                    </div>
                                        {(isQuickBookLoader) && <samp><AiOutlineLoading3Quarters className="h-6 w-6 font-bold animate-spin text-PRIMARY" /></samp>}
                                    </div>
                                </div>
                                <div className={`${isQuickBookLoader ? "!cursor-not-allowed" : ""}`}>
                                    <DropdownWithSearch
                                        setSelectedItem={() => { }}
                                        selectedItem={expenseAccount?.find((c: any) => c._id === formData.expenseAccount)?.name || ''}
                                        items={expenseAccount}
                                        title="QuickBooks expense account"
                                        handleFilter={handleExpenseAccount}
                                        fieldKey="QuickBooks expense account"
                                        isAllow={isQuickBookLoader}
                                    />
                                    {errors?.expenseAccount && <p className="mt-1 text-sm text-red-600">{errors?.expenseAccount}</p>}
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <div className="flex items-center gap-3 h-6 w-full">
                                        <div>
                                            <Label
                                                className="text-sm font-medium text-DARK-700 mb-1">
                                                QuickBooks Asset Account
                                            </Label>
                                            <span className="text-ERROR_HOVER">*</span>
                                        </div>
                                        {(isQuickBookLoader) && <samp><AiOutlineLoading3Quarters className="h-6 w-6 font-bold animate-spin text-PRIMARY" /></samp>}
                                    </div>
                                </div>
                                <div className={`${isQuickBookLoader ? "!cursor-not-allowed" : ""}`}>
                                    <DropdownWithSearch
                                        setSelectedItem={() => { }}
                                        selectedItem={assetAccount?.find((c: any) => c._id === formData.assetAccount)?.name || ''}
                                        items={assetAccount}
                                        title="QuickBooks asset account"
                                        handleFilter={handleAssetAccount}
                                        fieldKey="QuickBooks asset account"
                                        isAllow={isQuickBookLoader}
                                    />
                                    {errors?.assetAccount && <p className="mt-1 text-sm text-red-600">{errors?.assetAccount}</p>}
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <div className="flex items-center gap-3 h-6 w-full">
                                    <div>
                                        <Label
                                            className="text-sm font-medium text-DARK-700 mb-1">
                                            QuickBooks DepositTo Account
                                        </Label>
                                        <span className="text-ERROR_HOVER">*</span>
                                    </div>
                                        {(isQuickBookLoader) && <samp><AiOutlineLoading3Quarters className="h-6 w-6 font-bold animate-spin text-PRIMARY" /></samp>}
                                    </div>
                                </div>
                                <div className={`${isQuickBookLoader ? "!cursor-not-allowed" : ""}`}>
                                    <DropdownWithSearch
                                        setSelectedItem={() => { }}
                                        selectedItem={depositAccount?.find((c: any) => c._id === formData.depositAccount)?.name || ''}
                                        items={depositAccount}
                                        title="QuickBooks deposit account"
                                        handleFilter={handleDepositAccount}
                                        fieldKey="QuickBooks deposit account"
                                        isAllow={isQuickBookLoader}
                                    />
                                    {errors?.depositAccount && <p className="mt-1 text-sm text-red-600">{errors?.depositAccount}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={!!isButtonLoading}
                                className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!!isButtonLoading}
                                className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                            >
                                <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                                {isButtonLoading && (
                                    <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default ConnectionSettings