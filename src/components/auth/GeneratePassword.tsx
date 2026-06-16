import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { HiEye, HiEyeOff } from "react-icons/hi";

const GeneratePassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const navigate = useNavigate();
    const [loadingBtn, setLoadingBtn] = useState<any>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showconfirmPassword, setconfirmShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<{ [key: string]: string }>({});
    const [passwordData, setPasswordData] = useState<any>({});

    useEffect(() => {
        if (!token) {
            toast.success('You are an unauthorized user.');
        }
    }, [token]);


    const handleError = (name: string, errorMessage: string = "") => {
        setError((prevErrors: any) => ({
            ...prevErrors,
            [name]: errorMessage
        }));
    };

    const inputHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setPasswordData((prevData: any) => ({
            ...prevData,
            [name]: value,
        }));

        if (name === "password" && value.length >= 6 && value.length <= 8) {
            handleError(name, "");
        } else if (name === "confirmpassword" && value === passwordData.password) {
            handleError(name, "");
        }
    };

    const toggleShowPassword = () => {
        setShowPassword((prev) => !prev);
    };

    const toggleconfirmShowPassword = () => {
        setconfirmShowPassword((prev) => !prev);
    };


    const submitHandle = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let isValid = true;
        let errormsg: { [key: string]: string } = {};

        const validatePassword = (password: string, type: string) => {
            const labels: any = {
                password: "password",
                confirmpassword: "confirm password"
            };

            if (!password) {
                errormsg[type] = `Please enter ${labels[type]}!`;
                isValid = false;
            } else if (password.length < 6) {
                errormsg[type] = `${labels[type]} must be at least 6 characters`;
                isValid = false;
            }
        };

        validatePassword(passwordData.password, "password");
        validatePassword(passwordData.confirmpassword, "confirmpassword");

        if (passwordData.password !== passwordData.confirmpassword) {
            errormsg.confirmpassword = "Password & confirm password don't match.";
            isValid = false;
        }

        setError(errormsg);

        if (isValid) {
            setLoadingBtn(true);

            try {
                const res = await apiClient.post(`/auth/setpassword/${token}`, passwordData);

                if (res.data.status) {
                    toast.success(res.data.message);
                    navigate('/');
                } else {
                    toast.error(res.data.message);
                }
            } catch (error) {
                toast.error('Unable to generate password. Please try again.');
            } finally {
                setLoadingBtn(false);
            }
        }
    };

    return (
        <div className="bg-slide-img">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 py-24">
                    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-center text-DARK-800 mb-6">
                            Generate Password
                        </h2>
                        <form onSubmit={submitHandle}>
                            <div className="mb-5">
                                <div className="flex items-center border border-DARK-300 rounded-md">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        onChange={inputHandle}
                                        className="block w-full p-3 rounded-l-md border-DARK-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleShowPassword}
                                        className="px-3 py-2 text-DARK-500 border-l border-DARK-300 rounded-r-md transition-colors duration-200 hover:text-BRAND-500 dark:hover:text-BRAND-400"
                                    >
                                        {showPassword ? <HiEye className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                                {error.password && (
                                    <span className="text-ERROR">{error.password}</span>
                                )}
                            </div>

                            <div className="mb-5">
                                <div className="flex items-center border border-DARK-300 rounded-md">
                                    <input
                                        type={showconfirmPassword ? "text" : "password"}
                                        name="confirmpassword"
                                        onChange={inputHandle}
                                        className="block w-full p-3 rounded-l-md border-DARK-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Confirm Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleconfirmShowPassword}
                                        className="px-3 py-2 text-DARK-500 border-l border-DARK-300 rounded-r-md transition-colors duration-200 hover:text-BRAND-500 dark:hover:text-BRAND-400"
                                    >
                                        {showconfirmPassword ? <HiEye className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                                {error.confirmpassword && (
                                    <span className="text-ERROR">{error.confirmpassword}</span>
                                )}

                            </div>

                            <div className="flex justify-center mt-4">
                                {loadingBtn ? (
                                    <button
                                        disabled
                                        type="button"
                                        className="bg-BRAND-500 w-full rounded-md text-lg text-white font-semibold p-3 h-14 flex items-center justify-center"
                                    >
                                        <svg
                                            aria-hidden="true"
                                            role="status"
                                            className="inline w-5 h-5 mr-3 text-white animate-spin"
                                            viewBox="0 0 100 101"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                fill="#E5E7EB"
                                            />
                                            <path
                                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        Loading...
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        // onClick={(e: any) => submitHandle(e)}
                                        className="bg-BRAND-500 w-full rounded-md text-lg text-white font-semibold p-3 h-14"
                                    >
                                        Submit
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default GeneratePassword
