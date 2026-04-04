const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://sitesfortrends.com",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  socket.on("register", (username) => {
    socket.username = username;
    console.log("REGISTER:", username);
    
  socket.emit("registered"); // ✅ confirm back
  });

  socket.on("send_message", (data) => {
    console.log("MESSAGE:", data.message);

    io.emit("receive_message", {
      user: socket.username || "NO_NAME",
      message: data.message
    });
  });
});

server.listen(3000, () => {
  console.log("SERVER RUNNING");
});