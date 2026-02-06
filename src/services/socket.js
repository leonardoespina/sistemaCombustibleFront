import { io } from "socket.io-client";

// URL del backend (debe coincidir con donde corre tu servidor Express)
const URL = "http://10.60.3.78:3000"; 

const socket = io(URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Conectado al Socket.io Server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Desconectado del Socket.io Server");
});

export default socket;
