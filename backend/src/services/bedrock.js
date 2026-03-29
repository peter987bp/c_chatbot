import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { CHAT_LIMITS } from "../config/chatLimits.js";

const systemPrompt =
  [
    "You are a Caesars Entertainment customer support assistant.",
    "Be concise, calm, helpful, and natural.",
    "Answer general customer support questions normally when they do not require real-time account or reservation data.",
    "Ask a clarifying question when the request is ambiguous or missing details.",
    "Provide general guidance and suggest practical next steps when helpful.",
    "Recommend Talk to Agent only when the request needs account-specific help, reservation lookup, payment help, loyalty or rewards access, or anything that requires real customer data or live support.",
    "Always admit uncertainty when you are unsure or cannot verify something.",
    "Never invent or guess facts, contact information, policies, reservation details, account details, promotions, or property-specific details.",
    "Never output placeholder text such as [insert phone number], [email], or [link].",
    "Never claim to access systems, internal tools, reservations, accounts, or customer data.",
    "Never imply that you completed an action, made an update, confirmed a status, escalated a case, or processed a request.",
    "Keep answers short and avoid robotic or repetitive wording."
  ].join(" ");

const SAFE_FALLBACK_REPLY =
  "I can help with general questions, but for account, reservation, payment, or rewards support, please use Talk to Agent.";

const PLACEHOLDER_PATTERN =
  /(?:\[\s*(?:insert[^\]]*|phone|email|link|url|contact|placeholder)[^\]]*\]|<\s*(?:link|url|email|phone|contact)[^>]*>|(?:insert|provide)\s+(?:a\s+)?(?:phone number|email|link|url|contact)(?:\s+here)?)/i;
const PHONE_PATTERN = /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?){2}\d{4}\b/;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const URL_PATTERN = /\b(?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?)\b/i;

