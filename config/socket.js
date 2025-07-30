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
    socket.on("register", (userId) => {
      socket.join(userId);
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
