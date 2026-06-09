import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if ([fullName, username, email, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) throw new ApiError(409, "Username or email already exists");

  let avatarUrl = "";
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    avatarUrl = uploaded?.url || "";
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarUrl,
  });

  const created = await User.findById(user._id).select("-password -refreshToken");

  return res.status(201).json(new ApiResponse(201, created, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) throw new ApiError(400, "Email or username required");

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) throw new ApiError(404, "User not found");

  const valid = await user.isPasswordCorrect(password);
  if (!valid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateTokens(user._id);
  const loggedIn = await User.findById(user._id).select("-password -refreshToken");

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedIn, accessToken, refreshToken }, "Logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  const options = { httpOnly: true, secure: true };
  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw new ApiError(401, "Unauthorized");

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded._id);
  if (!user || token !== user.refreshToken) throw new ApiError(401, "Refresh token expired");

  const { accessToken, refreshToken } = await generateTokens(user._id);
  const options = { httpOnly: true, secure: true };

  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Token refreshed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.json(new ApiResponse(200, req.user, "User fetched"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, about } = req.body;
  let avatarUrl = req.user.avatar;

  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) avatarUrl = uploaded.url;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, about, avatar: avatarUrl } },
    { new: true }
  ).select("-password -refreshToken");

  return res.json(new ApiResponse(200, user, "Profile updated"));
});

const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) throw new ApiError(400, "Search query required");

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } },
      {
        $or: [
          { username: { $regex: q, $options: "i" } },
          { fullName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      },
    ],
  }).select("username fullName avatar isOnline lastSeen about").limit(20);

  return res.json(new ApiResponse(200, users, "Users found"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const valid = await user.isPasswordCorrect(oldPassword);
  if (!valid) throw new ApiError(400, "Old password is incorrect");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.json(new ApiResponse(200, {}, "Password changed"));
});

export {
  registerUser, loginUser, logoutUser, refreshAccessToken,
  getCurrentUser, updateProfile, searchUsers, changePassword,
};
