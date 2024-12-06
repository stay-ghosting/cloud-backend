import { Socket } from "socket.io";
import { Server } from 'socket.io';

const express = require('express');
const http = require('http');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

let updateNumber = 0;

app.use(express.static('public'));

io.on('connection', (socket: Socket) => {
  console.log('a user connected');

  socket.on('update-canvas', (data: any) => {
    updateNumber++
    console.log("canvas update " + updateNumber);
    
    socket.broadcast.emit('update-canvas', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
