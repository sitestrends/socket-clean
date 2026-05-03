const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://sitesfortrends.com",
    methods: ["GET", "POST"]
  }
});

const cors = require("cors");
app.use(cors());

const users = {};           // userId -> socketId
const conversations = {};   // userId -> messages[]
const ADMIN_ID = "1";
const onlineUsers = {};

io.on("connection", (socket) => {
console.log("ONLINE USERS SERVER:", Object.keys(onlineUsers));
    // 🔑 REGISTER USER
socket.on("register", (userId) => {
console.log("REGISTER RAW:", userId);
  const id = String(userId);

  // 🔥 if user already exists → disconnect old socket
  if (users[id] && users[id] !== socket.id) {
    const oldSocket = io.sockets.sockets.get(users[id]);
    if (oldSocket) {
      console.log("KILL OLD SOCKET:", id);
      oldSocket.disconnect(true);
    }
  }

  socket.userId = id;

  users[id] = socket.id;
  onlineUsers[id] = socket.id;

  console.log("REGISTER:", id);

  emitOnline();
});

  // ✅ PRIVATE MESSAGE (USERS → ADMIN ONLY)
  socket.on("private_message", (data) => {
    const senderId = String(socket.userId);
    console.log("TARGET SOCKET:", targetSocketId);
    console.log("ALL USERS:", users);

    let targetId = senderId === ADMIN_ID
      ? String(data.to)     // admin chooses
      : ADMIN_ID;           // users forced to admin

    const targetSocketId = users[targetId];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", targetId);
      return;
    }

    const msg = {
      from: senderId,
      to: targetId,
      message: data.message,
      time: new Date().toISOString()
    };

    // 🔥 store per user (inbox thread)
    const convoKey = senderId === ADMIN_ID ? targetId : senderId;

    if (!conversations[convoKey]) {
      conversations[convoKey] = [];
    }

    conversations[convoKey].push(msg);

    // send to receiver + sender
    io.to(targetSocketId).emit("receive_message", msg);
  // send back ONLY once to sender
    if (socket.id !== targetSocketId) {
      socket.emit("receive_message", msg);
    }

    console.log("MSG:", senderId, "→", targetId, data.message);
  });

  // ✅ LOAD CONVERSATION (ADMIN)
  socket.on("load_conversation", (userId) => {
    userId = String(userId);

    const msgs = conversations[userId] || [];

    socket.emit("conversation_data", msgs);
  });

  // ✅ DISCONNECT
socket.on("disconnect", () => {

  if (socket.userId) {
    delete onlineUsers[socket.userId];
    delete users[socket.userId];
  }

  emitOnline();
});

//const adminId = "1";

function emitOnline() {
  const list = Object.keys(onlineUsers).filter(id => id !== ADMIN_ID);
  io.emit("online_users", list);   // ✅ ALWAYS ARRAY
}
  /*  socket.on("disconnect", () => {

    console.log("DISCONNECTED:", socket.id);

    if (socket.userId) {
      delete onlineUsers[socket.userId];
    }

    // 🔥 UPDATE LIST AGAIN
    io.emit("online_users", Object.keys(onlineUsers));
  });*/
  /*  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);

    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
        break;
      }
    }

    io.emit("user_list", Object.keys(users));
  });*/
});

server.listen(process.env.PORT || 3000, () => {
  console.log("SERVER RUNNING");
});