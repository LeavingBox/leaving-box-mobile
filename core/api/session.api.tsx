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

if (__DEV__) {
  Socket.on("connect", () => {
    console.log("[Socket] Connecté:", Socket.id);
  });
  Socket.on("connect_error", (err) => {
    console.warn("[Socket] Erreur de connexion:", err.message);
  });
  Socket.on("error", (err) => {
    console.warn("[Socket] Erreur:", err);
  });
  Socket.on("disconnect", (reason) => {
    console.log("[Socket] Déconnecté:", reason);
  });
}
