import { useState } from "react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const initialMessages = [
  {
    id: crypto.randomUUID(),
    sender: "bot",
    text: "Hello. How can I help with your customer support issue today?"
  }
];

export default function ChatWindow() {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSendMessage(text) {
    const userMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text
    };

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error("Chat request failed.");
      }

      const data = await response.json();
      const botMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.reply || "I could not generate a response."
      };

      setMessages((current) => [...current, botMessage]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: "There was a problem reaching support. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEscalate() {
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/escalate`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Escalation request failed.");
      }

      const data = await response.json();
      setStatusMessage(
        data.status === "initiated"
          ? "Escalation initiated. A live agent will be available soon."
          : "Escalation request completed."
      );
    } catch (error) {
      setStatusMessage("Unable to initiate escalation right now.");
    }
  }

  return (
    <section className="chat-window">
      <div className="chat-header">
        <div>
          <h1>Customer Support</h1>
          <p>Simple Bedrock-backed support chatbot MVP</p>
        </div>
        <button type="button" className="secondary-button" onClick={handleEscalate}>
          Talk to Agent
        </button>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </section>
  );
}
