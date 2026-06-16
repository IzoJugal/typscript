import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
// import { toast } from "react-toastify";
import { useSocket } from "../context/SocketProvider";
import { useQuickBooks } from "../context/QuickBooksProvider";

const useLogOut = () => {
  const [isLogOut, setIsLogOut] = useState(false);
  const navigate = useNavigate();
  const { removeItem, userData } = useAuth();
  const { removeQuickBooksData } = useQuickBooks();
  const socket = useSocket()
  useEffect(() => {

    if (isLogOut) {
      socket.emit("userLogout", userData?.staffMember?._id)
      removeItem("user");
      removeItem("activePlan");
      removeItem("companyConfigs");
      removeQuickBooksData("quickBooks");
      removeItem("companyId");
      Cookies.remove('token')
      navigate("/", { replace: true });
      // setTimeout(() => {
      //   toast.success('You have been logged out successfully.');
      // }, 500);
    };
    // const checkCookie = Cookies.get('user');

    // if(!checkCookie){
    //   removeItem('user');
    //   navigate("/",{replace:true});
    // };
  }, [isLogOut, navigate, removeItem]);

  const logOut = async () => {
    setIsLogOut(true);
    // try {
    //   const response = await axios.post(`${apiUrl}/auth/logout`,{userId:userData?._id,deviceId:userData?.deviceId},{
    //     withCredentials: true,
    //   });
    //   if (response.status === 200) {
    //     setIsLogOut(true);
    //   }
    // } catch (error) {
    //   console.log(error);
    // }
  };

  return { logOut, isLogOut };
};

export default useLogOut;
