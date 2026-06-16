import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { Button, Label, Modal } from "flowbite-react";
import FormLoader from "../../utils/common/FormLoader";
import { AiOutlineLoading } from "react-icons/ai";


interface ICurrency {
    _id?: string;
    name: string;
    code: string;
    symbol: string;
    label?: string;
    isActive?: boolean;
    isDelete?: boolean;
}

interface IError {
    name?: string;
    code?: string;
    symbol?: string;
    label?: string;
}

const CurrencyForm = ({ openModal, currencyId, setCurrencyId, setOpenModal, setCurrencyData, isLoading, setIsLoading }: { openModal: boolean, currencyId: string, setCurrencyId: React.Dispatch<React.SetStateAction<string>>, setOpenModal: React.Dispatch<React.SetStateAction<boolean>>; setCurrencyData: any, isLoading: boolean, setIsLoading: React.Dispatch<React.SetStateAction<any>> }) => {

    const [formData, setFormData] = useState<ICurrency>({
        name: "",
        symbol: "",
        code: "",
        label: ""
    });
    const [errors, setErrors] = useState<IError>({});
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    const getCurrency = useCallback(async () => {
        try {
            setDataLoading(true)
            const response = await apiClient.get(`/currency/${currencyId}`);
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
    }, [currencyId, setIsButtonLoading, setDataLoading]);

    useEffect(() => {
        if (currencyId) {
            getCurrency();
        }
    }, [currencyId, getCurrency,]);


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

    const nameRef = useRef<HTMLInputElement>(null);
    const codeRef = useRef<HTMLInputElement>(null);
    const symbolRef = useRef<HTMLInputElement>(null);

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

        if (!formData.code) {
            errorMsg.code = "Please enter code.";
            if (!firstErrorRef) {
                firstErrorRef = codeRef;
            };
            isValid = false;
        }

        if (!formData.symbol) {
            errorMsg.symbol = "Please enter symbol.";
            if (!firstErrorRef) {
                firstErrorRef = symbolRef;
            };
            isValid = false;
        }

        setErrors((prev: any) => ({ ...prev, ...errorMsg }));
        if (firstErrorRef && firstErrorRef.current) {
            firstErrorRef.current.focus();
            firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        return isValid;
    };

    const handleModalClose = () => {
        setFormData({
            _id: '',
            name: '',
            code: '',
            symbol: '',
            label: '',
        })
        setCurrencyId("")
        setOpenModal(false)
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                let response;
                if (currencyId) {
                    setIsButtonLoading(true);
                    response = await apiClient.patch(`/currency/${currencyId}`, formData);
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'Currency updated successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the currency.');
                        setIsLoading(false);
                        setIsButtonLoading(false);
                        return;
                    }
                } else {
                    setIsButtonLoading(true)
                    response = await apiClient.post('/currency/add', formData);
                    if (response?.data?.success) {
                        toast.success(response?.data?.message || 'Currency added successfully!');
                    } else {
                        toast.error(response?.data?.message || 'There was an issue adding the currency.');
                        setIsLoading(false);
                        setIsButtonLoading(false);
                        return;
                    }
                }
                if (response?.data?.success === true) {
                    setOpenModal(false);
                    setTimeout(() => {
                        setFormData({
                            _id: '',
                            name: '',
                            code: '',
                            symbol: '',
                            label: '',
                        })
                        setCurrencyId("");
                        setIsLoading(false);
                        setCurrencyData(response.data);
                        setIsButtonLoading(false);
                    }, 500);
                }
            } catch (error: any) {
                setIsButtonLoading(false);
                console.log('Error during form submission:', error);
                toast.error(error?.response?.data?.message);
            }
        }
    };

    return (
        <Modal show={openModal} onClose={() => { handleModalClose() }} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">
                <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                    {dataLoading ? (
                        <div className="h-6 w-40 bg-DARK-200 rounded-md animate-pulse mb-4"></div>
                    ) : (
                        formData._id ? "Update Currency" : "Add Currency"
                    )}
                </span>
            </Modal.Header>
            <Modal.Body className="max-h-80 dark:bg-DARK-800">
                {dataLoading ? <FormLoader count={1} /> :
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="code" value="Code" /><span className="text-ERROR_HOVER">*</span>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="Enter Code (INR)"
                                    ref={codeRef}
                                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                />
                                {errors.code && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.code}</p>}
                            </div>
                            <div>
                                <Label htmlFor="symbol" value="Symbol" /><span className="text-ERROR_HOVER">*</span>
                                <input
                                    id="symbol"
                                    name="symbol"
                                    type="text"
                                    value={formData.symbol}
                                    onChange={handleChange}
                                    placeholder="Enter Symbol (₹)"
                                    ref={symbolRef}
                                    min={0}
                                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                />
                                {errors.symbol && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.symbol}</p>}
                            </div>
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
                            {currencyId && (
                                <div>
                                    <Label htmlFor="label" value="Label" /><span className="text-ERROR_HOVER">*</span>
                                    <input
                                        type="text"
                                        id="label"
                                        name="label"
                                        value={formData.label}
                                        onChange={handleChange}
                                        disabled={true}
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>
                            )}
                            {currencyId && (
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="isAvailable" value="Status" className="text-sm font-medium text-DARK-700"></Label>
                                    <input
                                        type="radio"
                                        id="Activated"
                                        name="isActive"
                                        value="true"
                                        checked={formData.isActive === true}
                                        onChange={() => setFormData((prev: any) => ({ ...prev, isActive: true }))}
                                        className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
                                    />
                                    <Label htmlFor="Activated" value="Activated" className="text-sm font-medium text-DARK-700"></Label>
                                    <input
                                        type="radio"
                                        id="DeActivated"
                                        name="isActive"
                                        value="false"
                                        checked={formData.isActive === false}
                                        onChange={() => setFormData((prev: any) => ({ ...prev, isActive: false }))}
                                        className="h-4 w-4 text-BRAND-500 !ring-0 border-DARK-300 rounded"
                                    />
                                    <Label htmlFor="DeActivated" value="DeActivated" className="text-sm font-medium text-DARK-700"></Label>
                                </div>
                            )}
                        </div>
                    </form>
                }
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

export default CurrencyForm;
