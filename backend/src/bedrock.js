import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const systemPrompt =
  "You are a helpful customer support assistant. Be concise. Suggest escalation if needed.";

function getClient() {
  const region = process.env.AWS_REGION;

  if (!region) {
    return null;
  }

  return new BedrockRuntimeClient({ region });
}

function getMockResponse(message) {
  return `Mock support reply: I understand you need help with "${message}". Please share any order number or account detail relevant to the issue. If this needs a live person, use Talk to Agent.`;
}

export async function generateResponse(message) {
  const modelId = process.env.BEDROCK_MODEL_ID;
  const client = getClient();

  if (!client || !modelId) {
    return getMockResponse(message);
  }

  try {
    const command = new ConverseCommand({
      modelId,
      system: [
        {
          text: systemPrompt
        }
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              text: message
            }
          ]
        }
      ]
    });

    const response = await client.send(command);
    const text = response.output?.message?.content
      ?.filter((item) => item.text)
      .map((item) => item.text)
      .join(" ")
      .trim();

    return text || getMockResponse(message);
  } catch (error) {
    console.error("Bedrock request failed, falling back to mock response.", error);
    return getMockResponse(message);
  }
}
