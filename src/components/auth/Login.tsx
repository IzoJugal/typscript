import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../utils/AxiosInstance";
import { useLoading } from "../../context/LoadingContext";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { apiUrl } from "../../environment/env";
import { useSocket } from "../../context/SocketProvider";
import { AiOutlineLoading } from "react-icons/ai";
import TextInputPOS from "../../utils/common/TextInputPOS";
import { useConfigs } from "../../context/SiteConfigsProvider";

interface AuthState {
  email: string;
  password: string;
}

interface ErrorState {
  email: string;
  password: string;
}

const Login = () => {
  const { setUserData, setActivePlan } = useAuth();
    const { configData } = useConfigs();
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>({ email: "", password: "" });
  const [error, setError] = useState<ErrorState>({ email: "", password: "" });
  const { isLoading, setIsLoading } = useLoading();
  const [showPin, setShowPin] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  
  // Kept solely for the Forgot Password field state
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  const location = useLocation();
  const emailFromState = location.state?.email || "";

  useEffect(() => {
    localStorage.removeItem("userEmail");
    if (emailFromState) {
      setAuth((prev) => ({
        ...prev,
        email: emailFromState,
      }));
    }
  }, [emailFromState]);

  const posImage = `/images/poslogin.jpg`;
  const defaultLogo = "/pos.png";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuth((prevAuth) => ({
      ...prevAuth,
      [name]: value,
    }));
    
    // Clear error dynamically when typing
    if (error[name as keyof ErrorState]) {
      setError((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Reusable strict RFC-compliant Email Regex
  const validateEmailFormat = (emailStr: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(emailStr);
  };

  const isValid = (data: AuthState): boolean => {
    let isFormValid = true;
    const errorMsg: ErrorState = { email: "", password: "" };

    // Validate email directly from the clean data object passed in
    if (!data.email) {
      errorMsg.email = "Please enter email.";
      isFormValid = false;
    } else if (!validateEmailFormat(data.email)) {
      errorMsg.email = "Please enter a valid email address.";
      isFormValid = false;
    }

    if (!data.password) {
      errorMsg.password = "Please enter password.";
      isFormValid = false;
    }

    setError(errorMsg);
    return isFormValid;
  };

  const socket = useSocket();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedAuth = {
      email: auth.email.trim(),
      password: auth.password.trim(),
    };

    if (isValid(trimmedAuth)) {
      try {
        setIsLoading(true);
        const response = await apiClient.post('/auth/staff/login', trimmedAuth);
        setTimeout(() => {
          setIsLoading(false);
          if (response.status === 200 && response.data.status) {
            setUserData(response.data);
            localStorage.setItem("companyId", response?.data?.staffMember?.company?._id);
            if (response?.data?.activePlan) {
              setActivePlan(response?.data?.activePlan);
            }
            socket.emit("userLogin", response.data?.staffMember?._id);
            setError({ email: "", password: "" });
            navigate("/");
          } else {
            if (response.data.message === "No active subscription found for your business.") {
              navigate("/pricing");
              toast.info(response?.data?.message);
            } else {
              setError((prev) => ({ ...prev, password: response.data.message }));
            }
          }
        }, 1000);
      } catch (error: unknown) {
        setIsLoading(false);
        if (error instanceof AxiosError) {
          if (error.response) {
            if (error.response.status === 200) {
              toast.error(error.response.data.message);
              setError({ email: "", password: "" });
            }
          } else {
            toast.error("No response from server");
          }
        } else {
          console.log("~ Login.tsx ~ handleSubmit ~ Unexpected error:", error);
        }
      }
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setEmailError("Please enter your email");
      return;
    }

    if (!validateEmailFormat(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setIsButtonLoading(true);
      const response = await apiClient.post(`/auth/forgotpassword`, { email: trimmedEmail });
      if (response?.data?.status) {
        toast.success(response?.data?.message);
        modelClose();
      } else {
        setEmailError(response?.data?.message);
        setIsButtonLoading(false);
      }
    } catch (error: any) {
      setIsButtonLoading(false);
      setEmailError(error?.response?.data?.message || "Failed to send reset link. Please try again.");
    }
  };

  const modelClose = () => {
    setOpenModal(false);
    setEmailError("");
    setForgotEmail("");
    setIsButtonLoading(false);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4F7] dark:bg-DARK-950 font-sans selection:bg-BRAND-200">
        {/* Left Side: Background Image with Overlay */}
        <div className="hidden lg:flex w-1/2 h-screen relative overflow-hidden group">
          <img
            src={posImage}
            alt="POS Login Background"
            className="object-cover w-full h-full transform transition-transform duration-10000 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-BRAND-900/60 to-DARK-900/40 backdrop-blur-[2px]"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white z-10">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Streamline Your Operations</h2>
            <p className="text-lg text-BRAND-50/90 max-w-md drop-shadow-md">
              Access your point of sale system with ease. Manage orders, inventory, and analytics in one place.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md transform transition-all duration-500 hover:translate-y-[-2px]">
            <div className="bg-white dark:bg-DARK-800 p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-none dark:border dark:border-DARK-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-BRAND-50 dark:bg-BRAND-900/20 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 hover:scale-110"></div>

              <div className="relative z-10">
                <div className="flex justify-center mb-8">
                  <div className="p-4 bg-white dark:bg-DARK-700 rounded-2xl shadow-sm border border-gray-100 dark:border-DARK-600">
                    <img
                      src={`${apiUrl}/${configData?.favicon}`}
                      alt="Business Logo"
                      className="w-12 h-12 object-contain"
                      onError={(e) => (e.currentTarget.src = defaultLogo)}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold text-DARK-900 dark:text-white mb-2 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-DARK-500 dark:text-DARK-400 font-medium">
                  Please enter your credentials to access your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" value="Email Address" className="text-DARK-700 dark:text-DARK-300 mb-1.5 block font-semibold text-sm" />
                  <div className="relative group">
                    <input
                      id="email"
                      name="email"
                      type="text"
                      value={auth.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-DARK-700 border border-gray-200 dark:border-DARK-600 rounded-xl focus:ring-4 focus:ring-BRAND-500/10 focus:border-BRAND-500 dark:text-white dark:placeholder:text-DARK-500 outline-none transition-all duration-300"
                      placeholder="e.g. name@company.com"
                    />
                  </div>
                  {error.email && (
                    <p className="text-ERROR text-xs mt-1.5 ml-1 font-medium bg-ERROR/5 p-1 px-2 rounded w-fit animate-pulse">
                      {error.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="password" value="Password" className="text-DARK-700 dark:text-DARK-300 font-semibold text-sm" />
                    <span 
                      onClick={() => setOpenModal(true)} 
                      className="text-xs font-bold text-BRAND-600 hover:text-BRAND-700 cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative group">
                    <TextInputPOS
                      name="password"
                      type={showPin ? 'text' : 'password'}
                      value={auth.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-DARK-700 border border-gray-200 dark:border-DARK-600 rounded-xl focus:ring-4 focus:ring-BRAND-500/10 focus:border-BRAND-500 outline-none transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((prev) => !prev)}
                      className="absolute inset-y-0 right-4 flex items-center text-DARK-400 dark:text-DARK-500 hover:text-BRAND-500 transition-colors"
                    >
                      {showPin ? <HiEye size={20} /> : <HiEyeOff size={20} />}
                    </button>
                  </div>
                  {error.password && (
                    <p className="text-ERROR text-xs mt-1.5 ml-1 font-medium bg-ERROR/5 p-1 px-2 rounded w-fit animate-pulse">
                      {error.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full !py-3 !bg-BRAND-600 hover:!bg-BRAND-700 !text-white font-bold !rounded-xl shadow-lg shadow-BRAND-500/20 transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center border-none focus:!ring-0"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <AiOutlineLoading className="animate-spin h-5 w-5" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaLock className="h-4 w-4" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-DARK-700 text-center">
                <p className="text-DARK-400 dark:text-DARK-500 text-sm font-medium">
                  Powered by <span className="text-BRAND-600">POS Bucket</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={openModal}
        onClose={modelClose}
        className="backdrop-blur-md"
        size="md"
      >
        <div className="bg-white dark:bg-DARK-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500">
          <Modal.Header className="!border-none !p-8 !pb-2">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-DARK-900 dark:text-white">Forgot Password?</h3>
              <p className="text-DARK-400 dark:text-DARK-500 text-sm font-medium mt-1">
                Enter your email to receive a reset link
              </p>
            </div>
          </Modal.Header>
          <Modal.Body className="!p-8 !pt-4">
            <div className="space-y-6">
              <div>
                <Label htmlFor="forgot-email" value="Email Address" className="text-DARK-700 dark:text-DARK-300 mb-1.5 block font-semibold text-sm" />
                <TextInput
                  id="forgot-email"
                  name="email"
                  autoComplete="email"
                  type="text"
                  value={forgotEmail}
                  placeholder="name@company.com"
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setEmailError("");
                  }}
                  required
                  className="[&>div>input]:!bg-gray-50 [&>div>input]:dark:!bg-DARK-700 [&>div>input]:!border-gray-200 [&>div>input]:dark:!border-DARK-600 [&>div>input]:!rounded-xl [&>div>input]:!py-3 [&>div>input]:focus:!ring-BRAND-500/10 [&>div>input]:focus:!border-BRAND-500 [&>div>input]:!transition-all [&>div>input]:!duration-300"
                />
                {emailError && (
                  <p className="text-ERROR text-xs mt-1.5 ml-1 font-medium bg-ERROR/5 p-1 px-2 rounded w-fit animate-pulse">
                    {emailError}
                  </p>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="!border-none !p-8 !pt-0 flex gap-3">
            <Button
              type="button"
              onClick={modelClose}
              className="flex-1 !bg-gray-100 hover:!bg-gray-200 dark:!bg-DARK-700 dark:hover:!bg-DARK-600 !text-DARK-600 dark:!text-DARK-200 font-bold !rounded-xl !border-none transition-all duration-300 focus:!ring-0"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleForgotPassword}
              disabled={isButtonLoading}
              className="flex-1 !bg-BRAND-600 hover:!bg-BRAND-700 !text-white font-bold !rounded-xl shadow-lg shadow-BRAND-500/20 transform active:scale-[0.98] transition-all duration-300 !border-none focus:!ring-0"
            >
              {isButtonLoading ? (
                <div className="flex items-center gap-2">
                  <AiOutlineLoading className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Send Link"
              )}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </>
  );
};

export default Login;