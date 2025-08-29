import { Server } from "socket.io";

let io: Server | undefined;

interface RegisterPayload {
  userId: string;
  notificationsEnabled?: boolean;
}

function init(server: any): Server {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("register", (payload: RegisterPayload) => {
    
      const { userId, notificationsEnabled } = payload;
      if (!userId) return;

      socket.join(userId);
      socket.data.userId = userId;
      socket.data.notificationsEnabled = notificationsEnabled ?? true;

    
    });

    socket.on("disconnect", () => {
      const userId = socket.data?.userId;
     
    });

  });

  return io;
}

function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

export { init, getIO };