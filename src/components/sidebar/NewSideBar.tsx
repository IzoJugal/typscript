import { useEffect, useState, useCallback, useRef } from "react";
import { BiSolidReport } from "react-icons/bi";
import { FaBuilding, FaCalendarAlt, FaCalendarCheck, FaUsersCog } from "react-icons/fa";
import { FaAngleDown, FaAngleUp, FaGear, FaMoneyCheckDollar, FaPeopleGroup } from "react-icons/fa6";
import { HiChartPie, HiPlusCircle, HiReceiptTax, HiX } from "react-icons/hi";
import { IoRestaurant, IoSettingsSharp } from "react-icons/io5";
import { MdFastfood, MdLocalOffer, MdOutlineImportantDevices, MdOutlineSecurity, MdOutlineTableRestaurant, MdPayments, MdTableBar } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import { TbCategoryFilled, TbMapPinCode, TbReportSearch } from "react-icons/tb";
import { NavLink, useLocation } from "react-router-dom";
import { useSidebarStore } from "../../hooks/useSidebarStore";
import { TfiMenuAlt } from "react-icons/tfi";
import { LuCalendarClock } from "react-icons/lu";
import { RiFunctionAddFill } from "react-icons/ri";
import { GiSandsOfTime } from "react-icons/gi";
import { RiCouponFill } from "react-icons/ri";
import { apiUrl, siteUrl } from "../../environment/env";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { useCompanyConfigs } from "../../context/CompanyConfigsProvider";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import { IoMdArrowDropdown, IoMdArrowDropup, IoIosRestaurant } from "react-icons/io";
import { checkAccess } from "../../utils/utility";
import { MANAGER_ROLES, ModuleName, SUPER_ADMIN } from "../../utils/common/constant";
import { BsPeopleFill } from "react-icons/bs";
import { LuImagePlus } from "react-icons/lu";
import { PiClockCountdown } from "react-icons/pi";
import { BsCurrencyExchange } from "react-icons/bs";
import { TbWorldCog } from "react-icons/tb";
import { MdPriceChange } from "react-icons/md";
import { TbSettingsStar } from "react-icons/tb";


