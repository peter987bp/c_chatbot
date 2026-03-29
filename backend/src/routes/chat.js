import express from "express";
import { generateResponse } from "../services/bedrock.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message, messages } = req.body ?? {};
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedMessage) {
    return res.status(400).json({ error: "A non-empty message string is required." });
  }

  if (trimmedMessage.length > 2000) {
    return res.status(400).json({ error: "Message is too long." });
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