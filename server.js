const users = {};
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

socket.on("send_message", (data) => {
  io.emit("receive_message", {
    user: socket.username,   // ✅ MUST be "user"
    message: data.message,
    id: socket.id
  });
});

socket.on("register", (username) => {
  socket.username = username;

  console.log("REGISTER:", username, socket.id);

  // ✅ tell client it's ready
  socket.emit("registered");
});

const users = {};


io.on("connection", (socket) => {

  socket.on("register", (username) => {
    socket.username = username;
    users[username] = socket.id;

    console.log("REGISTER:", username, socket.id);

    socket.emit("registered"); // ✅ important
  });

  socket.on("send_message", (data) => {
    console.log("MESSAGE:", socket.username, data.message);

    io.emit("receive_message", {
      user: socket.username,// || "NO_NAME", // ✅ fallback
      message: data.message
      id: socket.id // this shows user1 & user2 username
    });
  });

  socket.on("private_message", ({ to, message }) => {
    console.log("PRIVATE ATTEMPT:", socket.username, "→", to);

    const targetSocketId = users[to];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", to);
      return;
    }

    io.to(targetSocketId).emit("receive_private", {
      from: socket.username,
      message
    });
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("🔥 SERVER CLEAN RUNNING");
});

app.get("/", (req, res) => {
  res.send("🔥 Socket server is live");
});