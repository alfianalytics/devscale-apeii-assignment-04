import { OpenAIClient } from "@anvia/openai";
import "dotenv/config";

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY!,
  baseUrl: process.env.OPENAI_BASE_URL,
});

export function getModel(modelId: string = process.env.MODEL_ID || "gpt-5.6-luna") {
  return client.completionModel({ modelId, api: "chat" });
}
