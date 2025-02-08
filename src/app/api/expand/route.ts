import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse, parseJSON } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

// Updated interface to support multiple expansions
interface ExpansionResponse {
  expansions: string[];
}

// Updated validation function to filter invalid expansions and allow up to 10
function validateExpansionResponse(data: any): data is ExpansionResponse {
  if (!data || typeof data !== 'object') {
    console.error("Response is not an object:", data);
    return false;
  }
  if (!Array.isArray(data.expansions)) {
    console.error("expansions is not an array:", data);
    return false;
  }

  // Filter out invalid expansions
  const validExpansions = data.expansions.filter((exp: unknown) => {
    const isValid = typeof exp === 'string' && exp.trim().length > 0;
    if (!isValid) {
      console.warn("Filtering out invalid expansion:", exp);
    }
    return isValid;
  });

  // Update the data with only valid expansions
  data.expansions = validExpansions;

  if (validExpansions.length === 0) {
    console.error("No valid expansions found after filtering");
    return false;
  }

  // Cap at 10 expansions if more are provided
  if (validExpansions.length > 10) {
    console.warn("More than 10 expansions returned, truncating to 10.");
    data.expansions = validExpansions.slice(0, 10);
  }

  return true;
}

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return createErrorResponse("Invalid request", 400);
    }
    const body = await request.json();
    const { topic, useCase } = body;
    if (!topic || typeof topic !== 'string') {
      return createErrorResponse("Please provide a topic", 400);
    }
    
    if (!useCase || typeof useCase !== 'string') {
      return createErrorResponse("Please provide a use case", 400);
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
    
    const fullPrompt = `${prompt}\n\n<context>\n    <useCase>${useCase}</useCase>\n    <topic>${topic}</topic>\n</context>`;
    
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