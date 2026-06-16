
import { Button, Modal, } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../utils/AxiosInstance";
import { useAuth } from "../../../context/AuthProvider";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import NewDateRangePicker from "../../../utils/common/NewDateRangePicker";
import { DropdownWithSearch } from "../../../utils/common/Filters";
import { OWNER_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { createQueryParams } from "../../../utils/functions";
import CommonSelect from "../../../utils/common/CommonSelect";

interface ISales {
    fromDate?: string;
    toDate?: string;
    type?: string;
    isVoid?: boolean;
    company?: string;
    restaurant?: string;
}

const VoidReport = () => {
    const [openModal, setOpenModal] = useState(false);
    const [btnLoader, setBtnLoader] = useState("");
    const [url, setUrl] = useState("");
    const [formData, setFormData] = useState<ISales | any>({
        fromDate: "",
        toDate: "",
        type: "",
        company: "",
        restaurant: ""
    });
    const [errors, setErrors] = useState<ISales>({});
    const [companyDetails, setCompanyDetails] = useState<any>([]);
    const [restaurant, setRestaurant] = useState<any>([]);
    const { userData } = useAuth();
    const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
                setRestaurant(response.data.restaurant)
            }
        } catch (error: any) {
            console.log("error", error.message);
        }
    }


    useEffect(() => {
        if (loginRole === SUPER_ADMIN) {
            getCompany()
        }
        if (formData?.company) {
            getRestaurant(formData.company);
        } else if (OWNER_ROLES.includes(loginRole) && userData?.staffMember?.company?._id) {
            getRestaurant(userData.staffMember.company._id);
        }
    }, [formData?.company, loginRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === "fromDate") {
            setFormData((prev: any) => ({
                ...prev,
                fromDate: value, toDate: value
            }));
        } else {
            setFormData((prev: any) => ({
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
            }));
        }

        // Clear the error for the field being changed
        if (errors[name as keyof ISales]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleDateRangeChange = (value: { startDate: Date | null; endDate: Date | null } | any) => {
        setSelectedRange(value);
        setFormData((prev: any) => ({ ...prev, fromDate: value?.startDate, toDate: value?.endDate }));
    };

    const handlePreview = async () => {
        try {
            setBtnLoader("preview")
            const params = createQueryParams(formData)
            const response = await apiClient.get(`/category/sales/void${params}`, {
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

                console.log("Report preview opened successfully.");
            } else {
                throw new Error("Failed to retrieve report.");
            }
        } catch (error: any) {
            console.log("Error retrieving report:", error);
            const errorMessage = error?.response?.data?.message || "No records found!";
            setTimeout(() => {
                setBtnLoader("")
                toast.error(errorMessage);
            }, 500);
        }
    };

    const handlePrint = async () => {
        try {
            setBtnLoader("print")
            const params = createQueryParams(formData)
            const response = await apiClient.get(`/category/sales/void${params}`, {
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
                "No records found!";
            console.log("Error downloading report:", error);
            setTimeout(() => {
                setBtnLoader("")
                toast.error(errorMessage);
            }, 500);
        }
    };

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<ISales> = {};

        if (loginRole === SUPER_ADMIN && !formData.company) {
            errorMsg.company = "Please select a business.";
            isValid = false;
        }


        setErrors(prev => ({ ...prev, ...errorMsg }));
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
        }
    };


    const handleCancel = () => {
        setBtnLoader("")
        setFormData({
            fromDate: "",
            toDate: "",
            type: "",
            company: "",
            restaurnt: '',
        })
        setErrors({})
        setOpenModal(false)
        setSelectedRange({
            startDate: null,
            endDate: null
        });
        if (loginRole === SUPER_ADMIN) {
            setRestaurant([]);
        }
    };

    const handleBusiness = (value: string) => {
        setFormData((prev: any) => ({ ...prev, company: value }));
        setErrors((prev) => ({
            ...prev,
            company: ""
        }));
    };

    const handleRestaurant = (value: any) => {
        setFormData((prev: any) => ({ ...prev, restaurant: value }));
    };

    const typeOptions = [
        { value: "Select Void Type", label: "Select Void Type" },
        { value: "product", label: "Product Void" },
        { value: "table", label: "Table Void" },
    ]

    const hashFilters =
        formData.fromDate ||
        formData.toDate ||
        formData.type ||
        formData.company && companyDetails?.length > 1 ||
        formData.restaurant && restaurant?.length > 1;

    return (
        <div>
            <div>
                <FormHeaderPaths page={'Void Report'} prevLink='#' prevPage='Sales' />
            </div>
            <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Void Report</h2>
                <form className="space-y-6">
                    <div className="space-y-4">
                        {loginRole === SUPER_ADMIN && (
                            <div>
                                <label className="block font-medium dark:text-DARK-200">Business<span className="text-red-500">*</span></label>
                                <DropdownWithSearch
                                    setSelectedItem={setFormData}
                                    selectedItem={companyDetails?.find((c: any) => c._id === formData?.company)?.name || ''}
                                    items={companyDetails}
                                    title="Business"
                                    setIsDropdownOpen={setIsDropdownOpen}
                                    isDropdownOpen={isDropdownOpen}
                                    handleFilter={handleBusiness}
                                    fieldKey="company"
                                />
                                {errors.company && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.company}</p>}
                            </div>)}
                        {OWNER_ROLES.includes(loginRole) && (<div className="col-span-1">
                            <label className="block font-medium dark:text-DARK-200">Restaurant</label>
                            <DropdownWithSearch
                                setSelectedItem={setFormData}
                                selectedItem={restaurant?.find((c: any) => c._id === formData?.restaurant)?.name || ''}
                                items={restaurant}
                                title="Restaurant"
                                setIsDropdownOpen={setIsDropdownOpen}
                                isDropdownOpen={isDropdownOpen}
                                handleFilter={handleRestaurant}
                                fieldKey="restaurant"
                            />
                        </div>)}
                        <div>
                            <label className="block text-sm font-medium text-DARK-700 dark:text-DARK-200 mb-1">Date Filter</label>
                            <NewDateRangePicker
                                value={selectedRange}
                                onChange={handleDateRangeChange}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="type" className="block text-sm font-medium text-DARK-700 dark:text-DARK-200 mb-1">Void Type</label>
                            {/* <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200  dark:border-none border bg-DARK-100 rounded-md"
                            >
                                <option value="">Select Void Type</option>
                                <option value="product">Product Void</option>
                                <option value="table">Table Void</option>
                            </select> */}
                            <CommonSelect
                                name="type"
                                value={formData?.type || ""}
                                onChange={handleChange}
                                options={typeOptions}
                                loading={false}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="mb-4 flex items-center justify-start space-x-4">
                            {/* <Button type="button" className="flex gap-1 justify-center items-center">
                                    <div className="flex justify-center items-center">Email</div>
                                </Button> */}
                            <Button onClick={() => { handleSubmit("preview") }} className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600">
                                <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
                            </Button>

                            <Button onClick={() => { handleSubmit("print") }} className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600">
                                <div className="flex justify-center items-center ">{btnLoader === "print" ? "Loading..." : "Download"} </div>
                            </Button>
                            {hashFilters && (
                                <Button color="failure" onClick={handleCancel}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
            <Modal size="7xl" show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header>Void Report</Modal.Header>
                <Modal.Body>
                    <iframe src={url} width="100%" height="500px" />
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default VoidReport;
