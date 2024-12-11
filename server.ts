import { Server } from 'socket.io';
import { Etcd3 } from 'etcd3';
import dotenv from 'dotenv';

dotenv.config();

const express = require('express');
const http = require('http');
if (!(process.env.ETCD_HOST && process.env.CLIENT_URL)) {
  throw new Error("Missing ETCD_HOST or CLIENT_URL");
}

const client = new Etcd3({
  hosts: process.env.ETCD_HOST,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

let updateNumber = 0;

const getCanvasDataFromETCD = async () => {
  try {
    const result = await client.get('canvas-data').string();
    return result ? JSON.parse(result) : { updatedElements: [], authorClientId: "Server" };
  } catch (err) {
    console.error("Error retrieving canvas data from ETCD:", err);
    return { updatedElements: [], authorClientId: "Server" };
  }
};

const setCanvasDataInETCD = async (canvasData: any[]) => {
  try {
    await client.put('canvas-data').value(JSON.stringify(canvasData));
    return canvasData;
  } catch (err) {
    console.error("Error saving canvas data to ETCD:", err);
    return null;
  }
};

io.on("connection", async (socket) => {
  console.log("A user connected");

  const initialCanvasData = await getCanvasDataFromETCD();

  socket.emit("initialise-canvas", { updatedElements: initialCanvasData, authorClientId: "server" });

  socket.on("update-canvas", async (data) => {
    updateNumber++;
    console.log(`Canvas update #${updateNumber}`);
    const result = await setCanvasDataInETCD(data);

    if (result) {
      io.emit("update-canvas", result);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
