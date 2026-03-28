import React from "react";

export default function MessageList({ messages, isLoading }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message-row ${message.sender === "user" ? "user" : "bot"}`}
        >
          <div className="message-bubble">{message.text}</div>
        </div>
      ))}

      {isLoading ? (
        <div className="message-row bot">
          <div className="message-bubble">Thinking...</div>
        </div>
      ) : null}
    </div>
  );
}
