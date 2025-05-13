import { io } from "socket.io-client";

export const Socket = io("http://10.33.70.48:3001", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: false,
});

Socket.on("connect", () => {
  console.log("Socket connected:", Socket.id);
});

Socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
});

Socket.on("error", (error) => {
  console.error("Socket error:", error);
});

Socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});
