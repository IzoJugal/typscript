import tablet from "../../../public/images/tablet.jpg";

const AppAboutUs = () => {
    return (
        <div className="bg-gray-100 min-h-screen flex items-center pb-10">
            <div className="w-full max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-lg shadow-lg overflow-hidden">

                    {/* Left Side - Image */}
                    <div className="flex items-center justify-center">
                        <img
                            src={tablet}
                            alt="About Us"
                            className="object-cover w-full h-full"
                            loading="lazy"
                        />
                    </div>

                    {/* Right Side - Text */}
                    <div className="flex flex-col justify-center p-8 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-800">About POS Bucket</h2>
                        <p className="text-gray-600 text-lg leading-relaxed text-justify">
                            POS Bucket is designed to revolutionize how businesses manage their sales, inventory, and customer experiences.
                            Our mission is to deliver smart, reliable, and easy-to-use point-of-sale solutions for businesses of all sizes.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed text-justify">
                            With years of experience in the payment and technology industries, our team brings innovation and dedication to every product we build.
                            We believe in empowering businesses to thrive by providing seamless technology, world-class support, and continuous upgrades.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed text-justify">
                            Join hundreds of businesses who trust POS Bucket to streamline their operations and boost their success.
                        </p>
                    </div>

                </div>
            </div>
        </div>

    )
}

export default AppAboutUs
