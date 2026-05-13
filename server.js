const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const users = {}; // userId -> socketId

io.on("connection", (socket) => {

  socket.on("register", (userId) => {
    const id = String(userId);
    socket.userId = id;
    users[id] = socket.id;

    console.log("REGISTER:", id);

    io.emit("online_users", Object.keys(users));
  });

  socket.on("send_message", (data) => {
    const { from, to, message } = data;

    const msg = {
      from: String(from),
      to: String(to),
      message,
      time: new Date().toISOString()
    };

    const target = users[msg.to];

    if (target) io.to(target).emit("receive_message", msg);

    socket.emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    if (socket.userId) delete users[socket.userId];
    io.emit("online_users", Object.keys(users));
  });

});

server.listen(3000, () => {
  console.log("Socket server running");
});