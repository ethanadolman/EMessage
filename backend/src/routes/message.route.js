import express from "express";
import {
  deleteConversation,
  getConversationsForSidebar,
  getMessages,
  getUsersForSidebar,
  sendMessage,
  toggleConversationPin,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", getUsersForSidebar);
router.get("/conversations", getConversationsForSidebar);
router.post("/conversations/:id/pin", toggleConversationPin);
router.delete("/conversations/:id", deleteConversation);
router.get("/:id", getMessages);
router.post("/send/:id", upload.single("media"), sendMessage);

export default router;
