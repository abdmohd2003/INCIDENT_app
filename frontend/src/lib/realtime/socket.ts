"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

const getSocketUrl = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

  try {
    return new URL(apiUrl).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be an absolute URL");
  }
};

export const getSocket = (token: string) => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
    });
  } else if (currentToken !== token) {
    socket.auth = { token };
    if (socket.connected) socket.disconnect();
  }

  currentToken = token;
  return socket;
};

export const connectSocket = (token: string) => {
  const currentSocket = getSocket(token);
  if (!currentSocket.connected) currentSocket.connect();
  return currentSocket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  currentToken = null;
};
