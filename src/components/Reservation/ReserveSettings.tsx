import { useState } from "react";
import { FormHeaderPaths } from "../../utils/HeaderPaths"
import TimeSlotForm from "./TimeSlotForm";
import TimeSlotFormLoader from "./TimeSlotFormLoader";
import { setTitle } from "../../utils/utility";

const ReserveSettings = () => {
    setTitle("Reserve Settings");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tab1");
  // const generalSettings = () => {
  //   return (
  //     <div className="py-4">
  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //         <div className="bg-DARK-50 dark:bg-DARK-600 p-6 rounded-lg">
  //           <h3 className="text-lg font-medium text-DARK-900 dark:text-DARK-100 mb-4">General Settings</h3>
  //         </div>
  //         <div className="bg-DARK-50 dark:bg-DARK-600 p-6 rounded-lg">
  //           <h3 className="text-lg font-medium text-DARK-900 dark:text-DARK-100 mb-4">Open Time</h3>
  //         </div>
  //         <div className="bg-DARK-50 dark:bg-DARK-600 p-6 rounded-lg">
  //           <h3 className="text-lg font-medium text-DARK-900 dark:text-DARK-100 mb-4">Close Time</h3>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  const tabs = [
    { id: "Tab1", label: "Time Slot", content: <TimeSlotForm /> },
    // { id: "Tab2", label: "General", content: generalSettings() },
    // { id: "Tab3", label: "Table", content: "This is content for Tab 3" },
    // { id: "Tab4", label: "Reservation", content: "This is content for Tab 4" },
  ];
  setTimeout(() => {
    setIsLoading(false);
  }, 1000);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center">
          <FormHeaderPaths page={'Settings'} prevLink='/reservation/bookings/1' prevPage='Reservation' />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
      {isLoading ?
        <TimeSlotFormLoader /> :
        <>
          <div className="p-6 bg-white rounded-2xl sm:rounded-2xl shadow-md dark:bg-DARK-800">
            <div className="flex border-b border-DARK-200 dark:border-DARK-500">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 text-sm font-medium transition-all duration-200 focus:outline-none border-b-2 ${activeTab === tab.id
                    ? "border-BRAND-500 text-BRAND-500"
                    : "border-transparent text-DARK-600 dark:text-DARK-300 hover:text-BRAND-500"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4-">
              {tabs.map((tab) => (
                activeTab === tab.id && (
                  <div key={tab.id} className="text-DARK-700">
                    {tab.content}
                  </div>
                )
              ))}
            </div>
          </div>
        </>
      }
      </div>
    </div>
  )
}

export default ReserveSettings
