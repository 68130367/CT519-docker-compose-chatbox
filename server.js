const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Redis = require("ioredis");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Redis pub/sub — ใช้ 2 instance: publish และ subscribe แยกกัน
// (connection เดียวกันไม่สามารถใช้ทั้ง publish และ subscribe พร้อมกันได้)
const pub = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);

pub.on("error", (err) => console.error("Redis pub error:", err));
sub.on("error", (err) => console.error("Redis sub error:", err));

// MongoDB schema สำหรับเก็บ message
const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URL);

// Serve หน้า HTML
app.use(express.static("public"));

// Subscribe channel 'chat' — รับ message จาก Redis แล้วกระจายให้ทุก browser
sub.subscribe("chat");
sub.on("message", (channel, data) => {
  io.emit("message", JSON.parse(data));
});

io.on("connection", async (socket) => {
  // ส่ง history 50 message ล่าสุดให้ browser ที่เพิ่ง connect
  const history = await Message.find().sort({ timestamp: -1 }).limit(50).lean();
  socket.emit("history", history.reverse());

  // รับ message ใหม่จาก browser
  socket.on("message", async (data) => {
    // บันทึกลง MongoDB
    await Message.create(data);
    // publish ผ่าน Redis ให้ทุก server instance รับและกระจายต่อ
    pub.publish("chat", JSON.stringify(data));
  });
});

server.listen(3000, () => console.log("ChatBox running on port 3000"));
