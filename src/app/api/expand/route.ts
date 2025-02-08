import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse, parseJSON } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

// Updated interface to support multiple expansions
interface ExpansionResponse {
  expansions: string[];
}

// Updated validation function to ensure 'expansions' is a non-empty array of strings and capped at 5 elements
function validateExpansionResponse(data: any): data is ExpansionResponse {
  if (!data || typeof data !== 'object') {
    console.error("Response is not an object:", data);
    return false;
  }
  if (!Array.isArray(data.expansions)) {
    console.error("expansions is not an array:", data);
    return false;
  }
  if (data.expansions.length === 0) {
    console.error("expansions array is empty");
    return false;
  }
  if (data.expansions.length > 5) {
    console.warn("More than 5 expansions returned, truncating to 5.");
    data.expansions = data.expansions.slice(0, 5);
  }
  for (const exp of data.expansions) {
    if (typeof exp !== 'string' || exp.trim().length === 0) {
      console.error("One of the expansions is invalid:", exp);
      return false;
    }
  }
  return true;
}

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return createErrorResponse("Invalid request", 400);
    }
    const body = await request.json();
    const { topic } = body;
    if (!topic || typeof topic !== 'string') {
      return createErrorResponse("Please provide a topic", 400);
    }
    
    const keyError = await validateAPIKey();
    if (keyError) {
      return createErrorResponse(keyError.error, keyError.status);
    }
    
    const { prompt, error: promptError } = await readSystemPrompt(
      path.join(process.cwd(), "src", "app", "api", "expand", "systemPrompt.txt")
    );
    if (promptError) {
      return createErrorResponse(promptError.error, promptError.status);
    }
    
    const fullPrompt = `${prompt}\n\n<topic>${topic}</topic>`;
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    // Reuse the TOPIC_GENERATION model for expansion
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODELS.TOPIC_GENERATION });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();
    
    const { data, error: parseError } = await parseJSON<ExpansionResponse>(content);
    if (parseError) {
      return createErrorResponse(parseError.error, parseError.status);
    }
    if (!validateExpansionResponse(data)) {
      return createErrorResponse("Unable to generate valid expansion", 500);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in expansion:", error);
    return createErrorResponse("Something went wrong", 500);
  }
} 