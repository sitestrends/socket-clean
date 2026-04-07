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

const users = {};           // userId -> socketId
const conversations = {};   // userId -> messages[]
const ADMIN_ID = "1";

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  // ✅ REGISTER
  socket.on("register", (userId) => {
    userId = String(userId);

    socket.userId = userId;
    users[userId] = socket.id;

    console.log("REGISTER:", userId);

    io.emit("user_list", Object.keys(users));
  });

  // ✅ PRIVATE MESSAGE (INBOX SYSTEM)
  socket.on("private_message", (data) => {
    const senderId = String(socket.userId);

    let targetId;

    if (senderId !== ADMIN_ID) {
      targetId = ADMIN_ID; // users → admin only
    } else {
      targetId = String(data.to); // admin chooses
    }

    const targetSocketId = users[targetId];

    if (!targetSocketId) {
      console.log("USER NOT FOUND:", targetId);
      return;
    }

    const msg = {
      user: senderId,
      message: data.message,
      time: new Date().toISOString()
    };

    // 🔥 conversation key (user side, not admin)
    const convoId = senderId === ADMIN_ID ? targetId : senderId;

    if (!conversations[convoId]) {
      conversations[convoId] = [];
    }

    conversations[convoId].push(msg);

    // send to receiver + sender
    io.to(targetSocketId).emit("receive_message", msg);
    socket.emit("receive_message", msg);

    console.log("PRIVATE:", senderId, "→", targetId, data.message);
  });

  // ✅ LOAD CONVERSATION
  socket.on("load_conversation", (userId) => {
    userId = String(userId);

    const msgs = conversations[userId] || [];

    socket.emit("conversation_data", msgs);

    console.log("LOAD CONVO:", userId);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});