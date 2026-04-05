const users = {};
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
// ✅ CORS FIX
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  socket.on("register", (username) => {
    socket.username = username || "NO_NAME";
    users[username] = socket.id;

    console.log("REGISTER:", username, socket.id);

    socket.emit("registered"); // ✅ important
  });

  socket.on("send_message", (data) => {
    console.log("MESSAGE:", socket.username, data.message);
    io.emit("receive_message", {
      user: socket.username, // ✅ FIXED (no more undefined)
      message: data.message,
      id: socket.id
    });
  });

  socket.on("private_message", ({ to, message }) => {
    console.log("PRIVATE ATTEMPT:", to, message);

    const targetSocketId = users[to];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", to);
      return;
    }

    io.to(targetSocketId).emit("receive_private", {
      from: socket.username,
      message: message
    });

    console.log("PRIVATE SENT:", socket.username, "→", to);
  });
});
// ✅ IMPORTANT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Running on port", PORT);
});