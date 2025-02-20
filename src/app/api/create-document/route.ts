import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { validateAPIKey, readSystemPrompt, createErrorResponse, extractFromXML } from "@/utils/api-validation";
import { DEFAULT_MODELS } from "@/utils/llm-constants";

// Only include the properties we need for document generation
// while maintaining compatibility with TopicState from KonvaStage
type Topic = {
  id: string;
  text: string;
  expansions?: string[];
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
    if (topic.expansions && !Array.isArray(topic.expansions)) return false;
    if (topic.expansions) {
      return topic.expansions.every((exp: any) => typeof exp === 'string' && exp);
    }
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

    // Format topics and expansions for the prompt
    const topicsXML = body.topics.map(topic => {
      const expansionsXML = topic.expansions 
        ? topic.expansions.map(exp => `        <expansion>${exp}</expansion>`).join('\n')
        : '';
      
      return `    <topic>
      <text>${topic.text}</text>
${expansionsXML ? `      <expansions>\n${expansionsXML}\n      </expansions>` : ''}
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

    // Extract HTML content from XML response
    const htmlContent = extractFromXML(content, 'content');
    if (!htmlContent) {
      return createErrorResponse("Failed to extract content from response", 500);
    }

    // Add styling wrapper around the HTML content
    const styledHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3 { color: #2c5282; }
    h1 { font-size: 2rem; margin-bottom: 2rem; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
    h3 { font-size: 1.2rem; margin: 1.5rem 0 0.75rem; }
    p { margin: 0.75rem 0; }
    ul { margin: 0.5rem 0; padding-left: 2rem; }
    li { margin: 0.25rem 0; }
    .meta { color: #666; font-style: italic; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    return new NextResponse(styledHtmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error("Unexpected error generating document:", error);
    return createErrorResponse("An unexpected error occurred");
  }
} 