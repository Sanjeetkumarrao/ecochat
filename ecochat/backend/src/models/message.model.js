import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User" }, // for DM
    group: { type: Schema.Types.ObjectId, ref: "Group" },   // for group
    content: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },   // cloudinary url
    mediaType: { type: String, enum: ["image", "file", "none"], default: "none" },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // for group read receipts
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
