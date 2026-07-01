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

users[userId] = socket.id;

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

socket.on("send_message", (msg) => {

    const receiverSocket = users[msg.to];   // ✔ THIS IS REQUIRED

    console.log("SEND:", msg);
    console.log("LOOKING FOR:", msg.to);
    console.log("FOUND SOCKET:", receiverSocket);

    if (receiverSocket) {

        io.to(receiverSocket).emit("receive_message", msg);

    } else {
        console.log("USER NOT ONLINE:", msg.to);
    }

    // optional echo back to sender (for consistency)
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

socket.on("message_delivered", (data) => {

    updateMessageStatus(data.id, "delivered");

});

io.to(receiverSocket).emit("receive_message", msg);

socket.emit("message_delivered", {
    id: msg.id
});

socket.on("messages_seen", (data) => {

io.emit("messages_seen", data);


});

socket.on("disconnect", () => {


Object.keys(users).forEach(id => {

  if (users[id] === socket.id) {
    delete users[id];
  }

});

io.emit("online_users", Object.keys(users));


});

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

console.log("Server running on", PORT);

});
