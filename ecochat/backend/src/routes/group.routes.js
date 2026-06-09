import { Router } from "express";
import {
  createGroup, getUserGroups, getGroupById, getGroupMessages,
  sendGroupMessage, addMembers, removeMember, leaveGroup, updateGroup,
} from "../controllers/group.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.post("/", upload.single("avatar"), createGroup);
router.get("/", getUserGroups);
router.get("/:groupId", getGroupById);
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", upload.single("media"), sendGroupMessage);
router.patch("/:groupId", upload.single("avatar"), updateGroup);
router.post("/:groupId/members", addMembers);
router.delete("/:groupId/members/:memberId", removeMember);
router.delete("/:groupId/leave", leaveGroup);

export default router;
