
import { useEffect, useState } from "react";
import { BiUpload } from "react-icons/bi";
import { FaRegTrashAlt } from "react-icons/fa";
import { TextInputField, ToggleSwitchHospit } from "../utils/hospitalityUtils";
import axios from "axios";
import { apiUrl } from "../../../environment/env";
import { toast } from "react-toastify";
// import { RadioButtonGroup } from "../utils/General";


export const FormFields = [
    { id: 'company', label: 'Company' },
    { id: 'phone', label: 'Phone' },
    { id: 'address1', label: 'Address 1' },
    { id: 'address2', label: 'Address 2' },
    { id: 'fax', label: 'Fax' },
    { id: 'email', label: 'Email' },
    { id: 'webAddress', label: 'Web Address' },
    { id: 'state', label: 'State' },
    { id: 'city', label: 'City' },
    { id: 'zip', label: 'Zip' },
    { id: 'info', label: 'Hospitality Information' },
    { id: 'slogan', label: 'Slogan' },
    { id: 'text', label: 'Text' },
];

export const smtpFiled = [
    { id: 'host', label: 'Host', type: 'text' },
    { id: 'username', label: 'User name', type: 'text' },
    { id: 'password', label: 'Password', type: 'password' },
    { id: 'port', label: 'Port', type: 'text' },
]

export const emailAddressSetup = [
    { id: 'to', label: 'To' },
    { id: 'fromAddress', label: 'From Address' },
    { id: 'fromName', label: 'From Name' },
    { id: 'replyTo', label: 'Reply To' }
]

interface EmailAddressSetup {
    to: string,
    fromAddress: string,
    fromName: string,
    replyTo: string,
}

interface WebAddress {
    webUrl: string,
    visiting: string
}

export interface FormDataInterface {
    company?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    fax?: string;
    email?: string;
    webAddress?: string;
    state?: string;
    city?: string;
    zip?: string;
    info?: string;
    isLogoEnabled: boolean;
    slogan?: string;
    text?: string;
}

export interface SmtpSettings {
    host: string;
    username: string;
    password: string;
    port: string;
    isSslEnable: boolean;
}

const webAddressOption = [
    { value: 'AllowFixedWebpage', label: 'Allow visiting a Fixed Webpage' },
    { value: 'AllowAnyWebpage', label: 'Allow visiting any Webpage' },
    { value: 'DoNotAllow', label: 'DO not allow visiting a Webpage' },
]