const UNSAFE_REPLY_PATTERNS = [
  /\b(?:i|we)(?:'ve|\s+have)?\s+(?:escalated|submitted|processed|resolved|updated)\s+(?:your\s+)?(?:case|request|issue|reservation|booking|payment|refund|account)\b/i,
  /\b(?:your|the)\s+(?:case|request|issue|reservation|booking|payment|refund)\s+(?:is|was|has been)\s+(?:resolved|submitted|processed|approved|completed)\b/i,
  /\byour\s+(?:reservation|booking|payment|refund)\s+has been\s+(?:confirmed|approved|processed|completed)\b/i,
  /\b(?:our\s+records\s+show|i\s+checked(?:\s+and)?|i\s+can\s+see|i\s+found|our\s+system\s+shows?)\s+(?:that\s+)?(?:your\s+)?(?:account|reservation|booking|payment|refund|case)\b/i,
  /\b(?:our\s+records\s+show|our\s+system\s+shows?)\s+(?:that\s+)?(?:your\s+)?(?:reservation|booking|payment|refund|case)\s+(?:is|was)\s+(?:active|confirmed|pending|approved|processed|resolved)\b/i,
  /\bi\s+checked(?:\s+and)?\s+(?:your\s+)?(?:account|reservation|booking|payment|refund|case)\s+(?:is|was|has been)\s+(?:active|confirmed|pending|approved|processed|resolved)\b/i,
  /\b(?:we|our\s+support\s+team|an?\s+agent)\s+will\s+(?:contact|email|call|reach\s+out\s+to)\s+you(?:\s+(?:shortly|soon))?\b/i,
  /\byou(?:'ll|\s+will)\s+receive\s+(?:an?\s+)?(?:email|call|message|update)\s+(?:shortly|soon)\b/i
];

function getClient() {
  const region = process.env.AWS_REGION?.trim();

  if (!region) {
    return null;
  }

  return new BedrockRuntimeClient({ region });
}

function normalizeHistory(messages = []) {
  if (!Array.isArray(messages)) {
    return [];
  }

  const normalizedMessages = messages
    .slice(-CHAT_LIMITS.maxHistoryMessages)
    .filter(
      (entry) =>
        entry &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.text === "string" &&
        entry.text.trim()
    )
    .map((entry) => ({
      role: entry.role,
      text: entry.text.trim().slice(0, CHAT_LIMITS.maxHistoryMessageLength)
    }));

  const firstUserIndex = normalizedMessages.findIndex((entry) => entry.role === "user");

  if (firstUserIndex === -1) {
    return [];
  }

  return normalizedMessages.slice(firstUserIndex);
}

function getMockResponse() {
  return "I can help with general questions. For account, reservation, payment, or rewards support, please use Talk to Agent.";
}

function buildFallbackMetadata(reason, error = null) {
  const metadata = { reason };

  if (error) {
    metadata.errorCode = error.code || error.name || "UnknownError";
    metadata.errorMessage =
      typeof error.message === "string" && error.message.trim()
        ? error.message.trim()
        : "Unknown Bedrock error.";
  }

  return metadata;
}

function toBedrockMessages(message, messages = []) {
  return [
    ...normalizeHistory(messages).map((entry) => ({
      role: entry.role,
      content: [{ text: entry.text }]
    })),
    {
      role: "user",
      content: [{ text: message.trim() }]
    }
  ];
}

function normalizeReply(reply) {
  return typeof reply === "string" ? reply.replace(/\s+/g, " ").trim() : "";
}

function matchesAnyPattern(reply, patterns) {
  return patterns.some((pattern) => pattern.test(reply));
}

function isUnsafeReply(reply) {
  const normalizedReply = normalizeReply(reply);

  if (!normalizedReply) {
    return true;
  }

  return (
    PLACEHOLDER_PATTERN.test(normalizedReply) ||
    PHONE_PATTERN.test(normalizedReply) ||
    EMAIL_PATTERN.test(normalizedReply) ||
    URL_PATTERN.test(normalizedReply) ||
    matchesAnyPattern(normalizedReply, UNSAFE_REPLY_PATTERNS)
  );
}

function finalizeReply(reply, source, metadata = null) {
  const normalizedReply = normalizeReply(reply);
  const blocked = isUnsafeReply(normalizedReply);
  const blockedMetadata = buildFallbackMetadata("unsafe_reply_blocked");

  return {
    reply: blocked ? SAFE_FALLBACK_REPLY : normalizedReply,
    source: blocked && source === "mock" ? "mock" : source,
    ...(blocked ? { debug: blockedMetadata } : metadata ? { debug: metadata } : {})
  };
}

export async function generateResponse(message, messages = []) {
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  const modelId = process.env.BEDROCK_MODEL_ID?.trim();
  const client = getClient();

  if (!trimmedMessage) {
    throw new Error("Message is required.");
  }

  if (trimmedMessage.length > CHAT_LIMITS.maxMessageLength) {
    throw new Error("Message exceeds maximum length.");
  }

  if (!client || !modelId) {
    return finalizeReply(
      getMockResponse(trimmedMessage, messages),
      "mock",
      buildFallbackMetadata("missing_bedrock_config")
    );
  }

  try {
    const command = new ConverseCommand({
      modelId,
      system: [{ text: systemPrompt }],
      messages: toBedrockMessages(trimmedMessage, messages)
    });

    const response = await client.send(command);
    const reply = response.output?.message?.content
      ?.filter((item) => typeof item?.text === "string" && item.text.trim())
      .map((item) => item.text.trim())
      .join(" ")
      .trim();

    if (!reply) {
      throw new Error("Bedrock returned an empty response.");
    }

    if (isUnsafeReply(reply)) {
      console.warn("Bedrock reply blocked by safety filter.", {
        reason: "unsafe_reply_blocked",
        preview: normalizeReply(reply).slice(0, 200)
      });
    }

    return finalizeReply(reply, "bedrock");
  } catch (error) {
    console.error("Bedrock request failed, falling back to mock response.", {
      reason: "bedrock_request_failed",
      errorCode: error.code || error.name || "UnknownError",
      errorMessage: error.message,
      causeCode: error.cause?.code,
      causeMessage: error.cause?.message
    });

    return finalizeReply(
      getMockResponse(trimmedMessage, messages),
      "mock",
      buildFallbackMetadata("bedrock_request_failed", error.cause || error)
    );
  }
}
