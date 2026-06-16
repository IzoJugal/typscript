import { FaUsers } from "react-icons/fa";
import { IoDocumentText, IoFastFood } from "react-icons/io5";
import { MdOutlineImportantDevices, MdTableBar } from "react-icons/md";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css"


const CardCarousel = () => {

    const cardData = [
        {
            title: "Table & Reservation Management",
            text: "Easily manage reservations, table layouts, and guest seating with a real-time view of availability. Assign guests efficiently, reduce wait times, and optimize seating arrangements during busy hours. Whether it’s walk-ins or booked tables, ensure a smooth guest experience and streamline floor operations with intuitive tools designed for your staff.",
            icon: <MdTableBar size={56} color="#771d1d " />,
        },
        {
            title: "Split Orders & Multiple Payments",
            text: "Handle group dining with ease by splitting orders by item, seat, or amount. Accept multiple payment types in one transaction, including cash, cards, UPI, wallets, or loyalty points. This flexibility enhances customer satisfaction while ensuring fast, accurate billing and checkout-even in high-volume service environments.",
            icon: <IoFastFood size={56} color="#771d1d " />,
        },
        {
            title: "Staff Management & Permissions",
            text: "Control employee access with role-based permissions and ensure accurate shift tracking using punch-in/punch-out features. Monitor staff hours, manage schedules efficiently, and gain insights into productivity. Empower managers with the tools to streamline team operations while maintaining accountability and security throughout the system.",
            icon: <FaUsers size={56} color="#771d1d " />,
        },
        {
            title: "POS Device Management",
            text: "Manage all your POS terminals across one or multiple locations from a single dashboard. Monitor device status, assign access, and perform remote updates with ease. Ensure consistency, reduce downtime, and maintain complete control over your hardware infrastructure to deliver reliable service throughout your operations.",
            icon: <MdOutlineImportantDevices size={56} color="#771d1d " />,
        },
        {
            title: "Daily Closeouts & Reports",
            text: "Automate your end-of-day process with detailed closeouts and reporting. Seamlessly reconcile transactions, track payments and tips, and generate comprehensive performance summaries. Access actionable insights across sales, taxes, and staff activity to make informed business decisions and maintain financial accuracy with minimal effort.",
            icon: <IoDocumentText size={56} color="#771d1d " />,
        }
    ];

    const responsive = {
        superLargeDesktop: {
            breakpoint: { max: 5000, min: 1920 },
            items: 4,
        },
        largeDesktop: {
            breakpoint: { max: 1920, min: 1280 },
            items: 3,
        },
        desktop: {
            breakpoint: { max: 1280, min: 1024 },
            items: 3,
        },
        tablet: {
            breakpoint: { max: 1024, min: 640 },
            items: 2,
        },
        mobile: {
            breakpoint: { max: 640, min: 0 },
            items: 1,
        },
    };


    return (
        <div className="py-4 px-4">
            <Carousel
                responsive={responsive}
                infinite
                autoPlay={true}
                autoPlaySpeed={5000}
                keyBoardControl
                showDots={true}
                arrows={false}
                containerClass="carousel-container pb-10 overflow-visible"
                itemClass="px-3"
                dotListClass="flex justify-center  space-x-2 "
            >
                {cardData.map((card, index) => (
                    <div
                        key={index}
                        className="flex flex-col justify-between bg-BRAND-100 shadow-lg border border-gray-200 p-6 rounded-xl transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] pb-5 h-full"
                    >
                        <div className="flex justify-between items-center pb-4 border-b border-BRAND-500">
                            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-BRAND-500 to-BRAND-700">
                                {card.title}
                            </h3>
                            <div>{card.icon}</div>
                        </div>
                        <p className="mt-4 text-sm font-medium text-DARK-500 text-justify leading-relaxed">
                            {card.text}
                        </p>
                    </div>
                ))}
            </Carousel>
        </div>
    )
}

export default CardCarousel;
