import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { generateResponse } from "./bedrock.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const { message, messages } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A message string is required." });
  }

  if (
    messages !== undefined &&
    (!Array.isArray(messages) ||
      messages.some(
        (entry) =>
          !entry ||
          (entry.role !== "user" && entry.role !== "assistant") ||
          typeof entry.text !== "string"
      ))
  ) {
    return res.status(400).json({
      error: "Messages must be an array of { role, text } objects."
    });
  }

  try {
    const result = await generateResponse(message, messages);
    return res.json(result);
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return res.status(500).json({
      error: "Unable to process chat request."
    });
  }
});

app.post("/api/escalate", (_req, res) => {
  res.json({ status: "initiated" });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
