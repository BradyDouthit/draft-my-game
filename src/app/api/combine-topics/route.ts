import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse, parseJSON } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: DEFAULT_MODELS.TOPIC_COMBINATION });

// Log model configuration
console.log(`[Topic Combination] Using model: ${DEFAULT_MODELS.TOPIC_COMBINATION}`);

interface CombinedTopicResponse {
  combinedTopic: string;
}

function validateCombinedResponse(data: any): data is CombinedTopicResponse {
  if (!data || typeof data !== 'object') {
    console.error("Response is not an object:", data);
    return false;
  }
  if (typeof data.combinedTopic !== 'string') {
    console.error("combinedTopic is not a string:", data);
    return false;
  }
  if (data.combinedTopic.length === 0) {
    console.error("combinedTopic is empty");
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  try {
    // Validate request
    if (!request.body) {
      return createErrorResponse("Invalid request", 400);
    }

    const body = await request.json();
    const { topic1, topic2 } = body;

    // Input validation
    if (!topic1 || typeof topic1 !== 'string' || !topic2 || typeof topic2 !== 'string') {
      return createErrorResponse("Please provide two topics", 400);
    }

    if (topic1.length > 100 || topic2.length > 100) {
      return createErrorResponse("Topics are too long", 400);
    }

    // Validate API key
    const keyError = await validateAPIKey();
    if (keyError) {
      return createErrorResponse(keyError.error, keyError.status);
    }

    // Read system prompt
    const { prompt, error: promptError } = await readSystemPrompt(
      path.join(process.cwd(), "src", "app", "api", "combine-topics", "systemPrompt.txt")
    );
    if (promptError) {
      return createErrorResponse(promptError.error, promptError.status);
    }

    // Make API call
    console.log(`[Topic Combination] Making request with model: ${DEFAULT_MODELS.TOPIC_COMBINATION}`);
    const result = await model.generateContent(
      `${prompt}\n\n<topics>\n    <topic1>${topic1}</topic1>\n    <topic2>${topic2}</topic2>\n</topics>`
    );
    const response = await result.response;
    const content = response.text();

    // Log full response
    console.log('[Topic Combination] Raw response:', content);

    // Parse and validate response
    const { data, error: parseError } = await parseJSON<CombinedTopicResponse>(content);
    if (parseError) {
      return createErrorResponse(parseError.error, parseError.status);
    }

    if (!validateCombinedResponse(data)) {
      return createErrorResponse("Unable to generate valid combination", 500);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Something went wrong");
  }
}
