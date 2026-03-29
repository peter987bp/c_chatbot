import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const systemPrompt =
  "You are a helpful Caesars customer support assistant. Be concise. Suggest escalation if needed.";

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

  return messages
    .filter(
      (entry) =>
        entry &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.text === "string" &&
        entry.text.trim()
    )
    .map((entry) => ({
      role: entry.role,
      text: entry.text.trim()
    }));
}

function getMockResponse(message, messages = []) {
  const history = normalizeHistory(messages);
  const lastUserMessage = [...history].reverse().find((entry) => entry.role === "user")?.text;
  const contextPrefix = lastUserMessage
    ? `Continuing from your earlier message about "${lastUserMessage}", `
    : "";

  return `Mock support reply: ${contextPrefix}I understand you need help with "${message}". Please share any order number or account detail relevant to the issue. If this needs a live person, use Talk to Agent.`;
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

export async function generateResponse(message, messages = []) {
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  const modelId = process.env.BEDROCK_MODEL_ID?.trim();
  const client = getClient();

  if (!trimmedMessage) {
    throw new Error("Message is required.");
  }

  if (!client || !modelId) {
    return {
      reply: getMockResponse(trimmedMessage, messages),
      source: "mock"
    };
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

    return {
      reply,
      source: "bedrock"
    };
  } catch (error) {
    console.error("Bedrock request failed, falling back to mock response.", error);

    return {
      reply: getMockResponse(trimmedMessage, messages),
      source: "mock"
    };
  }
}