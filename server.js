const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const users = {};

io.on("connection", (socket) => {

socket.on("register", (userId) => {


users[String(userId)] = socket.id;


});

socket.on("send_message", (data) => {

console.log(
  "SERVER SEND_MESSAGE",
  data
);

const msg = {
  id: Date.now(),
  from: String(data.from),
  to: String(data.to),
  message: data.message,
  seen: 0,
  time: new Date().toISOString()
};

const target = users[msg.to];

console.log(
  "TARGET USER:",
  msg.to,
  "SOCKET:",
  target
);

if (target) {

  io.to(target).emit(
    "receive_message",
    msg
  );

}

socket.emit(
  "receive_message",
  msg
);


});

socket.on("messages_seen", (data) => {

console.log("MESSAGES SEEN:", data);

io.emit("messages_seen", data);

});

/*socket.on("messages_seen", (data) => {

io.emit(
  "messages_seen",
  {
    reader: String(data.reader),
    chatUser: String(data.chatUser),
    ids: data.ids || []
  }
);


});*/

});
