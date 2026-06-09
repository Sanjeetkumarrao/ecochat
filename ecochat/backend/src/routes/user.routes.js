import { Router } from "express";
import {
  registerUser, loginUser, logoutUser, refreshAccessToken,
  getCurrentUser, updateProfile, searchUsers, changePassword,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

router.use(verifyJWT);
router.post("/logout", logoutUser);
router.get("/current-user", getCurrentUser);
router.patch("/update-profile", upload.single("avatar"), updateProfile);
router.post("/change-password", changePassword);
router.get("/search", searchUsers);

export default router;
