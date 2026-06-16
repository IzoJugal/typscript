
const AppTermsAndConditions = () => {
    return (
        <div className="bg-gray-100 min-h-screen flex justify-center items-center pb-10">
            <div className="w-full max-w-7xl mx-auto">
                <div className="my-10">
                    <h2 className="mb-8 font-bold text-3xl text-center">Terms & Conditions</h2>
                    <div className="lg:grid lg:grid-cols-1 gap-6 bg-white rounded-md overflow-hidden shadow-lg p-10 text-gray-700 ">

                        <div>
                            <h3 className="font-semibold text-2xl">1. License</h3>
                            <p className="text-justify">
                                POS Bucket grants you a limited, non-exclusive, non-transferable license to use our point-of-sale software ("POS Software") for your internal business operations only. You may not distribute, sublicense, or modify the software without prior written consent.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">2. Subscription & Payments</h3>
                            <p className="text-justify">
                                Your subscription fee is billed monthly or annually, depending on your selected plan. All fees are non-refundable, except as otherwise provided herein. Failure to make timely payments may result in suspension or termination of services.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">3. Updates & Support</h3>
                            <p className="text-justify">
                                POS Bucket will provide software updates and technical support during your active subscription period. Support includes troubleshooting software issues, but excludes hardware malfunctions or network problems outside our control.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">4. Data & Privacy</h3>
                            <p className="text-justify">
                                You retain ownership of all data entered into the POS system.POS Bucket will not sell, rent, or share your business data with third parties except as required by law. We implement reasonable security measures to protect your information.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">5. Hardware Responsibility</h3>
                            <p className="text-justify">
                                POS Bucket is not responsible for any hardware (printers, tablets, cash drawers) unless specifically purchased through us with a warranty agreement. Malfunctioning hardware must be addressed directly with the manufacturer unless otherwise agreed.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">6. Limitation of Liability</h3>
                            <p className="text-justify">
                                In no event will POS Bucket be liable for any indirect, incidental, special, or consequential damages arising from the use of our software or services. Our total liability is limited to the amount paid by you during the 12 months prior to the claim.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">7. Termination</h3>
                            <p className="text-justify">
                                Either party may terminate this agreement with a 30-day written notice. Upon termination, your access to the POS software will be disabled, and you must discontinue use immediately. Outstanding payments remain due even after termination.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">8. Changes to Terms</h3>
                            <p className="text-justify">
                                POS Bucket reserves the right to modify these Terms & Conditions at any time. Continued use of the software after changes have been made constitutes your acceptance of the new terms.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    )
}

export default AppTermsAndConditions
