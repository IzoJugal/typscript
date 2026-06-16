import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { useLoading } from "../../../context/LoadingContext";
import FormLoader from "../../../utils/common/FormLoader";
import { FormHeaderPaths } from "../../../utils/HeaderPaths";
import { Button, Tabs, ToggleSwitch } from "flowbite-react";
import { HiAdjustments, HiClipboardList, HiPencil } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import { apiUrl, siteUrl } from "../../../environment/env";
import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../../utils/AxiosInstance";
import { toast } from "react-toastify";
import { useCompanyConfigs } from "../../../context/CompanyConfigsProvider";
import { AiOutlineLoading } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { BsCardHeading } from "react-icons/bs";
import { BsFillCollectionFill } from "react-icons/bs";
import { OWNER_ADMIN_ROLES, SUPER_ADMIN } from "../../../utils/common/constant";
import { useAuth } from "../../../context/AuthProvider";
import { MdOutlineSettingsSuggest } from "react-icons/md";
import Subscriptions from "./Subscriptions";
import ActivePlan from "./ActivePlan";
import CompanyFeatureConfiguration from "./CompanyFeatureConfiguration";

interface IConfig {
  text: string;
  slogan: string;
  companyLogo: string | null;
  isLogoEnabled: boolean;
  info: string;
  fax: string | null;
  address: {
    address1: string;
    address2: string;
    state: string;
    city: string;
    zip: string;
  };
  smtpSettings: {
    host?: string;
    username?: string;
    password?: string;
    port?: string;
    isSslEnable?: boolean;
  };
  emailSetup: {
    to?: string;
    fromAddress?: string;
    fromName?: string;
    replyTo?: string;
  };
}

const customTheme = {
  base: "flex flex-col gap-2",
  tablist: {
    base: "flex border-b border-DARK-300",
    tabitem: {
      base: "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none focus:!ring-0 disabled:cursor-not-allowed disabled:text-DARK-400 disabled:dark:text-DARK-500",
      variant: {
        default: {
          base: "rounded-t-lg",
          active: {
            on: "bg-DARK-100 bg-BRAND-100 dark:!bg-BRAND-200 text-BRAND-600 dark:bg-DARK-800 dark:text-BRAND-500",
            off: "text-DARK-500 hover:bg-DARK-50 hover:text-DARK-600 dark:text-DARK-400 dark:hover:bg-DARK-800 dark:hover:text-DARK-300",
          },
        },
      },
    },
  },
  tabpanel: "py-3",
};

