import { Button, Label, Modal } from "flowbite-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import apiClient from "../../utils/AxiosInstance";
import SelectWithSearch from "../../utils/common/SelectWithSearch";
import CommonInput from "../../utils/common/CommonInput";
import NumberInputPOS from "../../utils/common/NumberInputPOS";

interface Ingredient {
    _id?: string;
    name: string;
    quantity: number | string;
    unit?: string;
    [key: string]: any;
}


interface IngredientsFormProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    onclose: () => void;
    onSubmit: (ingredient: Ingredient) => Promise<void>;
    title?: string;
    ingredients: Ingredient[];
    setIngredients?: Dispatch<SetStateAction<Ingredient[]>>;
    currentIngredientIndex: number | null;
    company?: string;
    restaurant?: string;
}

interface IError {
    _id: string;
    quantity: string;
}

const IngredientsForm: React.FC<IngredientsFormProps> = ({ open, setOpen, onclose, onSubmit, ingredients, currentIngredientIndex, company, restaurant }) => {

    const [isLoading, setIsLoading] = useState(false);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [ingredientList, setIngredientList] = useState<any>([]);
    const [errors, setErrors] = useState<IError>({
        _id: '',
        quantity: ''
    });
    const [selectedIngredient, setSelectedIngredient] = useState<any>();
    const [quantity, setQuantity] = useState<number | string>('');

    useEffect(() => {
        const getIngredientList = async () => {
            try {
                setIsLoading(true);

                const params: any = { company };
                if (restaurant) params.restaurant = restaurant;

                const response = await apiClient.get(`/inventory`, { params });

                setIngredientList(response.data?.ingredients || []);
            } catch (error) {
                console.error("getIngredientList error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (open) {
            getIngredientList();
        }
    }, [company, restaurant, open]);

    const handleIngredientSelect = (selectedId: string) => {
        const ingredient = ingredientList.find((i: any) => i._id === selectedId);

        setSelectedIngredient(ingredient ?? null);

        // clear error when selected
        if (ingredient?._id) {
            setErrors((prev) => ({
                ...prev,
                _id: "",
            }));
        }
    };

    const handleSubmit = async () => {
        const newErrors = { _id: '', quantity: '' };

        if (!selectedIngredient?._id) {
            newErrors._id = 'Ingredient is required';
        }

        if (!quantity) {
            newErrors.quantity = "Quantity is required";
        } else if (!/^\d+$/.test(String(quantity).trim())) {
            newErrors.quantity = "Only numbers allowed";
        } else if (Number(quantity) <= 0) {
            newErrors.quantity = "Quantity must be greater than 0";
        }

        setErrors(newErrors);

        if (newErrors._id || newErrors.quantity) return;

        setIsButtonLoading(true);

        try {
            await onSubmit({
                ...selectedIngredient,
                quantity,
            });

            setSelectedIngredient(null);
            setQuantity('');
            setErrors({ _id: '', quantity: '' });
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsButtonLoading(false);
        }
    };

    useEffect(() => {
        if (
            currentIngredientIndex !== null &&
            ingredients &&
            ingredients[currentIngredientIndex]
        ) {
            const ingredientToEdit = ingredients[currentIngredientIndex];
            setSelectedIngredient(ingredientToEdit);
            setQuantity(ingredientToEdit?.quantity || '');
        } else {
            setSelectedIngredient(null);
            setQuantity('');
        }
    }, [currentIngredientIndex, ingredients]);

    const handleClose = () => {
        setSelectedIngredient(null);
        setQuantity('');
        setErrors({ _id: '', quantity: '' });
        onclose();
    };


    return (
        <Modal show={open} onClose={() => handleClose()} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">
                <span className="text-2xl font-bold text-DARK-900 dark:text-DARK-100 text-left">
                    {currentIngredientIndex === null ? 'Add Ingredient' : 'Edit Ingredient'}
                </span>
            </Modal.Header>
            <Modal.Body className="dark:bg-DARK-900">

                <form className="flex max-w-full flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="_id" value="Name" /><span className="text-ERROR_HOVER">*</span>
                            <SelectWithSearch
                                items={isLoading ? [] : ingredientList}
                                title="Ingredient name"
                                displayKey="name"
                                searchKey="name"
                                valueKey="_id"
                                selectedItem={selectedIngredient?.name}
                                setSelectedItem={() => { }}
                                handleChange={handleIngredientSelect}
                            />
                            {errors._id && <p className="mt-1 text-sm text-ERROR_HOVER">{errors._id}</p>}
                        </div>
                        <div>
                            <Label htmlFor="unit" value="Unit" />
                            <CommonInput
                                id="unit"
                                type="text"
                                value={selectedIngredient?.unit || ""}
                                placeholder="Auto-filled after ingredient selection"
                                readOnly
                            // className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                            />
                        </div>
                        <div>
                            <Label htmlFor="quantity" value="Quantity" /><span className="text-ERROR_HOVER">*</span>
                            <NumberInputPOS
                                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
                                id="quantity"
                                allowDecimal={false}
                                placeholder="Enter quantity"
                                value={quantity}
                                onChange={(value) => {
                                    setQuantity(value);

                                    if (errors.quantity) {
                                        setErrors((prev) => ({
                                            ...prev,
                                            quantity: "",
                                        }));
                                    }
                                }}
                            />
                            {errors.quantity && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.quantity}</p>}
                        </div>
                    </div>
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    </div> */}
                </form>

            </Modal.Body>
            <Modal.Footer className="justify-end dark:bg-DARK-800">
                <Button
                    type="button"
                    onClick={() => handleClose()}
                    disabled={isButtonLoading}
                    className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isButtonLoading}
                    isProcessing={isButtonLoading}
                    processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                    className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                    {isButtonLoading && (
                        <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default IngredientsForm
