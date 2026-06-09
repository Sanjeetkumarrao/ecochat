import { Router } from "express";
import {
  getConversations, getDMMessages, sendMessage, deleteMessage, markAsRead,
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/conversations", getConversations);
router.get("/dm/:userId", getDMMessages);
router.post("/send", upload.single("media"), sendMessage);
router.delete("/:messageId", deleteMessage);
router.patch("/read/:senderId", markAsRead);

export default router;
