// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { BrowserRouter, Navigate, Route, Routes, } from 'react-router-dom'
// import { ToastContainer } from 'react-toastify'
// import 'react-toastify/dist/ReactToastify.css'
// import './App.css'
// import { lazy, Suspense, useCallback, useEffect } from 'react'

// const Login = lazy(() => import('./components/auth/Login'));
// const NotFound = lazy(() => import('./components/auth/Notfound'));
// const Categories = lazy(() => import('./components/categories/Categories'));
// const CategoryForm = lazy(() => import('./components/categories/CategoryForm'));
// const CustomerForm = lazy(() => import('./components/customers/CustomerForm'));
// const Customers = lazy(() => import('./components/customers/Customers'));
// const Dashboard = lazy(() => import('./components/dashboard/Dashboard'))
// const Discounts = lazy(() => import('./components/discounts/Discounts'))
// const Layout = lazy(() => import('./components/layout/Layout'))
// const ModifierForm = lazy(() => import('./components/modifiers/ModifierForm'))
// const Modifiers = lazy(()=> import('./components/modifiers/Modifiers'))
// const Orders = lazy(()=> import('./components/orders/Orders'))
// const OrderView = lazy(()=> import('./components/orders/OrderView'))
// const Tax = lazy(()=> import('./components/others/Tax'))
// const Tender = lazy(()=> import('./components/others/tender/Tender'))
// const ProductForm = lazy(()=> import('./components/products/ProductForm'))
// const Products = lazy(()=> import('./components/products/Products'))
// const CategoriesReport = lazy(()=> import('./components/report/CategoriesReport')) 
// const CustomerReport = lazy(()=> import('./components/report/customer/CustomerReport')) 
// const ModifierReport = lazy(()=> import( './components/report/ModifierReport'))
// const SalesByOrder = lazy(()=> import( './components/report/sales/SalesByOrder'))
// const Rooms = lazy(()=> import( './components/rooms/Rooms'))
// const Main = lazy(()=> import( './components/settings/Main'))
// const Staff = lazy(()=> import( './components/staff/Staff'))
// const StaffForm = lazy(()=> import( './components/staff/StaffForm'))
// const TableForm = lazy(()=> import( './components/tables/TableForm'))
// const Tables = lazy(()=> import( './components/tables/Tables'))
// import { useAuth } from './context/AuthProvider'
// const ProtectedRoutes = lazy(()=> import( './utils/ProtectedRoutes'))
// const OtherReport = lazy(()=> import( './components/report/customer/OtherReport'))
// const GeneralReport = lazy(()=> import( './components/report/customer/GeneralReport'))
// const ProductReport = lazy(()=> import( './components/report/product/ProductReport'))
// const ProductGeneral = lazy(()=> import( './components/report/product/ProductGeneral'))
// const SalesByCategory = lazy(()=> import( './components/report/sales/SalesByCategory'))
// const StockJournal = lazy(()=> import( './components/report/product/StockJournal'))
// const Reorder = lazy(()=> import( './components/report/product/Reorder'))
// const SummaryReport = lazy(()=> import( './components/report/sales/SummaryReport'))
// const ServerReport = lazy(()=> import( './components/report/sales/ServerReport'))
// const CardTransaction = lazy(()=> import( './components/report/sales/CardTransaction'))
// const OrderAnalysis = lazy(()=> import( './components/report/sales/OrderAnalysis'))
// const TableAnalysis = lazy(()=> import( './components/report/sales/TableAnalysis'))
// const MealPeriodAnalysis = lazy(()=> import( './components/report/sales/MealPeriodAnalysis'))
// const SalesTaxCollection = lazy(()=> import( './components/report/sales/SalesTaxCollection'))
// const SalesUsageFeeCollection = lazy(()=> import( './components/report/sales/SalesUsageFeeCollection'))
// const AutoTips = lazy(()=> import( './components/report/sales/AutoTips'))
// const VoidReport = lazy(()=> import( './components/report/sales/VoidReport'))
// const DiscountReport = lazy(()=> import( './components/report/sales/DiscountReport'))
// const GiftBalance = lazy(()=> import( './components/report/sales/GiftBalance'))
// const GiftActivity = lazy(()=> import( './components/report/sales/GiftActivity'))
// const ZipCode = lazy(()=> import( './components/others/ZipCode'))
// const Security = lazy(()=> import( './components/others/Security'))
// const AttendanceReport = lazy(()=> import( './components/report/Employee/AttendanceReport'))
// const LateReport = lazy(()=> import( './components/report/Employee/LateReport'))
// const AbsentReport = lazy(()=> import( './components/report/Employee/AbsentReport'))
// const PayrollReport = lazy(()=> import( './components/report/Employee/PayrollReport'))
// const SpecialEventsReport = lazy(()=> import( './components/report/Employee/SpecialEventsReport'))
// const ExportPayrollReport = lazy(()=> import( './components/report/Employee/ExportPayrollReport'))
// const ConsolidatedCloseout = lazy(()=> import( './components/report/CloseOut/ConsolidatedCloseout'))
// const TerminalCloseout = lazy(()=> import( './components/report/CloseOut/TerminalCloseout'))
// const EmployeeCloseout = lazy(()=> import( './components/report/CloseOut/EmployeeCloseout'))
// const AdminRegister = lazy(()=> import( './components/auth/AdminRegister'))
// const StaffReport = lazy(()=> import( './components/report/Employee/StaffReport'))
// const ClockInOut = lazy(()=> import( './components/clockinout/ClockInOut'))
// const Company = lazy(()=> import( './components/company/Company'))
// const CompanyForm = lazy(()=> import( './components/company/CompanyForm'))
// const Roles = lazy(()=> import( './components/role/Roles'))
// const ModifierCategories = lazy(()=> import( './components/modifierCategories/ModifierCategories'))
// const ModifierCategoryForm = lazy(()=> import( './components/modifierCategories/ModifierCategoryForm'))
// const CompanyRegister = lazy(()=> import( './components/auth/CompanyRegister'))
// const Restaurant = lazy(()=> import( './components/restaurant/Restaurant'))
// const RestaurantForm = lazy(()=> import( './components/restaurant/RestaurantForm'))
// const GeneratePassword = lazy(()=> import( './components/auth/GeneratePassword'))
// const PosDevice = lazy(()=> import( './components/POSDevice/PosDevice'))
// const BusinessSuccess = lazy(()=> import( './utils/BusinessSuccess'))
// const SalesMatrix = lazy(()=> import( './components/report/sales/SalesMatrix'))
// const Profile = lazy(()=> import( './components/profile/Profile'))
// import 'react-loading-skeleton/dist/skeleton.css'
// const Coupon = lazy(()=> import( './components/Coupon/Coupon'))
// const AllTaxesReport = lazy(()=> import( './components/report/sales/AllTaxesReport'))
// const CompanyConfigs = lazy(()=> import( './components/company/Configs/CompanyConfigs'))
// const SiteConfigs = lazy(()=> import( './components/siteConfigs/SiteConfigs'))
// import { apiUrl, siteUrl } from './environment/env'
// import { useConfigs } from './context/SiteConfigsProvider'
// const WasteReport = lazy(()=> import( './components/report/sales/WasteReport'))
// const ConnectionList = lazy(()=> import( './components/connection/ConnectionList'))
// const AddConnection = lazy(()=> import( './components/connection/AddConnection'))
// const ConnectionSuccess = lazy(()=> import( './components/connection/ConnectionSuccess'))
// const Reservations = lazy(()=> import( './components/Reservation/Reservations'))
// const ReserveSettings = lazy(()=> import( './components/Reservation/ReserveSettings'))
// const AvailabilityCalendar = lazy(()=> import( './components/Reservation/AvailabilityCalendar'))
// const Packages = lazy(()=> import( './components/Reservation/Packages'))
// import { useSocket } from './context/SocketProvider'
// const DiscountForm = lazy(()=> import( './components/discounts/DiscountForm'))
// const ResetPassword = lazy(()=> import( './components/auth/ResetPassword'))
// const KitchenDisplay = lazy(()=> import( './components/kitchen/KitchenDisplay'))
// const AppProductReport = lazy(()=> import( './AppWebView/AppProductReport'))
// const LandingPage = lazy(()=> import( './components/auth/LandingPage'))
// const Pricing = lazy(()=> import( './components/Pricing/Pricing'))
// const ContactUs = lazy(()=> import( './components/contactUs/ContactUs'))
// const TermsAndConditions = lazy(()=> import( './components/termsandconditions/TermsAndConditions'))
// const PrivacyAndPolicy = lazy(()=> import( './components/privacyandpolicy/PrivacyAndPolicy'))
// const AboutUs = lazy(()=> import( './components/aboutus/AboutUs'))
// const LandingLayout = lazy(()=> import( './components/LandingLayout/LandingLayout'))
// const AppModifierReport = lazy(()=> import( './AppWebView/AppModifierReport'))
// const AppCategoryReport = lazy(()=> import( './AppWebView/AppCategoryReport'))
// const AppOrder = lazy(()=> import( './AppWebView/AppOrder'))
// const AppOrderView = lazy(()=> import( './AppWebView/AppOrderView'))
// const CustomerDisplay = lazy(()=> import( './components/customerDisplay/CustomerDisplay'))
// const POSMenu = lazy(()=> import( './components/pos-app/POSMenu'))
// const CloseOutLists = lazy(()=> import( './components/restaurant/CloseOutLists'))
// const RestaurantSettings = lazy(()=> import( './components/restaurant/settings/RestaurantSettings'))
// const Currency = lazy(()=> import( './components/Currency/Currency'))
// const MealPeriods = lazy(()=> import( './components/mealPeriods/MealPeriods'))
// const SocialMedia = lazy(()=> import( './components/socialMedia/SocialMedia'))
// const Plan = lazy(()=> import( './components/plans/Plan'))
// const PlanForm = lazy(()=> import( './components/plans/PlanForm'))
// const TestAPIs = lazy(()=> import( './components/TestAPIs'))
// const PayDetails = lazy(()=> import( './components/SubscriptionPayment/PayDetails'))
// const PaymentCheckout = lazy(()=> import( './components/SubscriptionPayment/PaymentCheckout'))
// const PaymentSucess = lazy(()=> import( './components/SubscriptionPayment/PaymentSucess'))
// const PaymentFailed = lazy(()=> import( './components/SubscriptionPayment/PaymentFailed'))
// import { useQuickBooks } from './context/QuickBooksProvider'
// const ConnectionSettings = lazy(()=> import( './components/connection/ConnectionSettings'))
// import apiClient from './utils/AxiosInstance'
// const FeatureConfiguration = lazy(()=> import( './components/FeatureConfiguration/FeatureConfiguration'))
// const FeatureConfigurationForm = lazy(()=> import( './components/FeatureConfiguration/FeatureConfigurationForm'))
// const OfferList = lazy(()=> import( './components/offers/OfferList'))
// const RemovedOrders = lazy(()=> import( './components/orders/RemovedOrders'))
// const OrderHistory = lazy(()=> import( './components/orders/OrderHistory'))
// const Inventory = lazy(()=> import( './components/Inventory/Inventory'))

