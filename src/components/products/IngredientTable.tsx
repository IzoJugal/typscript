import { Button } from "flowbite-react";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { deleteBtnStyle, editBtnStyle } from "../../utils/common/constant";

interface Ingredient {
    _id: string;
    name: string;
    unit: string;
    quantity: number;
}

interface IProps {
    ingredients: Ingredient[];
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

const IngredientTable: React.FC<IProps> = ({ ingredients, onEdit, onDelete }) => {
    return (
        <div className="mt-4 overflow-x-auto rounded-md border border-gray-300 dark:border-DARK-700">
            {ingredients.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500 dark:text-DARK-400">
                    No ingredients added yet.
                </p>
            ) : (
                <table className="w-full table-auto border-collapse text-left dark:text-DARK-50">
                    <thead className="bg-gray-100 dark:bg-DARK-800">
                        <tr>
                            <th className="px-4 py-2 border-b border-gray-300 dark:border-DARK-700">Name</th>
                            <th className="px-4 py-2 border-b border-gray-300 dark:border-DARK-700">Quantity</th>
                            <th className="px-4 py-2 border-b border-gray-300 dark:border-DARK-700">Unit</th>
                            <th className="px-4 py-2 border-b border-gray-300 dark:border-DARK-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredients.map((ingredient, index) => (
                            <tr key={ingredient._id || index} className="hover:bg-gray-50 dark:hover:bg-DARK-900">
                                <td className="px-4 py-3 border-b border-gray-300 dark:border-DARK-700">{ingredient.name}</td>
                                <td className="px-4 py-3 border-b border-gray-300 dark:border-DARK-700">{ingredient.quantity}</td>
                                <td className="px-4 py-3 border-b border-gray-300 dark:border-DARK-700">{ingredient.unit || 'N/A'}</td>
                                <td className="px-4 py-3 border-b border-gray-300 dark:border-DARK-700 text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            type="button"
                                            onClick={() => onEdit(index)}
                                            className={editBtnStyle.btn}
                                            size="xs"
                                            aria-label={`Edit ${ingredient.name}`}
                                        >
                                            <HiPencil className={editBtnStyle.icon} />
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => onDelete(index)}
                                            className={deleteBtnStyle.btn}
                                            size="xs"
                                            aria-label={`Delete ${ingredient.name}`}
                                        >
                                            <RiDeleteBin6Line className={deleteBtnStyle.icon} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default IngredientTable
