import { useNavigate, useParams } from "react-router-dom";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import FormLoader from "../../utils/common/FormLoader";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Checkbox, Label } from "flowbite-react";
import SelectWithSearch from "../../utils/common/SelectWithSearch";
import { IoClose } from "react-icons/io5";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import NumberInputPOS from "../../utils/common/NumberInputPOS";
import CommonInput from "../../utils/common/CommonInput";


interface Feature {
    name?: string;
    count?: number;
    isUnlimited?: boolean;
}

interface IPlan {
    _id?: string;
    name?: string;
    price?: number | null;
    isCustomPrice?: boolean;
    slogan?: string;
    priority?: number;
    features?: Feature[];
    planDuration?: {
        interval?: string;
        intervalCount?: number;
    };
    isActive?: boolean;
}

interface ErrorState {
    name?: string;
    price?: string;
    priority?: string;
    slogan?: string;
    featureName?: string;
    featureCount?: string;
    interval?: string;
    intervalCount?: string;

    features?: {
        featureName?: string;
        featureCount?: string;
    }[];
}

// Define interval limits
const intervalLimits: { [key: string]: number } = {
    day: 365,
    week: 52,
    month: 12,
    year: 3,
};

const generateIntervalCountOptions = (interval?: string) => {
    const maxCount = interval ? intervalLimits[interval] : 1;
    const options = [];

    for (let i = 1; i <= maxCount; i++) {
        options.push({
            value: i,
            label: i.toString()
        });
    }

    return options;
};

const featureList = [
    {
        label: "Restaurant",
        value: "restaurant"
    },
    {
        label: "Products",
        value: "products"
    },
    {
        label: "Staff",
        value: "staff"
    },
    {
        label: "Coupons",
        value: "coupons"
    },
    {
        label: "POS Device",
        value: "pos_device"
    },
    {
        label: "Reservation",
        value: "reservation"
    }
];

