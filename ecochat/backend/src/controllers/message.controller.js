import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { userSocketMap } from "../sockets/socket.js";

// Get all DM conversations for current user
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        receiver: { $exists: true },
        deletedFor: { $nin: [userId] },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
        },
        lastMessage: { $first: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1, isOnline: 1, lastSeen: 1 } }],
      },
    },
    { $unwind: "$user" },
    {
      $addFields: {
        unreadCount: {
          $cond: [
            { $and: [{ $eq: ["$lastMessage.receiver", userId] }, { $eq: ["$lastMessage.isRead", false] }] },
            1,
            0,
          ],
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  return res.json(new ApiResponse(200, conversations, "Conversations fetched"));
});

// Get DM messages between two users
const getDMMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const myId = req.user._id;
  const { page = 1, limit = 30 } = req.query;

  const messages = await Message.find({
    $or: [
      { sender: myId, receiver: userId },
      { sender: userId, receiver: myId },
    ],
    deletedFor: { $nin: [myId] },
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("sender", "username fullName avatar")
    .lean();

  // Mark messages as read
  await Message.updateMany(
    { sender: userId, receiver: myId, isRead: false },
    { $set: { isRead: true } }
  );

  return res.json(new ApiResponse(200, messages.reverse(), "Messages fetched"));
});

// Send DM message
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId) throw new ApiError(400, "Receiver is required");
  if (!content?.trim() && !req.file) throw new ApiError(400, "Message content required");

  let mediaUrl = "";
  let mediaType = "none";

  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded) {
      mediaUrl = uploaded.url;
      mediaType = req.file.mimetype.startsWith("image") ? "image" : "file";
    }
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    content: content || "",
    mediaUrl,
    mediaType,
  });

  const populated = await Message.findById(message._id).populate("sender", "username fullName avatar");

  // Emit via socket
  const io = req.app.get("io");
  const receiverSocketId = userSocketMap.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("message:receive", populated);
  }

  // Create notification
  const receiver = await User.findById(receiverId);
  if (receiver && !userSocketMap.has(receiverId)) {
    await Notification.create({
      recipient: receiverId,
      sender: req.user._id,
      type: "message",
      message: `${req.user.fullName} sent you a message`,
    });
  }

  return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

// Delete message
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (message.sender.toString() === req.user._id.toString()) {
    // Delete for everyone
    await Message.findByIdAndDelete(messageId);
  } else {
    // Delete only for me
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: req.user._id },
    });
  }

  return res.json(new ApiResponse(200, {}, "Message deleted"));
});

// Mark messages as read
const markAsRead = asyncHandler(async (req, res) => {
  const { senderId } = req.params;
  await Message.updateMany(
    { sender: senderId, receiver: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  return res.json(new ApiResponse(200, {}, "Marked as read"));
});

export { getConversations, getDMMessages, sendMessage, deleteMessage, markAsRead };
