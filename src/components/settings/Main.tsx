
import { useState } from "react";
import Hospitality from "./pages/Hospitality";
import General from "./pages/General";
import Pos from "./pages/Pos";
import PrinterAndCash from "./pages/PrinterAndCash";


const Main = () => {
    const [activeTab, setActiveTab] = useState('tab1');

    const renderContent = () => {
        switch (activeTab) {
            case 'tab1':
                return <Hospitality />;
            case 'tab2':
                return <General />;
            case 'tab3':
                return <Pos />;
            case 'tab4':
                return <PrinterAndCash />
            case 'tab5':
                return <h3>Printer Template</h3>
            case 'tab6':
                return <h3>Internalization</h3>
            default:
                return null;
        }
    };

    return (
        <div className="w-full mx-auto px-2 py-2 bg-[#2A3769]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-[#9FB5F1] font-bold">General Settings</h2>
            </div>

            <div className="tabs">
                <ul className="flex border-b border-DARK-300">
                    {[
                        { id: 'tab1', label: 'Hospitality Info.' },
                        { id: 'tab2', label: 'General' },
                        { id: 'tab3', label: 'POS' },
                        { id: 'tab4', label: 'Remote Printer & Cash Drawer' },
                        // { id: 'tab5', label: 'Printer Template' },
                        // { id: 'tab6', label: 'Internalization' },
                    ].map((tab) => (
                        <li key={tab.id}>
                            <button
                                className={`cursor-pointer py-2 px-4 ${activeTab === tab.id
                                    ? 'border-b-2 text-[#FFFFFF] border-[#FFFFFF]'
                                    : 'text-[#9FB5F1]'
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                                onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="tab-content p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]">{renderContent()}</div>
            </div>
        </div>
    );
};

export default Main;
