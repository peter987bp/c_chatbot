# C Chatbot MVP

A production-minded customer support chatbot prototype built for an interview exercise.

This project demonstrates how Caesars could combine:

- AWS Bedrock (LLM-powered responses)
- AWS Connect (agent escalation path)
- React + Vite (frontend experience)
- Node.js + Express (API layer)

---

## 🎯 Purpose

This project was intentionally built as a **focused MVP**, then extended slightly with **production-aware improvements** to demonstrate:

- Real-world AI integration patterns
- Reliable frontend/backend communication
- Safe and controlled LLM behavior
- Clear escalation paths to human support

---

## 🧱 Architecture

```text
Browser (React + Vite)
        |
        v
Node.js API (Express)
        |
        +--> AWS Bedrock (LLM responses)
        |
        +--> Escalation Endpoint (AWS Connect stub)


Design Goals
Keep the system simple and explainable
Avoid over-engineering (no DB, no auth)
Add just enough resilience + safety to feel real
✨ Features
💬 Core Chat
Chat UI with message history
Multi-turn conversation support
Context-aware responses via transcript passing
🧠 AI Integration (AWS Bedrock)
Uses AWS SDK v3 to call Bedrock models
Sends full conversation transcript for better responses
Supports real-time replies
🛟 Fallback + Mock Mode
Automatically falls back when:
AWS credentials are missing
Bedrock fails or times out
UI clearly indicates:
AI Mode (Bedrock)
Mock Mode (Fallback)

👉 Ensures demo reliability in all environments

⚡ Stability & UX Safeguards
Request timeout (~8s) to prevent hanging UI
Graceful error handling with user-friendly messages
Loading states during API calls
💾 Session Persistence
Chat history stored in sessionStorage
Survives page refresh
Prevents duplicate initial state
🛡️ Safety & Guardrails

To prevent unsafe or misleading outputs, the chatbot:

Blocks generation of:
phone numbers
email addresses
URLs
Prevents false claims such as:
“Your reservation is confirmed”
“An agent has been contacted”
Falls back to safe responses when needed

👉 Ensures responsible AI behavior in a customer-facing context

📞 Escalation (AWS Connect Stub)
“Talk to Agent” button
Calls /api/escalate
Returns a placeholder response

This represents how the chatbot would integrate into a real AWS Connect contact flow

🔌 API Design
POST /api/chat

Request:

{
  "message": "I need help with my reservation",
  "messages": [
    { "role": "user", "text": "..." },
    { "role": "assistant", "text": "..." }
  ]
}

Response:

{
  "reply": "I can help with general questions. Would you like me to connect you with an agent?",
  "source": "bedrock"
}
POST /api/escalate

Request:

{
  "reason": "customer_requested_agent"
}

Response:

{
  "status": "initiated"
}
🔄 Chat Flow
User sends a message
Frontend sends request to /api/chat
Backend:
formats prompt
includes conversation history
calls AWS Bedrock (or fallback)
Response returned to UI
UI renders reply

Optional:

User clicks Talk to Agent
/api/escalate is triggered
🚀 Local Setup
Prerequisites
Node.js 18+
npm
Backend
cd backend
npm install
cp .env.example .env

Update .env:

PORT=3001
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

Start server:

npm run dev
Frontend
cd frontend
npm install
cp .env.example .env
VITE_API_BASE_URL=http://localhost:3001

Start app:

npm run dev

Open:

http://localhost:5173
🧪 Manual Testing Checklist

Recommended demo flow:

Ask:
“I need help with my hotel reservation”
Follow up:
“What if I need to change it?”
Ask account-specific question:
“Can you check my rewards balance?”
Ask for contact info:
“What number should I call?”
Click Talk to Agent
Refresh page (verify persistence)
Disable AWS → verify Mock Mode
⚠️ Limitations (Intentional)

To keep the MVP focused:

No authentication
No database (session-only persistence)
No streaming responses
No RAG / knowledge base
AWS Connect is a stub (not fully wired)
🧠 Design Decisions
Why no database?
Keeps MVP fast and simple
Avoids unnecessary infrastructure
Why Mock Mode?
Ensures demo works even without AWS
Prevents failure during interviews
Why guardrails?
Prevents hallucinated or unsafe responses
Aligns with real-world customer support expectations
Why transcript-based chat?
Enables natural multi-turn conversations
Mirrors production chatbot design
🚀 Future Improvements
Persistent storage (DB)
Streaming responses
AWS Connect full integration
Retrieval (RAG) over help docs
CloudWatch logging
CI/CD pipeline
Authentication
🏁 Summary

This project demonstrates:

AWS Bedrock integration for AI responses
Awareness of AWS Connect escalation flows
Clean frontend/backend architecture
Production-minded thinking (resilience, safety, UX)