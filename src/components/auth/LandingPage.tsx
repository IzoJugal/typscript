/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { MdFoodBank } from "react-icons/md";
import { FaUserClock } from "react-icons/fa6";
import { CgDisplayFullwidth } from "react-icons/cg";
import { TbChartDots3 } from "react-icons/tb";
import { MdManageAccounts } from "react-icons/md";
import { TiDocumentText } from "react-icons/ti";
import { FiChevronDown } from "react-icons/fi";
import CardCarousel from "./CardCarousel";
import { motion } from "motion/react";
import MainSlider from "./MainSlider";
import { useConfigs } from "../../context/SiteConfigsProvider";
// import TestimonialsSection from "../Reviews/Testimonials";
import ClientsShow from "../ourClients/ClientsShow";

function LandingPage() {
  const navigate = useNavigate();
    const { configData } = useConfigs();

  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (user?.userData) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.log("Error : ", error);
      }
    }
  }, [navigate]);

  const features = [
    {
      icon: <MdFoodBank className="w-5 h-5 text-BRAND-500" />,
      label: "Easy order taking",
    },
    {
      icon: <MdManageAccounts className="w-5 h-5 text-BRAND-500" />,
      label: "Table & staff management",
    },
    {
      icon: <TiDocumentText className="w-5 h-5 text-BRAND-500" />,
      label: "Real-time billing",
    },
    {
      icon: <TbChartDots3 className="w-5 h-5 text-BRAND-500" />,
      label: "Intuitive interface",
    },
    {
      icon: <FaUserClock className="w-5 h-5 text-BRAND-500" />,
      label: "Punch in / Punch out",
    },
    {
      icon: <CgDisplayFullwidth className="w-5 h-5 text-BRAND-500" />,
      label: "Kitchen's View for POS",
    },
  ];

  const faqs = [
    {
      question:
        "Can POS-Bucket handle split orders and multiple payment methods?",
      answer:
        "Yes, POS-Bucket allows customers to split their orders across different bills and supports multiple payment options like cash, card, and digital wallets in a single transaction, making checkout seamless and flexible.",
    },
    {
      question:
        "How does POS-Bucket help manage products, categories, and modifiers?",
      answer:
        "POS-Bucket offers an intuitive system to organize your products by categories and subcategories. You can easily add modifiers to products—such as size or extras—and even group modifiers into modifier categories, ensuring precise and customizable orders.",
    },
    {
      question:
        "What staff management features does POS-Bucket provide, including punch-in/out and individual permissions?",
      answer:
        "POS-Bucket enables employees to punch in and out easily and allows managers to assign specific permissions to each staff member individually, giving more control over what they can do.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const Words: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
      <div className="relative group w-full overflow-hidden">
        <MainSlider />
      </div>

      <section id="features" className="py-16 px-4 text-center bg-white">
        <h3 className="text-3xl font-bold">
          Why Choose <span className="text-BRAND-500">POS Bucket?</span>
        </h3>
        <div className="mt-4 max-w-4xl mx-auto">
          <motion.p
            className="text-gray-600 text-base leading-relaxed text-justify"
            variants={Words}
            initial="hidden"
            whileInView="visible"
          >
            Our POS system is built to simplify daily operations for food
            businesses of all sizes. From managing tables and reservations to
            handling split orders and multiple payments, it enhances service
            speed and customer satisfaction. Empower your staff with role-based
            permissions and accurate shift tracking tools. Track performance
            with real-time reports and streamline daily closeouts with ease.
            Seamlessly control multiple POS devices across locations from a
            centralized dashboard. Effortlessly manage your products,
            categories, modifiers, and modifier groups for flexible menu
            customization. Experience a user-friendly, all-in-one POS solution
            designed to boost efficiency and growth.
          </motion.p>
        </div>
      </section>

      <section className="relative p-6 bg-[url('/images/card-bg.png')] bg-no-repeat bg-cover bg-center">
        <div className="absolute inset-0 bg-white opacity-60 pointer-events-none z-0" />

        <div className="relative z-10">
          <Suspense>
            <CardCarousel />
          </Suspense>
        </div>
      </section>

      <section
        className="py-16 mt-12 mb-12 relative"
        style={{
          backgroundColor: "#fff4ed",
        }}
      >
        {/* Pattern overlay with left-to-right fade-in */}
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-video-content"
          //     style={{
          //       backgroundImage: `
          //   repeating-linear-gradient(45deg, #ffe8da 0, #ffe8da 1px, transparent 1px, transparent 20px),
          //   repeating-linear-gradient(-45deg, #ffe8da 0, #ffe8da 1px, transparent 1px, transparent 20px)
          // `,
          //       WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
          //       maskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
          //     }}
        >
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/bg-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Content Layer */}
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div id="features">
            <h2 className="text-3xl font-bold text-center text-white mb-4">
              Smart Features to Power Your Business with POS Bucket
            </h2>
            <p className="text-center text-white mb-10">
              Everything you need in a single POS system—from orders to
              operations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {[
                "Split Order Functionality",
                "Table & Floor Plan",
                "Return / Void / Cancel",
                "Pay-in / Pay-out",
                "Coupons & Discounts",
                "Punch In / Punch Out",
                "Multi Payment Methods",
                "Staff Permission Management",
                "Kitchen's View",
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-orange-200/50 backdrop-sepia-0 rounded-lg shadow hover:shadow-md hover:bg-orange-400 transition p-4 text-center text-white font-medium"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-BRAND-50 to-BRAND-100 rounded-xl p-6 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-gradient-to-b from-BRAND-50 to-white p-8 rounded-3xl shadow-md">
          {/* Left: Video Player */}
          {/* <div className="relative max-w-[640px] w-full h-full max-h-[360px] mx-auto rounded-xl overflow-hidden shadow group">
            <video
              ref={videoRef}
              controls={showControls}
              className="w-full h-full object-contain bg-black rounded-xl"
              poster="/video-thumbnail.jpg"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-BRAND-500 shadow-lg hover:scale-105 transition-transform"
              >
                <FaPlay className="w-6 h-6 text-white" />
              </button>
            )}

            {isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 hidden group-hover:flex items-center justify-center rounded-full bg-BRAND-500 shadow-lg hover:scale-105 transition-transform"
              >
                <FaPause className="w-6 h-6 text-white" />
              </button>
            )}
          </div> */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[400px] rounded-2xl overflow-hidden ">
              <img
                src="/images/screen.png"
                alt="POS Demo Screen"
                loading="lazy"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Right: POS Features Description */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-BRAND-600 mb-4">
              How POS Bucket Supports Your Entire Business
            </h2>
            <p className="text-DARK-700 mb-6 leading-relaxed">
              POS Bucket is designed to streamline every aspect of your business
              - from taking orders and managing staff to real-time billing and
              kitchen coordination.
            </p>
            <ul className="space-y-3">
              {features.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="text-BRAND-500">{item.icon}</div>
                  <span className="text-DARK-800 font-medium">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            {/* <p className="text-DARK-700 mt-6 leading-relaxed">From Orders to Operations - We’ve Got Your Back</p> */}
          </div>
        </div>
      </section>

      <div className="px-3 py-16 max-w-7xl mx-auto font-sans">
        <h2 className="text-3xl md:text-4xl font-bold text-[#15333D] mb-12">
          Frequently Asked Questions
        </h2>

        <div
          className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-start ${
           configData?.playStoreUrl ||configData?.appleStoreUrl
              ? ""
              : "md:grid-cols-9"
          }`}
        >
          {/* FAQ Section - 5 columns */}
          <div
            className={`space-y-6 ${
             configData?.playStoreUrl ||configData?.appleStoreUrl
                ? "md:col-span-5"
                : "md:col-span-5"
            }`}
          >
            {faqs.map((faq, index) => (
              <div
                key={index}
                onClick={() => toggle(index)}
                className={`cursor-pointer transition-all duration-300 rounded-xl border p-6 shadow ${
                  openIndex === index
                    ? "border-BRAND-500 bg-white shadow-md"
                    : "border-gray-200 bg-white hover:shadow"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-[#15333D]">
                    {faq.question}
                  </h3>
                  <FiChevronDown
                    size={24}
                    className={`w-8 h-8 p-1 shrink-0 transition-transform duration-300 ease-in mt-1 rounded-full ${
                      openIndex === index
                        ? "rotate-180 bg-BRAND-500 text-white"
                        : "rotate-0 bg-white text-BRAND-500"
                    }`}
                  />
                </div>
                {openIndex === index && (
                  <p className="text-sm text-gray-600 mt-4 text-justify">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Image Section - 4 columns */}
          <div
            className={`flex justify-center items-center ${
             configData?.playStoreUrl ||configData?.appleStoreUrl
                ? "md:col-span-4"
                : "md:col-span-4 md:col-start-6"
            }`}
          >
            <img
              src="/images/faq.svg"
              alt="FAQ Illustration"
              loading="lazy"
              className="w-full max-w-[400px] object-contain"
            />
          </div>

          {/* Conditionally Render App Download Section */}
          {(configData?.playStoreUrl ||configData?.appleStoreUrl) && (
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#15333D] mb-2">
                  Download Our App
                </h3>
                <p className="text-sm text-gray-600">
                  Manage your POS system on the go. Download the app to
                  streamline billing, monitor sales, and manage your staff from
                  anywhere.
                </p>
              </div>

              <div className="flex flex-col gap-4 items-center">
                {configData?.playStoreUrl && (
                  <Link to={configData.playStoreUrl} target="_blank">
                    <img
                      src="/images/playStoreBlack.svg"
                      alt="Google Play"
                      className="h-[55px] w-auto object-contain"
                    />
                  </Link>
                )}
                {configData?.appleStoreUrl && (
                  <Link to={configData.appleStoreUrl} target="_blank">
                    <img
                      src="/images/appStoreBlack.svg"
                      alt="App Store"
                      className="h-[55px] w-auto object-contain"
                    />
                  </Link>
                )}
              </div>

              <p className="text-xs text-center text-gray-500">
                Available for Android & iOS
              </p>
            </div>
          )}
        </div>
      </div>

      <div id="reviews">
        {/* <TestimonialsSection  /> */}
        <ClientsShow />
      </div>
    </>
  );
}

export default LandingPage;

// main layout

{
  /* <div className="py-28 px-6 grid grid-cols-1 lg:grid-cols-10 items-center justify-center gap-20 bg-gradient-to-b from-BRAND-50 to-BRAND-100 rounded-b-[5rem]">
        <div className="lg:col-start-2 lg:col-span-4 text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-BRAND-500 font-bold">
            Powerful & Easy-to-Use POS System
          </h2>
          <p className="mt-4 text-base sm:text-lg md:text-xl whitespace-nowrap font-semibold">
            Seamless sales, order processing, and customer management{" "}
            <br className="hidden md:block" />- all in one place
          </p>

          <div className="mt-6 flex justify-center lg:justify-start">
            <Button
              onClick={() => navigate("/company/register")}
              className="px-6 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 text-white rounded-md text-sm sm:text-base md:text-lg"
            >
              Try for Free
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-center mt-10 lg:mt-0 lg:ml-16">
          <img
            src={image}
            alt="POS System"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
            loading="lazy"
          />
        </div>
      </div> */
}

// pervious cards

{
  /* <section className="p-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-6">
            <div className="bg-[#fffcf7] md:col-span-2 shadow-md border border-gray-200 p-6 rounded-lg transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">
              <div className="flex pb-2 border-b border-BRAND-500">
                <h2 className="text-xl font-bold text-BRAND-500 group-hover:text-[#E64A19] transition-colors duration-300">
                  Table & Reservation Management
                </h2>
              </div>
              <p className="mt-4 text-sm font-medium text-black transition-opacity duration-300 group-hover:opacity-90 text-justify">
                Organize tables, manage reservations, and track seating to optimize your floor operations.
              </p>
            </div>


            <div className="md:col-span-2 bg-[#fffcf7] shadow-md border border-gray-200 p-6 rounded-2xl transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">
              <h2 className="text-xl font-bold pb-2 border-b border-BRAND-500 text-[#FF5722] group-hover:text-[#E64A19] transition-colors duration-300">Split Orders & Multiple Payments</h2>
              <p className="mt-4 text-sm font-medium text-black transition-opacity duration-300 group-hover:opacity-90 text-justify">
                Effortlessly handle split bills and accept multiple payment methods per order for a smooth checkout experience.
              </p>
            </div>

            <div className="md:col-span-2 bg-[#fffcf7] shadow-md border border-gray-200 p-6 rounded-2xl transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">
              <h2 className="text-xl pb-2 border-b border-BRAND-500 font-bold text-[#FF5722] group-hover:text-[#E64A19] transition-colors duration-300">Staff Management & Permissions</h2>
              <p className="mt-4 text-sm font-medium text-black transition-opacity duration-300 group-hover:opacity-90 text-justify">
                Control staff access with role-based permissions and manage punch-in/punch-out for accurate shift tracking.
              </p>
            </div>

            <div className="hidden md:block md:col-span-1"></div>

            <div className="md:col-span-2 bg-[#fffcf7] shadow-md border border-gray-200 p-6 rounded-2xl transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">
              <h2 className="text-xl pb-2 border-b border-BRAND-500 font-bold text-[#FF5722] group-hover:text-[#E64A19] transition-colors duration-300">POS Device Management</h2>
              <p className="mt-4 text-sm font-medium text-black transition-opacity duration-300 group-hover:opacity-90 text-justify">
                Easily manage multiple POS devices across locations with centralized control and monitoring.
              </p>
            </div>

            <div className="md:col-span-2 bg-[#fffcf7] shadow-md border border-gray-200 p-6 rounded-2xl transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">
              <h2 className="text-xl pb-2 border-b border-BRAND-500 font-bold text-[#FF5722] group-hover:text-[#E64A19] transition-colors duration-300">Daily Closeouts & Reports</h2>
              <p className="mt-4 text-sm font-medium text-black transition-opacity duration-300 group-hover:opacity-90 text-justify">
                Generate detailed sales reports, monitor performance, and run daily closeouts to stay on top of your business.
              </p>
            </div>

            <div className="hidden md:block md:col-span-1"></div>
          </div>
        </div>
      </section> */
}

// Review slider

{
  /* <section className="mt-12 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-10">
          <div className="h-60 sm:h-80 xl:h-60 2xl:h-60 lg:col-start-3 lg:col-span-6 ">
            <Carousel
              slide={false}
              indicators={true}
              theme={{
                control: {
                  base: "absolute top-1/2 left-0.1  right-1 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-BRAND-500 text-white hover:bg-BRAND-700 focus:outline-none focus:ring-2 focus:ring-BRAND-300",
                  icon: "h-5 w-5 text-white",
                },
                indicators: {
                  active: {
                    off: "bg-gray-300",
                    on: "bg-BRAND-500",
                  },
                  base: "hidden sm:inline-block h-2 w-2 rounded-full mx-1",
                },
              }}
            >
              <div className="flex items-center justify-center h-full w-full">
                <div className="grid grid-cols-1 md:grid-cols-10 items-center gap-3 max-w-5xl w-full px-4">
                  <div className="md:col-span-4 flex flex-col items-center md:flex-row md:items-center gap-2 md:ml-6">
                    <div className="shrink-0">
                      <img
                        src={profilep}
                        alt="not found"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-full border-2"
                      />
                    </div>

                    <div className="text-center md:text-left leading-tight">
                      <p className="font-bold text-lg sm:text-xl">Name</p>
                      <p className="text-sm sm:text-base">Company</p>
                      <p className="text-sm sm:text-base">Ratings</p>
                    </div>
                  </div>

                  <div className="md:col-span-6 text-center md:text-left">
                    <p className="text-base sm:text-lg text-gray-700 md:px-4">
                      "This POS system streamlined our operations and improved staff efficiency. Highly recommended!"
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center h-full w-full">
                <div className="grid grid-cols-1 md:grid-cols-10 items-center gap-3 max-w-5xl w-full px-4">
                  <div className="md:col-span-4 flex flex-col items-center md:flex-row md:items-center gap-2 md:ml-6">
                    <div className="shrink-0">
                      <img
                        src={profilep}
                        alt="not found"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-full border-2"
                      />
                    </div>

                    <div className="text-center md:text-left leading-tight">
                      <p className="font-bold text-lg sm:text-xl">Name</p>
                      <p className="text-sm sm:text-base">Company</p>
                      <p className="text-sm sm:text-base">Ratings</p>
                    </div>
                  </div>

                  <div className="md:col-span-6 text-center md:text-left">
                    <p className="text-base sm:text-lg text-gray-700 md:px-4">
                      "Managing split payments and daily reports has never been easier. The system is smooth and intuitive."
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center h-full w-full">
                <div className="grid grid-cols-1 md:grid-cols-10 items-center gap-3 max-w-5xl w-full px-4">
                  <div className="md:col-span-4 flex flex-col items-center md:flex-row md:items-center gap-2 md:ml-6">
                    <div className="shrink-0">
                      <img
                        src={profilep}
                        alt="not found"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-full border-2"
                      />
                    </div>

                    <div className="text-center md:text-left leading-tight">
                      <p className="font-bold text-lg sm:text-xl">Name</p>
                      <p className="text-sm sm:text-base">Company</p>
                      <p className="text-sm sm:text-base">Ratings</p>
                    </div>
                  </div>

                  <div className="md:col-span-6 text-center md:text-left">
                    <p className="text-base sm:text-lg text-gray-700 md:px-4">
                      "The centralized POS device monitoring helps us manage our multiple branches without any hassle."
                    </p>
                  </div>
                </div>
              </div>

            </Carousel>
          </div>
        </div>
      </section> */
}
