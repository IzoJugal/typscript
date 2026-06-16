/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { useAuth } from "../../context/AuthProvider";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import FormLoader from "../../utils/common/FormLoader";
import { Button, Label, } from "flowbite-react";
import { CompanyField, RestaurantField } from "../../utils/functions";
import { OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { HiEye, HiEyeOff } from "react-icons/hi";
import CryptoJS from "crypto-js";
import { SECRET_PASSPHRASE_QUICKBOOKS } from "../../environment/env";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { connectionPlatForm } from "../../utils/utility";

interface IConnection {
  _id: string;
  name: string;
  clientId: string;
  platForm: string;
  clientSecret: string;
  addedBy: string
  company: string;
  restaurant: string;
  realmId: string;
  apiEndPoint: string;
  isActive: boolean
  isProduction: boolean
}

const AddConnection = () => {
  const { id } = useParams();
  const { userData } = useAuth();
  const allowedRoles = ["Owner/ Admin", "Owner/Admin", "Owner", "Manager", "Super Admin"];
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;

  const navigate = useNavigate();
  const [formData, setFormData] = useState<IConnection>({
    _id: "",
    name: "",
    realmId: "",
    clientId: "",
    platForm: "",
    apiEndPoint: "",
    isActive: true,
    isProduction: false,
    addedBy: userData?.staffMember?._id,
    clientSecret: "",
    company: loginRole !== SUPER_ADMIN ? `${userData?.staffMember?.company?._id}` : "",
    restaurant: !allowedRoles.includes(loginRole) ? `${userData?.staffMember?.restaurant?._id}` : "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading } = useLoading();
  const [companies, setCompanies] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [showPin, setShowPin] = useState({
    clientId: false,
    clientSecret: false
  });



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "company") {
      if (value === "") {
        setRestaurants([]);
      } else {
        getRestaurants(value);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));


    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const isValid = (): boolean => {
    const errorMsg: Record<string, string> = {};
    let isValid = true;

    if (!formData?.name) {
      errorMsg.name = "Please enter a name.";
      isValid = false;
    }
    if (!formData?.clientId) {
      errorMsg.clientId = "Please enter a client id.";
      isValid = false;
    }
    if (!formData?.clientSecret) {
      errorMsg.clientSecret = "Please enter a client secret.";
      isValid = false;
    }
    if (!formData?.platForm) {
      errorMsg.platForm = "Please select a platform.";
      isValid = false;
    }
    if (!formData?.apiEndPoint) {
      errorMsg.apiEndPoint = "Please enter api end point.";
      isValid = false;
    }
    if (!formData?.restaurant) {
      errorMsg.restaurant = "Please select a restaurant.";
      isValid = false;
    }
    if (loginRole === SUPER_ADMIN) {
      if (!formData?.company) {
        errorMsg.company = "Please select a business.";
        isValid = false;
      }
    }



    setErrors(errorMsg);
    return isValid;
  };

  const getConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/connection/${id}`);
      const connection = response.data?.connection ?? {};
      const { clientId, clientSecret, ...rest } = connection;

      const decryptedClientId = CryptoJS.AES.decrypt(clientId, SECRET_PASSPHRASE_QUICKBOOKS)
        .toString(CryptoJS.enc.Utf8);

      const decryptedClientSecret = CryptoJS.AES.decrypt(clientSecret, SECRET_PASSPHRASE_QUICKBOOKS)
        .toString(CryptoJS.enc.Utf8);

      setFormData((prev) => ({
        ...prev,
        ...rest,
        clientId: decryptedClientId,
        clientSecret: decryptedClientSecret,
      }));

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("~ getConnection error:", error);
    }
  }, [setIsLoading, id]);


  const getCompanies = async () => {
    try {
      const response = await apiClient.get("/business");
      setCompanies(response.data.companies || []);
    } catch (error: any) {
      console.error("Error fetching companies:", error.message);
    }
  };

  const getRestaurants = async (companyId: string) => {
    try {
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      setRestaurants(response.data.restaurant || []);
    } catch (error: any) {
      console.error("Error fetching restaurants:", error.message);
    }
  };

  useEffect(() => {
    if (id) {
      getConnection();
    }
    if (loginRole === SUPER_ADMIN) {
      getCompanies();
    }
    if (loginRole !== SUPER_ADMIN) {
      getRestaurants(userData?.staffMember?.company?._id);
    }
  }, [id, getConnection, loginRole]);

  useEffect(() => {
    if (id && loginRole === SUPER_ADMIN) {
      if (formData?.company) {
        getRestaurants(formData?.company);
      }
    }
  }, [formData?.company]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValid()) return;

    try {

      if (formData?.platForm === "quickbook") {
        formData.clientId = CryptoJS.AES.encrypt(formData.clientId, SECRET_PASSPHRASE_QUICKBOOKS).toString()
        formData.clientSecret = CryptoJS.AES.encrypt(formData.clientSecret, SECRET_PASSPHRASE_QUICKBOOKS).toString()
        setIsButtonLoading(true);
        if (id) {
          const response = await apiClient.patch(`/connection/${formData?._id}`, formData)
          if (response.data?.success) {
            if (response.data.redirectUrl) {
              window.location.href = response.data.redirectUrl
            } else {
              navigate(-1)
              toast.success(response.data?.message)
            }

          } else {
            toast.error(response.data?.message)
          }
        } else {
          const response = await apiClient.post(`/connection/add`, formData)
          if (response?.data?.success) {
            if (response.data.redirectUrl) {
              window.location.href = response.data.redirectUrl
            }
          } else {
            toast.error(response.data?.message)
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred.");
      console.error("Error during form submission:", error);
    } finally {
      setIsButtonLoading(false);
    }
  };

  const handlePlatForm = (value: any) => {
    setFormData((prev) => ({ ...prev, platForm: value }))
    setErrors((prev) => ({
      ...prev,
      platForm: "",
    }));
  }

  return (
    <>
      <FormHeaderPaths page={id ? "Edit Connection" : "Connection Form"} prevLink="/connection/1" prevPage="Connection" />
      <div className="relative max-w-2xl mx-auto p-4 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
        <div className="mb-6 space-x-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold dark:text-DARK-100  flex justify-center">
            Connection Form
          </h1>
          {formData?.realmId && <span className="text-xs text-end bg-BRAND-500 text-white rounded p-1">
            QuickBook Connected
          </span>}
        </div>
        {isLoading && <FormLoader count={1} />}
        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid  ${loginRole === 'Owner/Admin' ? "" : "grid-cols-1 md:grid-cols-2"}  gap-4`}>
              {loginRole === SUPER_ADMIN && (
                <CompanyField
                  companies={companies}
                  selectedCompanyId={formData?.company}
                  handleChange={handleChange}
                  error={errors.company}
                />
              )}
              {(loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole)) && <RestaurantField
                restaurants={restaurants}
                selectedRestaurantId={formData?.restaurant}
                handleChange={handleChange}
                error={errors.restaurant}
              />}
            </div>
            <div>
              <Label htmlFor="name" value="Name" />
              <span className="text-ERROR_HOVER">*</span>
              <input
                type="text"
                id="name"
                name="name"
                value={formData?.name}
                onChange={handleChange}
                placeholder="Enter Name"
                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
              />
              {errors.name && <p className="text-ERROR_HOVER">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="flex flex-col mb-2">
                <div>
                  <Label htmlFor="PlatForm" value="PlatForm" />
                  <span className="text-ERROR_HOVER">*</span>
                </div>
                {/* <select name="platForm" value={formData?.platForm} onChange={handleChange} id="PlatForm" className="w-full px-3 py-2 dark:bg-DARK-700 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md">
                  <option value="">Select PlatForm</option>
                  <option value="quickbook">Quick Book</option>
                </select> */}
                <div>
                  <DropdownWithSearch
                    setSelectedItem={() => { }}
                    selectedItem={connectionPlatForm()?.find((c: any) => c._id === formData.platForm)?.name || ''}
                    items={connectionPlatForm()}
                    title="QuickBooks income account"
                    handleFilter={handlePlatForm}
                    fieldKey="QuickBooks income account"
                  />
                  {errors?.incomeAccount && <p className="mt-1 text-sm text-red-600">{errors?.incomeAccount}</p>}
                </div>
                {errors.platForm && <p className="text-ERROR_HOVER">{errors.platForm}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId" value="Client ID" />
                <span className="text-ERROR_HOVER">*</span>
                <div className="flex dark:border-none border border-DARK-300 rounded-md">
                  <input
                    type={showPin.clientId ? "text" : "password"}
                    id="clientId"
                    autoComplete="new-password"
                    name="clientId"
                    value={formData?.clientId}
                    onChange={handleChange}
                    placeholder="Enter Client ID"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border-none rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => ({ ...prev, clientId: !showPin.clientId }))}
                    className="flex mr-2 items-center text-DARK-500 dark:text-DARK-300 hover:text-BRAND-500 dark:hover:text-BRAND-400 transition-colors"
                  >
                    {showPin.clientId ? <HiEye className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
                  </button>
                </div>
                {errors.clientId && <p className="text-ERROR_HOVER">{errors.clientId}</p>}
              </div>
              <div>
                <Label htmlFor="clientSecret" value="Client Secret" />
                <span className="text-ERROR_HOVER">*</span>
                <div className="flex dark:border-none border border-DARK-300 rounded-md">
                  <input
                    type={showPin.clientSecret ? "text" : "password"}
                    id="clientSecret"
                    autoComplete="new-password"
                    name="clientSecret"
                    value={formData?.clientSecret}
                    onChange={handleChange}
                    placeholder="Enter Client Secret"
                    className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border-none rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => ({ ...prev, clientSecret: !showPin.clientSecret }))}
                    className="flex mr-2 items-center text-DARK-500 dark:text-DARK-300 hover:text-BRAND-500 dark:hover:text-BRAND-400 transition-colors"
                  >
                    {showPin.clientSecret ? <HiEye className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
                  </button>
                </div>
                {errors.clientSecret && <p className="text-ERROR_HOVER">{errors.clientSecret}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="apiEndPoint" value="Api EndPoint" />
              <span className="text-ERROR_HOVER">*</span>
              <input
                type="text"
                id="apiEndPoint"
                name="apiEndPoint"
                autoComplete="new-password"
                value={formData?.apiEndPoint}
                onChange={handleChange}
                placeholder="Enter Api EndPoint"
                className="w-full px-3 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-md"
              />
              {errors?.apiEndPoint && <p className="text-ERROR_HOVER">{errors?.apiEndPoint}</p>}
            </div>
            <div className="flex items-center space-x-4 col-span-full">
              <Label htmlFor="isProduction" className="font-medium text-DARK-700">Environment</Label>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="EnvActivated"
                    name="isProduction"
                    value="true"
                    checked={formData?.isProduction === true}
                    onChange={() => setFormData((prev) => ({ ...prev, isProduction: true }))}
                    className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                  />
                  <Label htmlFor="EnvActivated" className="ml-2 text-DARK-700">Production</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="EnvDeActivated"
                    name="isProduction"
                    value="false"
                    checked={formData?.isProduction === false}
                    onChange={() => setFormData((prev) => ({ ...prev, isProduction: false }))}
                    className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                  />
                  <Label htmlFor="EnvDeActivated" className="ml-2 text-DARK-700">Development</Label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 col-span-full">
              <Label htmlFor="isActive" className="font-medium text-DARK-700">Status</Label>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="Activated"
                    name="isActive"
                    value="true"
                    checked={formData?.isActive === true}
                    onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                    className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                  />
                  <Label htmlFor="Activated" className="ml-2 text-DARK-700">Activated</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="DeActivated"
                    name="isActive"
                    value="false"
                    checked={formData?.isActive === false}
                    onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                    className="h-4 w-4 text-BRAND-500 focus:ring-BRAND-500"
                  />
                  <Label htmlFor="DeActivated" className="ml-2 text-DARK-700">DeActivated</Label>
                </div>
              </div>
            </div>
            {/* Buttons - Right Aligned */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={!!isButtonLoading}
                className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!!isButtonLoading}
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
    </>
  );
};

export default AddConnection;
