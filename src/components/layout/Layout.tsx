import { Outlet, useLocation, useParams } from "react-router-dom"
import Header from "../header/Header"
// import NewSidebar from "../sidebar/NewSideBar";
import Sidebar from "../sidebar/Sidebar";
import { useSidebarStore } from "../../hooks/useSidebarStore";

const Layout = () => {
    const location = useLocation();
    const { id, orderId } = useParams();
    const hideSidebarRoutes = ['/order/app', `/order/app/${id}`, '/kitchen', `/subscription/pay/${id}`, '/subscription/payment', '/subscription/failed', '/subscription/success', "/generate-password", "/reset-password"];
    const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

    const hideHeaderRoutes = ['/generate-password', '/reset-password'];
    const shouldHideHeader = hideHeaderRoutes.includes(location?.pathname);

    const posRoutes = ['/pos-app', `/invoice/${orderId}`];
    const isPosRoutes = posRoutes.includes(location.pathname);

    const { isOpen: isSidebarOpen } = useSidebarStore();

    if (isPosRoutes) {
        return <Outlet />
    } else {
        const isSidebarVisible = !shouldHideSidebar || isSidebarOpen;

        return (
            <div className="flex flex-col min-h-screen bg-DARK-100 dark:bg-DARK-950">
                {!shouldHideHeader && <Header />}
                <div>
                    {/* {!shouldHideSidebar && <NewSidebar />} */}
                    {isSidebarVisible && <Sidebar />}
                    <div className={`${isSidebarVisible ? "flex-1 lmd:ml-64" : ""}`}>
                        <section className={`bg-DARK-100 dark:bg-DARK-950 py-2 antialiased md:py-4 min-h-full`}>
                            <Outlet />
                        </section>
                    </div>
                </div>
            </div>
        )
    }

}

export default Layout
