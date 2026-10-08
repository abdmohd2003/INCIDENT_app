// "use client";

// import { io, Socket } from "socket.io-client";

// let socket: Socket | null = null;

// const getSocketUrl = () => {
//   const url = process.env.NEXT_PUBLIC_API_URL;

//   if (!url) {
//     throw new Error("NEXT_PUBLIC_API_URL is not configured");
//   }

//   return url;
// };

// export const getSocket = (token: string) => {
//   if (!socket) {
//     socket = io(getSocketUrl(), {
//       autoConnect: false,
//       transports: ["websocket"],
//       auth: {
//         token,
//       },
//     });
//   } else {
//     socket.auth = {
//       token,
//     };
//   }

//   return socket;
// };

// export const connectSocket = (token: string) => {
//   const currentSocket = getSocket(token);

//   if (!currentSocket.connected) {
//     currentSocket.connect();
//   }

//   return currentSocket;
// };

// export const disconnectSocket = () => {
//   if (!socket) {
//     return;
//   }

//   socket.disconnect();
// };

// export const getExistingSocket = () => socket;


"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  // Example:
  // http://localhost:3000/api/v1
  //
  // Socket.IO must connect to:
  // http://localhost:3000
  try {
    return new URL(apiUrl).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL is invalid");
  }
};

export const getSocket = (token: string) => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token,
      },
    });
  } else {
    socket.auth = {
      token,
    };
  }

  return socket;
};

export const connectSocket = (token: string) => {
  const currentSocket = getSocket(token);

  if (!currentSocket.connected) {
    currentSocket.connect();
  }

  return currentSocket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
};

export const getExistingSocket = () => socket;