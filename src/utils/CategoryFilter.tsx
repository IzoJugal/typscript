// CategoryFilter.tsx
import React, { useState } from 'react';

interface Category {
    name: string;
}

interface CategoryFilterProps {
    categories: Category[];
    filter: string[];
    onCategoryChange: (categoryName: string) => void;
    onClose: () => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, filter, onCategoryChange, onClose }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    return (
        <>
            <input
                type="search"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-DARK-300 rounded p-2 mb-4 w-full"
            />
            <div className="overflow-y-auto max-h-40">
                <div className="grid grid-cols-2 gap-4">
                    {categories?.length > 0 ? (
                        categories.map((category) => (
                            <label
                                key={category.name}
                                className="flex items-center bg-DARK-200 p-2 rounded cursor-pointer transition duration-200 hover:bg-DARK-300"
                            >
                                <input
                                    type="checkbox"
                                    checked={filter.includes(category.name)}
                                    onChange={() => onCategoryChange(category.name)}
                                    className="mr-2 h-4 w-4 text-blue-600 border-DARK-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-DARK-700">{category.name}</span>
                            </label>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-4">
                            <span className="text-DARK-500">No categories found</span>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={onClose} className="bg-red-500 hover:bg-ERROR_HOVER p-2 mt-4 rounded text-white">Close</button>
        </>
    );
};

export default CategoryFilter;
