import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { toast } from "react-toastify";
import apiClient from "../../utils/AxiosInstance";
import { useLoading } from "../../context/LoadingContext";
import { Link, useNavigate } from "react-router-dom";

interface AuthState {
    username: string;
    email: string;
    password: string;
    role: string;
}

interface ErrorState {
    username: string;
    email: string;
    password: string;
    role: string;
}

const AdminRegister = () => {
    const navigate = useNavigate()
    const [auth, setAuth] = useState<AuthState>({
        username: "",
        email: "",
        password: "",
        role: "",
    });
    const [error, setError] = useState<ErrorState>({
        username: "",
        email: "",
        password: "",
        role: "",
    });
    const { isLoading, setIsLoading } = useLoading();
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAuth((prevAuth) => ({
            ...prevAuth,
            [name]: value,
        }));

        if (error[name as keyof ErrorState]) {
            setError((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const isValid = (): boolean => {
        let isValid = true;
        const errorMsg: Partial<ErrorState> = {};

        // if (!auth.username) {
        //     errorMsg.username = "Please enter username.";
        //     isValid = false;
        // }

        if (!auth.email) {
            errorMsg.email = "Please enter email.";
            isValid = false;
        }

        if (!auth.password) {
            errorMsg.password = "Please enter password.";
            isValid = false;
        }

        if (!auth.role) {
            errorMsg.role = "Please enter role.";
            isValid = false;
        }

        setError((prev) => ({ ...prev, ...errorMsg }));
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValid()) {
            try {
                setIsLoading(true);
                const response = await apiClient.post("/admin/add", auth);
                setIsLoading(false);
                if (response.status === 201) {
                    toast.success(response.data.message);
                    setError({ username: "", email: "", password: "", role: "" });
                    navigate('/')
                }
            } catch (error: any) {
                setIsLoading(false);
                if (error.response) {
                    toast.error(error.response.data.message);
                    setError({ username: "", email: "", password: "", role: "" });
                } else {
                    console.log("Error:", error);
                    toast.error("An error occurred, please try again.");
                }
            }
        }
    };

    return (
        <div className="bg-DARK-100 flex justify-center items-center h-screen">
            <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
                <h1 className="text-2xl font-semibold mb-4">Register </h1>
                <form onSubmit={handleSubmit}>
                    {/* <div className="mb-4 grid gap-1">
                        <label htmlFor="username" className="flex text-DARK-600">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={auth.username}
                            onChange={handleChange}
                            className="w-full border border-DARK-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                            placeholder="Enter your username"
                        />
                        {error.username && <div className="text-red-500 flex">{error.username}</div>}
                    </div> */}

                    <div className="mb-4 grid gap-1">
                        <label htmlFor="email" className="flex text-DARK-600">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={auth.email}
                            onChange={handleChange}
                            className="w-full border border-DARK-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                            placeholder="Enter your email"
                        />
                        {error.email && <div className="text-ERROR flex">{error.email}</div>}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-DARK-700 mb-1">
                            Password
                        </label>
                        <div className="flex items-center border border-DARK-300 rounded-md">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={auth.password}
                                onChange={handleChange}
                                className="block w-full p-2 rounded-l-md border-DARK-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="px-3 py-2 text-DARK-500 border-l border-DARK-300 rounded-r-md transition-colors duration-200 hover:text-blue-500"
                            >
                                {showPassword ? <HiEye className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
                            </button>
                        </div>
                        {error.password && <p className="text-ERROR text-sm">{error.password}</p>}
                    </div>

                    <div className="mb-4 grid gap-1">
                        <label htmlFor="role" className="flex text-DARK-600">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={auth.role}
                            onChange={handleChange}
                            className="w-full border border-DARK-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                        >
                            <option value="" disabled>Select a role</option>
                            <option value="superadmin">Super Admin</option>
                            <option value="admin">Admin</option>
                        </select>
                        {error.role && <div className="text-ERROR flex">{error.role}</div>}
                    </div>


                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
                    >
                        {isLoading ? "Loading..." : "Register"}
                    </button>
                </form>
                <br />
                <Link to={'/'} className="hover:underline">Back</Link>
            </div>
        </div>
    );
};

export default AdminRegister;