function NewSideBar() {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isCloseOutOpen, setIsCloseOutOpen] = useState(false);
  const [isOthersOpen, setIsOthersOpen] = useState(false);
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const NoImage = `${siteUrl}/images/Image-not-found.png`;

  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || '';
    const { configData } = useConfigs();
  const { companyConfigs, setCompanyConfigs } = useCompanyConfigs();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebarStore();
  const location = useLocation();
  const navRef = useRef<any>(null);

  const getCompanyConfigs = useCallback(async () => {
    try {
      const response = await apiClient.get(`${apiUrl}/configs/getByCompany/${userData?.staffMember?.company?._id}`);
      const { success, data } = response.data;
      if (success) {
        setCompanyConfigs(data);
        localStorage.setItem('lastCompanyLogo', data.companyLogo);
      }
    } catch (error) {
      console.log("site bar getCompanyConfigs Error:-", error);
    }
  }, [setCompanyConfigs, userData?.staffMember?.company?._id])

  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      getCompanyConfigs()
    }
  }, [getCompanyConfigs, loginRole])

  const headerLogo = companyConfigs?.isLogoEnabled && companyConfigs?.companyLogo && loginRole !== SUPER_ADMIN
    ? `${apiUrl}/${companyConfigs.companyLogo}`
    :configData?.headerLogo
      ? `${apiUrl}/${configData?.headerLogo}`
      : NoImage;
  const imageOnError = (event: any) => {
    event.currentTarget.src = NoImage;
  };

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: <HiChartPie className="mr-2 h-4 w-4" />, module: ModuleName.ALLOWED },
    { to: '/order', label: 'Orders', icon: <FaMoneyCheckDollar className="mr-2 h-4 w-4" />, module: ModuleName.ORDERS },
    { to: '/product', label: 'Products', icon: <MdFastfood className="mr-2 h-4 w-4" />, module: ModuleName.INVENTORY },
    { to: '/modifier', label: 'Modifier', icon: <RiFunctionAddFill className="mr-2 h-4 w-4" />, module: ModuleName.INVENTORY },
    { to: '/modifire/category', label: 'Modifier Category', icon: <HiPlusCircle className="mr-2 h-4 w-4" />, module: ModuleName.INVENTORY },
    { to: '/category', label: 'Categories', icon: <TbCategoryFilled className="mr-2 h-4 w-4" />, module: ModuleName.INVENTORY },
    { to: '/business', label: 'Business', icon: <FaBuilding className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    // { to: '/restaurant', label: 'Restaurant', icon: <IoRestaurant className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    { to: '/customer', label: 'Customers', icon: <FaPeopleGroup className="mr-2 h-4 w-4" />, module: ModuleName.CUSTOMER },
    { to: '/staff', label: 'Staff', icon: <BsPeopleFill className="mr-2 h-4 w-4" />, module: ModuleName.STAFFS },
    ...((MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) ? [{ to: '/role', label: 'Role', icon: <FaUsersCog className="mr-2 h-4 w-4" />, module: ModuleName.STAFFS }] : []),
    { to: '/posdevice', label: 'POS Device', icon: <MdOutlineImportantDevices className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    // { to: '/clock', label: 'Staff Clock In/Out', icon: <LuCalendarClock className="mr-2 h-4 w-4" />, module: ModuleName.STAFFS },
    { to: '/discount', label: 'Discounts', icon: <MdLocalOffer className="mr-2 h-4 w-4" />, module: ModuleName.DISCOUNTS },
    { to: '/coupon', label: 'Coupon', icon: <RiCouponFill className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    // { to: '/room', label: 'Rooms', icon: <SiGoogleclassroom className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    // { to: '/table', label: 'Tables', icon: <MdTableBar className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    { to: '/setting', label: 'Settings', icon: <IoSettingsSharp className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
    // ...((MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN) ? [{ to: '/connection', label: 'Connection', icon: <TbPlugConnected className="mr-2 h-4 w-4" />, module: ModuleName.ALLOWED },] : [])
  ];

  // if (loginRole === SUPER_ADMIN || loginRole === "Owner/Admin") {
  //   menuItems.push({ to: '/connection/1', label: 'Connection', icon: <TbPlugConnected className="mr-2 h-4 w-4" />, module: ModuleName.ALLOWED },);
  // }

  // if (loginRole === SUPER_ADMIN) {
  //   menuItems.push(
  //     { to: '/currency', label: 'Currency', icon: <BsCurrencyExchange className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS }
  //   );
  //   menuItems.push(
  //     { to: '/site-configs', label: 'Site Configs', icon: <IoSettingsSharp className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS }
  //   );
  //   menuItems.push(
  //     { to: '/social-media', label: 'Social-Media Configs', icon: <TbWorldCog className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS }
  //   );
  //   menuItems.push(
  //     { to: '/plan', label: 'Plan', icon: <MdPriceChange className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS }
  //   );
  // }

  const reportSections = [
    {
      title: 'Reports',
      isOpen: isReportsOpen,
      toggle: () => setIsReportsOpen(!isReportsOpen),
      subsections: [
        {
          title: 'Customer',
          isOpen: isCustomerOpen,
          toggle: () => setIsCustomerOpen(!isCustomerOpen),
          links: [
            { to: '/report/customer', label: 'Detail Report' },
            { to: '/report/general', label: 'General Report' },
            { to: '/report/other', label: 'Other Report (Sales)' },
          ]
        },
        {
          title: 'Product',
          isOpen: isProductOpen,
          toggle: () => setIsProductOpen(!isProductOpen),
          links: [
            { to: '/report/products/detail', label: 'Detail Report' },
            { to: '/report/products/general', label: 'General Report' },
            { to: '/report/products/stockjournal', label: 'Stock Journal Report' },
            { to: '/report/products/reorder', label: 'Reorder Report' },
            { to: '/report/products/modifier', label: 'Modifier Report' },
            { to: '/report/products/category', label: 'Categories Report' },
          ]
        },
        {
          title: 'Employee',
          isOpen: isEmployeeOpen,
          toggle: () => setIsEmployeeOpen(!isEmployeeOpen),
          links: [
            { to: '/report/staff', label: 'Detail Report' },
            { to: '/report/employee/attendance', label: 'Attendance Report' },
            { to: '/report/employee/latereport', label: 'Late Report' },
            { to: '/report/employee/absent', label: 'Absent Report' },
            { to: '/report/employee/payroll', label: 'Payroll Report' },
            { to: '/report/employee/specialevents', label: 'Special Events Report' },
            { to: '/report/employee/exportpayroll', label: 'Export Payroll' },
          ]
        },
        {
          title: 'Sales Reports',
          isOpen: isSalesOpen,
          toggle: () => setIsSalesOpen(!isSalesOpen),
          links: [
            { to: '/report/sales/order', label: 'Sales By Order' },
            { to: '/report/sales/category', label: 'Sales By Category' },
            { to: '/report/sales-matrix', label: 'Sales Matrix Report' },
            { to: '/report/sales/summary', label: 'Sales Summary Report' },
            { to: '/report/sales/server', label: 'Server Sales Report' },
            { to: '/report/sales/transaction', label: 'Card Transaction Report' },
            { to: '/report/sales/order-analysis', label: 'Order Type Wise Analysis', title: 'Order Type Wise Analysis' },
            { to: '/report/sales/table/analysis', label: 'Table Group Wise Analysis', title: 'Order Type Wise Analysis' },
            { to: '/report/sales/meal_period/analysis', label: 'Meal Period Wise Analysis' },
            { to: '/report/sales/tax/collection', label: 'Sales Tax Collection Report' },
            { to: '/report/sales/fee/collection', label: 'Usage Fee Collection Report' },
            { to: '/report/sales/tips', label: 'Auto Tips Report' },
            { to: '/report/sales/void', label: 'Void Report' },
            { to: '/report/sales/discount', label: 'Discount Report' },
            { to: '/report/sales/gift/balance', label: 'Gift Cert. Balance Report' },
            { to: '/report/sales/gift/activity', label: 'Gift Cert. Activity Report' },
            { to: '/report/sales/alltax', label: 'All Tax Report' },
            { to: '/report/waste', label: 'Waste Report' }
          ]
        }, {
          title: 'Closeout Reports',
          isOpen: isCloseOutOpen,
          toggle: () => setIsCloseOutOpen(!isCloseOutOpen),
          links: [
            { to: '/report/closeout/consolidatedcloseout', label: 'Consolidated Closeout Report' },
            { to: '/report/closeout/terminalcloseout', label: 'Terminal Closeout Report' },
            { to: '/report/closeout/employeecloseout', label: 'Employee Closeout Report' }
          ]
        },


      ]
    },
  ];

  const otherSections = [
    {
      title: 'Others',
      isOpen: isOthersOpen,
      toggle: () => setIsOthersOpen(!isOthersOpen),
      subsections: [
        {
          links: [
            { to: '/zip_code', label: 'Zip Code', icon: <TbMapPinCode className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/tax', label: 'Tax', icon: <HiReceiptTax className="mr-2 h-4 w-4" />, module: ModuleName.TAXES },
            { to: '/tender', label: 'Tender Types', icon: <MdPayments className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/security', label: 'Security', icon: <MdOutlineSecurity className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            // { to: '/meal_periods', label: 'Meal Periods', icon: <GiSandsOfTime className="mr-2 h-4 w-4" />, module: ModuleName.INVENTORY }
          ]
        }
      ]
    }
  ];
  const restaurantSections = [
    {
      title: 'Restaurants',
      isOpen: isRestaurantOpen,
      toggle: () => setIsRestaurantOpen(!isRestaurantOpen),
      subsections: [
        {
          links: [
            { to: '/restaurant', label: 'Restaurant', icon: <IoRestaurant className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/punch-clock', label: 'Staff Punch In/Out', icon: <LuCalendarClock className="mr-2 h-4 w-4" />, module: ModuleName.ALLOWED },
            { to: '/close-outs', label: 'Close Outs', icon: <PiClockCountdown className="mr-2 h-4 w-4" />, module: ModuleName.ALLOWED },
            { to: '/room', label: 'Rooms', icon: <SiGoogleclassroom className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/table', label: 'Tables', icon: <MdTableBar className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/meal_periods', label: 'Meal Periods', icon: <GiSandsOfTime className="mr-2 h-4 w-4" />, module: ModuleName.INVENTORY },
            { to: '/customer_display', label: 'Customer Display', icon: <LuImagePlus className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS }
          ]
        }
      ]
    }
  ];


  const configSections = [
    {
      title: "Configuration",
      isOpen: isConfigOpen,
      toggle: () => setIsConfigOpen(!isConfigOpen),
      subsections: [
        {
          links: [
            { to: '/currency', label: 'Currency', icon: <BsCurrencyExchange className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/site-configs', label: 'Site Configs', icon: <TbSettingsStar className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/social-media', label: 'Social-Media', icon: <TbWorldCog className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS },
            { to: '/plan', label: 'Plan', icon: <MdPriceChange className="mr-2 h-4 w-4" />, module: ModuleName.SETTINGS }
          ]
        }
      ],
    }
  ];


  const isLinkActive = (linkTo: any) => location.pathname.startsWith(linkTo);

  useEffect(() => {

    const reservationLinks = [
      '/reservation/bookings',
      '/reservation/availability',
      '/reservation/packages',
      '/reservation/settings'
    ];
    if (reservationLinks.some(link => isLinkActive(link))) {
      setIsReservationsOpen(true);
    }

    // Restaurant dropdown
    const restaurantLinks = restaurantSections[0].subsections[0].links.map(link => link.to);
    if (restaurantLinks.some(link => isLinkActive(link))) {
      setIsRestaurantOpen(true);
    }

    // Others dropdown
    const otherLinks = otherSections[0].subsections[0].links.map(link => link.to);
    if (otherLinks.some(link => isLinkActive(link))) {
      setIsOthersOpen(true);
    }

    // Reports dropdown
    let reportsOpen = false;
    reportSections[0].subsections.forEach((subsection, index) => {
      const isSubsectionActive = subsection.links.some(link => isLinkActive(link.to));
      if (isSubsectionActive) {
        reportsOpen = true;
        if (index === 0) setIsCustomerOpen(true);
        if (index === 1) setIsProductOpen(true);
        if (index === 2) setIsEmployeeOpen(true);
        if (index === 3) setIsSalesOpen(true);
        if (index === 4) setIsCloseOutOpen(true);
      }
    });
    if (reportsOpen) {
      setIsReportsOpen(true);
    }

    // Scroll to active link with delay to ensure DOM is rendered
    const scrollToActiveLink = () => {
      const activeLink: any = navRef?.current?.querySelector('.bg-BRAND-500');
      if (activeLink) {
        activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Use setTimeout to ensure DOM is fully rendered
    const timer = setTimeout(scrollToActiveLink, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="flex flex-col">
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-DARK-900 shadow-lg transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          <div className="lg:hidden p-4 flex justify-end">
            <button
              className="p-2 text-DARK-600 dark:text-DARK-300 hover:text-BRAND-600 dark:hover:text-BRAND-300 rounded-full hover:bg-BRAND-100 dark:hover:bg-DARK-800 transition-colors duration-200"
              onClick={toggleSidebar}
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex justify-center py-3 px-2 border-b border-BRAND-100 dark:border-DARK-700">
            <img
              src={headerLogo}
              alt="Logo"
              onError={imageOnError}
              className="h-20 object-contain transition-all duration-300"
            />
          </div>

          {/* Navigation */}
          <nav ref={navRef} className="flex-1 px-3 py-4 bg-BRAND-50 dark:bg-DARK-800 overflow-y-auto scrollbar-hide">
            <ul className="space-y-1">
              {menuItems
                .filter((item) => checkAccess(item.module, userData))
                .map((item, index) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                          ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                          : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                        }`
                      }
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                    </NavLink>

                    {item.label === "Orders" && (
                      <div className="mt-2">
                        <button
                          onClick={() => setIsReservationsOpen(!isReservationsOpen)}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isReservationsOpen
                            ? "text-DARK-800 dark:text-white"
                            : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                            }`}
                        >
                          <span className="flex items-center gap-3">
                            <MdOutlineTableRestaurant className="mr-2 h-4 w-4" />
                            Reservations
                          </span>
                          <span>
                            {isReservationsOpen ? (
                              <FaAngleUp className="mr-2 h-4 w-4" />
                            ) : (
                              <FaAngleDown className="mr-2 h-4 w-4" />
                            )}
                          </span>
                        </button>

                        {isReservationsOpen && (
                          <ul className="ml-6 mt-1 space-y-1">
                            <li>
                              <NavLink
                                to="/reservation/bookings"
                                className={({ isActive }) =>
                                  `flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${isActive
                                    ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                    : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                  }`
                                }
                              >
                                <span className="flex items-center gap-3">
                                  <FaCalendarCheck className="mr-2 h-4 w-4" />
                                  Reservations
                                </span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/reservation/availability"
                                className={({ isActive }) =>
                                  `flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${isActive
                                    ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                    : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                  }`
                                }
                              >
                                <span className="flex items-center gap-3">
                                  <FaCalendarAlt className="mr-2 h-4 w-4" />
                                  Booking Table
                                </span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/reservation/packages"
                                className={({ isActive }) =>
                                  `flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${isActive
                                    ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                    : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                  }`
                                }
                              >
                                <span className="flex items-center gap-3">
                                  <MdLocalOffer className="mr-2 h-4 w-4" />
                                  Packages
                                </span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/reservation/settings"
                                className={({ isActive }) =>
                                  `flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${isActive
                                    ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                    : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                  }`
                                }
                              >
                                <span className="flex items-center gap-3">
                                  <FaGear className="mr-2 h-4 w-4" />
                                  Reservation Settings
                                </span>
                              </NavLink>
                            </li>
                          </ul>
                        )}
                      </div>
                    )}

                    {index === 6 && (
                      <ul>
                        {restaurantSections.map((section) => (
                          <li key={section.title}>
                            <button
                              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
                              onClick={section.toggle}
                            >
                              <span className="flex items-center gap-3">
                                <IoIosRestaurant className="mr-2 h-4 w-4" />
                                {section.title}
                              </span>
                              {section.isOpen ? (
                                <FaAngleUp className="h-4 w-4" />
                              ) : (
                                <FaAngleDown className="h-4 w-4" />
                              )}
                            </button>
                            {section.isOpen && (
                              <div className="ml-4 mt-1 space-y-1">
                                {section.subsections.map((subsection, subIndex) => (
                                  <ul key={subIndex} className="ml-2 space-y-1">
                                    {subsection.links
                                      .filter((link) => checkAccess(link.module, userData))
                                      .map((link) => (
                                        <li key={link.to}>
                                          <NavLink
                                            to={link.to}
                                            className={({ isActive }) =>
                                              `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isActive
                                                ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                                : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                              }`
                                            }
                                          >
                                            {link.icon}
                                            {link.label}
                                          </NavLink>
                                        </li>
                                      ))}
                                  </ul>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}

              {/* Config Section */}
              {(loginRole === SUPER_ADMIN) &&
                configSections.map((section) => (
                  <li key={section.title}>
                    <button
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
                      onClick={section.toggle}
                    >
                      <span className="flex items-center gap-3">
                        <IoSettingsSharp className="h-5 w-5" />
                        {section.title}
                      </span>
                      {section.isOpen ? (
                        <FaAngleUp className="h-4 w-4" />
                      ) : (
                        <FaAngleDown className="h-4 w-4" />
                      )}
                    </button>
                    {section.isOpen && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {section.subsections.map((subsection, index) => (
                          <div key={index}>
                            {subsection.links
                              .filter((item) => checkAccess(item.module, userData))
                              .map((link) => (
                                <li key={link.to}>
                                  <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                      `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isActive
                                        ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                        : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                      }`
                                    }
                                  >
                                    {link.icon}
                                    {link.label}
                                  </NavLink>
                                </li>
                              ))}
                          </div>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}

              {/* Reports Section */}
              {reportSections
                .filter(() => checkAccess("reports", userData))
                .map((section) => (
                  <li key={section.title}>
                    <button
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
                      onClick={section.toggle}
                    >
                      <span className="flex items-center gap-3">
                        <BiSolidReport className="h-5 w-5" />
                        {section.title}
                      </span>
                      {section.isOpen ? (
                        <FaAngleUp className="h-4 w-4" />
                      ) : (
                        <FaAngleDown className="h-4 w-4" />
                      )}
                    </button>
                    {section.isOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <div key={subsection.title}>
                            <button
                              className="flex items-center w-full px-3 py-2 text-sm text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
                              onClick={subsection.toggle}
                            >
                              {subsection.isOpen ? (
                                <IoMdArrowDropup className="h-4 w-4 mr-2" />
                              ) : (
                                <IoMdArrowDropdown className="h-4 w-4 mr-2" />
                              )}
                              {subsection.title}
                            </button>
                            {subsection.isOpen && (
                              <ul className="ml-6 space-y-1">
                                {subsection.links.map((link) => (
                                  <li key={link.to}>
                                    <NavLink
                                      to={link.to}
                                      className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isActive
                                          ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                          : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                        }`
                                      }
                                    >
                                      <TbReportSearch className="h-4 w-4 mr-2" />
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}

              {/* Others Section */}
              {(loginRole === SUPER_ADMIN ||
                userData?.staffMember?.permissions?.some((perm: any) =>
                  [ModuleName.SETTINGS, ModuleName.INVENTORY, ModuleName.TAXES]
                    .map((module) => module.toLowerCase())
                    .includes(perm.toLowerCase())
                )) &&
                otherSections.map((section) => (
                  <li key={section.title}>
                    <button
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
                      onClick={section.toggle}
                    >
                      <span className="flex items-center gap-3">
                        <TfiMenuAlt className="h-5 w-5" />
                        {section.title}
                      </span>
                      {section.isOpen ? (
                        <FaAngleUp className="h-4 w-4" />
                      ) : (
                        <FaAngleDown className="h-4 w-4" />
                      )}
                    </button>
                    {section.isOpen && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {section.subsections.map((subsection, index) => (
                          <div key={index}>
                            {subsection.links
                              .filter((item) => checkAccess(item.module, userData))
                              .map((link) => (
                                <li key={link.to}>
                                  <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                      `flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isActive
                                        ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
                                        : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
                                      }`
                                    }
                                  >
                                    {link.icon}
                                    {link.label}
                                  </NavLink>
                                </li>
                              ))}
                          </div>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );

}


export default NewSideBar