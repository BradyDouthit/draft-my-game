import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

// Only include the properties we need for document generation
// while maintaining compatibility with TopicState from KonvaStage
type Topic = {
  id: string;
  text: string;
  // These properties are optional since they come from TopicState
  // but aren't needed for document generation
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  parentId?: string;
};

interface DocumentRequest {
  useCase: string;
  topics: Topic[];
}

function validateDocumentRequest(data: any): data is DocumentRequest {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.useCase !== 'string' || !data.useCase) return false;
  if (!Array.isArray(data.topics)) return false;
  if (data.topics.length === 0) return false;
  
  return data.topics.every((topic: any) => {
    if (typeof topic !== 'object') return false;
    if (typeof topic.text !== 'string' || !topic.text) return false;
    return true;
  });
}

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return createErrorResponse("Request body is required", 400);
    }

    const body = await request.json();
    if (!validateDocumentRequest(body)) {
      return createErrorResponse("Invalid request format", 400);
    }

    const keyError = await validateAPIKey();
    if (keyError) {
      return createErrorResponse(keyError.error, keyError.status);
    }

    const { prompt, error: promptError } = await readSystemPrompt(
      path.join(process.cwd(), "src", "app", "api", "create-document", "systemPrompt.txt")
    );
    if (promptError) {
      return createErrorResponse(promptError.error, promptError.status);
    }

    // Format topics for the input context - flat list without expansions
    const topicsXML = body.topics.map(topic => {
      return `    <topic>
      <text>${topic.text}</text>
    </topic>`;
    }).join('\n');

    const fullPrompt = `${prompt}\n\n<context>
  <useCase>${body.useCase}</useCase>
  <topics>
${topicsXML}
  </topics>
</context>`;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODELS.TOPIC_GENERATION });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  } catch (error) {
    console.error("Unexpected error generating document:", error);
    return createErrorResponse("An unexpected error occurred");
  }
} 