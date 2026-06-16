
// import { apiUrl } from "@/environment/env";
import { createContext, useMemo, useContext, } from "react";
import { io } from "socket.io-client";
import { apiUrl } from "../environment/env";
import { useAuth } from "./AuthProvider";

const SocketContext = createContext(null);

export const useSocket = (): any => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props: any) => {
  // const socket:any = useMemo(() => io(apiUrl), []);
  const { userData } = useAuth();
  const socket: any = useMemo(() => io(apiUrl, {
    auth: {
      token: userData.token
    },
    transports: ["websocket"]
  }), [userData]);
  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
