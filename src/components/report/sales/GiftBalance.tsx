import { Button, Modal, } from "flowbite-react";
import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../utils/AxiosInstance";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";

interface ISales {
    type?: string;
}

const GiftBalance = () => {
    const [openModal, setOpenModal] = useState(false);
    const [btnLoader, setBtnLoader] = useState("");
    const [url, setUrl] = useState("");
    const [formData, setFormData] = useState<ISales>({
        type: "all",
    });
    const [errors, setErrors] = useState<ISales>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === "fromDate") {
            setFormData(prev => ({
                ...prev,
                fromDate: value, toDate: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
            }));
        }

        // Clear the error for the field being changed
        if (errors[name as keyof ISales]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };


    const handlePreview = async () => {
        try {
            setBtnLoader("preview")
            const params = Object.fromEntries(
                Object.entries({

                    type: formData.type,
                }).filter(([, value]) => value)
            );
            const response = await apiClient.get(`/category/sales/gift`, {
                responseType: "blob",
                params: params
            });

            const blob = new Blob([response.data], {
                type: response.headers["content-type"],
            });
            const url = window.URL.createObjectURL(blob);
            setUrl(url);
            setOpenModal(true);

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                setBtnLoader("")
            }, 100);

            console.log("Report preview opened successfully.");
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
            const params = Object.fromEntries(
                Object.entries({

                    type: formData.type,
                }).filter(([, value]) => value)
            );
            const response = await apiClient.get(`/category/sales/gift`, {
                responseType: "blob",
                params: params
            });

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

    const handleSubmit = (type: string) => {
        if (type === "preview") {
            handlePreview()
        }
        if (type === "print") {
            handlePrint()
        }
    };


    const handleCancel = () => {
        setBtnLoader("")
        setFormData({
            type: "all",
        })
        setErrors({})
        setOpenModal(false)
    }

    return (
        <div>
            <div>
                <FormHeaderPaths page={'Gift Cert. Balance Report'} prevLink='#' prevPage='Sales' />
            </div>
            <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Gift Cert. Balance Report</h2>
                <form className="space-y-6">
                    <div className="space-y-6">
                        <div className="flex-1">
                            <label htmlFor="type" className="block text-sm font-medium text-DARK-700 dark:text-DARK-200 mb-1">Balance Criteria</label>
                            <select
                                name="type"
                                value={formData?.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200  dark:border-none border bg-DARK-100 rounded-md"
                            >
                                <option value="all">All Balance</option>
                                <option value="greaterthan">Balance Greater Then</option>
                                <option value="lessthan">Balance Less  Then</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <div className="mb-4 flex items-center justify-start space-x-4">
                            {/* <Button className="flex gap-1 justify-center items-center">
                                    <div className="flex justify-center items-center">Email</div>
                                </Button> */}
                            <Button onClick={() => { handleSubmit("preview") }} className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600">
                                <div className="flex justify-center items-center ">{btnLoader === "preview" ? "Loading..." : "Preview"} </div>
                            </Button>

                            <Button onClick={() => { handleSubmit("print") }} className="flex gap-1 justify-center items-center bg-BRAND-500 dark:bg-BRAND-500 hover:!bg-BRAND-600">
                                <div className="flex justify-center items-center ">{btnLoader === "print" ? "Loading..." : "Download"} </div>
                            </Button>
                            <Button color="failure" onClick={handleCancel}>
                                Clear
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
            <Modal show={openModal} onClose={() => setOpenModal(false)} className="backdrop-blur-sm dark:bg-DARK-950">
                <Modal.Header>Gift Certificate Balance Report</Modal.Header>
                <Modal.Body>
                    <iframe src={url} width="100%" height="500px" />
                </Modal.Body>
            </Modal>
        </div>
    );
}


export default GiftBalance