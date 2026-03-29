import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import chatRouter from "./routes/chat.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", chatRouter);

app.post("/api/escalate", (_req, res) => {
  res.json({
    status: "placeholder",
    message:
      "Talk to Agent is a demo placeholder in this MVP. For live support, this would connect to an agent workflow."
  });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
