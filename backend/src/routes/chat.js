import express from "express";
import { CHAT_LIMITS } from "../config/chatLimits.js";
import { generateResponse } from "../services/bedrock.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message, messages } = req.body ?? {};
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedMessage) {
    return res.status(400).json({ error: "A non-empty message string is required." });
  }

  if (trimmedMessage.length > CHAT_LIMITS.maxMessageLength) {
    return res.status(400).json({ error: "Message is too long." });
  }

  if (messages !== undefined) {
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array." });
    }

    if (messages.length > CHAT_LIMITS.maxHistoryMessages) {
      return res.status(400).json({ error: "Too many history messages." });
    }

    const hasInvalidMessage = messages.some(
      (entry) =>
        !entry ||
        (entry.role !== "user" && entry.role !== "assistant") ||
        typeof entry.text !== "string" ||
        !entry.text.trim() ||
        entry.text.trim().length > CHAT_LIMITS.maxHistoryMessageLength
    );

    if (hasInvalidMessage) {
      return res.status(400).json({ error: "History messages are invalid." });
    }
  }

  try {
    const result = await generateResponse(trimmedMessage, messages);
    return res.json(result);
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return res.status(500).json({
      error: "Unable to process chat request."
    });
  }
});

export default router;
