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

const users = {}; // username -> socket.id

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  // ✅ REGISTER USER
socket.on("register", (userId) => {
  userId = String(userId); // ✅ FORCE STRING

  socket.userId = userId;
  users[userId] = socket.id;

  console.log("REGISTER:", userId);//, socket.id);
});

  // ✅ PUBLIC MESSAGE
  socket.on("send_message", (data) => {
    console.log("MESSAGE:", data.message);

    io.emit("receive_message", {
  user: socket.userId,        // ✅ legacy support
  userId: socket.userId,      // ✅ new
  username: socket.userId,    // ✅ new
  message: data.message,
  time: new Date().toISOString()
});
/*
    io.emit("receive_message", {
      id: socket.username,
      username: socket.username,
      message: data.message,
      time: new Date().toISOString()
    });*/
  });

  // ✅ PRIVATE MESSAGE
socket.on("private_message", (data) => {
  const targetId = String(data.to);
  const targetSocketId = users[targetId];

  if (!targetSocketId) {
    console.log("USER NOT FOUND:", targetId);
    return;
  }

  const messageData = {
    user: socket.userId,
    message: data.message,
    time: new Date().toISOString(),
    private: true
  };

  // send to receiver
  io.to(targetSocketId).emit("receive_message", messageData);

  // send back to sender (THIS FIXES YOUR “no sent message” issue)
  socket.emit("receive_message", messageData);

  console.log("PRIVATE SENT:", socket.userId, "→", targetId);
});
/*  socket.on("private_message", (data) => {
    const targetSocketId = users[data.to];

    console.log("PRIVATE ATTEMPT:", data.to, data.message);

    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_message", {
        user: socket.userId,
        userId: socket.userId,
        username: socket.userId,
        message: data.message,
        time: new Date().toISOString(),
        private: true
      });
    /*  io.to(targetSocketId).emit("receive_message", {
        id: socket.username,
        username: socket.username,
        message: data.message,
        time: new Date().toISOString(),
        private: true
      });*//*

      console.log("PRIVATE SENT:", socket.username, "→", data.to);
    } else {
      console.log("USER NOT FOUND:", data.to);
    }
  });*/

socket.on("disconnect", () => {
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