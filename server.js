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

// Example: Create a room name like "chat_userA_userB"
//const privateRoom = [userId, agentId].sort().join('_');
//socket.join(privateRoom);
const privateRoom = [users, ADMIN_ID].sort().join('_');


io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

socket.join(privateRoom);
    // When a user starts a private chat
  socket.on('startPrivateChat', ({ userId, targetId }) => {
    const roomName = [userId, targetId].sort().join('_');
    socket.join(roomName);
    console.log(`User ${userId} joined private room: ${roomName}`);
  });

  // Sending a message specifically to that private room
  socket.on('sendPrivateMessage', ({ senderId, receiverId, message }) => {
    const roomName = [senderId, receiverId].sort().join('_');
    
    // io.to(roomName) ensures only those two see the message
    io.to(roomName).emit('newPrivateMessage', {
      senderId,
      message,
      timestamp: new Date()
    });
  });

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