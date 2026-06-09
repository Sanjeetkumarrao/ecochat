import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Map: userId -> socketId
export const userSocketMap = new Map();

export const initSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select("-password -refreshToken");

      if (!user) return next(new Error("Unauthorized"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    userSocketMap.set(userId, socket.id);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast online status
    io.emit("user:status", { userId, isOnline: true });

    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    // Join personal room
    socket.join(userId);

    // ─── DM Events ───────────────────────────────────────────
    socket.on("message:send", async (data) => {
      const { receiverId, content, mediaUrl, mediaType } = data;

      // Emit to receiver if online
      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:receive", {
          senderId: userId,
          senderName: socket.user.fullName,
          senderAvatar: socket.user.avatar,
          content,
          mediaUrl,
          mediaType,
          createdAt: new Date(),
        });
      }
    });

    // ─── Group Events ─────────────────────────────────────────
    socket.on("group:join", (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on("group:message", async (data) => {
      const { groupId, content, mediaUrl, mediaType } = data;
      io.to(`group:${groupId}`).emit("group:message:receive", {
        groupId,
        senderId: userId,
        senderName: socket.user.fullName,
        senderAvatar: socket.user.avatar,
        content,
        mediaUrl,
        mediaType,
        createdAt: new Date(),
      });
    });

    // ─── Typing Events ────────────────────────────────────────
    socket.on("typing:start", ({ receiverId, groupId }) => {
      if (receiverId) {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing:start", {
            senderId: userId,
            senderName: socket.user.fullName,
          });
        }
      }
      if (groupId) {
        socket.to(`group:${groupId}`).emit("typing:start", {
          senderId: userId,
          senderName: socket.user.fullName,
          groupId,
        });
      }
    });

    socket.on("typing:stop", ({ receiverId, groupId }) => {
      if (receiverId) {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing:stop", { senderId: userId });
        }
      }
      if (groupId) {
        socket.to(`group:${groupId}`).emit("typing:stop", { senderId: userId, groupId });
      }
    });

    // ─── Read Receipt ─────────────────────────────────────────
    socket.on("message:read", ({ senderId, messageId }) => {
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message:read", { messageId, readBy: userId });
      }
    });

    // ─── Disconnect ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      userSocketMap.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit("user:status", { userId, isOnline: false, lastSeen: new Date() });
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });
};
