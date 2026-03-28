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
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A message string is required." });
  }

  try {
    const reply = await generateResponse(message);
    return res.json({ reply });
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
