import { io } from "socket.io-client";

export const Socket = io(
  process.env.EXPO_PUBLIC_WEBSOCKET_URL,
  // "http://192.168.1.158:3030",
  {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: false,
  }
);

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
