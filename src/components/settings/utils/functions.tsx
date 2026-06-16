
export const  GeneralToggle = ({ label, checked, onChange }:any) => (
    <div className="flex items-center py-2 cursor-pointer">
        <span className="text-sm text-white">{label}</span>
        <label className="relative inline-flex items-center ml-4 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only" 
            />
            <div className={`w-12 h-4  rounded-full shadow-inner ${checked ? 'bg-BRAND-300' : 'bg-DARK-600'}`}></div>
            <div className={`dot absolute w-6 h-6 rounded-full shadow transform transition duration-200 ease-in-out ${checked ? 'translate-x-6 bg-BRAND-400' : 'bg-BRAND-400'}`}></div>
        </label>
    </div>
);