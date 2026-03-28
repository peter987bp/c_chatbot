import { useEffect, useState } from "react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const SESSION_STORAGE_KEY = "chat-window-messages";
const SOURCE_STORAGE_KEY = "chat-window-source";

const initialMessages = [
  {
    id: crypto.randomUUID(),
    sender: "bot",
    text: "Hello. How can I help with your customer support issue today?"
  }
];

function getInitialMessages() {
  if (typeof window === "undefined") {
    return initialMessages;
  }

  const savedMessages = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!savedMessages) {
    return initialMessages;
  }

  try {
    const parsedMessages = JSON.parse(savedMessages);

    if (
      Array.isArray(parsedMessages) &&
      parsedMessages.every(
        (message) =>
          message &&
          typeof message.id === "string" &&
          (message.sender === "user" || message.sender === "bot") &&
          typeof message.text === "string"
      )
    ) {
      return parsedMessages;
    }
  } catch (error) {
    console.error("Failed to read saved chat history:", error);
  }

  return initialMessages;
}

function getInitialSource() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedSource = window.sessionStorage.getItem(SOURCE_STORAGE_KEY);
  return savedSource === "bedrock" || savedSource === "mock" ? savedSource : null;
}

function toApiMessages(messages) {
  return messages.map((message) => ({
    role: message.sender === "user" ? "user" : "assistant",
    text: message.text
  }));
}

export default function ChatWindow() {
  const [messages, setMessages] = useState(getInitialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [responseSource, setResponseSource] = useState(getInitialSource);

  useEffect(() => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (responseSource) {
      window.sessionStorage.setItem(SOURCE_STORAGE_KEY, responseSource);
      return;
    }

    window.sessionStorage.removeItem(SOURCE_STORAGE_KEY);
  }, [responseSource]);

  async function handleSendMessage(text) {
    const userMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text
    };
    const messageHistory = toApiMessages(messages);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          messages: messageHistory
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Chat request failed.");
      }

      const data = await response.json();
      setResponseSource(data.source === "bedrock" ? "bedrock" : "mock");
      const botMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.reply || "I could not generate a response."
      };

      setMessages((current) => [...current, botMessage]);
    } catch (error) {
      const fallbackText =
        error.name === "AbortError"
          ? "The request timed out. Please try again or talk to an agent."
          : "There was a problem reaching support. Please try again.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: fallbackText
        }
      ]);
    } finally {
      window.clearTimeout(timeoutId);
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
          {responseSource ? (
            <span className={`mode-indicator ${responseSource === "bedrock" ? "ai" : "mock"}`}>
              {responseSource === "bedrock" ? "AI Mode" : "Mock Mode"}
            </span>
          ) : null}
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
