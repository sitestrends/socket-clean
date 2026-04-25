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

/*  socket.on("join_admin", () => {
    socket.join("admin_room");
    console.log("Admin joined admin_room");
});*/

  // ✅ REGISTER USER
  socket.on("register", (userId) => {
    userId = String(userId);

    socket.userId = userId;
    users[userId] = socket.id;

    console.log("REGISTER:", userId);

    io.emit("user_list", Object.keys(users));
  });

  // ✅ PRIVATE MESSAGE (USERS → ADMIN ONLY)
  socket.on("private_message", (data) => {
    const senderId = String(socket.userId);

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
    socket.emit("receive_message", msg);

  //  console.log("MSG:", senderId, "→", targetId, data.message);
      console.log("MSG:", data.sender_id, "→", data.receiver_id, data.message);

    // ✅ ADMIN ALERT (ADD THIS)
    console.log("Emitting to admin_room");
    io.to("admin_room").emit("new_message_alert", data);
  });

  ///   Typing Indicator
    socket.on("typing", (data) => {
    io.to(data.to).emit("typing", {
      from: data.from
    });
  });

    socket.on("typing", (data) => {
    const targetSocket = users[data.to];
    if (targetSocket) {
      io.to(targetSocket).emit("typing", { from: socket.userId });
    }
  });

    socket.on("stop_typing", (data) => {
      const targetSocket = users[data.to];
      if (targetSocket) {
        io.to(targetSocket).emit("stop_typing");
      }
    });

  // ✅ LOAD CONVERSATION (ADMIN)
  socket.on("load_conversation", (userId) => {
    userId = String(userId);

    const msgs = conversations[userId] || [];

    socket.emit("conversation_data", msgs);
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);

    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
        break;
      }
    }

    io.emit("user_list", Object.keys(users));
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("SERVER RUNNING");
});