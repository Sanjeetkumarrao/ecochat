import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "username fullName avatar")
    .sort({ createdAt: -1 })
    .limit(50);

  return res.json(new ApiResponse(200, notifications, "Notifications fetched"));
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { $set: { isRead: true } });
  return res.json(new ApiResponse(200, {}, "All notifications marked read"));
});

const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  return res.json(new ApiResponse(200, {}, "Notification deleted"));
});

export { getNotifications, markAllRead, deleteNotification };
