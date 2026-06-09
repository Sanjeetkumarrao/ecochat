import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["message", "group_invite", "mention"], default: "message" },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    ref: { type: Schema.Types.ObjectId }, // message or group id
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
