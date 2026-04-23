const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});
console.log("SERVER STARTED");
const users = {};           // userId -> socketId
const conversations = {};   // userId -> messages[]
const ADMIN_ID = "1";

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sites"
});

db.connect(err => {
  if (err) {
    console.error("❌ DB CONNECT ERROR:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});


io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);
  console.log("🔥 SOCKET CONNECTED:", socket.id);
  console.log("SOCKET CONNECTED");

  
  // ✅ REGISTER
  socket.on("register", (userId) => {
    socket.userId = String(userId);
    users[socket.userId] = socket.id;
    console.log("REGISTERED:", socket.userId);
  });

  // ✅ GET USERS
  socket.on("get_users", () => {
    console.log("GET USERS HIT");
    const usersList = Object.keys(users);
    socket.emit("user_list", usersList);
  });

  // ✅ PRIVATE MESSAGE
  socket.on("private_message", (data) => {
    const senderId = String(socket.userId);

    let targetId = senderId === ADMIN_ID
      ? String(data.to)
      : ADMIN_ID;

    const targetSocketId = users[targetId];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", targetId);
      return;
    }

    const msg = {
      sender: senderId,
      receiver: targetId,
      message: data.message,
      time: new Date().toISOString()
    };

    const convoKey = senderId === ADMIN_ID ? targetId : senderId;

    if (!conversations[convoKey]) {
      conversations[convoKey] = [];
    }

    conversations[convoKey].push(msg);

    io.to(targetSocketId).emit("receive_message", msg);
    socket.emit("receive_message", msg);

    io.to("admin_room").emit("new_message_alert", msg);
  });

  // ✅ TYPING
  socket.on("typing", ({ sender, receiver }) => {
    io.to(receiver).emit("user_typing", { sender });
  });

  socket.on("stop_typing", ({ sender, receiver }) => {
    io.to(receiver).emit("user_stop_typing", { sender });
  });

  // ✅ LOAD CONVO
  socket.on("load_conversation", (userId) => {
    const msgs = conversations[String(userId)] || [];
    socket.emit("conversation_data", msgs);
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("user_offline", socket.userId);
    }
  });
});