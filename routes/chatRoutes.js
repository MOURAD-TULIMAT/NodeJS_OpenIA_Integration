import express from "express";
import { handleChat } from "../services/chatService.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { userId, message } = req.body;
  await handleChat(userId, message, res);
});

export default router;