const blockInvalidNumberInput = (
    e: React.KeyboardEvent<HTMLInputElement>
) => {
    if (["e", "E", "+", "-", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
    }
};

const stopWheelChange = (
    e: React.WheelEvent<HTMLInputElement>
) => {
    (e.target as HTMLInputElement).blur();
};

const PlanForm = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({} as ErrorState);
    const [selectedIntervalCount, setSelectedIntervalCount] = useState<number | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
    const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
    const [features, setFeatures] = useState<Feature[]>([
        { name: "restaurant", count: 1, isUnlimited: false },
        { name: "products", count: 15, isUnlimited: false, },
        { name: "staff", count: 3, isUnlimited: false },
        // { name: "modifier", count: 15 },
        // { name: "pos device", count: 3 },
    ]);
    const [formData, setFormData] = useState<IPlan>({
        features: features,
        isActive: false
    });

    const intervalOptions = [
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
        { value: "year", label: "Year" },
    ];

    const priorityOptions = [
        { value: 1, label: "1" },
        { value: 2, label: "2" },
        { value: 3, label: "3" },
        { value: 4, label: "4" },
        { value: 5, label: "5" },
    ];

    const intervalCountOptions = generateIntervalCountOptions(formData?.planDuration?.interval) || [];

    const safeFeatures = Array.isArray(features) ? features : [];

    // const getPlanById = useCallback(async () => {
    //     if (!id) return;
    //     try {
    //         setIsLoading(true);
    //         const response = await apiClient.get(`/plan/${id}`);
    //         const features = response?.data?.data?.features;
    //         const priority = response?.data?.data?.priority;
    //         const interval = response?.data?.data?.planDuration?.interval;
    //         const intervalCount = response?.data?.data?.planDuration?.intervalCount;

    //         if (features && Array.isArray(features)) {
    //             setFeatures(features);
    //         }
    //         if (priority) {
    //             setSelectedPriority(priority);
    //         }
    //         if (interval) {
    //             setSelectedInterval(interval);
    //         }
    //         if (intervalCount) {
    //             setSelectedIntervalCount(intervalCount);
    //         }
    //         setFormData(response?.data?.data);
    //         setTimeout(() => {
    //             setIsLoading(false);
    //         }, 500);
    //     } catch (error) {
    //         setTimeout(() => {
    //             setIsLoading(false);
    //         }, 500);
    //         console.error('Error fetching plan data:', error);
    //     }
    // }, [id, setIsLoading]);

    const getPlanById = useCallback(async () => {
        if (!id) return;

        try {
            setIsLoading(true);

            const response = await apiClient.get(`/plan/${id}`);
            const data = response?.data?.data ?? {};

            const normalizedFeatures = Array.isArray(data.features) ? data.features : [];
            const priority = data?.priority ?? null;
            const interval = data?.planDuration?.interval ?? null;
            const intervalCount = data?.planDuration?.intervalCount ?? null;

            setFeatures(normalizedFeatures);
            setSelectedPriority(priority);
            setSelectedInterval(interval);
            setSelectedIntervalCount(intervalCount);

            setFormData({
                _id: data?._id ?? "",
                name: data?.name ?? "",
                price: data?.price ?? null,
                isCustomPrice: data?.isCustomPrice ?? false,
                slogan: data?.slogan ?? "",
                priority: data?.priority ?? undefined,
                features: normalizedFeatures,
                planDuration: {
                    interval: data?.planDuration?.interval ?? undefined,
                    intervalCount: data?.planDuration?.intervalCount ?? undefined,
                },
                isActive: data?.isActive ?? false,
            });
        } catch (error) {
            console.error("Error fetching plan data:", error);
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            getPlanById();
        }
    }, [id, getPlanById]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? checked
                : name === 'price'
                    ? value === '' ? null : Number(value)
                    : value,
        }));

        if (name === 'isCustomPrice') {
            setFormData(prev => ({
                ...prev,
                price: null,
            }));
        }

        if (errors[name as keyof ErrorState]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }

    }

    const intervalRef = useRef<HTMLInputElement>(null);
    const intervalCountRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const priorityRef = useRef<HTMLInputElement>(null);

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<ErrorState> = {};
        let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | null = null;

        if (!formData.name) {
            errorMsg.name = "Please enter name.";
            if (!firstErrorRef) {
                firstErrorRef = nameRef;
            };
            isValid = false;
        }


        if (!formData?.isCustomPrice) {
            const price = Number(formData?.price);

            if (
                formData?.price === null ||
                formData?.price === undefined ||
                isNaN(price)
            ) {
                errorMsg.price = "Please enter a valid price.";
                if (!firstErrorRef) firstErrorRef = priceRef;
                isValid = false;
            }
            else if (price < 0) {
                errorMsg.price = "Price cannot be negative.";
                if (!firstErrorRef) firstErrorRef = priceRef;
                isValid = false;
            }
            // else if (price === 0) {
            //     errorMsg.price = "Price must be greater than 0.";
            //     if (!firstErrorRef) firstErrorRef = priceRef;
            //     isValid = false;
            // }
        }
        // else if (!formData?.isCustomPrice && formData?.price < 0) {
        //     errorMsg.price = "Price must be greater than 0.";
        //     if (!firstErrorRef) {
        //         firstErrorRef = priceRef;
        //     };
        //     isValid = false;
        // }

        if (!formData?.isCustomPrice && !formData.planDuration?.interval) {
            errorMsg.interval = "Please select a plan interval.";
            if (!firstErrorRef) {
                firstErrorRef = intervalRef;
            };
            isValid = false;
        }

        if (!formData?.isCustomPrice && formData.planDuration?.interval && !formData.planDuration?.intervalCount) {
            errorMsg.intervalCount = "Please select a plan interval count.";
            if (!firstErrorRef) {
                firstErrorRef = intervalCountRef;
            };
            isValid = false;
        }

        if (!formData?.priority) {
            errorMsg.priority = "Please select a plan priority.";
            if (!firstErrorRef) {
                firstErrorRef = priorityRef
            }
            isValid = false;
        }

        if (!features || features.length === 0) {
            errorMsg.features = [{ featureName: "Please add at least one feature." }];
            isValid = false;
        } else {
            const featureErrors: ErrorState["features"] = [];

            features.forEach((feature, index) => {
                const fError: { featureName?: string; featureCount?: string } = {};

                if (!feature.name) {
                    fError.featureName = "Feature name is required.";
                    isValid = false;
                }

                if (!feature.isUnlimited) {
                    const count = Number(feature.count);

                    if (
                        feature.count === null ||
                        feature.count === undefined ||
                        isNaN(count)
                    ) {
                        fError.featureCount = "Count is required.";
                        isValid = false;
                    } else if (count < 0) {
                        fError.featureCount = "Count cannot be negative.";
                        isValid = false;
                    }
                }

                featureErrors[index] = fError;
            });
            errorMsg.features = featureErrors;
        }

        setErrors(prev => ({ ...prev, ...errorMsg }));
        if (firstErrorRef && firstErrorRef.current) {
            firstErrorRef.current.focus();
            firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                let response;
                if (id) {
                    setIsButtonLoading(true)
                    response = await apiClient.patch(`/plan/${id}`, formData);
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'Plan updated successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the plan.');
                        setIsLoading(false);
                        setIsButtonLoading(false);
                        return;
                    }
                } else {
                    setIsButtonLoading(true)
                    response = await apiClient.post('/plan/add', formData);
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'Plan added successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the plan.');
                        setIsLoading(false);
                        setIsButtonLoading(false);
                        return;
                    }
                }
                if (response?.data?.success === true) {
                    navigate(-1);
                    setTimeout(() => {
                        setFormData({});
                        setIsLoading(false)
                        setIsButtonLoading(false);
                    }, 500);
                }
            } catch (error: any) {
                setIsButtonLoading(false)
                console.log('Error during form submission:', error);
                toast.error(error?.response?.data?.message);
            }
        }
    };

    const handleInterval = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            planDuration: {
                ...prev.planDuration,
                interval: id
            }
        }));

        setErrors(prev => ({ ...prev, 'interval': "" }));
    };

    const handleIntervalCount = (id: number) => {
        setFormData((prev) => ({
            ...prev,
            planDuration: {
                ...prev.planDuration,
                intervalCount: id
            }
        }));

        setErrors(prev => ({ ...prev, 'intervalCount': "" }));
    };

    const handlePriority = (id: number) => {
        setFormData((prev) => ({
            ...prev,
            priority: id
        }));

        setErrors(prev => ({ ...prev, 'priority': "" }));
    };

    // const handleAddFeature = () => {
    //     const updated = [...features, { name: "", count: 1 }];
    //     handleFeaturesChange(updated);
    // };

    const handleAddFeature = () => {
        const current = Array.isArray(features) ? features : [];
        const updated = [...current, { name: "", count: 1, isUnlimited: false }];
        handleFeaturesChange(updated);
    };

    const handleRemoveFeature = (index: number) => {
        const current = Array.isArray(features) ? features : [];
        if (current.length > 1) {
            const updated = current.filter((_, i) => i !== index);
            handleFeaturesChange(updated);
        }
    };

    // const handleRemoveFeature = (index: number) => {
    //     if (features.length > 1) {
    //         const updated = features.filter((_, i) => i !== index);
    //         handleFeaturesChange(updated);
    //     }
    // };

    const handleFeaturesChange = (features: Feature[]) => {
        setFeatures(features);
        setFormData((prev) => ({
            ...prev,
            features: features
        }));
    };

    const handleFeatureInputChange = (
        index: number,
        key: keyof Feature | "featureName",
        value: string | number | boolean
    ) => {
        const current = Array.isArray(features) ? features : [];
        const updated: any[] = [...current];
        const updatedErrors = { ...errors };

        if (!updated[index]) return;

        if (key === "count") {
            if (!updated[index].isUnlimited) {
                const stringValue = String(value).trim();
                if (stringValue === "") {
                    updated[index].count = null;
                } else {
                    const sanitized = stringValue.replace(/[^0-9]/g, "");
                    updated[index].count = sanitized === "" ? null : Number(sanitized);
                }
                updated[index].isUnlimited = false;
            }
        } else if (key === "isUnlimited") {
            updated[index].isUnlimited = value as boolean;
            if (value === true) {
                updated[index].count = null;
            }
        } else {
            updated[index][key] = value;
        }

        if (key === "name" || key === "featureName") {
            if (updatedErrors.features?.[index]) {
                updatedErrors.features[index].featureName = "";
            }
        }

        handleFeaturesChange(updated);
        setErrors(updatedErrors);
    };

    // const handleFeatureInputChange = (index: number, key: keyof Feature | "featureName", value: string | number | boolean) => {
    //     const updated: any = [...features];
    //     const updatedErrors = { ...errors };

    //     if (key === "count") {
    //         if (!updated[index].isUnlimited) {
    //             const stringValue = String(value).trim();
    //             if (stringValue === "") {
    //                 updated[index].count = null;
    //             } else {
    //                 const sanitized = stringValue.replace(/[^0-9]/g, "");
    //                 updated[index].count = sanitized === "" ? null : Number(sanitized);
    //             }
    //             updated[index].isUnlimited = false;
    //         }
    //     } else if (key === "isUnlimited") {
    //         updated[index].isUnlimited = value as boolean;
    //         if (value === true) {
    //             updated[index].count = null;
    //             updated[index].isUnlimited = true;
    //         }
    //     } else {
    //         updated[index][key] = value;
    //     }

    //     if (key === "name" || key === "featureName") {
    //         if (updatedErrors.features?.[index]) {
    //             updatedErrors.features[index].featureName = "";
    //         }
    //     }

    //     handleFeaturesChange(updated);
    //     setErrors(updatedErrors);
    // };


    return (
        <>
            <FormHeaderPaths page={id ? 'Edit plan' : 'Add plan'} prevLink='/plan/1/' prevPage='Plan' />
            <div className="relative px-4 sm:px-6 lg:px-8  p-4 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Plan Form</h2>
                {isLoading ? <FormLoader count={2} /> :
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name" value="Plan name"></Label><span className="text-ERROR_HOVER">*</span>
                                <CommonInput
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name ?? ""}
                                    onChange={handleChange}
                                    ref={nameRef}
                                    placeholder="Name"
                                    // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                />
                                {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="price" value="Price"></Label>{!formData?.isCustomPrice && (<span className="text-ERROR_HOVER">*</span>)}
                                <NumberInputPOS
                                    id="price"
                                    name="price"
                                    value={formData?.price ?? ""}
                                    allowDecimal={true}
                                    onChange={(value) =>
                                        setFormData((prev:any) => ({
                                            ...prev,
                                            price: value,
                                        }))
                                    }
                                    inputRef={priceRef}
                                    maxDecimalPlaces={2}
                                    // min={0}
                                    placeholder="Price"
                                    disabled={formData?.isCustomPrice}
                                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl
                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                {errors.price && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.price}</p>}
                            </div>
                            <div className="flex items-center mt-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="isCustomPrice"
                                        name="isCustomPrice"
                                        checked={!!formData?.isCustomPrice}
                                        onChange={handleChange}
                                        className="checked:!bg-BRAND-500 !ring-0"
                                    />

                                    <Label
                                        htmlFor="isCustomPrice"
                                        value="Custom Pricing"
                                        className="cursor-pointer mb-0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center mt-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="isActive"
                                        name="isActive"
                                        checked={formData?.isActive ?? false}
                                        onChange={handleChange}
                                        className="checked:!bg-BRAND-500 !ring-0"
                                    />

                                    <Label
                                        htmlFor="isActive"
                                        value="Plan Active"
                                        className="cursor-pointer mb-0"
                                    />
                                </div>
                            </div>

                            <div ref={intervalRef}>
                                <Label htmlFor="interval" value="Interval" />{!formData?.isCustomPrice && (<span className="text-ERROR_HOVER">*</span>)}
                                <SelectWithSearch
                                    items={Array.isArray(intervalOptions) ? intervalOptions : []}
                                    title="Interval"
                                    fieldKey="interval"
                                    selectedItem={selectedInterval}
                                    setSelectedItem={setSelectedInterval}
                                    handleChange={handleInterval}
                                    displayKey="label"
                                    searchKey="label"
                                    valueKey="value"
                                    disabled={formData?.isCustomPrice}
                                />
                                {errors?.interval && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.interval}</p>}
                            </div>
                            <div ref={intervalCountRef}>
                                <Label htmlFor="intervalCount" value="Interval Count" />{!formData?.isCustomPrice && (<span className="text-ERROR_HOVER">*</span>)}
                                <SelectWithSearch
                                    items={Array.isArray(intervalCountOptions) ? intervalCountOptions : []}
                                    title="Interval Count"
                                    fieldKey="intervalCount"
                                    selectedItem={selectedIntervalCount}
                                    setSelectedItem={setSelectedIntervalCount}
                                    handleChange={handleIntervalCount}
                                    displayKey="label"
                                    searchKey="label"
                                    valueKey="value"
                                    onKeyDown={blockInvalidNumberInput}
                                    onPaste={(e: any) => {
                                        const paste = e.clipboardData.getData("text");
                                        if (paste.includes("-")) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onWheel={stopWheelChange}
                                    disabled={formData?.isCustomPrice || !formData?.planDuration?.interval}
                                />
                                {errors?.intervalCount && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.intervalCount}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div ref={priorityRef}>
                                <Label htmlFor="priority" value="Priority" /><span className="text-ERROR_HOVER">*</span>
                                <SelectWithSearch
                                    items={Array.isArray(priorityOptions) ? priorityOptions : []}
                                    title="Priority"
                                    fieldKey="priority"
                                    selectedItem={selectedPriority}
                                    setSelectedItem={setSelectedPriority}
                                    handleChange={handlePriority}
                                    displayKey="label"
                                    searchKey="label"
                                    valueKey="value"
                                />
                                {errors?.priority && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.priority}</p>}
                            </div>
                            <div>
                                <Label htmlFor="slogan" value="Slogan"></Label>
                                <CommonInput
                                    type="text"
                                    id="slogan"
                                    name="slogan"
                                    value={formData.slogan ?? ""}
                                    onChange={handleChange}
                                    placeholder="A short and catchy tagline for this plan"
                                    // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                />
                                {errors.slogan && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.slogan}</p>}
                            </div>
                            <div>
                                <Label htmlFor="features" value="Features" /><span className="text-ERROR_HOVER">*</span>
                                <div className="space-y-4 mt-4 w-full">

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleAddFeature}
                                            className=" px-4 py-2 bg-BRAND-500 text-white rounded hover:bg-BRAND-600"
                                        >
                                            + Add Feature
                                        </button>
                                    </div>

                                    <div className="flex w-full gap-2 mb-2">
                                        <div className="flex-1 text-sm font-medium text-gray-700">Name</div>
                                        <div className="w-[100px] text-sm font-medium text-gray-700">Count</div>
                                        <div className="w-[100px] text-sm font-medium text-gray-700 text-center">Unlimited</div>
                                        <div className="w-[40px]">{/* empty for remove button */}</div>
                                    </div>
                                    {safeFeatures.map((feature, index) => (
                                        <div key={index} className="flex w-full gap-2">
                                            <div className="flex-1">
                                                {/* <input
                                                    type="text"
                                                    value={feature.name || ""}
                                                    onChange={(e) => handleFeatureInputChange(index, "name", e.target.value)}
                                                    placeholder="Feature Name"
                                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                                                /> */}
                                                <SelectWithSearch
                                                    items={
                                                        Array.isArray(featureList)
                                                            ? featureList.filter(f =>
                                                                !(Array.isArray(features) ? features : []).some(
                                                                    (feat, i) => feat?.name === f.value && i !== index
                                                                )
                                                            )
                                                            : []
                                                    }
                                                    title="Feature"
                                                    fieldKey="featureName"
                                                    selectedItem={featureList.find(f => f.value === feature.name)?.label || ""}
                                                    setSelectedItem={(label: any) => {
                                                        const selected = featureList.find(f => f.label === label);
                                                        handleFeatureInputChange(index, "name", selected?.value || "");
                                                    }}
                                                    handleChange={(value: any) => handleFeatureInputChange(index, "name", value)}
                                                    displayKey="label"
                                                    searchKey="label"
                                                    valueKey="value"
                                                />
                                                {errors.features?.[index]?.featureName && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.features[index].featureName}</p>
                                                )}
                                            </div>

                                            <div className="w-[100px]">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="Count"
                                                    value={feature.count ?? ""}
                                                    onChange={(e) => {
                                                        let value = e.target.value;

                                                        // allow empty value
                                                        if (value === "") {
                                                            handleFeatureInputChange(index, "count", "");
                                                            return;
                                                        }

                                                        // remove minus and non-numeric chars
                                                        value = value.replace(/[^0-9]/g, "");

                                                        handleFeatureInputChange(index, "count", value);
                                                    }}
                                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                                                    disabled={feature.isUnlimited === true}
                                                />
                                                {!feature.isUnlimited && errors.features?.[index]?.featureCount && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.features[index].featureCount}</p>
                                                )}
                                            </div>

                                            <div className="w-[100px] flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={feature.isUnlimited || false}
                                                    onChange={(e) =>
                                                        handleFeatureInputChange(index, "isUnlimited", e.target.checked)
                                                    }
                                                    className="checked:!bg-BRAND-500 !ring-0 rounded"
                                                    aria-label="Unlimited checkbox"
                                                />
                                            </div>

                                            <div className="w-[40px] flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFeature(index)}
                                                    className={`bg-BRAND-500 text-white rounded hover:bg-BRAND-600 p-2 ${features.length === 1 ? "opacity-50 cursor-not-allowed" : ""
                                                        }`}
                                                    disabled={features.length === 1}
                                                    aria-label="Remove Feature"
                                                >
                                                    <IoClose className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}


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
                }
            </div>
        </>
    )
}

export default PlanForm;
