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
  socket.on("get_users", async () => {
      console.log("GET USERS RECEIVED");

      const users = [
          "136",
          "200"
      ];

      socket.emit("user_list", users);
  });

let unreadCount = 0;

function updateBadge() {
    const badge = document.getElementById("unreadBadge");

    if (unreadCount > 0) {
        badge.style.display = "inline-block";
        badge.textContent = unreadCount;
    } else {
        badge.style.display = "none";
    }
}

  // ✅ REGISTER USER
  socket.on("register", (userId) => {
      socket.userId = String(userId);
      socket.join(String(userId)); // REQUIRED
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
      const { sender_id, receiver_id } = data;

      io.to(receiver_id).emit("user_typing", {
          sender_id
      });
  });

    socket.on("stop_typing", (data) => {
      const { sender_id, receiver_id } = data;

      io.to(receiver_id).emit("user_stop_typing", {
          sender_id
      });
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
          io.emit("user_offline", socket.userId);
      }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("SERVER RUNNING");
});