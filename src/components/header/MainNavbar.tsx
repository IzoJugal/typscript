import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useScroll } from "../../hooks/useScroll";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { apiUrl } from "../../environment/env";
import { useConfigs } from "../../context/SiteConfigsProvider";

const MainNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [isOpen, setIsOpen] = useState(false);
   const { configData  } = useConfigs();
    const isScrolled = useScroll(20);
    const [darkMode, setDarkMode] = useState(false);

    let logo = `/HeaderLogo.png`;
    if (configData?.headerLogo !== "" && configData?.headerLogo !== null) {
        logo = `${apiUrl}/${configData?.headerLogo}`;
    } else {
        logo = `/HeaderLogo.png`;
    }

    const toggleMenu = () => setIsOpen((prev) => !prev);

    const handleNavigation = (path: string, options?: { state?: any }) => {
        setIsOpen(false);
        if (currentPath === path) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            navigate(path, options);
            window.scrollTo(0, 0);
        }
    };

    const handleScrollToReviews = () => {
        setIsOpen(false);
        const scrollToElement = () => {
            const section = document.getElementById("reviews");
            if (section) {
                const headerOffset = 80;
                const elementPosition = section.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        };

        if (currentPath !== "/") {
            navigate("/");
            setTimeout(scrollToElement, 100);
        } else {
            scrollToElement();
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");

        if (
            savedTheme === "dark" ||
            (!savedTheme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark");
            setDarkMode(true);
        }
    }, []);

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle("dark");

        setDarkMode(isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    };

    const navLinks = [
        { name: "Home", path: "/", onClick: () => handleNavigation("/") },
        { name: "Pricing", path: "/pricing", onClick: () => handleNavigation("/pricing", { state: { from: "price" } }) },
        { name: "Our Clients", path: "#reviews", onClick: handleScrollToReviews },
        { name: "Contact Us", path: "/contactus", onClick: () => handleNavigation("/contactus") },
    ];

    return (
        <nav
            className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${isScrolled
                ? "bg-white/80 backdrop-blur-md shadow-lg py-2"
                : "bg-white py-4 shadow-sm"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="transition-transform hover:scale-105 duration-200">
                            <img src={logo} alt="Logo" className="h-12 md:h-14 w-auto object-contain" loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/HeaderLogo.png';
                                }}
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={link.onClick}
                                className={`relative text-sm font-medium transition-colors duration-200 hover:text-BRAND-500 ${currentPath === link.path ? "text-BRAND-500" : "text-gray-600"
                                    }`}
                            >
                                {link.name}
                                {currentPath === link.path && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-BRAND-500 rounded-full"
                                    />
                                )}
                            </button>
                        ))}

                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle Theme"
                            className="rounded-full p-2 transition-all hover:bg-gray-100"
                        >
                            {darkMode ? (
                                <HiOutlineSun className="h-6 w-6 text-BRAND-500" />
                            ) : (
                                <HiOutlineMoon className="h-6 w-6 text-gray-700" />
                            )}
                        </button>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-4 ml-4">
                            <button
                                onClick={() => handleNavigation("/login")}
                                className="px-5 py-2 text-sm font-semibold text-BRAND-500 border-2 border-BRAND-500 rounded-full hover:bg-BRAND-500 hover:text-white transition-all duration-200"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => handleNavigation("/company/register")}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-BRAND-500 rounded-full hover:bg-BRAND-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                Sign Up
                                {/* Get Demo */}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-BRAND-500 hover:bg-gray-100 transition"
                        >
                            {isOpen ? (
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                        >
                            <div className="px-4 pt-2 pb-6 space-y-2">
                                {navLinks.map((link) => (
                                    <button
                                        key={link.name}
                                        onClick={link.onClick}
                                        className={`block w-full text-left px-3 py-3 text-base font-medium rounded-lg transition-colors ${currentPath === link.path
                                            ? "bg-BRAND-50 text-BRAND-500"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-BRAND-500"
                                            }`}
                                    >
                                        {link.name}
                                    </button>
                                ))}

                                <button
                                    onClick={toggleTheme}
                                    aria-label="Toggle Theme"
                                    className="rounded-full p-2 transition-all hover:bg-gray-100"
                                >
                                    {darkMode ? (
                                        <HiOutlineSun className="h-6 w-6 text-BRAND-500" />
                                    ) : (
                                        <HiOutlineMoon className="h-6 w-6 text-gray-700" />
                                    )}
                                </button>

                                <div className="pt-4 flex flex-col space-y-3 px-3">
                                    <button
                                        onClick={() => handleNavigation("/login")}
                                        className="w-full py-3 text-center text-BRAND-500 font-semibold border-2 border-BRAND-500 rounded-xl"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => handleNavigation("/company/register")}
                                        className="w-full py-3 text-center text-white bg-BRAND-500 font-semibold rounded-xl shadow-md"
                                    >
                                        Sign Up
                                        {/* Get Demo */}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default MainNavbar;
