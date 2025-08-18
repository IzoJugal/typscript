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
    socket.on("register", ({ userId, notificationsEnabled }: RegisterPayload) => {
      socket.join(userId);
      socket.data.userId = userId;
      if (userId) {
        socket.data.notificationsEnabled = notificationsEnabled ?? true;
      }
      socket.data.notificationsEnabled = notificationsEnabled; 
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

export { init, getIO };