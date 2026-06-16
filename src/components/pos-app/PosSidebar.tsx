import { usePOS } from "../../context/POSProvider";
import { capitalized } from "../../utils/utility";

// const PosSidebar = ({ categories, setSelectedCategory, selectedCategory, setSelectedSubCategories, fetchProductsByCategory }: any) => {
const PosSidebar = ({ fetchProductsByCategory }: any) => {
    const { posLocalData, setPosLocalData }: any = usePOS();
    const { categories, selectedCategory } = posLocalData;

    return (
        <aside
            className="w-56 bg-white dark:bg-gray-900 p-4 shadow-lg 2xl:max-h-[90vh] xl:max-h-[80vh] lg:max-h-[78vh] md:max-h-[75vh] sm:max-h-[50vh] overflow-y-scroll scrollbar-hide"
        >
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Categories</h2>
            <ul className="space-y-2">
                {/* {[...Array(5)].map((_, index) => (
                    <div key={index}> */}
                        {categories.map((cat: any) => {
                            const isSelected = selectedCategory.name === cat.name;
                            return (
                                <li
                                    key={cat._id}
                                    onClick={() => {
                                        setPosLocalData((prev: any) => ({
                                            ...prev,
                                            selectedCategory: cat,
                                            selectedSubCategory: null,
                                        }));
                                        fetchProductsByCategory(cat);
                                    }}
                                    className={`px-2 py-3 rounded-md cursor-pointer transition-colors duration-200 text-sm font-semibold
                                        ${isSelected
                                            ? "bg-BRAND-500 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    {capitalized(cat.name)}
                                </li>
                            );
                        })}
                    {/* </div>
                ))} */}
            </ul>
        </aside>

    );
};

export default PosSidebar;
