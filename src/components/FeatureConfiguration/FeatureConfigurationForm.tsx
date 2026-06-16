import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { Button, Label, TextInput, ToggleSwitch } from "flowbite-react";
import { deleteBtnStyle } from "../../utils/common/constant";
import { RiDeleteBin6Line } from "react-icons/ri";
import FormLoader from "../../utils/common/FormLoader";
import AddActionButton from "../../utils/common/AddActionButton";

export interface IFeatureChild {
    value: string;
    label: string;
}

export interface IFeature {
    _id?: string;
    value: string;
    label: string;
    child?: IFeatureChild[];
    isActive?: boolean;
}

export interface ChildError {
    value?: string;
    label?: string;
}

export interface ErrorState {
    value?: string;
    label?: string;
    child?: ChildError[];
}


const FeatureConfigurationForm = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [errors, setErrors] = useState<ErrorState>({} as ErrorState);
    const [formData, setFormData] = useState<IFeature>({
        value: "",
        label: "",
        child: [],
        isActive: false,
        // child: [{
        //     value: "",
        //     label: ""
        // }]
    });
    const safeChild = Array.isArray(formData.child) ? formData.child : [];


    // const getFeatureById = useCallback(async () => {
    //     if (!id) return;

    //     try {
    //         setIsLoading(true);

    //         const response = await apiClient.get(`/features/${id}`);

    //         const featureData = response?.data?.data;

    //         setFormData({
    //             _id: featureData?._id,
    //             value: featureData?.value || "",
    //             label: featureData?.label || "",
    //             child: featureData?.child || [],
    //             isActive: featureData?.isActive || false,
    //         });

    //     } catch (error) {
    //         console.error("Error fetching feature data:", error);
    //     } finally {
    //         setTimeout(() => {
    //             setIsLoading(false);
    //         }, 500);
    //     }
    // }, [id]);

    const getFeatureById = useCallback(async () => {
        if (!id) return;

        try {
            setIsLoading(true);

            const response = await apiClient.get(`/features/${id}`);
            const featureData = response?.data?.data ?? {};

            setFormData({
                _id: featureData?._id ?? "",
                value: featureData?.value ?? "",
                label: featureData?.label ?? "",
                child: Array.isArray(featureData?.child) ? featureData.child : [],
                isActive: featureData?.isActive ?? false,
            });

        } catch (error) {
            console.error("Error fetching feature data:", error);
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            getFeatureById();
        }
    }, [id, getFeatureById]);

    const validateForm = () => {
        const newErrors: ErrorState = {};

        if (!formData.value?.trim()) newErrors.value = "Value is required";
        if (!formData.label?.trim()) newErrors.label = "Label is required";

        const childErrors: ChildError[] = [];

        // formData.child?.forEach((item, index) => {
        safeChild.forEach((item, index) => {
            const cErr: ChildError = {};

            if (!item.value?.trim()) cErr.value = "Required";
            if (!item.label?.trim()) cErr.label = "Required";

            childErrors[index] = cErr;
        });

        if (childErrors.some(err => err.value || err.label)) {
            newErrors.child = childErrors;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleParentChange = (field: keyof IFeature, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    // const handleChildChange = (index: number, field: keyof IFeatureChild, value: string) => {
    //     const updated = [...(formData.child || [])];
    //     updated[index][field] = value;

    //     setFormData(prev => ({ ...prev, child: updated }));

    //     const updatedErrors = { ...errors };
    //     updatedErrors.child = updatedErrors.child || [];
    //     updatedErrors.child[index] = {
    //         ...updatedErrors.child[index],
    //         [field]: undefined
    //     };

    //     setErrors(updatedErrors);
    // };

    const handleChildChange = (
        index: number,
        field: keyof IFeatureChild,
        value: string
    ) => {
        const updated = [...safeChild];

        if (!updated[index]) return;

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        setFormData(prev => ({ ...prev, child: updated }));

        const updatedErrors = { ...errors };
        updatedErrors.child = updatedErrors.child || [];
        updatedErrors.child[index] = {
            ...updatedErrors.child[index],
            [field]: undefined,
        };

        setErrors(updatedErrors);
    };

    // const addChildRow = () => {
    //     setFormData(prev => ({
    //         ...prev,
    //         child: [...(prev.child || []), { value: "", label: "" }]
    //     }));
    // };

    // const removeChildRow = (index: number) => {
    //     const updated = [...(formData.child || [])];
    //     updated.splice(index, 1);
    //     setFormData(prev => ({ ...prev, child: updated }));
    // };

    const addChildRow = () => {
        setFormData(prev => ({
            ...prev,
            child: [...(Array.isArray(prev.child) ? prev.child : []), { value: "", label: "" }]
        }));
    };

    const removeChildRow = (index: number) => {
        const updated = [...safeChild];
        updated.splice(index, 1);
        setFormData(prev => ({ ...prev, child: updated }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsButtonLoading(true);

            if (id) {
                await apiClient.patch(`/features/${id}`, formData);
            } else {
                await apiClient.post(`/features/add`, formData);
            }

            navigate("/feature-config/1");
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsButtonLoading(false);
        }
    };

    return (
        <>
            <FormHeaderPaths page={id ? 'Edit feature-config' : 'Add feature-config'} prevLink='/feature-config/1/' prevPage='Feature-config' />
            <div className="relative  mx-8 my-5 p-4 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
                <h2 className="text-2xl font-bold mb-6 -text-center dark:text-white">Feature-config Form</h2>
                {isLoading ? <FormLoader count={2} /> :
                    <>
                        <h3 className="text-lg font-semibold dark:text-white">Parent Feature</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <Label>Value</Label>
                                <TextInput
                                    value={formData.value}
                                    placeholder="Enter feature value"
                                    onChange={(e) => handleParentChange("value", e.target.value)}
                                />
                                {errors.value && <p className="text-red-500 text-sm">{errors.value}</p>}
                            </div>

                            <div>
                                <Label>Label</Label>
                                <TextInput
                                    value={formData.label}
                                    placeholder="Enter feature label"
                                    onChange={(e) => handleParentChange("label", e.target.value)}
                                />
                                {errors.label && <p className="text-red-500 text-sm">{errors.label}</p>}
                            </div>
                        </div>

                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold dark:text-white">Child Feature</h3>
                            <div className="group relative">
                                <span onClick={() => addChildRow()}>
                                    <AddActionButton text="Add a child feature" />
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto border rounded-lg mb-10">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-200 dark:bg-DARK-700 dark:text-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Value</th>
                                        <th className="px-4 py-2 text-left">Label</th>
                                        <th className="px-4 py-2">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {/* {formData?.child && formData.child.length > 0 ? (
                                        formData.child.map((item, index) => ( */}
                                    {safeChild?.length > 0 ? (
                                        safeChild?.map((item, index) => (

                                            <tr key={index} className="border-t">
                                                <td className="px-4 py-2">
                                                    <TextInput
                                                        value={item.value}
                                                        placeholder="Enter child feature value"
                                                        onChange={(e) =>
                                                            handleChildChange(index, "value", e.target.value)
                                                        }
                                                    />
                                                    {errors?.child?.[index]?.value && (
                                                        <p className="text-red-500 text-sm">
                                                            {errors.child[index].value}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-2">
                                                    <TextInput
                                                        value={item.label}
                                                        placeholder="Enter child feature label"
                                                        onChange={(e) =>
                                                            handleChildChange(index, "label", e.target.value)
                                                        }
                                                    />
                                                    {errors?.child?.[index]?.label && (
                                                        <p className="text-red-500 text-sm">
                                                            {errors.child[index].label}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-2 text-center">
                                                    <Button
                                                        className={deleteBtnStyle.btn}
                                                        onClick={() => removeChildRow(index)}
                                                    >
                                                        <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center text-gray-500 py-4">
                                                No child features added yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center space-x-4 col-span-full">
                            <Label htmlFor="isWhatsappActive" className="font-medium text-DARK-700">Status</Label>
                            <ToggleSwitch
                                checked={!!formData?.isActive}
                                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e }))}
                                color="success"
                            />
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
                                onClick={handleSubmit}
                                disabled={isButtonLoading}
                                className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                            >
                                <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                                {isButtonLoading && (
                                    <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                                )}
                            </Button>
                        </div>
                    </>
                }
            </div>

        </>
    )
}

export default FeatureConfigurationForm