# Caesars Chatbot MVP

A minimal customer support chatbot prototype built for an interview exercise.

This project demonstrates a simple, production-inspired architecture using:

- React + Vite frontend
- Node.js + Express backend
- AWS Bedrock integration (with mock fallback)
- Placeholder escalation endpoint for AWS Connect handoff

---

## ✨ Features

### Core Chat
- Simple chat UI with message history
- Multi-turn conversation support (context-aware follow-ups)
- Loading states and error handling

### Stability (Demo-Safe)
- Session persistence via `sessionStorage`
- Request timeout handling (prevents hanging UI)
- Graceful backend failure handling

### AI Integration
- AWS Bedrock integration using AWS SDK v3
- Supports multi-turn conversation via transcript history
- Clear fallback to **Mock Mode** when Bedrock is unavailable

### Transparency
- UI indicates:
  - **AI Mode (Bedrock)**
  - **Mock Mode (Fallback)**

### Escalation
- "Talk to Agent" button
- Placeholder `/api/escalate` endpoint for AWS Connect handoff

---

## 🧱 Project Structure

```text
caesars-chatbot-mvp/
  frontend/
  backend/
⚙️ Prerequisites
Node.js 18+
npm
🚀 Backend Setup
cd backend
npm install
cp .env.example .env

Update .env:

PORT=3001
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

Start backend:

npm run dev
Backend Endpoints
GET /health → health check
POST /api/chat → chatbot response
POST /api/escalate → placeholder escalation trigger
🌐 Frontend Setup
cd frontend
npm install
cp .env.example .env

Frontend .env:

VITE_API_BASE_URL=http://localhost:3001

Start frontend:

npm run dev

App runs at:

http://localhost:5173
🧠 Chat Flow
Request Shape
{
  "message": "string",
  "messages": [
    { "role": "user", "text": "..." },
    { "role": "assistant", "text": "..." }
  ]
}
message = current user input
messages = prior conversation history
Response Shape
{
  "reply": "string",
  "source": "bedrock" | "mock"
}
reply = chatbot response
source = indicates real AI vs fallback


🔄 Behavior Details
Multi-Turn Context
Frontend sends full transcript
Backend forwards transcript to Bedrock
Enables follow-up questions to behave contextually
Session Persistence
Chat history stored in sessionStorage
Survives page refresh
Prevents duplicate initial greeting
Timeout Handling
Frontend uses request timeout (~8s)
Prevents infinite loading states
Displays user-friendly failure message
Mock Mode
Automatically used when:
AWS credentials missing
Bedrock call fails
Clearly indicated in UI
Allows local development without AWS setup

### Safety & Guardrails

The chatbot includes basic safety and truthfulness guardrails:

- Prevents generating:
  - Phone numbers
  - Email addresses
  - URLs
  - Placeholder text (e.g. "[insert support number]")
- Blocks false claims such as:
  - “Your reservation is confirmed”
  - “I have escalated your request”
  - “A live agent will contact you”
- Falls back to safe response when output is deemed unsafe

These rules ensure the chatbot does not fabricate actions or sensitive information.

⚠️ Limitations (Intentional for MVP)
No authentication
No database / long-term persistence
No streaming responses
No RAG / knowledge base integration
AWS Connect escalation is a stub (not fully wired)
🧪 Testing Notes

Recommended manual test flow:

Ask a question
Ask a follow-up (verify context)
Refresh page (verify persistence)
Stop backend (verify timeout handling)
Break AWS config (verify Mock Mode)
Click "Talk to Agent"
🧭 Future Improvements
Full AWS Connect integration
Streaming responses (Bedrock streaming API)
Conversation persistence (database)
Better prompt engineering / system prompts
UI polish (auto-scroll, typing indicators)
Observability/logging