import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Footer from "../footer/Footer"
import MainNavbar from "../header/MainNavbar"

const LandingLayout = () => {
    const location = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

    return (
        <div className="flex">
            <div className="flex-1 flex flex-col overflow-hidden">
                <MainNavbar />
                <main className="flex flex-col w-full bg-white pt-[88px]">
                    <div className="flex w-full mx-auto">
                        <div className="flex flex-col w-full h-full">
                            <Outlet />
                        </div>
                    </div>
                </main>
                <div className="flex flex-col w-full bg-black">
                    <Footer />
                </div>
            </div>
        </div>
    )
}

export default LandingLayout
