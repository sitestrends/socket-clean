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


const target = users[String(data.to)];

if (target) {

  io.to(target).emit("typing", {
    from: String(data.from)
  });

}


});

socket.on("send_message", (data) => {

        const msg = {
            id: Date.now().toString(),

            from: String(data.from),
            to: String(data.to),

            message: data.message || "",

            file_name: data.file_name || null,
            file_path: data.file_path || null,
            file_type: data.file_type || null,

            time: new Date().toISOString(),

            seen: 0
        };

    const targetSockets = users[msg.to];

console.log("SEND FILE MESSAGE:", data);
console.log("TARGET USER:", msg.to);
console.log("TARGET SOCKETS:", targetSockets);

    // Send to ALL sockets for that user
    if (targetSockets) {

        targetSockets.forEach(socketId => {

            io.to(socketId).emit("receive_message", msg);

        });

    }
        // Echo back to sender
        socket.emit("receive_message", msg);

    });
/*socket.on("send_message", (data) => {

const msg = {
  from: String(data.from),
  to: String(data.to),
  message: data.message,
  time: new Date().toISOString(),
  seen: 0
};

const target = users[msg.to];

if (target) {
  io.to(target).emit("receive_message", msg);
}

socket.emit("receive_message", msg);


});   */

socket.on("mark_seen", (data) => {

    const from = data.from;
    const to = data.to;

    // send to sender ONLY
    if (users[from]) {
        users[from].forEach(socketId => {
            io.to(socketId).emit("messages_seen", {
                from: to,
                to: from
            });
        });
    }

});
/*socket.on("messages_seen", (data) => {


io.emit("messages_seen", data);


});   */   

socket.on("disconnect", () => {

  for (let userId in users) {
    if (users[userId] === socket.id) {
      delete users[userId];
      break;
    }
  }

  io.emit("online_users", Object.keys(users));

});

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

console.log("Server running on", PORT);

});
