const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  socket.on("register", (username) => {
    console.log("REGISTER:", username);
    socket.username = username;
  });

  socket.on("send_message", (data) => {
    console.log("MESSAGE:", data);

    io.emit("receive_message", {
      username: socket.username || "NO_NAME",
      message: data.message
    });
  });

  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 SERVER CLEAN RUNNING");
});