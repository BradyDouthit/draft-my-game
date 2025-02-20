import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse, extractAllFromXML } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

interface GenerateTopicsRequest {
  useCase: string;
}

function validateGenerateTopicsRequest(data: any): data is GenerateTopicsRequest {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.useCase !== 'string' || !data.useCase) return false;
  return true;
}

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return createErrorResponse("Request body is required", 400);
    }

    const body = await request.json();
    if (!validateGenerateTopicsRequest(body)) {
      return createErrorResponse("Invalid request format", 400);
    }

    const keyError = await validateAPIKey();
    if (keyError) {
      return createErrorResponse(keyError.error, keyError.status);
    }

    const { prompt, error: promptError } = await readSystemPrompt(
      path.join(process.cwd(), "src", "app", "api", "generate-topics", "generateTopicsSystemPrompt.txt")
    );
    if (promptError) {
      return createErrorResponse(promptError.error, promptError.status);
    }

    const fullPrompt = `${prompt}\n\n<context>
  <useCase>${body.useCase}</useCase>
</context>`;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODELS.TOPIC_GENERATION });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    // Extract topics from XML response using the new utility function
    const topics = extractAllFromXML(content, 'topic');
    if (topics.length === 0) {
      return createErrorResponse("No valid topics found in response", 500);
    }

    return new NextResponse(JSON.stringify({ topics }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Unexpected error generating topics:", error);
    return createErrorResponse("An unexpected error occurred");
  }
}
