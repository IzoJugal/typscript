import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../../environment/env";
import { Button, Label, Modal, ToggleSwitch } from "flowbite-react";
import { AiOutlineLoading } from "react-icons/ai";
import FormLoader from "../../utils/common/FormLoader";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiPencil } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { allowedImageExtensions, FILE_SIZE_LIMIT } from "../../utils/common/constant";
import apiClient from "../../utils/AxiosInstance";
import { toast } from "react-toastify";

interface ISocialMedia {
    _id?: string;
    name: string;
    url: string;
    isActive?: boolean;
    image?: File | null;
}

interface IError {
    name?: string;
    url?: string;
    image?: string;
}

const SocialMediaForm = ({ openModal, socialMediaId, setSocialMediaId, setOpenModal, setSocialMediaData, isLoading, setIsLoading }: { openModal: boolean, socialMediaId: string, setSocialMediaId: React.Dispatch<React.SetStateAction<string>>, setOpenModal: React.Dispatch<React.SetStateAction<boolean>>; setSocialMediaData: any, isLoading: boolean, setIsLoading: React.Dispatch<React.SetStateAction<any>> }) => {

    const [formData, setFormData] = useState<ISocialMedia>({
        name: "",
        url: "",
        image: null,
        isActive: false
    });
    const [errors, setErrors] = useState<IError>({});
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    // const NoImage = `${siteUrl}/images/social-media.jpg`;
    const [isFileEdit, setIsFileEdit] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | any>("");
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [formData?.image, selectedFile]);

    const getSocialMediaById = useCallback(async () => {
        try {
            setDataLoading(true)
            const response = await apiClient.get(`/social-media/${socialMediaId}`);
            const currency = response.data?.data;

            setFormData(prev => ({
                ...prev,
                ...currency,
            }));
            setTimeout(() => {
                setDataLoading(false);
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setDataLoading(false);
                setIsButtonLoading(false)
            }, 500);
            console.error('~ getCurrency error :-', error);
        }
    }, [socialMediaId, setIsButtonLoading, setDataLoading]);

    useEffect(() => {
        if (socialMediaId) {
            getSocialMediaById();
        }
    }, [socialMediaId, getSocialMediaById,]);

    const handleModalClose = () => {
        setFormData({
            _id: '',
            name: '',
            url: '',
            image: null,
            isActive: false,
        })
        setSocialMediaId("")
        setOpenModal(false)
        setErrors({});
        setSelectedFile('');
        setIsFileEdit(false);
        if (imageRef.current) {
            imageRef.current.value = ""
        }
    };

    const imageRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const urlRef = useRef<HTMLInputElement>(null);

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<any> = {};
        let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement> | null = null;

        if (!formData.name) {
            errorMsg.name = "Please enter name.";
            if (!firstErrorRef) {
                firstErrorRef = nameRef;
            };
            isValid = false;
        }

        if (!formData.url) {
            errorMsg.url = "Please enter url.";
            if (!firstErrorRef) {
                firstErrorRef = urlRef;
            };
            isValid = false;
        }

        if (selectedFile) {
            const imageValidationError = validateImage(selectedFile);
            if (imageValidationError) {
                errorMsg.image = imageValidationError;
                isValid = false;
                firstErrorRef = imageRef;
            }
        }

        setErrors((prev: any) => ({ ...prev, ...errorMsg }));
        if (firstErrorRef && firstErrorRef.current) {
            firstErrorRef.current.focus();
            firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        return isValid;
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (name in errors) {
            setErrors((prev: any) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            const formDataToSend = new FormData();

            const simpleFields: (keyof ISocialMedia)[] = [
                '_id', 'name', 'url', 'isActive',
            ];

            simpleFields.forEach((field) => {
                const value = formData[field];
                if (value !== undefined && value !== null) {
                    formDataToSend.append(field, String(value));
                }
            });

            if (selectedFile) {
                formDataToSend.append('image', selectedFile);
            } else if (formData.image) {
                formDataToSend.append('image', formData.image as any);
            }

            try {
                let response;
                if (socialMediaId) {
                    setIsButtonLoading(true)
                    response = await apiClient.patch(`/social-media/${socialMediaId}`, formDataToSend, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'socialMedia updated successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the room.');
                        setIsLoading(false);
                        setIsButtonLoading(false);
                        return;
                    }
                } else {
                    setIsButtonLoading(true)
                    response = await apiClient.post('/social-media/add', formDataToSend, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'SocialMedia added successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the socialMedia.');
                        setIsLoading(false);
                        setIsButtonLoading(false);
                        return;
                    }
                }
                if (response?.data?.success === true) {
                    setOpenModal(false)
                    setTimeout(() => {
                        setFormData({
                            _id: '',
                            name: '',
                            url: '',
                            isActive: false,
                        })
                        setSocialMediaId("")
                        setIsLoading(false)
                        setSocialMediaData(response.data)
                        setIsButtonLoading(false);
                        setSelectedFile('');
                        setIsFileEdit(false);
                    }, 500);
                }
            } catch (error: any) {
                setIsButtonLoading(false)
                console.log('Error during form submission:', error);
                toast.error(error?.response?.data?.message);
            }

        }
    };

    const validateImage = (file: File): string | null => {
        const maxSizeMB = FILE_SIZE_LIMIT;
        const extname = file.name.split(".").pop()?.toLowerCase();

        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File size should be less than or equal to ${maxSizeMB} MB.`;
        }

        if (!extname || !allowedImageExtensions.includes(extname)) {
            return "Please select a valid image file (jpeg, png, gif, webp).";
        }

        return null; // Valid
    };

    const socialImage = useMemo(() => {
        if (selectedFile) {
            return URL.createObjectURL(selectedFile);
        }
        if (formData?.image) {
            return `${apiUrl}/${formData.image}`;
        }
        return;
    }, [selectedFile, formData?.image]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            const validationError = validateImage(file);

            if (validationError) {
                setErrors(prev => ({ ...prev, image: validationError }));
                return;
            }

            setIsFileEdit(true);

            setSelectedFile(file);

            if (errors.image) {
                setErrors(prev => ({ ...prev, image: "" }));
            }
        }
    };

    const handlePreviousFile = () => {
        setIsFileEdit(false);
        setSelectedFile(null);
        if (imageRef.current) {
            imageRef.current.value = ""
        }
    };

    const handleDeletePhoto = () => {
        setIsFileEdit(false);
        setSelectedFile(null);
        setFormData((prev: any) => ({ ...prev, image: null }));
    };

    const handleToggleChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            isActive: checked,
        }));

        if ('isActive' in errors) {
            setErrors((prev: any) => ({ ...prev, isActive: "" }));
        }
    };

    return (
        <Modal show={openModal} onClose={() => { handleModalClose() }} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">
                <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                    {dataLoading ? (
                        <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                    ) : (
                        formData._id ? "Update Social Media" : "Add Social Media"
                    )}
                </span>
            </Modal.Header>
            <Modal.Body className="max-h-96 dark:bg-DARK-800">
                {dataLoading ? <FormLoader count={1} /> :
                    <form className="space-y-4">
                        <div className="flex flex-col items-center">
                            <label htmlFor="image" className="cursor-pointer">
                                {socialImage && !imageError ? (
                                    <img
                                        src={socialImage}
                                        alt="Social Media Preview"
                                        className="w-32 h-32 object-cover rounded-full border-2 bg-DARK-100 dark:bg-DARK-200 border-DARK-300"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <label className="w-32 h-32 rounded-3xl border-2 border-dashed border-gray-300 dark:border-DARK-400 bg-gray-50 dark:bg-DARK-500 flex items-center justify-center text-center px-4 cursor-pointer hover:border-BRAND-400 hover:bg-BRAND-50 transition-all duration-300">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />

                                        <div className="flex flex-col items-center justify-center text-center">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-100">
                                                Click to Select Image
                                            </p>

                                            <span className="text-xs text-gray-500 dark:text-gray-400 my-1">
                                                or
                                            </span>

                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-100">
                                               Image Upload
                                            </p>
                                        </div>
                                    </label>
                                )}

                            </label>

                            {/* Hidden file input - THIS IS THE KEY FIX */}
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                                ref={imageRef}
                                key={isFileEdit ? "edited" : "normal"}
                            />

                            <div className="flex gap-1">
                                {isFileEdit ? (
                                    <div
                                        title="Click to switch back to your previous picture"
                                        onClick={handlePreviousFile}
                                        className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                    >
                                        <RxCross2 className="font-extrabold" />
                                    </div>
                                ) : (
                                    <label htmlFor="image" className="cursor-pointer">
                                        <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                            <HiPencil />
                                        </div>
                                    </label>
                                )}
                                <button className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                    type="button"
                                    title={
                                        !formData?.image
                                            ? "Picture not stored – can't delete"
                                            : "Delete picture"
                                    }
                                    onClick={handleDeletePhoto}
                                    disabled={formData?.image ? false : true}
                                >  <RiDeleteBin6Line />
                                </button>
                            </div>
                            {errors.image && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.image}</p>}
                        </div>
                        <div className="flex justify-end">
                            <ToggleSwitch
                                checked={!!formData?.isActive}
                                onChange={handleToggleChange}
                                // label={formData?.isActive ? 'Activated' : 'Deactivated'}
                                color="success"
                                className="focus:outline-none focus:ring-0"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="name" value="Name" /><span className="text-ERROR_HOVER">*</span>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter Name"
                                    ref={nameRef}
                                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                />
                                {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="url" value="URL" /><span className="text-ERROR_HOVER">*</span>
                                <input
                                    id="url"
                                    name="url"
                                    type="text"
                                    value={formData.url}
                                    onChange={handleChange}
                                    placeholder="Enter Url"
                                    ref={urlRef}
                                    min={0}
                                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                />
                                {errors.url && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.url}</p>}
                            </div>
                        </div>
                    </form>}
            </Modal.Body>
            <Modal.Footer className="justify-end dark:bg-DARK-800">
                <Button
                    type="button"
                    onClick={() => handleModalClose()}
                    disabled={!!isButtonLoading}
                    className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!!isButtonLoading}
                    isProcessing={isButtonLoading}
                    onClick={(e: any) => {
                        e.preventDefault();
                        if (!isLoading && !isButtonLoading) handleSubmit(e);
                    }}
                    processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                    className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                    {isButtonLoading && (
                        <span className="absolute inset-0 !bg-BRAND-600 opacity-20 animate-pulse"></span>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default SocialMediaForm;
