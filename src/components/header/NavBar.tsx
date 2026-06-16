/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dropdown, Navbar } from "flowbite-react";
import useLogOut from "../../hooks/LogOut";
import { useAuth } from "../../context/AuthProvider";
import { useSidebarStore } from "../../hooks/useSidebarStore";
import { Link } from "react-router-dom";
import { siteUrl } from "../../environment/env";
import { MdDashboard, MdOutlineLogout } from "react-icons/md";
import { ImProfile } from "react-icons/im";
import { IoMoon, IoSunny } from "react-icons/io5";
import { useDarkMode } from "../../context/DarkModeProvider";
import { useLanguage } from "../../context/LanguageContext";
import { HiMenu } from "react-icons/hi";
// import { apiUrl } from "../../environment/env";
import { useLocation, useParams } from "react-router-dom";

const NavBar = () => {
  const { userData } = useAuth();
  const { logOut } = useLogOut();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { languageCode, setLanguage, allLanguages } = useLanguage();
  const NoImage = `${siteUrl}/images/download.png`;

  const { pathname } = useLocation();
  const { id } = useParams();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebarStore();

  const hideSidebarRoutes = ['/order/app', `/order/app/${id}`, '/kitchen', `/subscription/pay/${id}`, '/subscription/payment', '/subscription/failed', '/subscription/success', "/generate-password", "/reset-password"];
  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);


  return (
    <div>
      <Navbar fluid rounded className="bg-BRAND-300 hide-on-print">
        <div className="flex sm:justify-between lmd:justify-end items-center w-full lmd:order-2 gap-3">
          <div className="flex-1 md:w-auto lg:flex-none ">
            <Dropdown
              label={
                <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 flex items-center gap-2">
                  {`${allLanguages.find((lang) => lang.code === languageCode)?.translatedName} (${allLanguages.find((lang) => lang.code === languageCode)?.translatedCode})`}
                </span>
              }
              inline
              arrowIcon={false}
              className="!min-w-[145px]  rounded-xl overflow-hidden shadow-xl  dark:bg-DARK-800 border-none"
            >
              <div className="max-h-60 overflow-y-auto">
                {allLanguages.map((lang) => (
                  <Dropdown.Item
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-200 ${languageCode === lang.code
                        ? "bg-BRAND-100 text-BRAND-600 dark:bg-BRAND-900/20 dark:text-BRAND-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-DARK-700"
                      }`}
                  >
                    <span className="font-medium">{lang.translatedName}</span>
                    <span className="text-xs opacity-60">({lang.translatedCode})</span>
                  </Dropdown.Item>
                ))}
              </div>
            </Dropdown>
          </div>

          <div className={`${isSidebarOpen ? 'hidden' : 'block'} ${shouldHideSidebar ? '' : 'lmd:hidden'}`}>
            <button
              onClick={toggleSidebar}
              className="p-2 text-DARK-600 dark:text-DARK-300 hover:text-BRAND-600 dark:hover:text-BRAND-300 rounded-lg hover:bg-BRAND-100 dark:hover:bg-DARK-800 transition-colors duration-200"
            >
              <HiMenu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <Dropdown
                className="rounded-xl w-52 overflow-hidden"
                arrowIcon={false}
                inline
                label={
                  <img
                    src={userData?.staffMember?.profile || "images/download.png"}
                    alt="Profile Preview"
                    className="w-10 h-10 object-cover rounded-full border-2 border-DARK-300"
                    onError={(e) => (e.currentTarget.src = NoImage)}

                  />
                }
              >
                <Link to={`/profile/${userData?.staffMember?._id}`} title="Show profile" className="">
                  <Dropdown.Header className="hover:bg-BRAND-100 dark:hover:text-slate-900">
                    <span className="block truncate text-base font-semibold dark:hover:text-slate-900">{userData?.staffMember?.email}</span>
                    <span className="block text-sm dark:hover:text-slate-900">{userData?.staffMember?.name}</span>
                  </Dropdown.Header>
                </Link>
                <Link to="/" className="font-semibold">
                  <Dropdown.Item className="flex gap-2">
                    <MdDashboard className="w-4 h-4" />Dashboard
                  </Dropdown.Item>
                </Link>
                {/* <Link to="/setting" title="Setting" className="font-semibold"> */}
                <Dropdown.Item className="flex gap-2 font-semibold" onClick={toggleDarkMode}>
                  {isDarkMode ? (
                    <IoSunny className="w-4 h-4" />
                  ) : (
                    <IoMoon className="w-4 h-4" />
                  )}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Dropdown.Item>
                {/* </Link> */}
                {/* <Link to="/setting" title="Setting" className="font-semibold">
                  <Dropdown.Item className="flex gap-2">
                    <IoSettings className="w-4 h-4" />Settings
                  </Dropdown.Item>
                </Link> */}
                <Link to={`/profile/${userData?.staffMember?._id}`} className="font-semibold">
                  <Dropdown.Item className="flex gap-2">
                    <ImProfile className="w-4 h-4" /> Profile
                  </Dropdown.Item>
                </Link>
                <Dropdown.Divider />
                <div className="px-2 py-2">
                  <Dropdown.Item onClick={() => logOut()} className="flex gap-2 bg-red-200 hover:!bg-red-500 text-red-600 dark:text-red-600 hover:text-white justify-center font-semibold rounded-lg">
                    <MdOutlineLogout className="w-4 h-4" /> Logout
                  </Dropdown.Item>
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </Navbar>
    </div>
  );
}

export default NavBar;
