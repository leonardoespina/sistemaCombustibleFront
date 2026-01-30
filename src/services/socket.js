import { io } from "socket.io-client";

// URL del backend (debe coincidir con donde corre tu servidor Express)
<<<<<<< HEAD
const URL = "http://10.60.4.195:3000"; 
=======
const URL = "http://10.60.5.129:3000"; 
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

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
