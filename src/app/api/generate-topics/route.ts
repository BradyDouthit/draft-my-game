import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse, parseJSON } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: DEFAULT_MODELS.TOPIC_GENERATION });

// Log model configuration
console.log(`[Topic Generation] Using model: ${DEFAULT_MODELS.TOPIC_GENERATION}`);

interface TopicsResponse {
  topics: string[];
}

function validateTopicsResponse(data: any): data is TopicsResponse {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.topics)) return false;
  if (data.topics.length !== 10) return false;
  return data.topics.every(
    (topic: any) => typeof topic === "string" && topic.length > 0
  );
}

export async function POST(request: Request) {
  try {
    // Validate request
    if (!request.body) {
      return createErrorResponse("Request body is required", 400);
    }

    const body = await request.json();
    const { useCase } = body;

    if (!useCase || typeof useCase !== "string") {
      return createErrorResponse("Use case must be a non-empty string", 400);
    }

    if (useCase.length > 200) {
      return createErrorResponse("Use case is too long (max 200 characters)", 400);
    }

    // Validate API key
    const keyError = await validateAPIKey();
    if (keyError) {
      return createErrorResponse(keyError.error, keyError.status);
    }

    // Read system prompt
    const { prompt, error: promptError } = await readSystemPrompt(
      path.join(process.cwd(), "src", "app", "api", "generate-topics", "generateTopicsSystemPrompt.txt")
    );
    if (promptError) {
      return createErrorResponse(promptError.error, promptError.status);
    }

    // Make API call
    console.log(`[Topic Generation] Making request with model: ${DEFAULT_MODELS.TOPIC_GENERATION}`);
    const result = await model.generateContent(
      `${prompt}\n\nGenerate 10 interesting ideas relevant to someone who is ${useCase}.`
    );
    const response = await result.response;
    const content = response.text();

    // Log full response
    console.log('[Topic Generation] Raw response:', content);

    // Parse and validate response
    const { data, error: parseError } = await parseJSON<TopicsResponse>(content);
    if (parseError) {
      return createErrorResponse(parseError.error, parseError.status);
    }

    if (!validateTopicsResponse(data)) {
      return createErrorResponse("AI response did not match expected format", 500);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error generating topics:", error);
    return createErrorResponse("An unexpected error occurred");
  }
}
