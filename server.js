

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

console.log("SENDING:", {
  userId: socket.userId,
  time: new Date().toISOString()
});
// ✅ IMPORTANT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Running on port", PORT);
});
server.listen(process.env.PORT || 3000, () => {
  console.log("🔥 SERVER CLEAN RUNNING");
});

app.get("/", (req, res) => {
  res.send("🔥 Socket server is live");
});

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  socket.on("register", (username) => {
    socket.username = username;
    users[username] = socket.id;

    console.log("REGISTER:", username, socket.id);

    socket.emit("registered"); // ✅ important
  });
  socket.on("send_message", (data) => {
  io.emit("receive_message", {
    userId: socket.username,
    username: socket.username,
    message: data.message,
    time: new Date().toISOString() // ✅ ADD THIS
  });
  
/*
  socket.on("send_message", (data) => {
    console.log("MESSAGE:", socket.username, data.message);
    io.emit("receive_message", {
      user: socket.username, // ✅ FIXED (no more undefined)
      message: data.message,
      id: socket.id
    });*/
  });

});
  socket.on("private_message", ({ to, message }) => {
    console.log("PRIVATE ATTEMPT:", to, message);

    const targetSocketId = users[to];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", to);
      return;
    }
  if (targetSocketId) {
    io.to(targetSocketId).emit("receive_message", {
      userId: socket.username,
      username: socket.username,
      message: data.message,
      time: new Date().toISOString() // ✅ ADD THIS
    });
  }
    io.to(targetSocketId).emit("receive_private", {
      from: socket.username,
      message: message
    });

    console.log("PRIVATE SENT:", socket.username, "→", to);
  });
/*
socket.on("private_message", (data) => {
  const targetSocketId = users[data.to];

  if (targetSocketId) {
    io.to(targetSocketId).emit("receive_message", {
      userId: socket.username,
      username: socket.username,
      message: data.message,
      time: new Date().toISOString() // ✅ ADD THIS
    });
  }
});*/
/*
io.emit("receive_message", {
  userId: socket.username,      // or socket.userid
  username: socket.username,     // display name
  message: data.message,
  time: new Date().toISOString()
});*/