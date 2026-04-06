const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const users = {}; // username -> socket.id

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  // ✅ REGISTER USER
  socket.on("register", (username) => {
    socket.username = username;
    users[username] = socket.id;

    console.log("REGISTER:", username, socket.id);

    socket.emit("registered");
  });

  // ✅ PUBLIC MESSAGE
  socket.on("send_message", (data) => {
    console.log("MESSAGE:", data.message);

    io.emit("receive_message", {
      userId: socket.username,
      username: socket.username,
      message: data.message,
      time: new Date().toISOString()
    });
  });

  // ✅ PRIVATE MESSAGE
  socket.on("private_message", (data) => {
    const targetSocketId = users[data.to];

    console.log("PRIVATE ATTEMPT:", data.to, data.message);

    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_message", {
        userId: socket.username,
        username: socket.username,
        message: data.message,
        time: new Date().toISOString(),
        private: true
      });

      console.log("PRIVATE SENT:", socket.username, "→", data.to);
    } else {
      console.log("USER NOT FOUND:", data.to);
    }
  });

  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);

    for (let user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});