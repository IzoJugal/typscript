import { Navigate, Outlet, useLocation, } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { routePermissions } from "./common/constant";
import NotFound from "../components/auth/Notfound";
import DashboardSkeleton from "./Dashboard/DashboardSkeleton";
import { useSubscription } from "../context/SubscriptionContext";

function ProtectedRoutes() {

    const { userData } = useAuth();
    const location = useLocation();
    const { isExpired, loading } = useSubscription();

    const unrestrictedRoutes = new Set(["connection", "clock"]);
    const allowedRoutesWhenExpired = new Set(["", "business", "profile","pricing", "subscription","subscription/pay/:id","subscription/payment", "subscription/success", "subscription/cancel"]);
    if (!userData) {
        return <Navigate to="/" replace />;
    };

    const isValidRouteKey = (key: string): key is keyof typeof routePermissions => {
        return key in routePermissions;
    };

    const currentPath = location.pathname.split("/")[1];

    // Wait for subscription status to load
    if (loading) {
        return <DashboardSkeleton />;
    }

    if (isExpired && !allowedRoutesWhenExpired.has(currentPath)) {
        return <Navigate to="/subscription" replace />;
    }

    if (!unrestrictedRoutes.has(currentPath)) {
        if (isValidRouteKey(currentPath)) {
            const requiredPermission = routePermissions[currentPath];
            if (!userData?.staffMember?.permissions?.includes(requiredPermission)) {
                return <NotFound />;
            }
        }
    }

    return <Outlet />
}

export default ProtectedRoutes