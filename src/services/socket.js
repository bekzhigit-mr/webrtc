import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    withCredentials: false, // Ставим false для теста
    transports: ['websocket', 'polling'],
});

export default socket;