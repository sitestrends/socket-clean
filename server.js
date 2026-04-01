const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// =========================
// SOCKET.IO SETUP
// =========================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// =========================
// BASIC ROUTE (IMPORTANT)
// =========================
app.get("/", (req, res) => {
  res.send("Socket server running");
});

// =========================
// SOCKET LOGIC
// =========================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (data) => {
    console.log("Message received:", data);

    // broadcast to ALL clients (safe fallback)
    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// =========================
// START SERVER (CRITICAL FOR RAILWAY)
// =========================
//const PORT = process.env.PORT || 8080;
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
//server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

/*const express = require("express");
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

app.get("/", (req, res) => {
  res.send("Server is running");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_project", (project_id) => {
    socket.join("project_" + project_id);
  });

  socket.on("send_message", (data) => {
    io.to("project_" + data.project_id).emit("receive_message", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});   */