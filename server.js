console.log("🔥 SOCKET SERVER VERSION WITH TYPING LOADED");
console.log("🔥 SERVER.JS DEPLOY TEST LOADED 🔥");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
cors: {
origin: "*"
}
});

const users = {};

io.on("connection", (socket) => {
    console.log("CONNECTED TO SOCKET SERVER:", socket.id);
socket.onAny((eventName, ...args) => { console.log("EVENT RECEIVED:", eventName, args); });
socket.on("register", (userId) => {

    userId = String(userId);

    if (!users[userId]) {
        users[userId] = new Set();
    }

    users[userId].add(socket.id);

    console.log("REGISTER:", userId);

    io.emit("online_users", Object.keys(users));
});

socket.on("typing", (data) => {

      console.log("SERVER typing", data);
      
    const targetSockets = users[String(data.to)];

    if (!targetSockets) {
        console.log("NO TARGET USER:", data.to);
        return;
    }

    targetSockets.forEach(socketId => {

        io.to(socketId).emit("typing", {
            from: String(data.from)
        });

    });

});

socket.on("stop_typing", (data) => {

    const targetSockets = users[String(data.to)];

    if (!targetSockets) return;

    targetSockets.forEach(socketId => {

        io.to(socketId).emit("stop_typing", {
            from: String(data.from)
        });

    });

});

socket.on("send_message", (data) => {

    const msg = data;

    const targetSockets = users[String(msg.to)];

    console.log("SEND FILE MESSAGE:", msg);

    if (targetSockets) {
        targetSockets.forEach(socketId => {
            io.to(socketId).emit("receive_message", msg);
        });
    }

    socket.emit("receive_message", msg);

});


socket.on("mark_seen", (data) => {

    const from = String(data.from);
    const to = String(data.to);

    console.log("MARK SEEN:");
    console.log("FROM =", from);
    console.log("TO   =", to);

    if (users[from]) {

        users[from].forEach(socketId => {

            io.to(socketId).emit("messages_seen", {
                from: from,
                to: to
            });

        });

    }

});

socket.on("disconnect", () => {

    for (const userId in users) {

        users[userId].delete(socket.id);

        if (users[userId].size === 0) {
            delete users[userId];
        }

    }

    io.emit("online_users", Object.keys(users));

});

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

console.log("Server running on", PORT);

});
