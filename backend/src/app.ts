import express from 'express';
import cors from 'cors';

import userRoutes from "./routes/user.routes.js"
import incidentRoutes from "./routes/incident.routes.js";
import authRoutes from "./routes/auth.routes.js";
import commentRoutes from "./routes/comment.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import {errorHandler} from "./middleware/error.middleware.js";


const app = express();

app.use(cors());

app.use(express.json());



app.get("/", (_req, res) => {
  res.json({
    message: "Incident Management API is running",
  });
});

app.get('/health', (req,res)=>{
    res.json({
        status: "okayish"
    });
});

app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users",userRoutes);
app.use("/api/v1",commentRoutes);
app.use("/api/v1/notifications", notificationRoutes);


app.use(errorHandler);
export default app;