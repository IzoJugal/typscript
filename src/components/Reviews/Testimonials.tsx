import React from "react";
import { MapPin, Star } from "lucide-react";

// Interface for the testimonial data
interface Testimonial {
  id: number;
  name: string;
  rating: number;
  image: string;
  location: string;
  text: string;
  isActive?: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "JPP Restaurant & Catering",
    rating: 5.0,
    image: "./images/jpplogo.png",
    location: "New York, USA",
    text: "Switching to this POS system was a game-changer for our restaurant. The table management and split-billing features saved us so much time during the dinner rush!",
    isActive: true,
  },
  {
    id: 2,
    name: "Locate Plate",
    rating: 5.0,
    image: "./images/locate_plate.png",
    location: "Bergen, Norway",
    text: "I love how easy it is to manage inventory and track staff hours. The real-time analytics give me full control over my business, even when I'm not at the cafe.",
  },
  {
    id: 3,
    name: "Cuisine4u",
    image: "./images/cuisine4u.png",
    rating: 5.0,
    location: "Mumbai, India",
    text: "The intuitive interface and powerful reporting features have transformed how we manage our operations. Highly recommended for any restaurant owner!",
  },
];

const TestimonialsSection: React.FC = () => {
  const getGridClass = (count: number) => {
    if (count === 1) {
      return "grid-cols-1 max-w-md mx-auto";
    } else if (count === 2) {
      return "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto";
    } else {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };
  return (
    <div className="bg-gradient-to-b from-BRAND-50 to-BRAND-100 flex items-center justify-center rounded-xl p-4 sm:p-6 lg:p-10">
      {/* Main White Content Container */}
      <div
        className="relative z-10 w-full max-w-7xl bg-gradient-to-b from-BRAND-200/20 to-white 
        rounded-3xl md:rounded-[3rem] shadow-2xl 
        px-5 py-10 sm:px-8 sm:py-12 md:px-12 md:py-20"
      >
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Our Client <span className="text-BRAND-500">Reviews</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div
          className={`grid gap-6 md:gap-8 mb-8 md:mb-12 ${getGridClass(
            testimonials.length
          )}`}
        >
          {" "}
          {testimonials.map((item) => (
            <div
              key={item.id}
              //   className={`relative p-5 md:p-6 bg-white transition-all duration-300 flex flex-col
              //     ${
              //       item.isActive
              //         ? "border border-BRAND-300 shadow-[0_10px_40px_-10px_rgba(237,124,58,0.4)] transform md:-translate-y-2"
              //         : "border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1"
              //     }
              //     rounded-tl-2xl rounded-bl-2xl rounded-br-2xl
              //     rounded-tr-3xl md:rounded-tr-[3rem]
              //   `}
              className={`relative p-5 md:p-6 bg-white transition-all duration-300 flex flex-col
              border border-BRAND-300 shadow-[0_10px_40px_-10px_rgba(237,124,58,0.4)] transform md:-translate-y-2
                hover:shadow-xl hover:-translate-y-1               
                rounded-tl-2xl rounded-bl-2xl rounded-br-2xl
                rounded-tr-3xl md:rounded-tr-[3rem]
              `}
            >
              {/* Profile & Rating Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-14 h-14 md:w-16 md:h-16 rounded-md object-cover shadow-sm"
                  />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">
                    {item.name}
                  </h3>
                  <span className="inline-flex items-center text-gray-600">
                    <MapPin className="mr-1.5 h-4 w-4 text-brand-500" />
                    <span className="text-sm font-medium">{item.location}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                {item.text}
              </p>

              {/* Footer Link */}
              {/* <div className="flex items-center justify-end mt-auto">
                <button className="group flex items-center text-sm font-bold text-gray-900 hover:text-BRAND-600 transition-colors">
                  Explore More
                  <span className="ml-2 bg-gray-900 text-white rounded-full p-1 group-hover:bg-BRAND-600 transition-colors">
                    <Play className="w-2 h-2 fill-current" />
                  </span>
                </button>
              </div> */}
            </div>
          ))}
        </div>

        {/* Bottom CTA Button */}
        {/* <div className="flex justify-center">
          <button className="px-6 py-3 md:px-8 md:py-3 text-sm md:text-base bg-BRAND-600 text-white font-semibold rounded-xl shadow-lg shadow-BRAND-200 hover:shadow-BRAND-300 hover:-translate-y-0.5 transition-all duration-200">
            View More Reviews
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default TestimonialsSection;
