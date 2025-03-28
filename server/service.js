const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: "*", // Разрешаем любые источники для тестов    methods: ["GET", "POST"],
    methods: ["GET", "POST"],

    credentials: true                // Важно для CORS
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Разрешаем оба адреса
        methods: ["GET", "POST"],
        credentials: true              // Важно для CORS
    }
});

io.on('connection', (socket) => {
    console.log('Пользователь подключён:', socket.id);

    socket.on('offer', (data) => {
        console.log('Пользователь offer:', data);
        socket.broadcast.emit('offer', data);
    });

    socket.on('answer', (data) => {
        console.log('Пользователь answer:', data);
        socket.broadcast.emit('answer', data);
    });

    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключён');
    });
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