const CompanyConfigs = () => {
  const { userData } = useAuth();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const NoImage = `${siteUrl}/images/Image-not-found.png`;
  const [pageLoading, setPageLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const { id } = useParams();
  const [companyName, setCompanyName] = useState<string>("");  
  const navigate = useNavigate();
  const { setCompanyConfigs } = useCompanyConfigs();
  const [formData, setFormData] = useState<IConfig>({
    text: "",
    slogan: "",
    companyLogo: null,
    isLogoEnabled: false,
    info: "",
    fax: null,
    address: {
      address1: "",
      address2: "",
      state: "",
      city: "",
      zip: "",
    },
    smtpSettings: {
      host: "",
      username: "",
      password: "",
      port: "",
      isSslEnable: false,
    },
    emailSetup: {
      to: "",
      fromAddress: "",
      fromName: "",
      replyTo: "",
    },
  });
  const [selectedFile, setSelectedFile] = useState<File | any>("");

  const [isFileEdit, setIsFileEdit] = useState(false);

console.log("PATH:", location.pathname);
console.log("SEARCH:", location.search);
  const tabTitles = [
    "General",
    "SMTP Settings",
    "Email Setup",
    "Active Plan",
    "Subscriptions",
    "Feature Configuration",
  ];
  const [_activeTab, setActiveTab] = useState(0);
  const [filterParams, setFilterParams] = useState({
    page: 1,
    limit: 10,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const openedTab = searchParams.get("activeTab") || tabTitles[0];

  const shouldShowSaveConfigBtn = [
    "General",
    "SMTP Settings",
    "Email Setup",
  ].includes(openedTab);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // const hasSettingPermission = checkAccess(ModuleName.SETTINGS);
  // const hasSettingPermission = loginRole === SUPER_ADMIN;

  useEffect(() => {
    const index = tabTitles.findIndex((x: any) => x === openedTab);
    setActiveTab(index);
  }, [openedTab]);

  const companyLogo = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (formData?.companyLogo) {
      return `${apiUrl}/${formData.companyLogo}`;
    }
    return NoImage;
  }, [selectedFile, formData?.companyLogo]);

  const handlePreviousFile = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    setFormData((pre: any) => ({ ...pre, companyLogo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsFileEdit(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      address: {
        ...prevData.address,
        [name]: value,
      },
    }));
  };

  const handleSmtpSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      smtpSettings: {
        ...prevData.smtpSettings,
        [name]: value,
      },
    }));
  };

  const handleEmailSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      emailSetup: {
        ...prevData.emailSetup,
        [name]: value,
      },
    }));
  };

  const handleToggle = (checked: boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      isLogoEnabled: checked,
    }));
  };

  const handleSslToggle = (checked: boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      smtpSettings: {
        ...prevData.smtpSettings,
        isSslEnable: checked,
      },
    }));
  };

  useEffect(() => {
    const getConfig = async () => {
      setPageLoading(true);
      try {
        const response = await apiClient.get(`/configs/getByCompany/${id}`
        );
        const { success, data } = response.data;
        if (success) {
          setCompanyConfigs(data);
          setFormData(data);
          localStorage.setItem("lastCompanyLogo", data.companyLogo);
        }
      } catch (error) {
        console.error(error);
        toast.error("Network Error");
      } finally {
       setPageLoading(false)
      }
    };

     const getCompanyName = async () => {
      try {
        const response = await apiClient.get(`${apiUrl}/company/${id}`);
        const { success, company } = response.data;        
        if (success) {
          setCompanyName(company.name);
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
      }
    };

    getConfig();
    getCompanyName()
  }, [id, setPageLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBtnLoading(true);
      const formDataToSend = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        if (key === "companyLogo") continue;
        if (typeof value === "object" && value !== null) {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (typeof subValue === "string") {
              formDataToSend.append(`${key}[${subKey}]`, subValue);
            }
          }
        } else {
          if (typeof value === "string" || typeof value === "boolean") {
            formDataToSend.append(key, value.toString());
          }
        }
      }

      formDataToSend.append("companyLogo", selectedFile);

      const response = await apiClient.patch(
        `${apiUrl}/configs/updateByCompany/${id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const { success, data, message } = response.data;
      if (success) {
        setCompanyConfigs(data);
        localStorage.setItem("lastCompanyLogo", data.companyLogo);
        toast.success(message);
        navigate(-1);
      } else {
        toast.error(message);
      }
      setTimeout(() => {
        setBtnLoading(false);
      }, 1000);
    } catch (error) {
      console.log(error);
      setTimeout(() => {
        setBtnLoading(false);
      }, 1000);
      toast.error("Network Error");
    }
  };

  const initialFilterParams = {
    page: 1,
    limit: 10,
  };

  const handleTabUrl = (tabIndex: number) => {
    searchParams.set("activeTab", tabTitles[tabIndex]);
    setSearchParams(searchParams);
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setFilterParams(initialFilterParams);
    handleTabUrl(tabIndex);
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <FormHeaderPaths
          page="Business Configuration"
          prevLink="/business/1/"
          prevPage="Business"
        />
        <div className="max-full mx-auto bg-white dark:bg-DARK-800 shadow-lg rounded-2xl p-4">
          <h2 className="text-3xl font-semibold -text-center text-DARK-800 dark:text-DARK-100 mb-4">
           {companyName || "Loading..."}  {" "}•  Business Configuration
          </h2>

          {pageLoading && <FormLoader count={2} />}

          {!pageLoading && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <Tabs
                  theme={customTheme}
                  className="flex"
                  onActiveTabChange={(index: number) => {
                    handleTabChange(index);
                  }}
                >
                  <Tabs.Item
                    className="!ring-0 !outline-none focus:!ring-0 focus:!outline-none"
                    active={openedTab === tabTitles[0]}
                    title="General"
                    icon={MdDashboard}
                  >
                    <div className="space-y-6">
                      {/* <!-- Logo Upload Section --> */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="flex flex-col items-center">
                            <img
                              src={companyLogo}
                              alt="Profile Preview"
                              className="w-32 h-32 object-cover rounded-full border-2 border-DARK-300 shadow-sm  transition-opacity"
                              onError={(e) => (e.currentTarget.src = NoImage)}
                            />

                            <div className="flex">
                              {isFileEdit ? (
                                <div
                                  title="Click to switch back to your previous picture"
                                  onClick={handlePreviousFile}
                                  className="-mt-3.5 p-1  cursor-pointer bg-white text-BRAND-600 border rounded-full"
                                >
                                  <RxCross2 className="font-extrabold" />
                                </div>
                              ) : (
                                <label
                                  htmlFor="companyLogo"
                                  className="cursor-pointer"
                                >
                                  <div className="-mt-3.5 p-1 cursor-pointer bg-white text-BRAND-600 border rounded-full">
                                    <HiPencil />
                                  </div>
                                </label>
                              )}
                              <button
                                type="button"
                                title={
                                  !formData?.companyLogo
                                    ? "Picture not stored – can't delete"
                                    : "Delete picture"
                                }
                                onClick={handleDeletePhoto}
                                disabled={!formData?.companyLogo}
                                className={`-mt-3.5 p-1 border rounded-full transition
                                ${formData?.companyLogo
                                    ? "cursor-pointer bg-white text-BRAND-600 hover:bg-BRAND-50"
                                    : "cursor-not-allowed bg-BRAND-200 text-BRAND-400"
                                  }
                            `}
                              >
                                <RiDeleteBin6Line />
                              </button>
                            </div>
                          </div>
                          <input
                            type="file"
                            id="companyLogo"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                          />
                        </div>

                        {/* <!-- Toggle and Slogan --> */}
                        <div className="space-y-4">
                          {/* Enable Logo */}
                          <div className="flex items-center gap-3 -ml-3">
                            <ToggleSwitch
                              label="Enable Logo"
                              checked={formData?.isLogoEnabled}
                              onChange={handleToggle}
                              color="yellow"
                              className="flex-row-reverse text-sm gap-6 !ring-0 !outline-none"
                            />
                          </div>

                          {/* Slogan */}
                          <div>
                            <label
                              htmlFor="slogan"
                              className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                            >
                              Slogan
                            </label>
                            <input
                              type="text"
                              name="slogan"
                              value={formData?.slogan}
                              onChange={handleChange}
                              placeholder="Enter Slogan"
                              className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* <!-- Address Section --> */}
                      <div>
                        {/* <h3 className="text-lg font-semibold mb-4">Address</h3> */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* <!-- Address 1 --> */}
                          <div>
                            <label
                              htmlFor="address1"
                              className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                            >
                              Primary Address
                            </label>
                            <textarea
                              id="address1"
                              name="address1"
                              value={formData?.address?.address1 || ""}
                              onChange={(e: any) => handleAddressChange(e)}
                              placeholder="Enter primary address"
                              className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {/* <!-- Address 2 --> */}
                          <div>
                            <label
                              htmlFor="address2"
                              className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                            >
                              Secondary Address
                            </label>
                            <textarea
                              id="address2"
                              name="address2"
                              value={formData?.address?.address2 || ""}
                              onChange={(e: any) => handleAddressChange(e)}
                              placeholder="Enter secondary address"
                              className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {/* <!-- City --> */}
                          <div>
                            <label
                              htmlFor="city"
                              className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                            >
                              City
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={formData?.address?.city}
                              onChange={handleAddressChange}
                              placeholder="Enter City"
                              className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {/* <!-- State --> */}
                          <div>
                            <label
                              htmlFor="state"
                              className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                            >
                              State
                            </label>
                            <input
                              type="text"
                              id="state"
                              name="state"
                              value={formData?.address?.state}
                              onChange={handleAddressChange}
                              placeholder="Enter State"
                              className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {/* <!-- Zip --> */}
                          <div>
                            <label
                              htmlFor="zip"
                              className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                            >
                              Zip Code
                            </label>
                            <input
                              type="text"
                              id="zip"
                              name="zip"
                              autoComplete="new-password"
                              value={formData?.address?.zip}
                              onChange={handleAddressChange}
                              placeholder="Enter Zip Code"
                              className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tabs.Item>

                  <Tabs.Item
                    active={openedTab === tabTitles[1]}
                    title="SMTP Settings"
                    icon={HiAdjustments}
                  >
                    <div className="space-y-6">
                      {/* <!-- SMTP Host --> */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="host"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            Host
                          </label>
                          <input
                            type="text"
                            id="host"
                            name="host"
                            value={formData?.smtpSettings?.host || ""}
                            onChange={handleSmtpSettingsChange}
                            placeholder="Enter Host"
                            className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* <!-- Username --> */}
                        <div>
                          <label
                            htmlFor="username"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData?.smtpSettings?.username || ""}
                            onChange={handleSmtpSettingsChange}
                            placeholder="Enter Username"
                            className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* <!-- Password and Port --> */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            name="password"
                            value={formData?.smtpSettings?.password || ""}
                            onChange={handleSmtpSettingsChange}
                            placeholder="Enter Password"
                            className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="port"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            Port
                          </label>
                          <input
                            type="text"
                            id="port"
                            name="port"
                            value={formData?.smtpSettings?.port || ""}
                            onChange={handleSmtpSettingsChange}
                            placeholder="Enter Port"
                            className="w-full px-3 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* <!-- SSL Toggle --> */}
                      <div className="flex items-center justify-end">
                        <ToggleSwitch
                          label="Enable SSL"
                          checked={formData?.smtpSettings?.isSslEnable || false}
                          onChange={handleSslToggle}
                          color="yellow"
                          className="focus:!ring-0"
                        />
                      </div>
                    </div>
                  </Tabs.Item>

                  <Tabs.Item
                    active={openedTab === tabTitles[2]}
                    title="Email Setup"
                    icon={HiClipboardList}
                  >
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* To */}
                        <div>
                          <label
                            htmlFor="to"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            To
                          </label>
                          <input
                            type="email"
                            id="to"
                            name="to"
                            value={formData?.emailSetup?.to || ""}
                            onChange={handleEmailSetupChange}
                            placeholder="Enter Email To"
                            className="w-full px-4 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* From Address */}
                        <div>
                          <label
                            htmlFor="fromAddress"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            From Address
                          </label>
                          <input
                            type="email"
                            id="fromAddress"
                            name="fromAddress"
                            value={formData?.emailSetup?.fromAddress || ""}
                            onChange={handleEmailSetupChange}
                            placeholder="Enter From Address"
                            className="w-full px-4 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* From Name */}
                        <div>
                          <label
                            htmlFor="fromName"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            From Name
                          </label>
                          <input
                            type="text"
                            id="fromName"
                            name="fromName"
                            value={formData?.emailSetup?.fromName || ""}
                            onChange={handleEmailSetupChange}
                            placeholder="Enter From Name"
                            className="w-full px-4 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Reply To */}
                        <div>
                          <label
                            htmlFor="replyTo"
                            className="block text-sm font-medium text-DARK-700 dark:text-DARK-100 mb-1"
                          >
                            Reply To
                          </label>
                          <input
                            type="email"
                            id="replyTo"
                            name="replyTo"
                            value={formData?.emailSetup?.replyTo || ""}
                            onChange={handleEmailSetupChange}
                            placeholder="Enter Reply To"
                            className="w-full px-4 py-2 border border-DARK-300 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-100 dark:border-DARK-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </Tabs.Item>

                  <Tabs.Item
                    active={openedTab === tabTitles[3]}
                    title="Active Plan"
                    icon={BsCardHeading}
                  >
                      {openedTab === "Active Plan" && <ActivePlan />}
                  </Tabs.Item>

                  <Tabs.Item
                    active={openedTab === tabTitles[4]}
                    title="Subscriptions"
                    icon={BsFillCollectionFill}
                  >
                   {openedTab === "Subscriptions" && <Subscriptions
                      filterParams={filterParams}
                      setFilterParams={setFilterParams}
                    />
                    }
                  </Tabs.Item>

                  {/* Company payment types and terminal provider tabs */}

                  {/* {hasSettingPermission && (
                                        <Tabs.Item title="Payment Terminal Provider" icon={MdPayments}>
                                            <CompanyTerminalProvider />
                                        </Tabs.Item>
                                    )}
                                    {hasSettingPermission && (
                                        <Tabs.Item title="Payment Types" icon={RiSecurePaymentFill}>
                                            <CompanyPaymentTypes />
                                        </Tabs.Item>
                                    )} */}

                  {OWNER_ADMIN_ROLES.includes(loginRole) && (
                    <Tabs.Item
                      title="Feature Configuration"
                      icon={MdOutlineSettingsSuggest}
                    >
                     {openedTab === "Feature Configuration" && <CompanyFeatureConfiguration />}
                    </Tabs.Item>
                  )}
                </Tabs>
                {shouldShowSaveConfigBtn && (
                  <div className="flex justify-end mt-8">
                    {btnLoading ? (
                      <Button
                        className="w-36 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 !ring-0"
                        size="sm"
                        isProcessing
                        processingSpinner={
                          <AiOutlineLoading className="h-6 w-6 animate-spin" />
                        }
                      >
                        Saving...
                      </Button>
                    ) : (
                      <Button
                        className="w-36 py-2 !bg-BRAND-500 hover:!bg-BRAND-600 !ring-0"
                        size="sm"
                        type="submit"
                      >
                        Save Configs
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default CompanyConfigs;
