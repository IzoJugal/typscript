import { Button } from "flowbite-react";
import { CheckSquare, Square } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../../../environment/env";
import { toast } from "react-toastify";
import apiClient from "../../../utils/AxiosInstance";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { IFeature } from "../../FeatureConfiguration/FeatureConfiguration";
import { createQueryParams } from "../../../utils/functions";
import { useDarkMode } from "../../../context/DarkModeProvider";

interface IFormData {
    _id?: string;
    company?: string;
    parent?: {
        name: string;
        isActive: boolean;
    };
    children?: {
        name: string;
        isActive: boolean;
    }[];
}

export const toDisplayName = (key: string) => {
    if (!key) return "";

    const customMappings: Record<string, string> = {
        open_close_cash_register: "Open/Close Cash Register",
        qr_payments: "QR Payments",
        pre_auth: "Pre Auth",
        tax_exemptions: "Tax Exemptions",
        house_account: "House Account",
    };

    if (customMappings[key]) return customMappings[key];

    return key
        .split('_')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const Loader = () => {
    const { isDarkMode } = useDarkMode();
    return (
        <SkeletonTheme 
            baseColor={isDarkMode ? "#212529" : "#F1E9EE"} 
            highlightColor={isDarkMode ? "#343A40" : "#F9F5F7"}
        >
            <div className="space-y-8">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="border dark:border-DARK-700 rounded-xl p-5 bg-DARK-50 dark:bg-DARK-800 shadow-sm"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton width={150} height={20} />
                            <div className="flex gap-4">
                                <Skeleton width={60} height={16} />
                                <Skeleton width={50} height={16} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, j) => (
                                <Skeleton key={j} height={40} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </SkeletonTheme>
    );
}

const CompanyFeatureConfiguration = () => {
    const { id } = useParams();
    const [btnLoading, setBtnLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Default to true to prevent initial content flashes
    const [featuresData, setFeaturesData] = useState<IFeature[]>([]);
    const [formData, setFormData] = useState<IFormData>({ company: id });
    const [selected, setSelected] = useState<Record<string, { selectedParent: boolean; children: string[] }>>({});

    // Unified initialization function to coordinate both requests cleanly
    const initializeData = useCallback(async () => {
        if (!id) return;
        
        setIsLoading(true);
        try {
            // 1. Fetch system features structure
            const combinedData = { isActive: true, createdAt: -1 };
            const queryParams = createQueryParams(combinedData);
            const featuresResponse = await apiClient.get(`/features${queryParams}`);
            const fetchedFeatures = featuresResponse.data?.data || [];

            // 2. Fetch active configuration assignment matching company ID
            let companyConfigData: any = null;
            try {
                const configResponse = await apiClient.get(`${apiUrl}/feature-configuration/company/${id}`);
                if (configResponse.data?.success) {
                    companyConfigData = configResponse.data.data;
                }
            } catch (err) {
                console.error("No configuration schema assignment found for this company profile yet.");
            }

            // 3. Process application state updates simultaneously inside artificial execution timeout
            setTimeout(() => {
                setFeaturesData(fetchedFeatures);

                if (companyConfigData) {
                    setFormData(companyConfigData);
                    if (companyConfigData.features) {
                        const mapped: any = {};
                        companyConfigData.features.forEach((feature: any) => {
                            mapped[feature?.parent?.name] = {
                                selectedParent: feature?.parent?.isActive || feature?.parent?.active || false,
                                children: feature?.children
                                    ?.filter((c: any) => c.isActive || c.active)
                                    .map((c: any) => c.name) || [],
                            };
                        });
                        setSelected(mapped);
                    }
                }
                setIsLoading(false);
            }, 500);

        } catch (error) {
            console.error('Initialization phase encountered a fatal processing error:', error);
            setFeaturesData([]);
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    const getChildrenOf = (parent: string) => {
        const p = featuresData?.find(f => f.value === parent);
        return p?.child?.map(c => c.value) || [];
    };

    const toggleParent = (parent: string) => {
        setSelected(prev => {
            const prevState = prev[parent] || { selectedParent: false, children: [] };
            const isParentSelected = prevState.selectedParent;

            return {
                ...prev,
                [parent]: {
                    selectedParent: !isParentSelected,
                    children: parent === "payment_types" ? ["cash"] : [],
                },
            };
        });
    };

    const toggleChild = (parent: string, child: string) => {
        setSelected(prev => {
            const current = prev[parent] || { selectedParent: false, children: [] };

            let newChildren = current.children.includes(child)
                ? current.children.filter(c => c !== child)
                : [...current.children, child];

            if (parent === "payment_types") {
                if (child === "cash") return prev;
                newChildren = ["cash", ...newChildren.filter(c => c !== "cash")];
            }

            return {
                ...prev,
                [parent]: {
                    ...current,
                    children: newChildren,
                },
            };
        });
    };

    const selectAll = (parent: string) => {
        setSelected(prev => {
            const current = prev[parent] || { selectedParent: false, children: [] };
            const allChildren = getChildrenOf(parent);

            const filteredCurrent = parent === "payment_types"
                ? current.children.filter(c => c !== "cash")
                : current.children;

            const isAllSelected = filteredCurrent.length ===
                (parent === "payment_types" ? allChildren.length - 1 : allChildren.length);

            let updatedChildren: string[] = [];

            if (isAllSelected) {
                updatedChildren = parent === "payment_types" ? ["cash"] : [];
            } else {
                updatedChildren = parent === "payment_types"
                    ? ["cash", ...allChildren.filter(c => c !== "cash")]
                    : allChildren;
            }

            return {
                ...prev,
                [parent]: {
                    ...current,
                    children: updatedChildren,
                },
            };
        });
    };

    const reset = (parent: string) => {
        setSelected(prev => ({
            ...prev,
            [parent]: {
                selectedParent: parent === "payment_types",
                children: parent === "payment_types" ? ["cash"] : [],
            },
        }));
    };

    const saveFeatureConfiguration = async (e: React.FormEvent) => {
        e.preventDefault();
        setBtnLoading(true);

        try {
            const isEdit = Boolean(formData?._id);
            const endpoint = isEdit
                ? `${apiUrl}/feature-configuration/${formData._id}`
                : `${apiUrl}/feature-configuration/add`;

            const method: 'patch' | 'post' = isEdit ? 'patch' : 'post';

            const features = featuresData?.map(parentItem => {
                const parentValue = parentItem.value;
                const selectedState = selected[parentValue] || {
                    selectedParent: false,
                    children: [],
                };

                const parentChildren = parentItem.child.map(c => {
                    let isActive = selectedState.children.includes(c.value);
                    if (parentValue === "payment_types" && c.value === "cash") {
                        isActive = true;
                    }
                    return {
                        name: c.value,
                        isActive,
                    };
                });

                const isParentActive = parentValue === "payment_types" ? true : selectedState.selectedParent;

                return {
                    parent: {
                        name: parentValue,
                        isActive: isParentActive,
                    },
                    children: parentChildren,
                };
            });

            const payload = {
                company: id,
                features,
            };

            const response = await apiClient[method](endpoint, payload);
            const { success, message, data } = response.data;

            if (!success) {
                toast.error(message);
                return;
            }

            toast.success(message);
            setFormData(data);

            if (data.features) {
                const mapped: any = {};
                data.features.forEach((feature: any) => {
                    mapped[feature?.parent?.name] = {
                        selectedParent: feature?.parent?.isActive || feature?.parent?.active || false,
                        children: feature?.children
                            ?.filter((c: any) => c.isActive || c.active)
                            .map((c: any) => c.name) || [],
                    };
                });
                setSelected(mapped);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "An error occurred while saving feature configuration.");
        } finally {
            setBtnLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-DARK-900 rounded-xl shadow-sm border dark:border-DARK-700">
            <h2 className="text-2xl font-semibold mb-6 text-DARK-900 dark:text-DARK-100">
                Feature Configuration
            </h2>

            {isLoading ? (
                <Loader />
            ) : (
                <div className="space-y-8">
                    {!featuresData || featuresData.length === 0 ? (
                        <div className="text-center py-10 text-DARK-600 dark:text-DARK-300 text-lg font-medium">
                            No features available to display.
                        </div>
                    ) : (
                        featuresData.map((parentItem) => {
                            const parentSelected = selected[parentItem?.value]?.selectedParent || false;
                            const selectedChildren = selected[parentItem?.value]?.children || [];

                            return (
                                <div
                                    key={parentItem._id}
                                    className="border dark:border-DARK-700 rounded-xl p-5 bg-DARK-50 dark:bg-DARK-800 shadow-sm"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={parentSelected}
                                                onChange={() => toggleParent(parentItem?.value)}
                                                className="w-5 h-5 text-BRAND-500 rounded border-DARK-300 focus:ring-0 cursor-pointer"
                                            />
                                            <span className="ml-2 text-lg font-medium text-DARK-900 dark:text-DARK-100">
                                                {parentItem?.label}
                                            </span>
                                        </label>

                                        <div className="flex gap-4">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedChildren.length === parentItem.child.length && parentSelected}
                                                    onChange={() => parentSelected && selectAll(parentItem?.value)}
                                                    className="w-4 h-4 text-green-600 border-DARK-300 rounded focus:!ring-0 disabled:cursor-not-allowed"
                                                    disabled={!parentSelected}
                                                />
                                                <span className={`ml-2 text-sm font-medium ${parentSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                    Select All
                                                </span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => reset(parentItem?.value)}
                                                disabled={!parentSelected}
                                                className="text-sm font-medium text-ERROR_HOVER hover:text-red-700 hover:underline transition-colors disabled:opacity-40 disabled:no-underline"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {parentItem?.child.map((child, index) => {
                                            const isCash = parentItem.value === "payment_types" && child.value === "cash";
                                            const isChecked = isCash ? true : selectedChildren.includes(child?.value);
                                            
                                            const cursorClass = !parentSelected || isCash
                                                ? "cursor-not-allowed"
                                                : "cursor-pointer";

                                            return (
                                                <div key={child?._id || index} className="relative group">
                                                    <div
                                                        onClick={() => parentSelected && toggleChild(parentItem?.value, child?.value)}
                                                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${cursorClass} ${
                                                            isChecked && parentSelected
                                                                ? "bg-BRAND-50 border-BRAND-500 dark:bg-DARK-950 shadow-sm"
                                                                : "bg-white dark:bg-DARK-800 border-gray-200 dark:border-DARK-600 hover:border-DARK-400"
                                                        } ${!parentSelected ? "opacity-50" : ""}`}
                                                    >
                                                        <span className="text-sm font-medium text-DARK-900 dark:text-DARK-100 truncate pr-2">
                                                            {child?.label}
                                                        </span>
                                                        
                                                        {isChecked && parentSelected ? (
                                                            <CheckSquare className="h-5 w-5 text-BRAND-500 flex-shrink-0" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-gray-400 dark:text-DARK-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    
                                                    {isCash && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap shadow-md">
                                                            Cash is always enabled by default
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <div className="flex justify-end mt-8">
                <Button
                    className="w-32 bg-BRAND-500 hover:!bg-BRAND-600 dark:bg-BRAND-500 dark:hover:!bg-BRAND-600 text-white focus:!ring-0"
                    onClick={saveFeatureConfiguration}
                    disabled={btnLoading || isLoading || featuresData?.length === 0}
                >
                    {btnLoading ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    );
};

export default CompanyFeatureConfiguration;