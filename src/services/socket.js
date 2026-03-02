import { io } from "socket.io-client";

// Obtenemos la URL desde las variables de entorno
// Vite expone las variables con prefijo VITE_ en import.meta.env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const socket = io(SOCKET_URL, {
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
