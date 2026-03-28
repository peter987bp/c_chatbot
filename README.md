# Caesars Chatbot MVP

Minimal customer support chatbot prototype with:

- React + Vite frontend
- Node.js + Express backend
- AWS Bedrock integration via AWS SDK v3
- Placeholder escalation endpoint for AWS Connect handoff

## Project Structure

```text
caesars-chatbot-mvp/
  frontend/
  backend/
```

## Prerequisites

- Node.js 18+
- npm

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your values:

```env
PORT=3001
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
```

Start the backend:

```bash
npm run dev
```

Available backend endpoints:

- `GET /health`
- `POST /api/chat`
- `POST /api/escalate`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Frontend environment:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

The Vite dev server will print a local URL, typically `http://localhost:5173`.

## Notes

- If Bedrock environment variables are missing or the Bedrock call fails, the backend returns a mock support response so the MVP still works locally.
- `/api/escalate` currently returns `{ "status": "initiated" }` as a placeholder for a future AWS Connect workflow.
