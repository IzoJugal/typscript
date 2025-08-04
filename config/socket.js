const { Server } = require("socket.io");

let io;

function init(server) {
  io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("register", ({ userId, notificationsEnabled }) => {
      socket.join(userId);
      socket.data.userId = userId;
       if (userId) {
      socket.data.notificationsEnabled = user.notificationsEnabled ?? true;
    }
      socket.data.notificationsEnabled = notificationsEnabled; 
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { init, getIO };