// const AuthenticatedRoutes = () => (
//   <Routes>
//     <Route element={<ProtectedRoutes />}>
//       <Route path="/" element={<Layout />}>
//         <Route index element={<Dashboard />} />
//         <Route path="setting">
//           <Route index element={<Main />} />
//         </Route>
//         <Route path="reset-password" element={<ResetPassword />} />
//         <Route path="generate-password" element={<GeneratePassword />} />
//         <Route path="/profile/:id" element={<Profile />} />
//         <Route path="/site-configs" element={<SiteConfigs />} />
//         <Route path="/profile/edit/:id" element={<StaffForm />} />
//         <Route path="/contactus" element={<ContactUs />} />
//         <Route path="connection">
//           <Route index element={<Navigate to="/connection/1" />} />
//           <Route path=":pages" element={<ConnectionList />} />
//           <Route path="add" element={<AddConnection />} />
//           <Route path="edit/:id" element={<AddConnection />} />
//           <Route path="settings/:id" element={<ConnectionSettings />} />
//         </Route>
//         <Route path="connection-status" element={<ConnectionSuccess />} />
//         <Route path="order">
//           <Route index element={<Navigate to="/order/1" />} />
//           <Route path=":pages" element={<Orders />} />
//           <Route path="view/:id" element={<OrderView />} />
//         </Route>
//         <Route path="removed-order">
//           <Route index element={<Navigate to="/removed-order/1" />} />
//           <Route path=":pages" element={<RemovedOrders />} />
//         </Route>
//         <Route path="order-history">
//           <Route index element={<Navigate to="/order-history/1" />} />
//           <Route path=":pages" element={<OrderHistory />} />
//         </Route>
//         <Route path="product">
//           <Route index element={<Navigate to="/product/1" />} />
//           <Route path=":pages" element={<Products />} />
//           <Route path="add" element={<ProductForm />} />
//           <Route path="edit/:id" element={<ProductForm />} />
//         </Route>
//         <Route path="category">
//           <Route index element={<Navigate to="/category/1" />} />
//           <Route path=":pages" element={<Categories />} />
//           <Route path="add" element={<CategoryForm />} />
//           <Route path="edit/:id" element={<CategoryForm />} />
//         </Route>
//         <Route path="modifire/category">
//           <Route index element={<Navigate to="/modifire/category/1" />} />
//           <Route path=":pages" element={<ModifierCategories />} />
//           <Route path="add" element={<ModifierCategoryForm />} />
//           <Route path="edit/:id" element={<ModifierCategoryForm />} />
//         </Route>
//         <Route path="room">
//           <Route index element={<Navigate to="/room/1" />} />
//           <Route path=":pages" element={<Rooms />} />
//         </Route>
//         <Route path="discount" >
//           <Route index element={<Navigate to="/discount/1" />} />
//           <Route path=":pages" element={<Discounts />} />
//           <Route path="add" element={<DiscountForm />} />
//           <Route path="edit/:id" element={<DiscountForm />} />
//         </Route>
//         <Route path="coupon" >
//           <Route index element={<Navigate to="/coupon/1" />} />
//           <Route path=":pages" element={<Coupon />} />
//         </Route>
//         <Route path="inventory" >
//           <Route index element={<Navigate to="/inventory/1" />} />
//           <Route path=":pages" element={<Inventory />} />
//         </Route>
//         {/* <Route path="modifier" element={<Modifiers />} /> */}
//         <Route path='modifier'>
//           <Route index element={<Navigate to="/modifier/1" />} />
//           <Route path=":pages" element={<Modifiers />} />
//           <Route path="add" element={<ModifierForm />} />
//           <Route path="edit/:id" element={<ModifierForm />} />
//         </Route>
//         <Route path='customer'>
//           <Route index element={<Navigate to="/customer/1" />} />
//           <Route path=":pages" element={<Customers />} />
//           <Route path="add" element={<CustomerForm />} />
//           <Route path="edit/:id" element={<CustomerForm />} />
//         </Route>
//         <Route path="staff">
//           <Route index element={<Navigate to="/staff/1" />} />
//           <Route path=":pages" element={<Staff />} />
//           <Route path="add" element={<StaffForm />} />
//           <Route path="edit/:id" element={<StaffForm />} />
//         </Route>
//         <Route path="role">
//           <Route index element={<Navigate to="/role/1" />} />
//           <Route path=":pages" element={<Roles />} />
//           <Route path="add" element={<StaffForm />} />
//           <Route path="edit/:id" element={<StaffForm />} />
//         </Route>
//         <Route path='posdevice'>
//           <Route index element={<Navigate to="/posdevice/1" />} />
//           <Route path=':pages' element={<PosDevice />} />
//         </Route>
//         <Route path="table">
//           <Route index element={<Navigate to="/table/1" />} />
//           <Route path=":pages" element={<Tables />} />
//           <Route path="add" element={<TableForm />} />
//           <Route path="edit/:id" element={<TableForm />} />
//         </Route>
//         <Route path="business">
//           <Route index element={<Navigate to="/business/1" />} />
//           <Route path=":pages" element={<Company />} />
//           <Route path="add" element={<CompanyForm />} />
//           <Route path="edit/:id" element={<CompanyForm />} />
//         <Route path="bussiness_configs/:id" element={<CompanyConfigs />} />

