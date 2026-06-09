import { Router } from "express";
import { getNotifications, markAllRead, deleteNotification } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.delete("/:id", deleteNotification);

export default router;
