import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./src/sockets/socket.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: "https://ecochat-git-main-sanjeetkumarraos-projects.vercel.app/",
    credentials: true,
  },
});

// Make io accessible in controllers
app.set("io", io);

// Initialize socket handlers
initSocket(io);

app.use(cors({ origin: "https://ecochat-git-main-sanjeetkumarraos-projects.vercel.app/", credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "./src/routes/user.routes.js";
import messageRouter from "./src/routes/message.routes.js";
import groupRouter from "./src/routes/group.routes.js";
import notificationRouter from "./src/routes/notification.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/notifications", notificationRouter);

export { app, server, io };
