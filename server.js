const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {}; // userId -> socketId
const ADMIN_ID = "1";

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  // ✅ REGISTER
  socket.on("register", (userId) => {
    userId = String(userId);

    socket.userId = userId;
    users[userId] = socket.id;

    console.log("REGISTER:", userId, socket.id);

    io.emit("user_list", Object.keys(users));
  });

  // ✅ PRIVATE MESSAGE (ADMIN SYSTEM)
  socket.on("private_message", (data) => {
    const senderId = String(socket.userId);

    let targetId;

    if (senderId !== ADMIN_ID) {
      targetId = ADMIN_ID; // users can only message admin
    } else {
      targetId = String(data.to); // admin chooses user
    }

    const targetSocketId = users[targetId];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", targetId);
      return;
    }

    const messageData = {
      user: senderId,
      message: data.message,
      time: new Date().toISOString(),
      private: true
    };

    // send to receiver
    io.to(targetSocketId).emit("receive_message", messageData);

    // send back to sender (so sender sees their own message)
    socket.emit("receive_message", messageData);

    console.log("PRIVATE:", senderId, "→", targetId, data.message);
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);

    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
        break;
      }
    }

    io.emit("user_list", Object.keys(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});