function Hospitality() {
    const [isEditId, setIsEditId] = useState()
    const [formData, setFormData] = useState<FormDataInterface | any>({
        company: '',
        phone: '',
        address1: '',
        address2: '',
        fax: '',
        email: '',
        webAddress: '',
        state: '',
        city: '',
        zip: '',
        info: '',
        isLogoEnabled: false,
    });
    const notfound = '/images/Image-not-found.png';
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null | any>(notfound);
    const [existingLogoPreview, setExistingLogoPreview] = useState<string | null>(notfound);
    const [isImageSelect, setIsImageSelect] = useState(false);
    const [isImageRemoved, setIsImageRemoved] = useState(false);
    const [activeTab, setActiveTab] = useState("email");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [webAddress, setWebAddress] = useState<WebAddress>({
        webUrl: '',
        visiting: 'AllowFixedWebpage'
    })
    const [emailSetup, setEmailSetup] = useState<EmailAddressSetup>({
        to: '',
        fromAddress: '',
        fromName: '',
        replyTo: '',
    })
    const [smtpSettings, setSmtpSettings] = useState<SmtpSettings | any>({
        host: '',
        username: '',
        password: '',
        port: '',
        isSslEnable: false,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        if (id === "phone") {
            if (!/^\d*$/.test(value)) {
                return;
            }
        }

        if (id === "fax") {
            if (!/^[a-zA-Z0-9+\-() ]*$/.test(value)) {
                return;
            }
        }

        if (id === "zip") {
            if (!/^\d*$/.test(value) || value.length > 6) {
                return;
            }
        }

        setFormData((prev: FormDataInterface) => ({
            ...prev,
            [id]: value
        }));

        setErrors((prev) => {
            const updatedErrors = { ...prev };

            if (value.trim()) {
                delete updatedErrors[id];
            }

            // Email validation
            if (id === "email") {
                if (
                    value.trim() &&
                    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
                ) {
                    updatedErrors.email = "Invalid email address";
                } else {
                    delete updatedErrors.email;
                }
            }

            // ZIP validation
            if (id === "zip") {
                if (value.trim() && !/^\d{6}$/.test(value)) {
                    updatedErrors.zip = "Zip code must be 6 digits";
                } else {
                    delete updatedErrors.zip;
                }
            }

            return updatedErrors;
        });
    };

    const handleSwitchChangeLogo = () => {
        setFormData((prevData: any) => ({
            ...prevData,
            isLogoEnabled: !prevData.isLogoEnabled,
        }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImageSelect(true);
            setLogo(file);
            setIsImageRemoved(false); // Reset the removed status when a new image is selected
            const reader = new FileReader();
            reader.onload = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleLogoClick = () => {
        const logoInput = document.getElementById('logo-input');
        if (logoInput) {
            logoInput.click();
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(existingLogoPreview);
        setIsImageSelect(false);
        setIsImageRemoved(true);
    };

    const handleSwitchChangeSSL = () => {
        setSmtpSettings((prevSettings: any) => ({
            ...prevSettings,
            isSslEnable: !prevSettings.isSslEnable,
        }));
    };

    const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSmtpSettings({
            ...smtpSettings,
            [e.target.id]: e.target.value
        });
    };

    const handleEmailSetup = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailSetup({
            ...emailSetup,
            [e.target.id]: e.target.value
        });
    };

    const handleWebAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setWebAddress((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.company?.trim()) {
            newErrors.company = "Company is required";
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = "Phone is required";
        }

        if (!formData.address1?.trim()) {
            newErrors.address1 = "Address 1 is required";
        }

        if (!formData.email?.trim()) {
            newErrors.email = "Email is required";
        } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
        ) {
            newErrors.email = "Invalid email address";
        }

        if (!formData.fax?.trim()) {
            newErrors.fax = "Fax is required";
        }

        if (!formData.state?.trim()) {
            newErrors.state = "State is required";
        }

        if (!formData.city?.trim()) {
            newErrors.city = "City is required";
        }

        if (!formData.zip?.trim()) {
            newErrors.zip = "Zip is required";
        } else if (!/^\d{6}$/.test(formData.zip)) {
            newErrors.zip = "Zip code must be 6 digits";
        }

        if (!formData?.slogan?.trim()) {
            newErrors.slogan = "Slogan is required";
        }

        setErrors(newErrors);

        // Focus first invalid field
        const firstErrorField = Object.keys(newErrors)[0];

        if (firstErrorField) {
            const field = document.getElementById(firstErrorField);
            field?.focus();
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const payload = {
            formData,
            smtpSettings,
            emailSetup,
            webAddress,
        };

        const formDataPayload = new FormData();
        formDataPayload.append('payload', JSON.stringify(payload));

        // Append logo if present and not removed
        if (logo && !isImageRemoved) {
            formDataPayload.append('logo', logo);
        }

        try {
            let response;
            if (isEditId) {
                response = await axios.patch(`${apiUrl}/setting/hospitality/${isEditId}`, formDataPayload, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                response = await axios.post(`${apiUrl}/setting/add/hospitality`, formDataPayload, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            setIsImageSelect(false);
            setIsImageRemoved(false);
            if (response.status === 200) {
                console.log('Settings saved successfully:', response.data.message);
                toast.success(response.data.message);
            }

        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(`Failed to save data: ${error.response.data.message}`);
            } else {
                console.error('Unexpected error:', error);
                toast.error('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const handleTabChange = (tab: any) => {
        setActiveTab(tab);
    };

    const getHospitalityInfo = async () => {
        try {
            const response = await axios.get(`${apiUrl}/setting/companyInfo`)
            setFormData(response.data.data[0].formData)
            setEmailSetup(response.data.data[0].emailSetup)
            setSmtpSettings(response.data.data[0].smtpSettings)
            setWebAddress(response.data.data[0].webAddress)
            setLogo(response.data.data[0].companyLogo)
            const logo = response.data.data[0].companyLogo ? `${apiUrl}/${response.data.data[0].companyLogo}` : notfound
            setLogoPreview(logo)
            setExistingLogoPreview(logo)
            setIsEditId(response.data.data[0]?._id)

        } catch (error) {
            console.log("~ error :-", error);
        }
    }

    useEffect(() => {
        getHospitalityInfo()
    }, [])


    return (<>
        <div className='grid grid-cols-2 gap-4'>
            <div className="space-y-4">
                <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                    <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Hospitality Information</h3>
                    {FormFields.map((field: any) => (
                        <div key={field.id}>
                            <TextInputField
                                id={field.id}
                                name={field.id}
                                label={field.label}
                                value={formData[field.id as keyof FormDataInterface] ?? ''}
                                onChange={handleInputChange}
                                className={errors[field.id] ? "border border-red-500" : ""}
                            />

                            {errors[field.id] && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors[field.id]}
                                </p>
                            )}
                        </div>
                    ))}
                    <div className="flex flex-col space-x-4">
                        <div>
                            <ToggleSwitchHospit
                                isChecked={formData.isLogoEnabled}
                                onChange={handleSwitchChangeLogo}
                                label="Display Web page / Logo"
                                labelText={formData.isLogoEnabled ? "Update Logo" : "Update Web page"}
                            />
                        </div>
                        {formData.isLogoEnabled ? (
                            <div className="mt-2 flex items-center gap-4">
                                <div
                                    aria-hidden="true"
                                    className="w-28 h-28 bg-[#2E5783] rounded flex items-center justify-center"
                                >
                                    <img
                                        src={logoPreview}
                                        alt="Logo Preview"
                                        className="w-full h-full object-cover rounded"
                                        onError={(e) => { e.currentTarget.src = notfound }}
                                    />
                                </div>
                                <div className="flex items-start">
                                    <input
                                        type="file"
                                        id="logo-input"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        disabled={!formData.isLogoEnabled}
                                    />
                                    <div className="flex flex-col gap-2">
                                        {isImageSelect && (
                                            <button
                                                type="button"
                                                className="bg-red-500 text-white py-2 px-3 rounded flex items-center justify-center"
                                                onClick={handleRemoveLogo}
                                                disabled={!formData.isLogoEnabled}
                                            >
                                                <FaRegTrashAlt />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleLogoClick}
                                            className="bg-[#cb8bff] text-white py-2 px-3 rounded flex items-center justify-center"
                                            disabled={!formData.isLogoEnabled}
                                        >
                                            <BiUpload />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : <>
                            <div className="flex-1 mt-2 items-center">
                                <label htmlFor="webUrl" className="block text-white">Webpage</label>
                                <input
                                    type="url"
                                    className="bg-[#2E5783] border-0 w-full text-white"
                                    name="webUrl"
                                    onChange={handleWebAddress}
                                />
                            </div>
                            <div>
                                {webAddressOption.map((option) => {
                                    return <label key={option.value} className="flex items-center w-54 py-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="visiting"
                                            value={option.value}
                                            className="mr-2 cursor-pointer"
                                            checked={webAddress?.visiting === option.value}
                                            onChange={handleWebAddress}
                                        />
                                        <span className="text-sm text-white">{option.label}</span>
                                    </label>
                                })}
                            </div>
                        </>}
                    </div>
                </div>
            </div>
            <div className='lg:h-[500px] h-[48vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e57832d] scrollbar-track-[#2A3769]'>
                <h3 className="text-xl font-semibold text-[#46a92a] mb-4">SMTP Confirmation for sending Reports</h3>
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => handleTabChange("email")}
                        className={`px-4 py-2 rounded ${activeTab === "email" ? "bg-[#46a92a] text-white" : "bg-DARK-200 text-black"}`}
                    >
                        Email Address Setup
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("smtp")}
                        className={`px-4 py-2 rounded ${activeTab === "smtp" ? "bg-[#46a92a] text-white" : "bg-DARK-200 text-black"}`}
                    >
                        SMTP Setup
                    </button>
                </div>
                {activeTab === "email" ?
                    <div>
                        {smtpFiled.map((field) => (
                            <TextInputField
                                key={field.id}
                                id={field.id}
                                name={field.id}
                                label={field.label}
                                type={field.type === 'password' ? 'password' : 'text'}
                                value={smtpSettings[field.id as keyof SmtpSettings]}
                                onChange={handleSmtpChange}
                            />
                        ))}

                        <div className="flex-1">
                            <div className='flex mt-3 gap-4'>
                                <ToggleSwitchHospit
                                    isChecked={smtpSettings.isSslEnable}
                                    onChange={handleSwitchChangeSSL}
                                    label="Enable SSL"
                                />
                            </div>
                        </div>
                    </div>
                    :
                    <div>
                        <h3 className="text-xl font-semibold text-[#46a92a] mb-4">Email Address Setup</h3>
                        {emailAddressSetup.map((field) => (
                            <TextInputField
                                key={field.id}
                                id={field.id}
                                name={field.id}
                                label={field.label}
                                value={emailSetup[field.id as keyof EmailAddressSetup]}
                                onChange={handleEmailSetup}
                            />
                        ))}
                    </div>
                }

            </div>
        </div>
        <div className="text-whit text-center" >
            <button type="submit" onClick={handleSubmit} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">Submit</button>
        </div>
    </>
    )
}

export default Hospitality