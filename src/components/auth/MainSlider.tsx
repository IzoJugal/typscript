/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Carousel } from "flowbite-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { FaPlay } from "react-icons/fa6";
import { FaPause } from "react-icons/fa6";
import { useConfigs } from "../../context/SiteConfigsProvider";

const MainSlider = () => {
  const navigate = useNavigate();
    const { configData } = useConfigs();
  // const carouselRef = useRef<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const video = `/pos-video.mp4`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // const [showControls, setShowControls] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const posMan = `/images/table.jpg`;

  useEffect(() => {
    if (videoLoaded && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [videoLoaded]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      // setShowControls(true);
    } else {
      video.pause();
      setIsPlaying(false);
      // setShowControls(false);
    }
  };

  const textVariant: any = {
    hidden: { opacity: 0, y: -30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: "easeOut",
      },
    }),
  };

  return (
    <Carousel
      // ref={carouselRef}
      slideInterval={5000}
      slide={isPlaying ? false : true}
      // slide={false}
      indicators={false}
      onSlideChange={(index) => setCurrentSlide(index)}
      className="min-h-[28rem] sm:min-h-[32rem] lg:min-h-[33rem] bg-gradient-to-b from-BRAND-50 to-BRAND-100"
      theme={{
        control: {
          base: "inline-flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 items-center justify-center rounded-full bg-BRAND-500 group-hover:bg-BRAND-500 group-focus:outline-none sm:h-10 sm:w-10 dark:bg-BRAND-500 dark:group-hover:bg-BRAND-500 backdrop-blur-sm mb-[180px] md:mb-[82px]",
        },
      }}
    >
      {/* Slide 1 */}
      <div className="relative top-0 left-0 translate-x-0 translate-y-0">
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-contain ml-40 bg-left"
          style={{
            backgroundImage: `url('/images/1-2.png')`,
            maskImage: "linear-gradient(to right, black 60%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, black 60%, transparent)",
          }}
        />

        <div className="relative z-10 px-6 py-16 sm:py-20 md:py-24 mt-3 gap-5 md:mt-0 items-center lmd:items-start justify-center flex lmd:flex-row flex-col rounded-b-[1rem] !sm:rounded-b-[0rem] lmd:gap-x-16 xl:gap-x-32">
          <div className="lmd:text-left text-start">
            <AnimatePresence mode="wait">
              {currentSlide === 0 && (
                <motion.div
                  key="slide-0-wrapper"
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                >
                  <motion.h2
                    className="text-2xl sm:text-3xl md:text-4xl text-BRAND-500 font-bold leading-tight"
                    variants={textVariant}
                  >
                    Powerful & Easy-to-Use POS System
                  </motion.h2>

                  <motion.p
                    variants={textVariant}
                    className="mt-4 text-base sm:text-lg md:text-xl font-semibold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                  >
                    Seamless sales, order processing, and customer management{" "}
                    <br className="hidden md:block" /> - all in one place
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 flex lmd:justify-start justify-center">
              <Button
                onClick={() => navigate("/company/register")}
                className="px-6 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 text-white rounded-md text-sm sm:text-base md:text-lg"
              >
                Try for Free
              </Button>
            </div>
          </div>

          <div className=" flex justify-center   mt-10 lg:mt-0 lg:ml-16">
            <div className="relative max-w-[480px] w-full aspect-[627/392] mx-auto rounded-xl bg-BRAND-700/45 backdrop-blur-xl p-2 shadow group">
              {!videoLoaded ? (
                <>
                  <img
                    src="/video-thumbnail.png"
                    alt="Video thumbnail"
                    loading="lazy"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setVideoLoaded(true)}
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-BRAND-500 shadow-lg hover:scale-105 transition-transform"
                  >
                    <FaPlay className="w-6 h-6 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full object-contain bg-black rounded-xl"
                    poster="/video-thumbnail.png"
                    preload="none"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    style={{
                      maskImage: "linear-gradient(to right, black 60%, transparent)",
                      WebkitMaskImage: "linear-gradient(to right, black 60%, transparent)",
                    }}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide 2 */}
      <div className="relative top-0 left-0 translate-x-0 translate-y-0">
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-contain  bg-left"
          style={{
            backgroundImage: `url('/images/2-2.png')`,
            maskImage: "linear-gradient(to right, black 60%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, black 60%, transparent)",
          }}
        />

        <div className=" relative z-10 px-6 py-16 sm:py-20 md:py-24 mt-3 gap-5 md:mt-0 items-center lmd:items-start justify-center flex lmd:flex-row flex-col rounded-b-[1rem] !sm:rounded-b-[0rem] lmd:gap-x-16 xl:gap-x-32">
          {/* Left Content */}
          <div className="text-start lmd:text-left ">
            <AnimatePresence mode="wait">
              {currentSlide === 1 && (
                <motion.div
                  className="flex flex-col"
                  key="slide-1-wrapper"
                  initial={{ opacity: 0, y: 70 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -70 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                >
                  <motion.h2
                    variants={textVariant}
                    className="text-2xl sm:text-3xl md:text-4xl text-BRAND-500 font-bold leading-tight"
                  >
                    Let’s Talk About Your Business Goals
                  </motion.h2>

                  <motion.p
                    variants={textVariant}
                    className="mt-4 text-base sm:text-lg md:text-xl font-semibold "
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                  >
                    Reach out to explore how our POS solutions can fit your
                    needs
                    <br className="hidden md:block" />- we’re here to help.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 flex justify-center lmd:justify-start">
              <Button
                onClick={() => navigate("/contactus")}
                className="px-6 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 text-white rounded-md text-sm sm:text-base md:text-lg"
              >
                Get in Touch
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className=" flex justify-center items-center mt-10 lg:mt-0 max-w-[550px] w-full rounded-xl bg-BRAND-700/45 backdrop-blur-xl p-2">
            <img
              src="/images/kitchen.jpg"
              alt="POS System"
              className="w-full  rounded-[8px] object-contain aspect-[16/9] "
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Slide 3*/}
      <div className="relative top-0 left-0 translate-x-0 translate-y-0">
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-contain bg-left"
          style={{
            backgroundImage: `url('/images/3rd.png')`,
            // maskImage: "linear-gradient(to right, black 60%, transparent)",
            // WebkitMaskImage: "linear-gradient(to right, black 60%, transparent)"
          }}
        />
        <div className="relative z-10 px-6 py-16 sm:py-20 md:py-24 mt-3 gap-5 md:mt-0 items-center lmd:items-start justify-center flex lmd:flex-row flex-col rounded-b-[1rem] !sm:rounded-b-[0rem] lmd:gap-x-16 xl:gap-x-6">
          {/* Left Content */}
          <div className=" text-start lmd:text-left">
            <AnimatePresence mode="wait">
              {currentSlide === 2 && (
                <motion.div
                  className="flex flex-col"
                  key="slide-2-wrapper"
                  initial={{ opacity: 0, y: 70 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -70 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                >
                  <motion.h2
                    variants={textVariant}
                    className="text-2xl sm:text-3xl md:text-4xl text-BRAND-500 font-bold leading-tight"
                  >
                    POS Power, Wherever You Go
                  </motion.h2>

                  <motion.p
                    variants={textVariant}
                    className="mt-4 text-base sm:text-lg md:text-xl font-semibold lmd:max-w-[780px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                  >
                    Stay in control wherever you are. Track sales, manage
                    orders, and monitor performance
                    <br className="hidden md:block" />- all from your phone.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 flex justify-center lg:justify-start">
              {configData?.playStoreUrl ||configData?.appleStoreUrl ? (
                <div className="flex gap-3">
                  {configData?.playStoreUrl && (
                    <Link to={configData?.playStoreUrl} target="_blank">
                      <img
                        src="/images/playStoreBlack.svg"
                        alt="Google Play"
                        className="h-[45px] object-contain"
                      />
                    </Link>
                  )}
                  {configData?.appleStoreUrl && (
                    <Link to={configData?.appleStoreUrl} target="_blank">
                      <img
                        src="/images/appStoreBlack.svg"
                        alt="App Store"
                        className="h-[45px] object-contain"
                      />
                    </Link>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => {
                    const features = document.getElementById("features");
                    features?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 text-white rounded-md text-sm sm:text-base md:text-lg"
                >
                  Explore Features
                </Button>
              )}
            </div>
          </div>

          {/* Right Image */}
          <div className=" flex justify-center items-center mt-10 lg:mt-0   max-w-[550px] w-full rounded-xl bg-BRAND-700/45 backdrop-blur-xl p-2">
            <img
              src={posMan}
              alt="POS System"
              className="w-full rounded-[8px] object-contain aspect-[16/9]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </Carousel>
  );
};

export default MainSlider;

{
  /* <img
    src={image}
    alt="POS System"
    className="w-full max-w-[300px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
    loading="lazy" /> 
 */
}

{
  /* Slide 2 - Image background */
}
{
  /* <div className="relative top-0 left-0 translate-x-0 translate-y-0">
    <div
      className="px-6 py-16 sm:py-20 md:py-24 grid grid-cols-1 lg:grid-cols-10 items-center justify-center gap-10 lg:gap-20 bg-cover bg-center rounded-b-[3rem] sm:rounded-b-[5rem]"
      style={{ backgroundImage: `url(${posbackground})` }}
    >
      <div className="lg:col-start-2 lg:col-span-8 text-center bg-white/70 rounded-xl p-6 sm:p-10 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl text-BRAND-500 font-bold leading-tight">
          Flexible POS built to fit your unique business needs
        </h2>
        <p className="mt-4 text-base sm:text-lg md:text-xl font-medium">
          Handle everything from orders to customer engagement — all in one smooth flow.
        </p>
      </div>
    </div>
    </div>
*/
}