//         </Route>
//         <Route path="restaurant">
//           <Route index element={<Navigate to="/restaurant/1" />} />
//           <Route path=":pages" element={<Restaurant />} />
//           <Route path="add" element={<RestaurantForm />} />
//           <Route path="close-outs" element={<CloseOutLists />} />
//           <Route path="edit/:id" element={<RestaurantForm />} />
//           <Route path="settings/:restaurant" element={<RestaurantSettings />} />
//         </Route>
//         <Route path="reservation">
//           {/* <Route index element={<Navigate to="1" />} /> */}
//           <Route path="bookings/:pages?" element={<Reservations />} />
//           <Route path="availability" element={<AvailabilityCalendar />} />
//           <Route path="settings" element={<ReserveSettings />} />
//           <Route path="packages/:pages?" element={<Packages />} />
//         </Route>
//         <Route path="punch-clock">
//           <Route index element={<Navigate to="/punch-clock/1" />} />
//           <Route path=":pages" element={<ClockInOut />} />
//         </Route>
//         <Route path="report/products/detail/:pages?" element={<ProductReport />} />
//         <Route path="report/products/general" element={<ProductGeneral />} />
//         <Route path='report/products/stockjournal' element={<StockJournal />} />
//         <Route path='report/products/reorder' element={<Reorder />} />
//         <Route path="report">
//           <Route path="products/modifier/:pages?" element={<ModifierReport />} />
//           <Route path="products/category/:pages?" element={<CategoriesReport />} />
//           <Route path="staff/:pages?" element={<StaffReport />} />
//           <Route path="sales/order" element={<SalesByOrder />} />
//           <Route path="sales/category" element={<SalesByCategory />} />
//           <Route path="sales/matrix" element={<SalesMatrix />} />
//           <Route path="sales/summary" element={<SummaryReport />} />
//           <Route path="sales/server" element={<ServerReport />} />
//           <Route path="sales/transaction" element={<CardTransaction />} />
//           <Route path="sales/order-analysis" element={<OrderAnalysis />} />
//           <Route path="sales/table/analysis" element={<TableAnalysis />} />
//           <Route path="sales/meal_period/analysis" element={<MealPeriodAnalysis />} />
//           <Route path="sales/tax/collection" element={<SalesTaxCollection />} />
//           <Route path="sales/fee/collection" element={<SalesUsageFeeCollection />} />
//           <Route path="sales/tips" element={<AutoTips />} />
//           <Route path="sales/void" element={<VoidReport />} />
//           <Route path="sales/discount" element={<DiscountReport />} />
//           <Route path="sales/gift-balance" element={<GiftBalance />} />
//           <Route path="sales/gift-activity" element={<GiftActivity />} />
//           <Route path="sales/alltax" element={<AllTaxesReport />} />
//           <Route path="waste" element={<WasteReport />} />
//           <Route path="customer/detail/:pages?" element={<CustomerReport />} />
//           <Route path="customer/general" element={<GeneralReport />} />
//           <Route path="customer/other" element={<OtherReport />} />
//           <Route path="employee/staff/:pages?" element={<StaffReport />} />
//           <Route path='employee/attendance' element={<AttendanceReport />} />
//           <Route path='employee/latereport' element={<LateReport />} />
//           <Route path='employee/absent' element={<AbsentReport />} />
//           <Route path='employee/payroll' element={<PayrollReport />} />
//           <Route path='employee/specialevents' element={<SpecialEventsReport />} />
//           <Route path='employee/exportpayroll' element={<ExportPayrollReport />} />
//           <Route path='closeout/consolidatedcloseout' element={<ConsolidatedCloseout />} />
//           <Route path='closeout/terminalcloseout' element={<TerminalCloseout />} />
//           <Route path='closeout/employeecloseout' element={<EmployeeCloseout />} />


