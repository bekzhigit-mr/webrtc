import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import router from "./router";
import { io } from 'socket.io-client';
import "tailwindcss";


const socket = io('http://localhost:3000'); // Убедись, что URL совпадает

socket.on('connect', () => {
    console.log('✅ Подключение к Socket.IO успешно');
});

socket.on('disconnect', () => {
    console.log('❌ Соединение разорвано');
});

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");
