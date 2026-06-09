import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { userSocketMap } from "../sockets/socket.js";

const createGroup = asyncHandler(async (req, res) => {
  const { name, description, members } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Group name required");

  let avatarUrl = "";
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    avatarUrl = uploaded?.url || "";
  }

  const memberList = members ? JSON.parse(members) : [];
  if (!memberList.includes(req.user._id.toString())) {
    memberList.push(req.user._id.toString());
  }

  const group = await Group.create({
    name,
    description,
    avatar: avatarUrl,
    admin: req.user._id,
    members: memberList,
  });

  const populated = await Group.findById(group._id).populate("members", "username fullName avatar isOnline");

  // Notify members via socket
  const io = req.app.get("io");
  memberList.forEach((memberId) => {
    const socketId = userSocketMap.get(memberId.toString());
    if (socketId) io.to(socketId).emit("group:new", populated);
  });

  return res.status(201).json(new ApiResponse(201, populated, "Group created"));
});

const getUserGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .populate("members", "username fullName avatar isOnline")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  return res.json(new ApiResponse(200, groups, "Groups fetched"));
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId)
    .populate("members", "username fullName avatar isOnline lastSeen")
    .populate("admin", "username fullName avatar");

  if (!group) throw new ApiError(404, "Group not found");
  return res.json(new ApiResponse(200, group, "Group fetched"));
});

const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const messages = await Message.find({ group: groupId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("sender", "username fullName avatar");

  // Mark as read for current user
  await Message.updateMany(
    { group: groupId, readBy: { $nin: [req.user._id] } },
    { $addToSet: { readBy: req.user._id } }
  );

  return res.json(new ApiResponse(200, messages.reverse(), "Group messages fetched"));
});

const sendGroupMessage = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  if (!content?.trim() && !req.file) throw new ApiError(400, "Content required");

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (!group.members.includes(req.user._id)) throw new ApiError(403, "Not a member");

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
    group: groupId,
    content: content || "",
    mediaUrl,
    mediaType,
    readBy: [req.user._id],
  });

  await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });

  const populated = await Message.findById(message._id).populate("sender", "username fullName avatar");

  const io = req.app.get("io");
  io.to(`group:${groupId}`).emit("group:message:receive", populated);

  return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

const addMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { memberIds } = req.body;

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, "Only admin can add members");

  await Group.findByIdAndUpdate(groupId, { $addToSet: { members: { $each: memberIds } } });

  const updated = await Group.findById(groupId).populate("members", "username fullName avatar isOnline");
  return res.json(new ApiResponse(200, updated, "Members added"));
});

const removeMember = asyncHandler(async (req, res) => {
  const { groupId, memberId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, "Only admin can remove");

  await Group.findByIdAndUpdate(groupId, { $pull: { members: memberId } });
  return res.json(new ApiResponse(200, {}, "Member removed"));
});

const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  await Group.findByIdAndUpdate(groupId, { $pull: { members: req.user._id } });
  return res.json(new ApiResponse(200, {}, "Left group"));
});

const updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { name, description } = req.body;
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (group.admin.toString() !== req.user._id.toString()) throw new ApiError(403, "Only admin can update");

  let avatarUrl = group.avatar;
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) avatarUrl = uploaded.url;
  }

  const updated = await Group.findByIdAndUpdate(
    groupId,
    { $set: { name, description, avatar: avatarUrl } },
    { new: true }
  ).populate("members", "username fullName avatar isOnline");

  return res.json(new ApiResponse(200, updated, "Group updated"));
});

export {
  createGroup, getUserGroups, getGroupById, getGroupMessages,
  sendGroupMessage, addMembers, removeMember, leaveGroup, updateGroup,
};