//         </Route>
//         <Route path="currency">
//           <Route index element={<Navigate to="/currency/1" />} />
//           <Route path=":pages" element={<Currency />} />
//         </Route>
//         <Route path="social-media">
//           <Route index element={<Navigate to="/social-media/1" />} />
//           <Route path=":pages" element={<SocialMedia />} />
//         </Route>
//         <Route path="plan">
//           <Route index element={<Navigate to="/plan/1" />} />
//           <Route path=":pages" element={<Plan />} />
//           <Route path="add" element={<PlanForm />} />
//           <Route path="edit/:id" element={<PlanForm />} />
//         </Route>
//         <Route path="feature-config">
//           <Route index element={<Navigate to="/feature-config/1" />} />
//           <Route path=":pages" element={<FeatureConfiguration />} />
//           <Route path="add" element={<FeatureConfigurationForm />} />
//           <Route path="edit/:id" element={<FeatureConfigurationForm />} />
//         </Route>
//         <Route path="zip_code">
//           <Route index element={<Navigate to="/zip_code/1" />} />
//           <Route path=":pages" element={<ZipCode />} />
//         </Route>
//         <Route path="security">
//           <Route index element={<Navigate to="/security/1" />} />
//           <Route path=":pages" element={<Security />} />
//         </Route>
//         <Route path="meal_periods">
//           <Route index element={<Navigate to="/meal_periods/1" />} />
//           <Route path=":pages" element={<MealPeriods />} />
//         </Route>
//         <Route path="close-outs">
//           <Route index element={<Navigate to="/close-outs/1" />} />
//           <Route path=":pages" element={<CloseOutLists />} />
//         </Route>
//         <Route path="customer_display">
//           <Route index element={<Navigate to="/customer_display/1" />} />
//           <Route path=":pages" element={<CustomerDisplay />} />
//         </Route>
//         <Route path="tax">
//           <Route index element={<Navigate to="/tax/1" />} />
//           <Route path=":pages" element={<Tax />} />
//         </Route>
//         <Route path="tender">
//           <Route index element={<Navigate to="/tender/1" />} />
//           <Route path=":pages" element={<Tender />} />
//         </Route>
//         <Route path="kitchen" element={<KitchenDisplay />} />
//         <Route path="pos-app" element={<POSMenu />} />
//         <Route path="test-api" element={<TestAPIs />} />

//         <Route path="/pricing" element={<Pricing />} />
//         <Route path="subscription">
//           <Route path="pay/:id" element={<PayDetails />} />
//           <Route path="payment" element={<PaymentCheckout />} />
//           <Route path="success" element={<PaymentSucess />} />
//           <Route path="failed" element={<PaymentFailed />} />
//         </Route>

//         <Route path="offers">
//           <Route index element={<Navigate to="/offers/1" />} />
//           <Route path=":pages" element={<OfferList />} />
//         </Route>
//       </Route>

//       <Route path="*" element={<NotFound />} />
//     </Route>
//   </Routes>
// );

// const UnauthenticatedRoutes = () => (
//   <Routes>
//     <Route element={<LandingLayout />}>
//       <Route path="/" element={<LandingPage />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/company/register" element={<CompanyRegister />} />
//       <Route path="/register" element={<AdminRegister />} />
//       <Route path="/register-success" element={<BusinessSuccess />} />
//       <Route path="/pricing" element={<Pricing />} />
//       <Route path="/contactus" element={<ContactUs />} />
//       <Route path="/terms_conditions" element={<TermsAndConditions />} />
//       <Route path="/privacy_policy" element={<PrivacyAndPolicy />} />
//       <Route path="/aboutus" element={<AboutUs />} />
//     </Route>
//     <Route path="/report/modifier/app/:pages" element={<AppModifierReport />} />
//     <Route path="/order/app/:pages" element={<AppOrder />} />
//     <Route path="/order/app/view/:id" element={<AppOrderView />} />
//     <Route path="/report/product/app/:pages" element={<AppProductReport />} />
//     <Route path="/report/modifier/app" element={<ModifierReport />} />
//     <Route path="/report/category/app/:pages" element={<AppCategoryReport />} />
//     <Route path="/report/staff/app" element={<StaffReport />} />
//     <Route path="/report/customer/app" element={<CustomerReport />} />
//     <Route path="/report/sales/order/app" element={<SalesByOrder />} />
//     <Route path="/tender/app" element={<Tender />} />
//     <Route path="setting">
//       <Route index element={<Main />} />
//     </Route>
//     <Route path="/generate-password" element={<GeneratePassword />} />
//     <Route path="/reset-password" element={<ResetPassword />} />
//     <Route element={<LandingLayout />}>
//       <Route path="subscription">
//         <Route path="pay/:id" element={<PayDetails />} />
//         <Route path="payment" element={<PaymentCheckout />} />
//         <Route path="success" element={<PaymentSucess />} />
//         <Route path="failed" element={<PaymentFailed />} />
//       </Route>
//     </Route>
//     <Route path="*" element={<Navigate to="/" />} />
//   </Routes>
// );

// function App() {
//   const { userData, setUserData } = useAuth()
//   const { configs, setConfigs } = useConfigs()
//   const { setQuickBooksData } = useQuickBooks()
//   const getConfig = useCallback(async () => {
//     try {
//       const response = await apiClient.get(`${apiUrl}/siteConfigs`);
//       const { success, data } = response.data;
//       if (success) {
//         setConfigs(data);
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   }, [setConfigs, userData])

//   // const changeFavicon = (url: any) => {
//   //   console.log("url", url)
//   //   const favicon: any = document.getElementById('favicon') as HTMLLinkElement;
//   //   if (favicon) {
//   //     favicon.href = url;
//   //   }
//   //   console.log("Fav Icon", favicon)
//   // };

