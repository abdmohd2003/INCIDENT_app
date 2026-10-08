import "dotenv/config"
import app from "./app.js";

// const PORT = process.env.PORT || 3000 || 5000;

// app.listen(PORT, ()=>{
//     console.log(`Server is Running on port ${PORT}`)
// });


import http from "node:http";

import app from "./app.js";
import { initializeSocket } from "./realtime/socket.js";

const PORT = Number(process.env.PORT ?? 3000);

const httpServer = http.createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}`);
});