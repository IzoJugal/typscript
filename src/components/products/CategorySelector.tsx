import { useState, useRef, useEffect } from "react";

const CategorySelector = ({ categorys, formData, handleSetCategory, errors }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categorys?.find((cat: any) => cat._id === formData.category)?.name || "";

  // Handle Click Outside to Close Dropdown
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !categoryRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-sm- mx-auto">
      <label htmlFor="category" className="block text-sm font-medium text-DARK-700">
        Category <span className="text-ERROR_HOVER">*</span>
      </label>

      {/* Selected Category Input */}
      <div 
        ref={categoryRef} 
        className="relative mt-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          id="category"
          type="text"
          placeholder="Select a category"
          value={selectedCategory}
          readOnly
          className="w-full px-4 py-3 border border-DARK-300 rounded-lg shadow-sm focus:!ring-0 cursor-pointer bg-white"
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-DARK-500">
          ▼
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          ref={dropdownRef} 
          className="absolute z-20 w-full bg-white border border-DARK-300 rounded-lg mt-2 shadow-xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-2 bg-DARK-100">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-DARK-300 rounded-lg focus:!ring-0"
            />
          </div>

          {/* Category List */}
          <div className="max-h-60 overflow-y-auto">
            {categorys?.filter((category: any) => category.name.toLowerCase().includes(searchTerm)).length > 0 ? (
              categorys
                .filter((category: any) => category.name.toLowerCase().includes(searchTerm))
                .map((category: any) => (
                  <div
                    key={category._id}
                    className="px-4 py-3 text-sm cursor-pointer hover:bg-BRAND-500 hover:text-white transition-all"
                    onClick={() => {
                      handleSetCategory(category);
                      setIsOpen(false);
                    }}
                  >
                    {category.name}
                  </div>
                ))
            ) : (
              <div className="px-4 py-3 text-DARK-500">No categories found</div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.category && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.category}</p>}
    </div>
  );
};

export default CategorySelector;