//   const getQuickBooks = useCallback(async () => {
//     try {
//       const response = await apiClient.get(`${apiUrl}/connection`);
//       if (response.data?.success) {
//         setQuickBooksData(response.data?.connection);
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   }, [setQuickBooksData, userData])

//   const changeFavicon = (url: string) => {
//     let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
//     if (!link) {
//       link = document.createElement('link');
//       link.rel = 'icon';
//       document.head.appendChild(link);
//     }
//     link.href = url;
//   };

//   useEffect(() => {
//     let favicon = `${siteUrl}/pos.png`;
//     if (configs?.favicon) {
//       favicon = `${apiUrl}/${configs?.favicon}`
//       changeFavicon(favicon)
//     } else {
//       changeFavicon(favicon)
//     }
//   }, [configs])

//   useEffect(() => {
//     if (userData) {
//       getQuickBooks()
//     }
//   }, [getQuickBooks])


//   useEffect(() => {
//     if (userData) {
//       getConfig()
//     }
//   }, [getConfig]);

//   const socket = useSocket()

//   useEffect(() => {
//     if (userData?.staffMember?._id && socket) {
//       socket.emit("userLogin", userData?.staffMember?._id)
//     }
//   }, [userData?.staffMember?._id, socket]);


//   useEffect(() => {
//     const userGet = (user: any) => {
//       // console.log("socket user",user);

//       if (user?.staffMember?.isActive) {
//         setUserData((prevUserData: any) => ({
//           ...prevUserData,
//           staffMember: user?.staffMember,
//           ...(user?.token && { token: user?.token }),
//         }));
//       } else if (user?.staffMember?.isActive === false) {
//         socket.emit("userLogout", user?.staffMember?._id)
//         setUserData("")
//       }
//     }
//     socket.on("change-permission/updateStaff", userGet)
//     return () => {
//       socket.off("change-permission/updateStaff", userGet)
//     }
//   }, [socket]);

//   return (<>
//     <BrowserRouter>
//       {/* Right click menu on POS terminal */}
//       {/* <RightClickOnPOSTerminal /> */}
//        <Suspense>
//       {userData ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />}
//       </Suspense>
//     </BrowserRouter>
//     <ToastContainer />
//   </>
//   )
// }

// export default App



/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserRouter, Navigate, Route, Routes, } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
import { useCallback, useEffect } from 'react'

import Login from './components/auth/Login';
import NotFound from './components/auth/Notfound';
import Categories from './components/categories/Categories';
import CategoryForm from './components/categories/CategoryForm';
import CustomerForm from './components/customers/CustomerForm';
import Customers from './components/customers/Customers';
import Dashboard from './components/dashboard/Dashboard'
import Discounts from './components/discounts/Discounts'
import Layout from './components/layout/Layout'
import ModifierForm from './components/modifiers/ModifierForm'
import Modifiers from './components/modifiers/Modifiers'
import Orders from './components/orders/Orders'
import OrderView from './components/orders/OrderView'
import Tax from './components/others/Tax'
import Tender from './components/others/tender/Tender'
import ProductForm from './components/products/ProductForm'
import Products from './components/products/Products'
import CategoriesReport from './components/report/CategoriesReport'
import CustomerReport from './components/report/customer/CustomerReport'
import ModifierReport from './components/report/ModifierReport'
import SalesByOrder from './components/report/sales/SalesByOrder'
import Rooms from './components/rooms/Rooms'
import Main from './components/settings/Main'
import Staff from './components/staff/Staff'
import StaffForm from './components/staff/StaffForm'
import TableForm from './components/tables/TableForm'
import Tables from './components/tables/Tables'
import { useAuth } from './context/AuthProvider'
import ProtectedRoutes from './utils/ProtectedRoutes'
import OtherReport from './components/report/customer/OtherReport'
import GeneralReport from './components/report/customer/GeneralReport'
import ProductReport from './components/report/product/ProductReport'
import ProductGeneral from './components/report/product/ProductGeneral'
import SalesByCategory from './components/report/sales/SalesByCategory'
import StockJournal from './components/report/product/StockJournal'
import Reorder from './components/report/product/Reorder'
import SummaryReport from './components/report/sales/SummaryReport'
import ServerReport from './components/report/sales/ServerReport'
import CardTransaction from './components/report/sales/CardTransaction'
import OrderAnalysis from './components/report/sales/OrderAnalysis'
import TableAnalysis from './components/report/sales/TableAnalysis'
import MealPeriodAnalysis from './components/report/sales/MealPeriodAnalysis'
import SalesTaxCollection from './components/report/sales/SalesTaxCollection'
import SalesUsageFeeCollection from './components/report/sales/SalesUsageFeeCollection'
import AutoTips from './components/report/sales/AutoTips'
import VoidReport from './components/report/sales/VoidReport'
import DiscountReport from './components/report/sales/DiscountReport'
import GiftBalance from './components/report/sales/GiftBalance'
import GiftActivity from './components/report/sales/GiftActivity'
import ZipCode from './components/others/ZipCode'
import Security from './components/others/Security'
import AttendanceReport from './components/report/Employee/AttendanceReport'
import LateReport from './components/report/Employee/LateReport';
import AbsentReport from './components/report/Employee/AbsentReport';
import PayrollReport from './components/report/Employee/PayrollReport';
import SpecialEventsReport from './components/report/Employee/SpecialEventsReport';
import ExportPayrollReport from './components/report/Employee/ExportPayrollReport';
import ConsolidatedCloseout from './components/report/CloseOut/ConsolidatedCloseout';
import TerminalCloseout from './components/report/CloseOut/TerminalCloseout';
import EmployeeCloseout from './components/report/CloseOut/EmployeeCloseout';
import AdminRegister from './components/auth/AdminRegister';
import StaffReport from './components/report/Employee/StaffReport';
import ClockInOut from './components/clockinout/ClockInOut';
import Company from './components/company/Company';
import CompanyForm from './components/company/CompanyForm';
import Roles from './components/role/Roles';
import ModifierCategories from './components/modifierCategories/ModifierCategories';
import CompanyRegister from './components/auth/CompanyRegister';
import Restaurant from './components/restaurant/Restaurant';
import RestaurantForm from './components/restaurant/RestaurantForm';
import GeneratePassword from './components/auth/GeneratePassword';
import PosDevice from './components/POSDevice/PosDevice'
import BusinessSuccess from './utils/BusinessSuccess'
import SalesMatrix from './components/report/sales/SalesMatrix'
import Profile from './components/profile/Profile'
import 'react-loading-skeleton/dist/skeleton.css'
import Coupon from './components/Coupon/Coupon'
import AllTaxesReport from './components/report/sales/AllTaxesReport'
import CompanyConfigs from './components/company/Configs/CompanyConfigs'
import SiteConfigs from './components/siteConfigs/SiteConfigs'
import { apiUrl, siteUrl } from './environment/env'
import { useConfigs } from './context/SiteConfigsProvider'
import WasteReport from './components/report/sales/WasteReport'
import ConnectionList from './components/connection/ConnectionList'
import AddConnection from './components/connection/AddConnection'
import ConnectionSuccess from './components/connection/ConnectionSuccess'
import Reservations from './components/Reservation/Reservations'
import ReserveSettings from './components/Reservation/ReserveSettings'
import AvailabilityCalendar from './components/Reservation/AvailabilityCalendar'
import Packages from './components/Reservation/Packages'
import { useSocket } from './context/SocketProvider'
import ResetPassword from './components/auth/ResetPassword'
import KitchenDisplay from './components/kitchen/KitchenDisplay'
import AppProductReport from './AppWebView/AppProductReport'
import LandingPage from './components/auth/LandingPage'
import Pricing from './components/Pricing/Pricing'
import ContactUs from './components/contactUs/ContactUs'
import TermsAndConditions from './components/termsandconditions/TermsAndConditions'
import PrivacyAndPolicy from './components/privacyandpolicy/PrivacyAndPolicy'
import AboutUs from './components/aboutus/AboutUs'
import LandingLayout from './components/LandingLayout/LandingLayout'
import AppModifierReport from './AppWebView/AppModifierReport'
import AppCategoryReport from './AppWebView/AppCategoryReport'
import AppOrder from './AppWebView/AppOrder'
import AppOrderView from './AppWebView/AppOrderView'
import CustomerDisplay from './components/customerDisplay/CustomerDisplay'
import POSMenu from './components/pos-app/POSMenu'
import CloseOutLists from './components/restaurant/CloseOutLists'
import RestaurantSettings from './components/restaurant/settings/RestaurantSettings'
import Currency from './components/Currency/Currency'
import MealPeriods from './components/mealPeriods/MealPeriods'
import SocialMedia from './components/socialMedia/SocialMedia'
import Plan from './components/plans/Plan'
import PlanForm from './components/plans/PlanForm'
import TestAPIs from './components/TestAPIs'
import PayDetails from './components/SubscriptionPayment/PayDetails'
import PaymentCheckout from './components/SubscriptionPayment/PaymentCheckout'
import PaymentSucess from './components/SubscriptionPayment/PaymentSucess'
import PaymentFailed from './components/SubscriptionPayment/PaymentFailed'
import SubscriptionPage from './components/SubscriptionPayment/SubscriptionPage'
import { useQuickBooks } from './context/QuickBooksProvider'
import ConnectionSettings from './components/connection/ConnectionSettings'
import apiClient from './utils/AxiosInstance'
import FeatureConfiguration from './components/FeatureConfiguration/FeatureConfiguration'
import FeatureConfigurationForm from './components/FeatureConfiguration/FeatureConfigurationForm'
import OfferList from './components/offers/OfferList'
import RemovedOrders from './components/orders/RemovedOrders'
import OrderHistory from './components/orders/OrderHistory'
import Inventory from './components/Inventory/Inventory'
import AppAboutUs from './components/aboutus/AppAboutUS'
import AppContactUs from './components/contactUs/AppContactUs'
import AppTermsAndConditions from './components/termsandconditions/AppTermsAndConditions'
import AppPrivacyAndPolicy from './components/privacyandpolicy/AppPrivacyAndPolicy'
import OrderInvoice from './components/invoice/OrderInvoice'
import ClientsShow from './components/ourClients/ClientsShow'

const AuthenticatedRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoutes />}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="setting">
          <Route index element={<Main />} />
        </Route>
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="generate-password" element={<GeneratePassword />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/site-configs" element={<SiteConfigs />} />
        <Route path="/profile/edit/:id" element={<StaffForm />} />
        <Route path="/contactus" element={<ContactUs />} />

        <Route path="connection">
          <Route index element={<Navigate to="/connection/1" />} />
          <Route path=":pages" element={<ConnectionList />} />
          <Route path="add" element={<AddConnection />} />
          <Route path="edit/:id" element={<AddConnection />} />
          <Route path="settings/:id" element={<ConnectionSettings />} />
        </Route>
        <Route path="connection-status" element={<ConnectionSuccess />} />
        <Route path="order">
          <Route index element={<Navigate to="/order/1" />} />
          <Route path=":pages" element={<Orders />} />
          <Route path="view/:id" element={<OrderView />} />
        </Route>
        <Route path="removed-order">
          <Route index element={<Navigate to="/removed-order/1" />} />
          <Route path=":pages" element={<RemovedOrders />} />
        </Route>
        <Route path="order-history">
          <Route index element={<Navigate to="/order-history/1" />} />
          <Route path=":pages" element={<OrderHistory />} />
        </Route>
        <Route path="product">
          <Route index element={<Navigate to="/product/1" />} />
          <Route path=":pages" element={<Products />} />
          <Route path="add" element={<ProductForm />} />
          <Route path="edit/:id" element={<ProductForm />} />
        </Route>
        <Route path="category">
          <Route index element={<Navigate to="/category/1" />} />
          <Route path=":pages" element={<Categories />} />
          <Route path="add" element={<CategoryForm />} />
          <Route path="edit/:id" element={<CategoryForm />} />
        </Route>
        <Route path="modifire/category">
          <Route index element={<Navigate to="/modifire/category/1" />} />
          <Route path=":pages" element={<ModifierCategories />} />
          {/* <Route path="add" element={<ModifierCategoryForm />} />
          <Route path="edit/:id" element={<ModifierCategoryForm />} /> */}
        </Route>
        <Route path="room">
          <Route index element={<Navigate to="/room/1" />} />
          <Route path=":pages" element={<Rooms />} />
        </Route>
        <Route path="discount" >
          <Route index element={<Navigate to="/discount/1" />} />
          <Route path=":pages" element={<Discounts />} />
          {/* <Route path="add" element={<DiscountForm />} />
          <Route path="edit/:id" element={<DiscountForm />} /> */}
        </Route>
        <Route path="coupon" >
          <Route index element={<Navigate to="/coupon/1" />} />
          <Route path=":pages" element={<Coupon />} />
        </Route>
        <Route path="inventory" >
          <Route index element={<Navigate to="/inventory/1" />} />
          <Route path=":pages" element={<Inventory />} />
        </Route>
        {/* <Route path="modifier" element={<Modifiers />} /> */}
        <Route path='modifier'>
          <Route index element={<Navigate to="/modifier/1" />} />
          <Route path=":pages" element={<Modifiers />} />
          <Route path="add" element={<ModifierForm />} />
          <Route path="edit/:id" element={<ModifierForm />} />
        </Route>
        <Route path='customer'>
          <Route index element={<Navigate to="/customer/1" />} />
          <Route path=":pages" element={<Customers />} />
          <Route path="add" element={<CustomerForm />} />
          <Route path="edit/:id" element={<CustomerForm />} />
        </Route>
        <Route path="staff">
          <Route index element={<Navigate to="/staff/1" />} />
          <Route path=":pages" element={<Staff />} />
          <Route path="add" element={<StaffForm />} />
          <Route path="edit/:id" element={<StaffForm />} />
        </Route>
        <Route path="role">
          <Route index element={<Navigate to="/role/1" />} />
          <Route path=":pages" element={<Roles />} />
          <Route path="add" element={<StaffForm />} />
          <Route path="edit/:id" element={<StaffForm />} />
        </Route>
        <Route path='posdevice'>
          <Route index element={<Navigate to="/posdevice/1" />} />
          <Route path=':pages' element={<PosDevice />} />
        </Route>
        <Route path="table">
          <Route index element={<Navigate to="/table/1" />} />
          <Route path=":pages" element={<Tables />} />
          <Route path="add" element={<TableForm />} />
          <Route path="edit/:id" element={<TableForm />} />
        </Route>
        <Route path="business">
          <Route index element={<Navigate to="/business/1" />} />
          <Route path=":pages" element={<Company />} />
          <Route path="add" element={<CompanyForm />} />
          <Route path="edit/:id" element={<CompanyForm />} />
          <Route path="bussiness_configs/:id" element={<CompanyConfigs />} />

        </Route>
        <Route path="restaurant">
          <Route index element={<Navigate to="/restaurant/1" />} />
          <Route path=":pages" element={<Restaurant />} />
          <Route path="add" element={<RestaurantForm />} />
          <Route path="close-outs" element={<CloseOutLists />} />
          <Route path="edit/:id" element={<RestaurantForm />} />
          <Route path="settings/:restaurant" element={<RestaurantSettings />} />
        </Route>
        <Route path="reservation">
          {/* <Route index element={<Navigate to="1" />} /> */}
          <Route path="bookings/:pages?" element={<Reservations />} />
          <Route path="availability" element={<AvailabilityCalendar />} />
          <Route path="settings" element={<ReserveSettings />} />
          <Route path="packages/:pages?" element={<Packages />} />
        </Route>
        <Route path="punch-clock">
          <Route index element={<Navigate to="/punch-clock/1" />} />
          <Route path=":pages" element={<ClockInOut />} />
        </Route>
        <Route path="report/products/detail/:pages?" element={<ProductReport />} />
        <Route path="report/products/general" element={<ProductGeneral />} />
        <Route path='report/products/stockjournal' element={<StockJournal />} />
        <Route path='report/products/reorder' element={<Reorder />} />
        <Route path="report">
          <Route path="products/modifier/:pages?" element={<ModifierReport />} />
          <Route path="products/category/:pages?" element={<CategoriesReport />} />
          <Route path="staff/:pages?" element={<StaffReport />} />
          <Route path="sales/order" element={<SalesByOrder />} />
          <Route path="sales/category" element={<SalesByCategory />} />
          <Route path="sales/matrix" element={<SalesMatrix />} />
          <Route path="sales/summary" element={<SummaryReport />} />
          <Route path="sales/server" element={<ServerReport />} />
          <Route path="sales/transaction" element={<CardTransaction />} />
          <Route path="sales/order-analysis" element={<OrderAnalysis />} />
          <Route path="sales/table/analysis" element={<TableAnalysis />} />
          <Route path="sales/meal_period/analysis" element={<MealPeriodAnalysis />} />
          <Route path="sales/tax/collection" element={<SalesTaxCollection />} />
          <Route path="sales/fee/collection" element={<SalesUsageFeeCollection />} />
          <Route path="sales/tips" element={<AutoTips />} />
          <Route path="sales/void" element={<VoidReport />} />
          <Route path="sales/discount" element={<DiscountReport />} />
          <Route path="sales/gift-balance" element={<GiftBalance />} />
          <Route path="sales/gift-activity" element={<GiftActivity />} />
          <Route path="sales/alltax" element={<AllTaxesReport />} />
          <Route path="waste" element={<WasteReport />} />
          <Route path="customer/detail/:pages?" element={<CustomerReport />} />
          <Route path="customer/general" element={<GeneralReport />} />
          <Route path="customer/other" element={<OtherReport />} />
          <Route path="employee/staff/:pages?" element={<StaffReport />} />
          <Route path='employee/attendance' element={<AttendanceReport />} />
          <Route path='employee/latereport' element={<LateReport />} />
          <Route path='employee/absent' element={<AbsentReport />} />
          <Route path='employee/payroll' element={<PayrollReport />} />
          <Route path='employee/specialevents' element={<SpecialEventsReport />} />
          <Route path='employee/exportpayroll' element={<ExportPayrollReport />} />
          <Route path='closeout/consolidatedcloseout' element={<ConsolidatedCloseout />} />
          <Route path='closeout/terminalcloseout' element={<TerminalCloseout />} />
          <Route path='closeout/employeecloseout' element={<EmployeeCloseout />} />


        </Route>
        <Route path="currency">
          <Route index element={<Navigate to="/currency/1" />} />
          <Route path=":pages" element={<Currency />} />
        </Route>
        <Route path="social-media">
          <Route index element={<Navigate to="/social-media/1" />} />
          <Route path=":pages" element={<SocialMedia />} />
        </Route>
        <Route path="plan">
          <Route index element={<Navigate to="/plan/1" />} />
          <Route path=":pages" element={<Plan />} />
          <Route path="add" element={<PlanForm />} />
          <Route path="edit/:id" element={<PlanForm />} />
        </Route>
        <Route path="feature-config">
          <Route index element={<Navigate to="/feature-config/1" />} />
          <Route path=":pages" element={<FeatureConfiguration />} />
          <Route path="add" element={<FeatureConfigurationForm />} />
          <Route path="edit/:id" element={<FeatureConfigurationForm />} />
        </Route>
        <Route path="zip_code">
          <Route index element={<Navigate to="/zip_code/1" />} />
          <Route path=":pages" element={<ZipCode />} />
        </Route>
        <Route path="security">
          <Route index element={<Navigate to="/security/1" />} />
          <Route path=":pages" element={<Security />} />
        </Route>
        <Route path="meal_periods">
          <Route index element={<Navigate to="/meal_periods/1" />} />
          <Route path=":pages" element={<MealPeriods />} />
        </Route>
        <Route path="close-outs">
          <Route index element={<Navigate to="/close-outs/1" />} />
          <Route path=":pages" element={<CloseOutLists />} />
        </Route>
        <Route path="customer_display">
          <Route index element={<Navigate to="/customer_display/1" />} />
          <Route path=":pages" element={<CustomerDisplay />} />
        </Route>
        <Route path="tax">
          <Route index element={<Navigate to="/tax/1" />} />
          <Route path=":pages" element={<Tax />} />
        </Route>
        <Route path="tender">
          <Route index element={<Navigate to="/tender/1" />} />
          <Route path=":pages" element={<Tender />} />
        </Route>
        <Route path="kitchen" element={<KitchenDisplay />} />
        <Route path="pos-app" element={<POSMenu />} />
        <Route path="test-api" element={<TestAPIs />} />
        <Route path="/invoice/:orderId" element={<OrderInvoice />} />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="subscription">
          <Route index element={<SubscriptionPage />} />
          <Route path="pay/:id" element={<PayDetails />} />
          <Route path="payment" element={<PaymentCheckout />} />
          <Route path="success" element={<PaymentSucess />} />
          <Route path="failed" element={<PaymentFailed />} />
        </Route>

        <Route path="offers">
          <Route index element={<Navigate to="/offers/1" />} />
          <Route path=":pages" element={<OfferList />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

const UnauthenticatedRoutes = () => (
  <Routes>
    <Route element={<LandingLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/company/register" element={<CompanyRegister />} />
      <Route path="/register" element={<AdminRegister />} />
      <Route path="/register-success" element={<BusinessSuccess />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contactus" element={<ContactUs />} />
      <Route path="/terms_conditions" element={<TermsAndConditions />} />
      <Route path="/privacy_policy" element={<PrivacyAndPolicy />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path='/#' element={<ClientsShow />} />
      

    </Route>

    {/* App Routes */}
    <Route path="/app/contactus" element={<AppContactUs />} />
    <Route path="/app/aboutus" element={<AppAboutUs />} />
    <Route path="/app/privacy_policy" element={<AppPrivacyAndPolicy />} />
    <Route path="/app/terms_conditions" element={<AppTermsAndConditions />} />

    <Route path="/report/modifier/app/:pages" element={<AppModifierReport />} />
    <Route path="/order/app/:pages" element={<AppOrder />} />
    <Route path="/order/app/view/:id" element={<AppOrderView />} />
    <Route path="/report/product/app/:pages" element={<AppProductReport />} />
    <Route path="/report/modifier/app" element={<ModifierReport />} />
    <Route path="/report/category/app/:pages" element={<AppCategoryReport />} />
    <Route path="/report/staff/app" element={<StaffReport />} />
    <Route path="/report/customer/app" element={<CustomerReport />} />
    <Route path="/report/sales/order/app" element={<SalesByOrder />} />
    <Route path="/tender/app" element={<Tender />} />
    <Route path="/invoice/:orderId" element={<OrderInvoice />} />
    <Route path="setting">
      <Route index element={<Main />} />
    </Route>
    <Route path="/generate-password" element={<GeneratePassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route element={<LandingLayout />}>
      <Route path="subscription">
        <Route path="pay/:id" element={<PayDetails />} />
        <Route path="payment" element={<PaymentCheckout />} />
        <Route path="success" element={<PaymentSucess />} />
        <Route path="failed" element={<PaymentFailed />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

function App() {
  const { userData, setUserData } = useAuth()
  const { configData } = useConfigs()
  const { setQuickBooksData } = useQuickBooks()

  // const changeFavicon = (url: any) => {
  //   console.log("url", url)
  //   const favicon: any = document.getElementById('favicon') as HTMLLinkElement;
  //   if (favicon) {
  //     favicon.href = url;
  //   }
  //   console.log("Fav Icon", favicon)
  // };

  const getQuickBooks = useCallback(async () => {
    try {
      const response = await apiClient.get(`${apiUrl}/connection`);
      if (response.data?.success) {
        setQuickBooksData(response.data?.connection);
      }
    } catch (error) {
      console.log(error);
    }
  }, [setQuickBooksData, userData])

  const changeFavicon = (url: string) => {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  };

  useEffect(() => {
    let favicon = `${siteUrl}/pos.png`;
    if (configData?.favicon) {
      favicon = `${apiUrl}/${configData?.favicon}`
      changeFavicon(favicon)
    } else {
      changeFavicon(favicon)
    }
  }, [configData])

  useEffect(() => {
    if (userData) {
      getQuickBooks()
    }
  }, [getQuickBooks])


  // useEffect(() => {
  //   if (userData) {
  //     refetch()
  //   }
  // }, [refetch]);

  const socket = useSocket()

  useEffect(() => {
    if (userData?.staffMember?._id && socket) {
      socket.emit("userLogin", userData?.staffMember?._id)
    }
  }, [userData?.staffMember?._id, socket]);


  useEffect(() => {
    const userGet = (user: any) => {
      // console.log("socket user",user);

      if (user?.staffMember?.isActive) {
        setUserData((prevUserData: any) => ({
          ...prevUserData,
          staffMember: user?.staffMember,
          ...(user?.token && { token: user?.token }),
        }));
      } else if (user?.staffMember?.isActive === false) {
        socket.emit("userLogout", user?.staffMember?._id)
        setUserData("")
      }
    }
    socket.on("change-permission/updateStaff", userGet)
    return () => {
      socket.off("change-permission/updateStaff", userGet)
    }
  }, [socket]);

  return (<>
    <BrowserRouter>
      {/* Right click menu on POS terminal */}
      {/* <RightClickOnPOSTerminal /> */}

      {userData ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />}

    </BrowserRouter>
    <ToastContainer />
  </>
  )
}

export default App