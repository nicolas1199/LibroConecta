import { io } from "socket.io-client";

// Obtener la URL base de la API REST
const API_URL = import.meta.env.VITE_API_URL || "http://146.83.198.35:1234/api";
// Quitar el sufijo /api si existe
const SOCKET_URL = API_URL.replace(/\/api$/, "");

const socket = io(SOCKET_URL);

export default socket; 