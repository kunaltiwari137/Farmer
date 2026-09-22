const { Server } = require("socket.io");

let io;
const userSockets = new Map(); // user_id -> socket.id mapping

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true },
  });

  io.on("connection", (socket) => {
    // STEP 1: Frontend connect hote hi apna user_id bhejega, hum use map mein rakhte hain
    socket.on("register", (userId) => {
      userSockets.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) userSockets.delete(userId);
      }
    });
  });

  return io;
}

// STEP 2: Kisi specific user ko event bhejne ka helper
function emitToUser(userId, event, data) {
  const socketId = userSockets.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
}

module.exports = { initSocket, emitToUser };