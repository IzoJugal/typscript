import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import { apiUrl, siteUrl } from "../../environment/env";
import apiClient from "../../utils/AxiosInstance";
import FormLoader from "../../utils/common/FormLoader";
import { DetailHeaderPaths } from "../../utils/HeaderPaths";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useConfigs } from "../../context/SiteConfigsProvider";
import { RxCross2 } from "react-icons/rx";
import { HiPencil } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Button, Label } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import PhoneInput, { CountryData } from "react-phone-input-2";
import { useAuth } from "../../context/AuthProvider";

interface ISiteConfig {
    _id: string
    siteName: string;
    subTitle: string;
    siteURL: string;
    copyright: string;
    year: number;
    currency: string;
    dateFormat: string;
    metaDescription: string;
    metaKeywords: string;
    address: string;
    email: string;
    designBy: string;
    footerText: string;
    headerLogo: string;
    footerLogo: string;
    favicon: string;
    androidIcon: string;
    iosIcon: string;
    designByUrl?: string;
    playStoreUrl?: string;
    appleStoreUrl?: string;
    countryCode?: string;
    phoneNumber?: string;
}

const SiteConfigs = () => {
    const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
    const { userData } = useAuth();
    const NoImage = `${siteUrl}/images/Image-not-found.png`;
    const { setConfigData } = useConfigs();
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);

    const [formData, setFormData] = useState<ISiteConfig>({
        _id: "",
        siteName: "",
        subTitle: "",
        siteURL: "",
        copyright: "",
        year: 0,
        currency: "",
        dateFormat: "DD/MM/YYYY",
        metaDescription: "",
        metaKeywords: "",
        address: "",
        email: "",
        designBy: "",
        footerText: "",
        headerLogo: "",
        footerLogo: "",
        favicon: "",
        androidIcon: "",
        iosIcon: "",
        designByUrl: "",
        playStoreUrl: "",
        appleStoreUrl: ""
    });
    const [phoneInputData, setPhoneInputData] = useState<any>();
    const navigate = useNavigate()

    const headerLogoInputRef = useRef<HTMLInputElement>(null);
    const footerLogoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    // const androidIconInputRef = useRef<HTMLInputElement>(null);
    // const iosIconInputRef = useRef<HTMLInputElement>(null);

    const getCurrencies = useCallback(async () => {
        try {
            const response = await apiClient.get(`/currency?`);
            if (response?.data?.data) {
                setCurrencies(
                    response.data.data.filter(
                        (c: any) => c.isActive && !c.isDelete
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching currencies:", error);
        }
    }, []);

    useEffect(() => {
        getCurrencies();
    }, [getCurrencies]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const [selectedFiles, setSelectedFiles] = useState<{
        headerLogo: File | any;
        footerLogo: File | any;
        favicon: File | any;
        androidIcon: File | any;
        iosIcon: File | any;
    }>({
        headerLogo: "",
        footerLogo: "",
        favicon: "",
        androidIcon: "",
        iosIcon: "",
    });
    const [isHeaderLogoEdit, setIsHeaderLogoEdit] = useState(false)
    const [isFooterLogoEdit, setIsFooterLogoEdit] = useState(false)
    const [isFaviconEdit, setIsFaviconEdit] = useState(false)
    // const [isAndroidIconEdit, setIsAndroidIconEdit] = useState(false)
    // const [isIosIconEdit, setIsIosIconEdit] = useState(false)


    // headerLogo
    const handlePreviousHeaderLogo = () => {
        setIsHeaderLogoEdit(false);
        setSelectedFiles((pre: any) => ({ ...pre, headerLogo: null }));
        if (headerLogoInputRef.current) {
            headerLogoInputRef.current.value = ""
        }
    };

    const handleDeleteHeaderLogo = () => {
        setIsHeaderLogoEdit(false);
        setSelectedFiles((pre: any) => ({ ...pre, headerLogo: null }));
        setFormData((pre: any) => ({ ...pre, headerLogo: null }))
    }
    // footerLogo
    const handlePreviousFooterLogo = () => {
        setIsFooterLogoEdit(false);
        setSelectedFiles((pre: any) => ({ ...pre, footerLogo: null }));
        if (footerLogoInputRef.current) {
            footerLogoInputRef.current.value = ""
        }
    };

    const handleDeleteFooterLogo = () => {
        setIsFooterLogoEdit(false);
        setSelectedFiles((pre: any) => ({ ...pre, footerLogo: null }));
        setFormData((pre: any) => ({ ...pre, footerLogo: null }))
    }
    //favicon
    const handlePreviousFavicon = () => {
        setIsFaviconEdit(false);
        setSelectedFiles((pre: any) => ({ ...pre, favicon: null }));
        if (faviconInputRef.current) {
            faviconInputRef.current.value = ""
        }
    };

    const handleDeleteFavicon = () => {
        setIsFaviconEdit(false);
        setSelectedFiles((pre: any) => ({ ...pre, favicon: null }));
        setFormData((pre: any) => ({ ...pre, favicon: null }))
    }
    // androidIcon
    // const handlePreviousAndroidIcon = () => {
    //     setIsAndroidIconEdit(false);
    //     setSelectedFiles((pre: any) => ({ ...pre, androidIcon: null }));
    //     if (androidIconInputRef.current) {
    //         androidIconInputRef.current.value = ""
    //     }
    // };

    // const handleDeleteAndroidIcon = () => {
    //     setIsAndroidIconEdit(false);
    //     setSelectedFiles((pre: any) => ({ ...pre, androidIcon: null }));
    //     setFormData((pre: any) => ({ ...pre, androidIcon: null }))
    // }
    // // iosIcon
    // const handlePreviousIosIcon = () => {
    //     setIsIosIconEdit(false);
    //     setSelectedFiles((pre: any) => ({ ...pre, iosIcon: null }));
    //     if (iosIconInputRef.current) {
    //         iosIconInputRef.current.value = ""
    //     }
    // };

    // const handleDeleteIosIcon = () => {
    //     setIsIosIconEdit(false);
    //     setSelectedFiles((pre: any) => ({ ...pre, iosIcon: null }));
    //     setFormData((pre: any) => ({ ...pre, iosIcon: null }))
    // }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            setSelectedFiles((prev) => ({ ...prev, [type]: file }));
            // setFormData((prevData) => ({
            //     ...prevData,
            //     [type]: URL.createObjectURL(file),
            // }));
            if (type === "headerLogo") {
                setIsHeaderLogoEdit(true)
            }
            if (type === "footerLogo") {
                setIsFooterLogoEdit(true)
            }
            if (type === "favicon") {
                setIsFaviconEdit(true)
            }
            // if (type === "androidIcon") {
            //     setIsAndroidIconEdit(true)
            // }
            // if (type === "iosIcon") {
            //     setIsIosIconEdit(true)
            // }
        }
    };



    const headerLogo = useMemo(() => {
        if (selectedFiles?.headerLogo) {
            return URL.createObjectURL(selectedFiles?.headerLogo);
        }
        if (formData?.headerLogo) {
            return `${apiUrl}/${formData?.headerLogo}`;
        }
        return NoImage;
    }, [selectedFiles?.headerLogo, formData?.headerLogo]);


    const favicon = useMemo(() => {
        if (selectedFiles?.favicon) {
            return URL.createObjectURL(selectedFiles?.favicon);
        }
        if (formData?.favicon) {
            return `${apiUrl}/${formData?.favicon}`;
        }
        return NoImage;
    }, [selectedFiles?.favicon, formData?.favicon]);


    const footerLogo = useMemo(() => {
        if (selectedFiles?.footerLogo) {
            return URL.createObjectURL(selectedFiles?.footerLogo);
        }
        if (formData?.footerLogo) {
            return `${apiUrl}/${formData?.footerLogo}`;
        }
        return NoImage;
    }, [selectedFiles?.footerLogo, formData?.footerLogo]);

    // const androidIcon = useMemo(() => {
    //     if (selectedFiles?.androidIcon) {
    //         return URL.createObjectURL(selectedFiles?.androidIcon);
    //     }
    //     if (formData?.androidIcon) {
    //         return `${apiUrl}/${formData?.androidIcon}`;
    //     }
    //     return NoImage;
    // }, [selectedFiles?.androidIcon, formData?.androidIcon]);

    // const iosIcon = useMemo(() => {
    //     if (selectedFiles?.iosIcon) {
    //         return URL.createObjectURL(selectedFiles?.iosIcon);
    //     }
    //     if (formData?.iosIcon) {
    //         return `${apiUrl}/${formData?.iosIcon}`;
    //     }
    //     return NoImage;
    // }, [selectedFiles?.iosIcon, formData?.iosIcon]);

    const getConfig = useCallback(async () => {
        setIsLoading(false);
        try {
            const response = await apiClient.get(`${apiUrl}/siteConfigs`);
            const { success, data } = response.data;
            if (success) {
                setFormData({ ...data, currency: data.currency?.id || '', dateFormat: data.dateFormat || 'DD/MM/YYYY' });
                if (data?.phoneNumber) {
                    setPhoneInputData(`${data?.countryCode || '1'}${data.phoneNumber}`)
                }
                // Fetch company currency and set as default if not set
                if (userData?.company?._id) {
                    try {
                        const companyResponse = await apiClient.get(`/configs/getByCompany/${userData.company._id}`);
                        if (companyResponse.data?.data?.currency && !data.currency) {
                            setFormData(prev => ({ ...prev, currency: companyResponse.data.data.currency }));
                        }
                    } catch (companyError) {
                        console.error("Error fetching company currency:", companyError);
                    }
                }
                setTimeout(() => {
                    setIsLoading(false)
                    setIsConfigLoaded(true)
                }, 500);
            } else {
                setTimeout(() => {
                    setIsLoading(false)
                }, 500);
            }
        } catch (error) {
            console.log(error);
            setTimeout(() => {
                setIsLoading(false)
                setIsConfigLoaded(true)
            }, 500);
            toast.error("Network Error")
        }
    }, [setIsLoading, userData?.company?._id])

    useEffect(() => {
        getConfig()
    }, [getConfig])



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            setIsButtonLoading(true)
            for (const [key, value] of Object.entries(formData)) {
                if (key === 'companyLogo') continue;
                if (typeof value === 'object' && value !== null) {
                    for (const [subKey, subValue] of Object.entries(value)) {
                        if (typeof subValue === 'string') {
                            formDataToSend.append(`${key}[${subKey}]`, subValue);
                        }
                    }
                } else {
                    if (typeof value === 'string') {
                        formDataToSend.append(key, value);
                    }
                }
            }

            if (selectedFiles?.headerLogo) {
                formDataToSend.append('headerLogo', selectedFiles.headerLogo);
            }
            if (selectedFiles?.footerLogo) {
                formDataToSend.append('footerLogo', selectedFiles.footerLogo);
            }
            if (selectedFiles?.favicon) {
                formDataToSend.append('favicon', selectedFiles.favicon);
            }
            if (selectedFiles?.androidIcon) {
                formDataToSend.append('androidIcon', selectedFiles.androidIcon);
            }
            if (selectedFiles?.iosIcon) {
                formDataToSend.append('iosIcon', selectedFiles.iosIcon);
            }

            if (formData?._id) {
                const response = await apiClient.patch(`${apiUrl}/siteConfigs/update`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data', }
                })
                if (response.data?.success === true) {
                    toast.success(response.data?.message || "Site configuration updated successfully")
                    setConfigData(response.data?.data)
                    setFormData({ ...response.data?.data, currency: response.data?.data.currency?.id || '' })
                    setTimeout(() => {
                        setIsButtonLoading(false)
                    }, 500);
                    setIsHeaderLogoEdit(false)
                    setIsFooterLogoEdit(false)
                    setIsFaviconEdit(false)
                    // setIsAndroidIconEdit(false)
                    // setIsIosIconEdit(false)
                } else {
                    setIsButtonLoading(false)
                    toast.error(response.data?.message || "Failed to update site configuration")
                }
            }
        } catch (error) {
            setIsButtonLoading(false)
            console.log("handleSubmit Error :-", error);
            toast.error("Network Error")
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className=" flex">
                <DetailHeaderPaths label="Site Configs" />
            </div>
            <div className="">
            <div className="max-full mx-auto bg-white dark:bg-DARK-800 shadow-lg rounded-2xl sm:rounded-2xl p-8">
                <h2 className="text-3xl font-semibold text-center text-DARK-800 dark:text-DARK-100 mb-8">
                    Site Configs
                </h2>
                {isLoading && <FormLoader count={2} />}
                {!isLoading && (
                    <form onSubmit={handleSubmit} >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="siteName" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Site Name</label>
                                    <input
                                        type="text"
                                        name="siteName"
                                        value={formData?.siteName}
                                        onChange={handleChange}
                                        placeholder="Enter site name"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="subTitle" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        name="subTitle"
                                        value={formData?.subTitle}
                                        onChange={handleChange}
                                        placeholder="Enter subtitle"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="siteURL" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Site URL</label>
                                    <input
                                        type="text"
                                        name="siteURL"
                                        value={formData?.siteURL}
                                        onChange={handleChange}
                                        placeholder="Enter site url"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="copyright" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Copyright</label>
                                    <input
                                        type="text"
                                        name="copyright"
                                        value={formData.copyright}
                                        onChange={handleChange}
                                        placeholder="Enter copyright text"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Year</label>
                                    <input
                                        type="number"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        placeholder="Enter year"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    >
                                        <option value="">Select Currency</option>
                                        {currencies.map((currency) => (
                                            <option key={currency._id} value={currency._id}>
                                                {currency.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="dateFormat" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Date Format</label>
                                    <select
                                        name="dateFormat"
                                        value={formData.dateFormat}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                    </select>
                                </div>



                                {/* <div>
                                    <label htmlFor="mobile" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="Enter mobile number"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div> */}
                                <div className="flex flex-col -gap-2">
                                    <Label>Phone Number</Label>
                                    <PhoneInput
                                        inputClass="appearance-none block w-full bg-slate-100 text-DARK-700 border border-DARK-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-DARK-500 dark:bg-DARK-700 dark:text-DARK-100"
                                        buttonStyle={{ backgroundColor: "white" }}
                                        countryCodeEditable={false}
                                        enableSearch={true}
                                        // disableDropdown
                                        country={"in"}
                                        // onlyCountries={["in"]}
                                        placeholder="Enter phone number"
                                        value={phoneInputData || ""}
                                        onChange={(phone, country: CountryData) => {
                                            setPhoneInputData(phone)
                                            const phoneWithoutDialCode = phone.replace(country.dialCode || "", "")
                                            setFormData((prevFormData) => ({
                                                ...prevFormData,
                                                phoneNumber: phoneWithoutDialCode,
                                                countryCode: `+${country.dialCode}`
                                            }));
                                        }}
                                    />
                                    {/* {errors.phone && <p className="text-sm text-ERROR mt-1">{errors.phone}</p>} */}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="metaDescription" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Meta Description</label>
                                    <input
                                        type="text"
                                        id="metaDescription"
                                        name="metaDescription"
                                        value={formData.metaDescription}
                                        onChange={handleChange}
                                        placeholder="Enter meta description"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="metaKeywords" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Keywords</label>
                                    <input
                                        type="text"
                                        id="metaKeywords"
                                        name="metaKeywords"
                                        value={formData.metaKeywords}
                                        onChange={handleChange}
                                        placeholder="Enter keywords"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="designBy" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Design By</label>
                                    <input
                                        type="text"
                                        name="designBy"
                                        value={formData.designBy}
                                        onChange={handleChange}
                                        placeholder="Enter design by name"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="designByUrl" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Design By Url</label>
                                    <input
                                        type="text"
                                        name="designByUrl"
                                        value={formData.designByUrl}
                                        onChange={handleChange}
                                        placeholder="Enter design by url"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="playStoreUrl" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Google Play Store Url</label>
                                    <input
                                        type="text"
                                        name="playStoreUrl"
                                        value={formData.playStoreUrl}
                                        onChange={handleChange}
                                        placeholder="Enter google play store url"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="appleStoreUrl" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Apple Store Url</label>
                                    <input
                                        type="text"
                                        name="appleStoreUrl"
                                        value={formData.appleStoreUrl}
                                        onChange={handleChange}
                                        placeholder="Enter apple store  url"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="footerText" className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1">Footer Text</label>
                                    <input
                                        type="text"
                                        name="footerText"
                                        value={formData.footerText}
                                        onChange={handleChange}
                                        placeholder="Enter footer text"
                                        className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols- sm:grid-cols-3 md:grid-cols-3 gap-6 justify-items-center">
                                <div className="flex flex-col items-center gap-1">
                                    <img
                                        src={headerLogo}
                                        alt="Header Logo Preview"
                                        className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300"
                                        onError={(e) => (e.currentTarget.src = NoImage)}
                                    />
                                    <div className="flex">
                                        {isHeaderLogoEdit ?
                                            <div title="Click to switch back to your previous picture" onClick={handlePreviousHeaderLogo} className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                <RxCross2 className="font-extrabold" />
                                            </div> :
                                            <label htmlFor="headerLogo" className="cursor-pointer">
                                                <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                    <HiPencil />
                                                </div>
                                            </label>
                                        }
                                        <button className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                            type="button"
                                            title={
                                                !formData?.headerLogo
                                                    ? "Picture not stored – can't delete"
                                                    : "Delete picture"
                                            }
                                            onClick={handleDeleteHeaderLogo}
                                            disabled={formData?.headerLogo ? false : true}
                                        >  <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                    <label htmlFor="" className="font-semibold dark:text-DARK-100">Header Logo</label>
                                    <input
                                        type="file"
                                        id="headerLogo"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, "headerLogo")}
                                        ref={headerLogoInputRef}
                                    />
                                </div>
                                <div>
                                    <div className="flex flex-col items-center gap-1">
                                        <img
                                            src={footerLogo}
                                            alt="Logo Preview"
                                            className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300"
                                            onError={(e) => (e.currentTarget.src = NoImage)}
                                        />
                                        <div className="flex">
                                            {isFooterLogoEdit ?
                                                <div title="Click to switch back to your previous picture" onClick={handlePreviousFooterLogo} className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                    <RxCross2 className="font-extrabold" />
                                                </div> :
                                                <label htmlFor="footerLogo" className="cursor-pointer">
                                                    <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                        <HiPencil />
                                                    </div>
                                                </label>
                                            }
                                            <button className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                                type="button"
                                                title={
                                                    !formData?.footerLogo
                                                        ? "Picture not stored – can't delete"
                                                        : "Delete picture"
                                                }
                                                onClick={handleDeleteFooterLogo}
                                                disabled={formData?.footerLogo ? false : true}
                                            >  <RiDeleteBin6Line />
                                            </button>
                                        </div>
                                        <label htmlFor="" className="font-semibold dark:text-DARK-100 ">Footer Logo</label>
                                        <input
                                            type="file"
                                            id="footerLogo"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e, "footerLogo")}
                                            ref={footerLogoInputRef}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col items-center gap-1">
                                        <img
                                            src={favicon}
                                            alt="Logo Preview"
                                            className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300"
                                            onError={(e) => (e.currentTarget.src = NoImage)}
                                        />
                                        <div className="flex">
                                            {isFaviconEdit ?
                                                <div title="Click to switch back to your previous picture" onClick={handlePreviousFavicon} className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                    <RxCross2 className="font-extrabold" />
                                                </div> :
                                                <label htmlFor="fav" className="cursor-pointer">
                                                    <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                        <HiPencil />
                                                    </div>
                                                </label>
                                            }
                                            <button className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                                type="button"
                                                title={
                                                    !formData?.favicon
                                                        ? "Picture not stored – can't delete"
                                                        : "Delete picture"
                                                }
                                                onClick={handleDeleteFavicon}
                                                disabled={formData?.favicon ? false : true}
                                            >  <RiDeleteBin6Line />
                                            </button>
                                        </div>
                                        <label htmlFor="" className="font-semibold dark:text-DARK-100">Favicon</label>
                                        <input
                                            type="file"
                                            id="fav"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e, "favicon")}
                                            ref={faviconInputRef}
                                        />
                                    </div>
                                </div>
                          
                                {/* <div className="flex flex-col items-center gap-1">
                                    <img
                                        src={androidIcon}
                                        alt="Android Icon Preview"
                                        className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300"
                                        onError={(e) => (e.currentTarget.src = NoImage)}
                                    />
                                    <div className="flex">
                                        {isAndroidIconEdit ?
                                            <div title="Click to switch back to your previous picture" onClick={handlePreviousAndroidIcon} className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                <RxCross2 className="font-extrabold" />
                                            </div> :
                                            <label htmlFor="androidIcon" className="cursor-pointer">
                                                <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                    <HiPencil />
                                                </div>
                                            </label>
                                        }
                                        <button className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                            type="button"
                                            title={
                                                !formData?.androidIcon
                                                    ? "Picture not stored – can't delete"
                                                    : "Delete picture"
                                            }
                                            onClick={handleDeleteAndroidIcon}
                                            disabled={formData?.androidIcon ? false : true}
                                        >  <RiDeleteBin6Line />
                                        </button>
                                    </div>
                                    <label htmlFor="" className="font-semibold dark:text-DARK-100">Android Icon</label>
                                    <input
                                        type="file"
                                        id="androidIcon"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, "androidIcon")}
                                        ref={androidIconInputRef}
                                    />
                                </div>
                                <div>
                                    <div className="flex flex-col items-center gap-1">
                                        <img
                                            src={iosIcon}
                                            alt="iOS Icon Preview"
                                            className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300"
                                            onError={(e) => (e.currentTarget.src = NoImage)}
                                        />
                                        <div className="flex">
                                            {isIosIconEdit ?
                                                <div title="Click to switch back to your previous picture" onClick={handlePreviousIosIcon} className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                    <RxCross2 className="font-extrabold" />
                                                </div> :
                                                <label htmlFor="iosIcon" className="cursor-pointer">
                                                    <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                                        <HiPencil />
                                                    </div>
                                                </label>
                                            }
                                            <button className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                                type="button"
                                                title={
                                                    !formData?.iosIcon
                                                        ? "Picture not stored – can't delete"
                                                        : "Delete picture"
                                                }
                                                onClick={handleDeleteIosIcon}
                                                disabled={formData?.iosIcon ? false : true}
                                            >  <RiDeleteBin6Line />
                                            </button>
                                        </div>
                                        <label htmlFor="" className="font-semibold dark:text-DARK-100">iOS Icon</label>
                                        <input
                                            type="file"
                                            id="iosIcon"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e, "iosIcon")}
                                            ref={iosIconInputRef}
                                        />
                                    </div>
                                </div> */}
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-14">
                            <Button
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={!!isButtonLoading || !isConfigLoaded}
                                className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!!isButtonLoading || !isConfigLoaded}
                                className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                            >
                                <span className="relative z-10">{isButtonLoading ? 'Loading...' : 'Submit'}</span>
                                {isButtonLoading && (
                                    <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                                )}
                            </Button>
                        </div>

                    </form>
                )}
            </div>
            </div>
        </div>
    );
};

export default SiteConfigs;
