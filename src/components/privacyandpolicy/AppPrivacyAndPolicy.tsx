import { useConfigs } from "../../context/SiteConfigsProvider"

const AppPrivacyAndPolicy = () => {

    const { configData } = useConfigs();

    return (
        <div className="bg-gray-100 min-h-screen flex justify-center items-center pb-10">
            <div className="w-full max-w-7xl mx-auto">
                <div className="my-10">
                    <h2 className="mb-8 font-bold text-3xl text-center">Privacy Policy</h2>
                    <div className="lg:grid lg:grid-cols-1 gap-6 bg-white rounded-md overflow-hidden shadow-lg p-10 text-gray-700">

                        <div>
                            <h3 className="font-semibold text-2xl">1. Introduction</h3>
                            <p className="text-justify">
                                POS Bucket respects your privacy and is committed to protecting any personal information you share with us. This Privacy Policy describes how we collect, use, and safeguard your data when you use our point-of-sale (POS) software and services.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">2. Information We Collect</h3>
                            <p className="text-justify">
                                We collect personal and business information necessary to provide and improve our services. This may include your business name, contact information, billing address, transaction history, and device information.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">3. How We Use Your Information</h3>
                            <p className="text-justify">
                                We use your information to operate, maintain, and improve our POS services, process transactions, provide customer support, and send important updates. We may also use aggregated, anonymized data for analytical purposes.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">4. Sharing of Information</h3>
                            <p className="text-justify">
                                POS Bucket does not sell, trade, or rent your personal information to third parties. We may share data with trusted partners who help us operate our business, provided they agree to keep your information confidential.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">5. Data Security</h3>
                            <p className="text-justify">
                                We implement a variety of security measures to maintain the safety of your personal information. This includes encryption, secure servers, and access controls. However, no system can be guaranteed 100% secure.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">6. Your Rights</h3>
                            <p className="text-justify">
                                You have the right to access, update, or delete your personal information at any time by contacting our support team. You may also opt-out of non-essential communications.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">7. Cookies and Tracking Technologies</h3>
                            <p className="text-justify">
                                Our platform may use cookies to enhance your user experience. You can adjust your browser settings to refuse cookies, but some features of the service may not function properly.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">8. Changes to This Privacy Policy</h3>
                            <p className="text-justify">
                                POS Bucket reserves the right to update this Privacy Policy at any time. We will notify users of any material changes and post the updated policy on our website or application.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-2xl">9. Contact Us</h3>
                            <p className="text-justify">
                                If you have any questions about this Privacy Policy or our practices, please contact us at <a href={`mailto:${configData?.email}`} className="text-blue-500 underline">{configData?.email}</a>.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    )
}

export default AppPrivacyAndPolicy
