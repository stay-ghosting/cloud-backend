import { Socket } from "socket.io";
import { Server } from 'socket.io';
import dotenv from "dotenv";
import cors from 'cors';
import { createClient } from 'redis';

dotenv.config();

const express = require('express');
const http = require('http');

const redisPublisher = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
});
const redisSubscriber = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
});

redisPublisher.connect().catch((err) => console.error("Redis Publisher Error:", err));
redisSubscriber.connect().catch((err) => console.error("Redis Subscriber Error:", err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.use(cors({
  origin: "http://localhost:5173",
}));

let updateNumber = 0;
let canvasData: any[] = [];

redisSubscriber.subscribe("canvas-updates", (message) => {
  const updatedCanvasData = JSON.parse(message);
  io.emit("update-canvas", updatedCanvasData);
});

io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.emit("initialise-canvas", canvasData);

  socket.on("update-canvas", (data: any) => {
    updateNumber++;
    console.log(`Canvas update #${updateNumber}`);
    canvasData = data;

    redisPublisher.publish("canvas-updates", JSON.stringify(canvasData));
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
