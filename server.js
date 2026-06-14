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

/*  socket.on("register", (userId) => {
    const id = String(userId);
    socket.userId = id;
    users[id] = socket.id;

    console.log("REGISTER:", id);

    io.emit("online_users", Object.keys(users));
  });*/
  socket.on("register", (userId) => {

  users[userId] = socket.id;

  console.log("REGISTER:", userId);

});

socket.on("messages_seen", (data) => {
  console.log("MESSAGES SEEN:", data);

  io.emit("messages_seen", {
    reader: data.reader,
    chatUser: data.chatUser,
    affected: data.affected
  });
});

/*  socket.on("typing", (data) => {
console.log("TYPING EVENT:", data);
    io.emit("typing", data);
  });*/
  socket.on("typing", (data) => {

  console.log("TYPING EVENT:", data);

  const targetSocketId = users[data.to];

  console.log("TARGET SOCKET:", targetSocketId);

  if (targetSocketId) {

    io.to(targetSocketId).emit("typing", {
      from: data.from,
      to: data.to
    });

  }

});

  socket.on("send_message", (data) => {
    const { from, to, message } = data;

    const msg = {
      from: String(from),
      to: String(to),
      message,
      time: new Date().toISOString(),
      seen: 0
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

/*server.listen(3000, () => {
  console.log("Socket server running");
});*/
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on", PORT);
});