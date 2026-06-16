/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef, Fragment } from "react";
import { BiSolidReport } from "react-icons/bi";
import { FaBuilding, FaCalendarAlt, FaCalendarCheck, FaUsersCog } from "react-icons/fa";
import { FaAngleDown, FaAngleUp, FaGear, FaMoneyCheckDollar, FaPeopleGroup } from "react-icons/fa6";
import { HiChartPie, HiPlusCircle, HiReceiptTax, HiX } from "react-icons/hi";
import { IoRestaurant, IoSettingsSharp } from "react-icons/io5";
import { MdFastfood, MdLocalOffer, MdManageHistory, MdOutlineImportantDevices, MdOutlineTableRestaurant, MdPayments, MdPriceChange, MdTableBar } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import { TbCategoryFilled, TbMapPinCode, TbReportSearch, TbSettingsStar, TbWorldCog } from "react-icons/tb";
import { NavLink, useLocation } from "react-router-dom";
import { useSidebarStore } from "../../hooks/useSidebarStore";
import { TfiMenuAlt } from "react-icons/tfi";
import { LuCalendarClock, LuShoppingBasket } from "react-icons/lu";
import { RiFunctionAddFill } from "react-icons/ri";
import { GiSandsOfTime } from "react-icons/gi";
import { RiCouponFill } from "react-icons/ri";
import { apiUrl, siteUrl } from "../../environment/env";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { useCompanyConfigs } from "../../context/CompanyConfigsProvider";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import { IoMdArrowDropdown, IoMdArrowDropup, IoIosRestaurant } from "react-icons/io";
import { BsCurrencyExchange, BsPeopleFill } from "react-icons/bs";
import { LuImagePlus } from "react-icons/lu";
import { PiClockCountdown } from "react-icons/pi";
import { MANAGER_ROLES, MasterPermissions, OWNER_ADMIN_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { MdOutlineSettingsApplications } from "react-icons/md";
import { IoIosRemoveCircle } from "react-icons/io";

function Sidebar() {
  const [openSections, setOpenSections] = useState<any>({});
  const NoImage = `${siteUrl}/images/Image-not-found.png`;

  const { userData } = useAuth();
  const { role: { name: loginRole } = { name: SUPER_ADMIN }, company, permissions } = userData.staffMember;
  const { configData } = useConfigs();
  const { companyConfigs, setCompanyConfigs } = useCompanyConfigs();
  const { isOpen: isSidebarOpen, setIsOpen } = useSidebarStore();
  const location = useLocation();
  const navRef: any = useRef(null);
  const featureConfig = userData?.featureConfig;
  const haveRemoveOrder = loginRole === SUPER_ADMIN || (featureConfig?.order_features?.remove_order === true && OWNER_ADMIN_ROLES.includes(loginRole));

  const getCompanyConfigs = async () => {
    try {
      const response = await apiClient.get(`${apiUrl}/configs/getByCompany/${company?._id}`);
      const { success, data } = response.data;
      if (success) {
        setCompanyConfigs(data);
        localStorage.setItem('lastCompanyLogo', data.companyLogo);
      }
    } catch (error) {
      console.log("Sidebar getCompanyConfigs Error:", error);
    }
  };

  useEffect(() => {
    if (company?._id) {
      getCompanyConfigs();
    }
  }, [company?._id]);

  const headerLogo = companyConfigs?.isLogoEnabled && companyConfigs?.companyLogo
    ? `${apiUrl}/${companyConfigs.companyLogo}`
    : configData?.headerLogo
      ? `${apiUrl}/${configData.headerLogo}`
      : NoImage;

  const imageOnError = (event: any) => {
    event.currentTarget.src = NoImage;
  };

  const toggleSection = (section: any) => {
    setOpenSections((prev: any) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isSectionOpen = (section: any) => openSections[section];

  // Permission checking functions
  const hasPermission = (permission: string) => {
    if (loginRole === SUPER_ADMIN) return true;
    // const normalizedRole = loginRole?.replace(/\s+/g, '').trim();
    // const isOwner = normalizedRole?.toLowerCase() === 'owner/admin';
    // if (isOwner) {
    //   return true;
    // }
    // if (MANAGER_ROLES.includes(normalizedRole)) {
    //   return true;
    // }
    return permissions?.some((item: string) => item.toLowerCase() === permission.toLowerCase());
  };

  /* const hasAnyPermission = (permissionsList: string[]) => {
    if (loginRole === SUPER_ADMIN) return true;
    return permissions?.some((item: string) =>
      permissionsList.map(p => p.toLowerCase()).includes(item.toLowerCase())
    );
  }; */

  const isManager = () => {
    return MANAGER_ROLES.includes(loginRole) || loginRole === SUPER_ADMIN;
  };


  const menuItems = [
    { to: '/', label: 'Dashboard', icon: <HiChartPie className="mr-2 h-4 w-4" />, permission: true },
    { to: '/order', label: 'Orders', icon: <FaMoneyCheckDollar className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.ORDERS) },
    { to: '/product', label: 'Products', icon: <MdFastfood className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.INVENTORY) },
    { to: '/modifier', label: 'Modifier', icon: <RiFunctionAddFill className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.INVENTORY) },
    { to: '/modifire/category', label: 'Modifier Category', icon: <HiPlusCircle className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.INVENTORY) },
    { to: '/category', label: 'Categories', icon: <TbCategoryFilled className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.INVENTORY) },
    { to: '/inventory', label: 'Inventory', icon: <LuShoppingBasket className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.INVENTORY) },
    { to: '/business', label: 'Business', icon: <FaBuilding className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.SETTINGS) },
    { to: '/customer', label: 'Customers', icon: <FaPeopleGroup className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.CUSTOMER) },
    { to: '/staff', label: 'Staff', icon: <BsPeopleFill className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.STAFFS) },
    { to: '/role', label: 'Roles', icon: <FaUsersCog className="mr-2 h-4 w-4" />, permission: isManager() && hasPermission(MasterPermissions.STAFFS) },
    { to: '/posdevice', label: 'POS Device', icon: <MdOutlineImportantDevices className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.POS_DEVICE) },
    { to: '/discount', label: 'Discounts', icon: <MdLocalOffer className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.DISCOUNTS) },
    { to: '/coupon', label: 'Coupons', icon: <RiCouponFill className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.COUPONS) },
    // { to: '/offers', label: 'Offers', icon: <BiSolidOffer className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.OFFERS) },
    // { to: '/setting', label: 'Settings', icon: <IoSettingsSharp className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.SETTINGS) },
    // { to: '/connection', label: 'Connections', icon: <TbPlugConnected className="mr-2 h-4 w-4" />, permission: true },
    // { to: '/currency', label: 'Currency', icon: <BsCurrencyExchange className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
    // { to: '/site-configs', label: 'Site Configs', icon: <TbSettingsStar className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
    // { to: '/social-media', label: 'Social-Media', icon: <TbWorldCog className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
    // { to: '/plan', label: 'Plan', icon: <MdPriceChange className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
  ].filter(item => item.permission);


  const reservationItems = [
    { to: '/reservation/bookings', label: 'Reservations', icon: <FaCalendarCheck className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.RESERVATIONS) },
    { to: '/reservation/availability', label: 'Availability', icon: <FaCalendarAlt className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.RESERVATIONS) },
    { to: '/reservation/packages', label: 'Packages', icon: <MdLocalOffer className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.RESERVATIONS) },
    { to: '/reservation/settings', label: 'Settings', icon: <FaGear className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.RESERVATIONS) },
  ].filter(item => item.permission);

  const restaurantItems = [
    { to: '/restaurant', label: 'Restaurants', icon: <IoRestaurant className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.SETTINGS) },
    { to: '/punch-clock', label: 'Staff Punch In/Out', icon: <LuCalendarClock className="mr-2 h-4 w-4" />, permission: true },
    { to: '/close-outs', label: 'Close Outs', icon: <PiClockCountdown className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.STAFFS) },
    { to: '/room', label: 'Rooms', icon: <SiGoogleclassroom className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.SETTINGS) },
    { to: '/table', label: 'Tables', icon: <MdTableBar className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.SETTINGS) },
    { to: '/meal_periods', label: 'Meal Periods', icon: <GiSandsOfTime className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.INVENTORY) },
    { to: '/customer_display', label: 'Customer Displays', icon: <LuImagePlus className="mr-2 h-4 w-4" />, permission: hasPermission(MasterPermissions.SETTINGS) },
    { to: '/removed-order', label: "Removed Orders", icon: <IoIosRemoveCircle className="mr-2 h-4 w-4" />, permission: haveRemoveOrder },
    { to: '/order-history', label: "Order History", icon: <MdManageHistory className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
  ].filter(item => item.permission);

  const reportSections = [
    {
      title: 'Customer',
      permission: hasPermission('reports'),
      items: [
        { to: '/report/customer/detail', label: 'Detail Report', permission: true },
        { to: '/report/customer/general', label: 'General Report', permission: true },
        { to: '/report/customer/other', label: 'Other Report (Sales)', permission: true },
      ]
    },
    {
      title: 'Product',
      permission: hasPermission('reports'),
      items: [
        { to: '/report/products/detail', label: 'Detail Report', permission: true },
        { to: '/report/products/general', label: 'General Report', permission: true },
        { to: '/report/products/stockjournal', label: 'Stock Journal Report', permission: true },
        { to: '/report/products/reorder', label: 'Reorder Report', permission: true },
        { to: '/report/products/modifier', label: 'Modifier Report', permission: true },
        { to: '/report/products/category', label: 'Categories Report', permission: true },
      ]
    },
    {
      title: 'Employee',
      permission: hasPermission('reports'),
      items: [
        { to: '/report/employee/staff', label: 'Detail Report', permission: true },
        { to: '/report/employee/attendance', label: 'Attendance Report', permission: true },
        { to: '/report/employee/latereport', label: 'Late Report', permission: true },
        { to: '/report/employee/absent', label: 'Absent Report', permission: true },
        { to: '/report/employee/payroll', label: 'Payroll Report', permission: true },
        // { to: '/report/employee/specialevents', label: 'Special Events Report', permission: true },
        { to: '/report/employee/exportpayroll', label: 'Export Payroll', permission: true },
      ]
    },
    {
      title: 'Sales Reports',
      permission: hasPermission('reports'),
      items: [
        { to: '/report/sales/order', label: 'Sales By Order', permission: true },
        { to: '/report/sales/category', label: 'Sales By Category', permission: true },
        { to: '/report/sales/matrix', label: 'Sales Matrix Report', permission: true },
        { to: '/report/sales/summary', label: 'Sales Summary Report', permission: true },
        { to: '/report/sales/server', label: 'Server Sales Report', permission: true },
        { to: '/report/sales/transaction', label: 'Card Transaction Report', permission: true },
        { to: '/report/sales/order-analysis', label: 'Order Type Wise Analysis', permission: true },
        { to: '/report/sales/table/analysis', label: 'Table Group Wise Analysis', permission: true },
        { to: '/report/sales/meal_period/analysis', label: 'Meal Period Wise Analysis', permission: true },
        { to: '/report/sales/tax/collection', label: 'Sales Tax Collection Report', permission: true },
        // { to: '/report/sales/fee/collection', label: 'Usage Fee Collection Report', permission: true },
        { to: '/report/sales/tips', label: 'Auto Tips Report', permission: true },
        { to: '/report/sales/void', label: 'Void Report', permission: true },
        // { to: '/report/sales/discount', label: 'Discount Report', permission: true },
        // { to: '/report/sales/gift-balance', label: 'Gift Cert. Balance Report', permission: true },
        // { to: '/report/sales/gift-activity', label: 'Gift Cert. Activity Report', permission: true },
        { to: '/report/sales/alltax', label: 'All Tax Report', permission: true },
        { to: '/report/waste', label: 'Waste Report', permission: true }
      ]
    },
    {
      title: 'Closeout Reports',
      permission: hasPermission('reports'),
      items: [
        { to: '/report/closeout/consolidatedcloseout', label: 'Consolidated Closeout Report', permission: true },
        { to: '/report/closeout/terminalcloseout', label: 'Terminal Closeout Report', permission: true },
        { to: '/report/closeout/employeecloseout', label: 'Employee Closeout Report', permission: true }
      ]
    }
  ].filter(section => section.permission);

  const otherItems = [
    { to: '/zip_code', label: 'Zip Code', icon: <TbMapPinCode className="mr-2 h-4 w-4" />, permission: hasPermission('settings') },
    { to: '/tax', label: 'Tax', icon: <HiReceiptTax className="mr-2 h-4 w-4" />, permission: hasPermission('taxes') },
    { to: '/tender', label: 'Tender Types', icon: <MdPayments className="mr-2 h-4 w-4" />, permission: hasPermission('settings') },
    // { to: '/security', label: 'Security', icon: <MdOutlineSecurity className="mr-2 h-4 w-4" />, permission: hasPermission('settings') },
  ].filter(item => item.permission);

  const configSections = [
    {
      title: 'Configuration',
      permission: loginRole === SUPER_ADMIN,
      items: [
        { to: '/currency', label: 'Currency', icon: <BsCurrencyExchange className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
        { to: '/site-configs', label: 'Site Configs', icon: <TbSettingsStar className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
        { to: '/social-media', label: 'Social-Media', icon: <TbWorldCog className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
        { to: '/plan', label: 'Plan', icon: <MdPriceChange className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
        { to: '/feature-config', label: 'Feature Config', icon: <MdOutlineSettingsApplications className="mr-2 h-4 w-4" />, permission: loginRole === SUPER_ADMIN },
      ].filter(item => item.permission)
    }
  ].filter(section => section.permission);

  // const isLinkActive = (linkTo: string) => {
  //   const getSegment = (path: string, index: number) => path.split('/')[index];
  //   const currentPath = location.pathname;
  //   const isSpecialPath = linkTo.startsWith('/reservation') || linkTo.startsWith('/report');
  //   let firstSegment = getSegment(currentPath, 1);
  //   let linkToSegment = getSegment(linkTo, 1);
  //   if (isSpecialPath) {
  //     const secondSegment = getSegment(currentPath, 2);
  //     const thirdSegment = getSegment(currentPath, 3);
  //     if (linkTo.startsWith('/report')) {
  //       firstSegment = thirdSegment;
  //       linkToSegment = getSegment(linkTo, 3);
  //       if (['products', 'sales', 'employee', 'staff', 'closeout'].includes(secondSegment)) {
  //         firstSegment = thirdSegment;
  //         linkToSegment = getSegment(linkTo, 3);
  //       }
  //     } else {
  //       firstSegment = secondSegment;
  //       linkToSegment = getSegment(linkTo, 2);
  //     }
  //   }
  //   return firstSegment === linkToSegment;
  // };

  const isLinkActive = (linkTo: string) => {
    const getSegment = (path: string, index: number) => path.split('/')[index];
    const currentPath = location.pathname;

    const isReservationPath = linkTo.startsWith('/reservation');

    if (isReservationPath) {
      return currentPath.startsWith(linkTo);
    }

    const isReportPath = linkTo.startsWith('/report');

    if (isReportPath) {
      const currentSegments = currentPath.split('/');
      const linkToSegments = linkTo.split('/');

      if (linkTo.startsWith('/report')) {
        const [currentReport, currentCategory, currentDetails] = currentSegments.slice(1, 4);
        const [linkReport, linkCategory, linkDetails] = linkToSegments.slice(1, 4);

        if (currentReport === linkReport && currentCategory === linkCategory) {
          return currentDetails === linkDetails || !currentDetails;
        }
        return false;
      }
    }

    const firstSegment = getSegment(currentPath, 1);
    const linkToSegment = getSegment(linkTo, 1);
    return firstSegment === linkToSegment;
  };


  useEffect(() => {
    const path = location.pathname;
    if (reservationItems.some(item => path.startsWith(item.to))) {
      setOpenSections((prev: any) => ({ ...prev, reservation: true }));
    }

    if (restaurantItems.some(item => path.startsWith(item.to))) {
      setOpenSections((prev: any) => ({ ...prev, restaurant: true }));
    }

    if (otherItems.some(item => path.startsWith(item.to))) {
      setOpenSections((prev: any) => ({ ...prev, others: true }));
    }

    if (configSections.some(section =>
      section.items.some(item => path.startsWith(item.to))
    )) {
      setOpenSections((prev: any) => ({ ...prev, configuration: true }));
    }

    if (reportSections.some(section =>
      section.items.some(item => path.startsWith(item.to))
    )) {
      setOpenSections((prev: any) => ({ ...prev, reports: true }));

      reportSections.forEach((section, index) => {
        if (section.items.some(item => path.startsWith(item.to))) {
          setOpenSections((prev: any) => ({ ...prev, [`report-${index}`]: true }));
        }
      });
    }

    const scrollToActiveLink = () => {
      const activeLink: any = navRef.current?.querySelector('.bg-BRAND-500');
      if (activeLink) {
        // activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const timer = setTimeout(scrollToActiveLink, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle mobile auto-close and viewport resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    // Auto-close on navigation if on mobile
    if (window.innerWidth < 992 && isSidebarOpen) {
      setIsOpen(false);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]);

  const NavItem = ({ to, label, icon, onClick, isButton = false, children, permission = true }: any) => {
    const isActive = isLinkActive(to);
    // console.log("isActive", isActive, to);

    const className = `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 
    ${isActive && !isButton
        ? "bg-BRAND-500 text-white hover:bg-BRAND-600"
        : "text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700"
      } ${permission ? "" : "opacity-50 cursor-not-allowed"}`;

    if (isButton) {
      return (
        <button className={className} onClick={permission ? onClick : undefined}>
          <span className="flex items-center justify-between w-full gap-3">
            <span className="flex items-center gap-3">
              {icon}
              {label}
            </span>
            {children}
          </span>
        </button>
      );
    }

    return (
      <Fragment>
        {permission ? (
          <NavLink to={to} className={className}>
            <span className="flex items-center gap-3">
              {icon}
              {label}
            </span>
          </NavLink>
        ) : (
          <span className={`${className}`}>
            <span className="flex items-center gap-3">
              {icon}
              {label}
            </span>
          </span>
        )}
      </Fragment>
    );
  };

  const CollapsibleSection = ({
    title,
    icon,
    isOpen,
    onToggle,
    children,
    permission = true,
  }: any) => {
    if (!permission) return null;

    return (
      <div> {/* Changed from <li> to <div> */}
        <button
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
          onClick={onToggle}
        >
          <span className="flex items-center gap-3">
            {icon}
            {title}
          </span>
          {isOpen ? <FaAngleUp className="h-4 w-4" /> : <FaAngleDown className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  const SubCollapsibleSection = ({ title, isOpen, onToggle, children, permission = true }: any) => {
    if (!permission) return null;

    return (
      <div>
        <button
          className="flex items-center w-full px-3 py-2 text-sm text-DARK-800 dark:text-DARK-200 hover:bg-BRAND-200 dark:hover:bg-DARK-700 rounded-lg transition-colors duration-200"
          onClick={onToggle}
        >
          {isOpen ? (
            <IoMdArrowDropup className="h-4 w-4 mr-2" />
          ) : (
            <IoMdArrowDropdown className="h-4 w-4 mr-2" />
          )}
          {title}
        </button>
        {isOpen && (
          <ul className="ml-6 space-y-1">
            {children}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col layout-container">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm lmd:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-DARK-900 shadow-lg transition-transform sidebar hide-on-print ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lmd:translate-x-0`}
      >
        <div className="h-full flex flex-col main-content">
          {/* Mobile close button */}
          <div className="lmd:hidden p-4 flex justify-end">
            {isSidebarOpen && (
            <button
              className="p-2 text-DARK-600 dark:text-DARK-300 hover:text-BRAND-600 dark:hover:text-BRAND-300 rounded-full hover:bg-BRAND-100 dark:hover:bg-DARK-800 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <HiX className="h-6 w-6" />
            </button>
            )}
          </div>

          {/* Logo */}
          <div className="flex justify-center py-3 px-2 border-b border-BRAND-100 dark:border-DARK-900">
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
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavItem {...item} />

                  {/* original */}
                  {item.label === "Orders" && restaurantItems.length > 0 && (
                    <CollapsibleSection
                      title="Restaurants"
                      icon={<IoIosRestaurant className="mr-2 h-4 w-4" />}
                      isOpen={isSectionOpen('restaurant')}
                      onToggle={() => toggleSection('restaurant')}
                      permission={restaurantItems.length > 0}
                    >
                      <ul className="ml-2 space-y-1">
                        {restaurantItems.map((restaurantItem) => (
                          <li key={restaurantItem.to}>
                            <NavItem {...restaurantItem} />
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}

                  {item.label === "Orders" && reservationItems.length > 0 && (
                    <CollapsibleSection
                      title="Reservations"
                      icon={<MdOutlineTableRestaurant className="mr-2 h-4 w-4" />}
                      isOpen={isSectionOpen('reservation')}
                      onToggle={() => toggleSection('reservation')}
                      permission={reservationItems.length > 0}
                    >
                      <ul className="ml-2 space-y-1">
                        {reservationItems.map((reservationItem) => (
                          <li key={reservationItem.to}>
                            <NavItem {...reservationItem} />
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}
                </li>
              ))}

              {configSections.length > 0 && (
                <CollapsibleSection
                  title="Configuration"
                  icon={<IoSettingsSharp className="h-5 w-5" />}
                  isOpen={isSectionOpen('configuration')}
                  onToggle={() => toggleSection('configuration')}
                  permission={configSections.length > 0}
                >
                  <ul className="ml-2 space-y-1">
                    {configSections[0].items.map((item) => (
                      <li key={item.to}>
                        <NavItem {...item} />
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Reports Section */}
              {reportSections.length > 0 && (
                <CollapsibleSection
                  title="Reports"
                  icon={<BiSolidReport className="h-5 w-5" />}
                  isOpen={isSectionOpen('reports')}
                  onToggle={() => toggleSection('reports')}
                  permission={reportSections.length > 0}
                >
                  {reportSections.map((section, index) => (
                    <SubCollapsibleSection
                      key={section.title}
                      title={section.title}
                      isOpen={isSectionOpen(`report-${index}`)}
                      onToggle={() => toggleSection(`report-${index}`)}
                      permission={section.permission}
                    >
                      <ul className="space-y-1">
                        {section.items.map((item) => (
                          <li key={item.to}>
                            <NavItem
                              to={item.to}
                              label={item.label}
                              icon={<TbReportSearch className="h-4 w-4 mr-2" />}
                              permission={item.permission}
                            />
                          </li>
                        ))}
                      </ul>
                    </SubCollapsibleSection>
                  ))}
                </CollapsibleSection>
              )}

              {/* Others Section */}
              {otherItems.length > 0 && (
                <CollapsibleSection
                  title="Others"
                  icon={<TfiMenuAlt className="h-5 w-5" />}
                  isOpen={isSectionOpen('others')}
                  onToggle={() => toggleSection('others')}
                  permission={otherItems.length > 0}
                >
                  <ul className="ml-2 space-y-1">
                    {otherItems.map((item) => (
                      <li key={item.to}>
                        <NavItem {...item} />
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
}

export default Sidebar;