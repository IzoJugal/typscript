import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal } from "flowbite-react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import ConfirmModal from "../../../hooks/ConfirmModal";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { createQueryParams } from "../../../utils/functions";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { MANAGER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";

interface IProduct {
    name: string;
    sku: string;
    category: string;
    posScreenGroup: string;
    orderBy: string;
    groupBy: string;
    selectedCategories: string[];
    company: string;
    restaurant: string;
}

interface ICategory {
    _id: string;
    name: string;
}

const ProductGeneral: React.FC = () => {
    const [openModal, setOpenModal] = useState(false);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isButtonType, setIsButtonType] = useState("");
    const [btnLoader, setBtnLoader] = useState("");
    const [url, setUrl] = useState("");
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [formData, setFormData] = useState<IProduct>({
        name: '',
        sku: '',
        category: '',
        posScreenGroup: '',
        orderBy: 'menuId',
        groupBy: 'None',
        selectedCategories: [],
        company: '',
        restaurant: '',
    });
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [companyDetails, setCompanyDetails] = useState<any>([]);
    const [restaurantDetails, setRestaurantDetails] = useState<any>([]);
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const getCompany = useCallback(async () => {
        try {
            try {
                const response = await apiClient.get(`/business`)
                setTimeout(() => {
                    setCompanyDetails(response.data.companies)
                }, 500);
            } catch (error) {
                setCompanyDetails([])
                console.error('~ getCompany error :-', error);
            }
        } catch (error) {
            console.error('~ getCompany error :-', error);
        }
    }, []);

    const getRestaurant = async (companyId: string) => {
        try {
            const response = await apiClient.get(`/restaurant/company/${companyId}`);
            if (response.data.success) {
                setRestaurantDetails(response.data.restaurant)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }

    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany()
        }
        if (MANAGER_ROLES.includes(loginRole)) {
            getRestaurant(userData?.staffMember?.company?._id)
        }
    }, [getCompany, loginRole]);

    const getCategory = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const queryParams = createQueryParams({
                company: formData?.company || undefined,
                restaurant: formData?.restaurant || undefined,
            });
            const response = await apiClient.get(`/category${queryParams}`, { signal: controller.signal });
            setCategories(response.data?.categories || []);
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            console.error('~ getCategory error :-', error);
            setCategories([]);
        }
    }, [formData?.company, formData?.restaurant]);

    useEffect(() => {
        if (loginRole !== SUPER_ADMIN) {
            getCategory();
        }
    }, [getCategory, loginRole]);

    useEffect(() => {
        if (loginRole === SUPER_ADMIN && formData?.company && formData?.restaurant) {
            getCategory();
        }
    }, [getCategory, loginRole, formData?.company, formData?.restaurant]);


    const allSelected = categories.length > 0 && categories.every(cat => formData.selectedCategories.includes(cat._id));

    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    //     const { name, value } = e.target;
    //     setFormData((prevData) => ({
    //         ...prevData,
    //         [name]: value,
    //     }));
    //     if (name === 'company') {
    //         setCategories([]);
    //     }
    // };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]:
                name === "name" || name === "sku"
                    ? value.trimStart()
                    : value,
        }));

        if (name === "company") {
            setFormData(prev => ({ ...prev, restaurant: '', selectedCategories: [] }));
            setRestaurantDetails([]);
        }
    };

    const handleCategoryCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            selectedCategories: checked
                ? [...prevData.selectedCategories, name]
                : prevData.selectedCategories.filter((id) => id !== name),
        }));
    };

    const handleSelectAll = () => {
        setFormData((prevData) => ({
            ...prevData,
            selectedCategories: allSelected ? [] : categories.map(cat => cat._id),
        }));
    };

    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const payload = {
        ...formData,
        name: formData.name.trim(),
        sku: formData.sku.trim(),
    };

    const handlePreview = async () => {
        try {
            setBtnLoader("preview")
            const response = await apiClient.post(`/product/general/report`, payload, {
                responseType: "blob",
            });

            const contentType = response.headers["content-type"];

            if (contentType.includes("application/json")) {
                const textData = await response.data.text();
                const jsonData = JSON.parse(textData);

                if (jsonData.status === false) {
                    setBtnLoader("")
                    toast.error(jsonData.message || "No data available to preview.");
                    return;
                }
            } else if (response.status === 200) {
                const blob = new Blob([response.data], {
                    type: contentType,
                });
                const url = window.URL.createObjectURL(blob);

                setUrl(url);
                setOpenModal(true);

                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    setBtnLoader("")
                }, 100);

                // console.log("Report preview opened successfully.");
            } else {
                throw new Error("Failed to retrieve report.");
            }
        } catch (error: any) {
            console.error("Error retrieving report:", error);
            const errorMessage = error?.response?.data?.message || "Product not found";
            setTimeout(() => {
                setBtnLoader("")
                toast.error(errorMessage);
            }, 500);
        }
    };

    const handlePrint = async () => {
        try {
            setBtnLoader("print")
            const response = await apiClient.post(`/product/general/report`, payload, {
                responseType: "blob",
            });

            const contentType = response.headers["content-type"];

            if (contentType.includes("application/json")) {
                const textData = await response.data.text();
                const jsonData = JSON.parse(textData);

                if (jsonData.status === false) {
                    setBtnLoader("")
                    toast.error(jsonData.message || "No data available to preview.");
                    return;
                }
            } else if (response.status === 200) {
                const blob = new Blob([response.data], {
                    type: response.headers["content-type"],
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;

                const filename = `report.pdf`;
                a.download = filename;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                setTimeout(() => {
                    setBtnLoader("")
                }, 500);
                console.log("File downloaded successfully.");
            } else {
                throw new Error("Failed to retrieve report.");
            }
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Product not found";
            console.error("Error downloading report:", errorMessage);
            setTimeout(() => {
                setBtnLoader("")
                toast.error(errorMessage);
            }, 500);
        }
    };

    const isValid = (): boolean => {
        let isValid = false;

        if (formData.name || formData.sku || formData.selectedCategories.length > 0) {
            isValid = true;
        }

        return isValid;
    };

    const handleSubmit = (type: string) => {
        if (isValid()) {
            if (type === "preview") {
                handlePreview()
            }
            if (type === "print") {
                handlePrint()
            }

        } else {
            setIsOpenModal(true)
        }
    };

    const handleConfirmSubmit = () => {
        setIsOpenModal(false)
        if (isButtonType === "preview") {
            handlePreview()
        }
        if (isButtonType === "print") {
            handlePrint()
        }
    }
    const handleCancel = () => {
        setIsOpenModal(false);
        setOpenModal(false);

        setFormData({
            name: '',
            sku: '',
            category: 'bar',
            posScreenGroup: '',
            orderBy: 'menuId',
            groupBy: 'None',
            selectedCategories: [],
            company: '',
            restaurant: '',
        });

        if (loginRole === SUPER_ADMIN) {
            setRestaurantDetails([]);
        }
    };

    const hasFilters =
        !!formData.name ||
        !!formData.sku ||
        (!!formData.company && companyDetails?.length! > 1) ||
        (!!formData.restaurant && restaurantDetails?.length! > 1) ||
        formData.selectedCategories.length > 0 ||
        formData.orderBy !== "menuId" ||
        formData.groupBy !== "None";

    const handleBusiness = (value: string) => {
        setFormData(prev => ({ ...prev, company: value }));
        getRestaurant(value)
    }
    const handleRestaurant = (value: string) => {
        setFormData(prev => ({ ...prev, restaurant: value }));
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div>
                <FormHeaderPaths page={'General Report'} prevLink='#' prevPage='Products' />
            </div>
            <div className="relative -max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-6 text-center dark:text-DARK-100">General Report</h2>
                {/* <h3 className="text-lg font-bold dark:text-DARK-100 mb-4">Criteria</h3> */}
                <div className="space-y-4">
                    {loginRole === SUPER_ADMIN && (
                        <div>
                            <label className="block font-medium dark:text-DARK-100">Business</label>
                            <DropdownWithSearch
                                setSelectedItem={() => { }}
                                selectedItem={companyDetails?.find((c: any) => c._id === formData?.company)?.name || ''}
                                items={companyDetails}
                                title="Business"
                                setIsDropdownOpen={setIsDropdownOpen}
                                isDropdownOpen={isDropdownOpen}
                                handleFilter={handleBusiness}
                                fieldKey="company"
                            />
                        </div>)}
                    {(loginRole === SUPER_ADMIN || MANAGER_ROLES.includes(loginRole)) && (
                        <div>
                            <label className="block font-medium dark:text-DARK-100">Restaurant</label>
                            <DropdownWithSearch
                                setSelectedItem={() => { }}
                                selectedItem={restaurantDetails?.find((c: any) => c._id === formData?.restaurant)?.name || ''}
                                items={restaurantDetails}
                                title="Restaurant"
                                handleFilter={handleRestaurant}
                                fieldKey="restaurant"
                            />
                        </div>)}
                    <div>
                        <label className="block font-medium dark:text-DARK-100">Product Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Product Name"
                            className="w-full mt-1 p-2 border rounded-xl px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none  border-DARK-300"
                        />
                    </div>
                    {/* <div>
                        <label className="block font-medium dark:text-DARK-100">SKU:</label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleInputChange}
                            placeholder="SKU"
                            className="w-full mt-1 p-2 border rounded-xl px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none  border-DARK-300"
                        />
                    </div> */}
                </div>

                <div className="mt-4">
                    <label className="block font-medium dark:text-DARK-100">Category:</label>
                    <div className="flex flex-col mt-2 space-y-2 p-6 border dark:border-DARK-400 rounded-md">
                        <label className="flex items-center font-medium dark:text-DARK-100">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={handleSelectAll}
                                className="mr-2 checked:!bg-BRAND-500 "
                            />
                            Select All
                        </label>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-xl dark:bg-DARK-700 dark:placeholder:text-DARK-400"
                        />
                        <div className="h-28 border rounded-xl mt-2 p-2 dark:bg-DARK-700 overflow-y-auto scrollbar-hide">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((cat) => (
                                    <label key={cat._id} className="flex items-center dark:text-DARK-100">
                                        <input
                                            type="checkbox"
                                            name={cat._id}
                                            checked={formData.selectedCategories.includes(cat._id)}
                                            onChange={handleCategoryCheck}
                                            className="mr-2 checked:!bg-BRAND-500"
                                        />
                                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                                    </label>
                                ))
                            ) : (
                                <p className="text-DARK-500 dark:text-DARK-100">No category found</p>
                            )}

                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block font-medium dark:text-DARK-100">Order by:</label>
                    <select
                        name="orderBy"
                        value={formData.orderBy}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-xl px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border-DARK-300 "
                    >
                        <option value="menuId">Menu Id</option>
                        <option value="menuName">Menu Name</option>
                        <option value="category">Category</option>
                    </select>
                </div>

                {/* <div className="mt-4">
                <label className="block font-medium">Group by:</label>
                <select
                    name="groupBy"
                    value={formData.groupBy}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 border rounded-md"
                >
                    <option value="None">None</option>
                    <option value="category">Category</option>
                </select>
            </div> */}

                <div className="mt-6 flex space-x-2">
                    {/* <Button onClick={() => console.log('Email')}>
                    Email
                </Button> */}

                    <Button onClick={() => { setIsButtonType("preview"); handleSubmit("preview") }} className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600">
                        <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
                    </Button>

                    <Button onClick={() => { setIsButtonType("print"); handleSubmit("print") }} className="flex gap-1 justify-center items-center !bg-BRAND-500 hover:!bg-BRAND-600">
                        <div className="flex justify-center items-center ">{btnLoader === "print" ? "Loading..." : "Download"} </div>
                    </Button>
                    {hasFilters && (
                        <Button color="failure" onClick={handleCancel}>
                            Clear
                        </Button>
                    )}
                </div>
                <ConfirmModal
                    isOpen={isOpenModal}
                    message="No Criteria Selected. Do you want to go for all ?"
                    onConfirm={() => { handleConfirmSubmit() }}
                    onCancel={() => setIsOpenModal(false)}
                />
                <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
                    <Modal.Header>Product General Report</Modal.Header>
                    <Modal.Body>
                        <iframe src={url} width="100%" height="500px" />
                    </Modal.Body>
                </Modal>
            </div>
        </div>
    );
};

export default ProductGeneral;
