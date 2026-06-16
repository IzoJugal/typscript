import { Button, Label, Modal } from "flowbite-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import FormLoader from "../../utils/common/FormLoader";
import { AiOutlineLoading } from "react-icons/ai";
import { CompanyField, RestaurantField } from "../../utils/functions";
import { allowedImageExtensions, allowedVideoExtensions, FILE_SIZE_LIMIT, MANAGER_ROLES, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { apiUrl, siteUrl } from "../../environment/env";
import { HiEye } from "react-icons/hi";
import { FaPlay } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import MediaView from "../../utils/common/MediaView";
import CommonInput from "../../utils/common/CommonInput";

interface DisplayFormProps {
    id: string;
    setId: Dispatch<SetStateAction<string>>;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

interface FormState {
    title: string;
    type: string;
    company?: string;
    restaurant?: string | any;
    file?: File | null;
    isActive?: boolean;
}

interface ErrorState {
    title?: string;
    type?: string;
    company?: string;
    restaurant?: string;
    file?: string;
}

const INITIAL_FORM_STATE: FormState = {
    title: "",
    type: "",
    company: "",
    restaurant: "",
    file: null,
    isActive: true,
};

const CustomerDisplayForm: React.FC<DisplayFormProps> = ({ id, setId, open, setOpen }) => {
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

    const [errors, setErrors] = useState<ErrorState>({});
    const [companies, setCompanies] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isBtnLoading, setIsBtnLoading] = useState(false);
    const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
    const [preViewFile, setPreViewFile] = useState<string | null>(null);
    const [fileModalOpen, setFileModalOpen] = useState(false);

    const onFileCloseModal = () => setFileModalOpen(false);

    const getSingleDisplay = useCallback(async (displayId: string) => {
        try {
            setIsModalLoading(true);
            const response = await apiClient.get(`/customer_display/${displayId}`);

            // Artificial timeout maintained from original specifications
            setTimeout(() => {
                setIsModalLoading(false);
                const data = response.data.data;
                setFormData(data);
                if (data?.file) {
                    setPreViewFile(`${apiUrl}/${data.file}`);
                }
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setIsModalLoading(false);
                setFormData(INITIAL_FORM_STATE);
            }, 500);
            console.error("~ get Customer Display error :- ", error);
        }
    }, []);

    useEffect(() => {
        if (id && open) {
            getSingleDisplay(id);
        }
    }, [id, open, getSingleDisplay]);

    // Sync company profile for non-SUPER_ADMIN accounts
    useEffect(() => {
        if (loginRole !== SUPER_ADMIN && userData?.staffMember?.company?._id) {
            setFormData(prev => ({ ...prev, company: userData.staffMember.company._id }));
        }
    }, [loginRole, userData]);

    const getCompany = async () => {
        try {
            const response = await apiClient.get(`/business`);
            if (response.data.success) {
                setCompanies(response.data.companies);
            }
        } catch (error: any) {
            console.error("error fetching business data", error.message);
        }
    };

    const getRestaurant = useCallback(async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurant(response.data.restaurant);
            }
        } catch (error: any) {
            console.error("error fetching restaurant data", error.message);
        }
    }, []);

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany();
        }

        if (formData?.company) {
            getRestaurant(formData.company);
        }
    }, [loginRole, formData?.company, getRestaurant, userData]);

    // Auto-select dropdown lists if single choice remains
    useEffect(() => {
        if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
            setFormData(prev => ({ ...prev, company: companies[0]._id }));
            setErrors(prev => ({ ...prev, company: "" }));
        }
    }, [companies, loginRole, open]);

    useEffect(() => {
        if (restaurant?.length === 1) {
            setFormData(prev => ({ ...prev, restaurant: restaurant[0]._id }));
            setErrors(prev => ({ ...prev, restaurant: "" }));
        }
    }, [restaurant, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!formData.type) {
            setErrors(prev => ({ ...prev, file: "Please select a display type (Image or Video) first." }));
            e.target.value = "";
            return;
        }

        const extname = file.name.split(".").pop()?.toLowerCase() || "";

        if (file.size > FILE_SIZE_LIMIT * 1024 * 1024) {
            setErrors(prev => ({ ...prev, file: `File size should be less than or equal to ${FILE_SIZE_LIMIT} MB.` }));
            e.target.value = "";
            return;
        }

        if (formData.type === "image" && !allowedImageExtensions.includes(extname)) {
            setErrors(prev => ({ ...prev, file: "Please select a valid image file (jpeg, png, gif, webp)." }));
            e.target.value = "";
            return;
        }

        if (formData.type === "video" && !allowedVideoExtensions.includes(extname)) {
            setErrors(prev => ({ ...prev, file: "Please select a valid video file (mp4, webm, ogg)." }));
            e.target.value = "";
            return;
        }

        setFormData(prevData => ({ ...prevData, file }));
        setErrors(prev => ({ ...prev, file: "" }));
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "company") {
            if (value === "") {
                setRestaurant([]);
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        setErrors(prev => ({
            ...prev,
            [name]: "",
        }));
    };

    const isValid = (): boolean => {
        let isFormValid = true;
        const errorMsg: Partial<ErrorState> = {};

        if (!formData.title.trim()) {
            errorMsg.title = "Please enter a title.";
            isFormValid = false;
        }
        if (!formData.type) {
            errorMsg.type = "Please select a type.";
            isFormValid = false;
        }
        // FIXED: Allow file configuration to be empty strictly if editing an item containing a pre-existing preview
        if (!formData.file && !preViewFile) {
            errorMsg.file = errors.file || "Please select an appropriate file.";
            isFormValid = false;
        }
        if (loginRole === SUPER_ADMIN && !formData?.company) {
            errorMsg.company = "Please select business.";
            isFormValid = false;
        }
        if ((loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && !formData?.restaurant) {
            errorMsg.restaurant = "Please select restaurant.";
            isFormValid = false;
        }

        setErrors(prev => ({ ...prev, ...errorMsg }));
        return isFormValid;
    };

    const handleSaveDisplay = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isValid()) return;

        try {
            setIsBtnLoading(true);
            const payload = new FormData();
            payload.append("title", formData.title);
            payload.append("type", formData.type);
            if (formData.company) payload.append("company", formData.company);

            const restaurantId = formData.restaurant?._id || formData.restaurant;
            if (restaurantId) payload.append("restaurant", restaurantId);
            if (formData.file) payload.append("file", formData.file);
            if (formData.isActive !== undefined) payload.append("isActive", String(formData.isActive));

            let response;
            if (id) {
                response = await apiClient.patch(`/customer_display/${id}`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await apiClient.post('/customer_display', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setIsModalLoading(true);
            if (response?.data?.success === false) {
                toast.error(response?.data?.message);
                setIsBtnLoading(false);
                setIsModalLoading(false);
                return;
            }

            toast.success(response?.data?.message || `Customer Display ${id ? 'updated' : 'added'} successfully.`);
            onCloseModal();
        } catch (error: any) {
            console.error('Error during form submission:', error);
            toast.error(error?.response?.data?.message || 'There was an issue with the request.');
        } finally {
            setIsBtnLoading(false);
            setTimeout(() => setIsModalLoading(false), 500);
        }
    };

    const onCloseModal = () => {
        setId('');
        setOpen(false);
        setFormData({
            ...INITIAL_FORM_STATE,
            company: loginRole === SUPER_ADMIN ? "" : userData?.staffMember?.company?._id || "",
        });
        setErrors({});
        setPreViewFile(null);
        if (loginRole === SUPER_ADMIN) {
            setRestaurant([]);
        }
    };

    const imageOnError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        event.currentTarget.src = `${siteUrl}/images/Image-not-found.png`;
        event.currentTarget.className = "h-[50px] w-[50px] p-1 border rounded";
    };

    const extname = preViewFile?.split(".").pop()?.toLowerCase();
    const isImage = extname && allowedImageExtensions.includes(extname);
    const isVideo = extname && allowedVideoExtensions.includes(extname);

    const handleremoveFile = async () => {
        if (!id) {
            setPreViewFile(null);
            setFormData(prev => ({ ...prev, file: null }));
            return;
        }

        try {
            const response = await apiClient.post(`/customer_display/file/delete/${id}`, {});
            if (response?.data?.success) {
                toast.success(response.data.message);
                setPreViewFile(null);
                setFormData(prev => ({ ...prev, file: null }));
            } else {
                toast.error(response?.data?.message);
            }
        } catch (error: any) {
            console.error('Delete Customer display file error:', error);
            toast.error('Failed to delete the customer display file. Please try again.');
        }
    };

    return (
        <div>
            <Modal show={open} onClose={onCloseModal} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header className="dark:bg-DARK-800">
                    <span className="text-2xl font-bold text-gray-900 dark:text-DARK-100 text-left">
                        {isModalLoading ? (
                            <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-4"></div>
                        ) : (
                            id ? "Update Customer Display" : "Add Customer Display"
                        )}
                    </span>
                </Modal.Header>
                <Modal.Body className="dark:bg-DARK-800">
                    {isModalLoading ? (
                        <FormLoader count={1} />
                    ) : (
                        <form id="customer-display-form" onSubmit={handleSaveDisplay} className="flex max-w-full flex-col gap-4">
                            <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
                                {loginRole === SUPER_ADMIN && (
                                    <div className="flex flex-col">
                                        <CompanyField
                                            companies={companies}
                                            selectedCompanyId={formData?.company ?? ''}
                                            handleChange={handleChange}
                                            error={errors.company}
                                        />
                                    </div>
                                )}
                                {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole) || OWNER_ROLES.includes(loginRole)) && (
                                    <div className="flex flex-col">
                                        <RestaurantField
                                            restaurants={restaurant}
                                            selectedRestaurantId={formData?.restaurant?._id || formData?.restaurant || ''}
                                            handleChange={handleChange}
                                            error={errors.restaurant}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="title" value="Title" /><span className="text-ERROR_HOVER">*</span>
                                </div>
                                <CommonInput
                                    id="title"
                                    name="title"
                                    type="text"
                                    placeholder="Enter title"
                                    value={formData.title}
                                    onChange={handleChange}
                                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-gray-300 rounded-xl"
                                />
                                <span className="text-ERROR_HOVER text-sm">{errors?.title}</span>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="type" value="Type" /><span className="text-ERROR_HOVER">*</span>
                                </div>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    className={`w-full -min-w-60 placeholder:text-BRAND-400 bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 border-2 border-DARK-300 dark:border-none focus:outline-none focus:ring-0 placeholder-DARK-400 dark:placeholder-DARK-300`}
                                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-gray-300 rounded-xl"
                                >
                                    <option value="" disabled>Select type</option>
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                                <span className="text-ERROR_HOVER text-sm">{errors?.type}</span>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="file" value="File" />{!id && <span className="text-ERROR_HOVER">*</span>}
                                </div>
                                <input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept={formData.type === "image" ? "image/*" : formData.type === "video" ? "video/*" : "image/*,video/*"}
                                    onChange={handleFileChange}
                                    className={`w-full cursor-pointer -min-w-60 placeholder:text-BRAND-400 bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 border-2 border-DARK-300 dark:border-none focus:outline-none focus:ring-0 placeholder-DARK-400 dark:placeholder-DARK-300`}
                                // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-gray-300 rounded-xl"
                                />
                                <span className="text-ERROR_HOVER text-sm">{errors?.file}</span>
                            </div>
                            <div className="flex">
                                <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
                                    {preViewFile && (isImage || isVideo) && (
                                        <div className="relative group" title="Preview File">
                                            <button
                                                type="button"
                                                className="absolute -top-2 -right-2 z-10 p-0 m-0 w-5 h-5 flex items-center justify-center bg-red-600 rounded-full"
                                                title="Remove file"
                                                onClick={handleremoveFile}
                                            >
                                                <IoMdClose className="text-white text-[12px]" />
                                            </button>

                                            {isImage && (
                                                <div className="cursor-pointer h-[60px] w-[60px] relative" onClick={() => setFileModalOpen(true)}>
                                                    <img
                                                        src={preViewFile}
                                                        alt="Preview"
                                                        className="h-[60px] w-[60px] p-0 border rounded object-cover"
                                                        onError={imageOnError}
                                                    />
                                                    <div className="opacity-0 group-hover:opacity-[0.9] h-[60px] w-[60px] duration-300 absolute inset-0 flex justify-center items-center bg-gray-200 text-black rounded">
                                                        <HiEye />
                                                    </div>
                                                </div>
                                            )}

                                            {isVideo && (
                                                <div className="cursor-pointer h-[60px] w-[60px] relative" onClick={() => setFileModalOpen(true)}>
                                                    <video className="h-[60px] w-[60px] p-1 border rounded object-cover">
                                                        <source src={preViewFile} type={`video/${extname}`} />
                                                    </video>
                                                    <div className="opacity-0 group-hover:opacity-[0.9] h-[60px] w-[60px] duration-300 absolute inset-0 flex justify-center items-center bg-gray-200 text-black rounded">
                                                        <FaPlay />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 col-span-full">
                                <Label htmlFor="Activated" className="font-medium text-gray-700">Status</Label>
                                <div className="flex space-x-6">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="Activated"
                                            name="isActive"
                                            value="true"
                                            checked={formData?.isActive === true}
                                            onChange={() => setFormData(prev => ({ ...prev, isActive: true }))}
                                            className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                                        />
                                        <Label htmlFor="Activated" className="ml-2 text-gray-700">Activated</Label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="DeActivated"
                                            name="isActive"
                                            value="false"
                                            checked={formData?.isActive === false}
                                            onChange={() => setFormData(prev => ({ ...prev, isActive: false }))}
                                            className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                                        />
                                        <Label htmlFor="DeActivated" className="ml-2 text-gray-700">DeActivated</Label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </Modal.Body>
                <Modal.Footer className="justify-end dark:bg-DARK-800">
                    <Button
                        type="button"
                        onClick={onCloseModal}
                        disabled={isBtnLoading}
                        className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="customer-display-form"
                        disabled={isBtnLoading || isModalLoading}
                        isProcessing={isBtnLoading}
                        processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                        className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        <span className="relative z-10">{isBtnLoading ? 'Loading...' : 'Submit'}</span>
                        {isBtnLoading && (
                            <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
            <MediaView
                onClose={onFileCloseModal}
                show={fileModalOpen}
                url={preViewFile ?? ""}
                extname={extname ?? ""}
            />
        </div>
    );
};

export default CustomerDisplayForm;