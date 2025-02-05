import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { promises as fs } from "fs";
import path from "path";

// Initialize Mistral client with the correct configuration
const token = process.env.MISTRAL_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Mistral-large-2407";

const client = new Mistral({
  apiKey: token || "dummy-key",
  serverURL: endpoint,
});

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
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { topic1, topic2 } = body;

    // Input validation
    if (!topic1 || typeof topic1 !== 'string' || !topic2 || typeof topic2 !== 'string') {
      return NextResponse.json(
        { error: "Please provide two topics" },
        { status: 400 }
      );
    }

    if (topic1.length > 100 || topic2.length > 100) {
      return NextResponse.json(
        { error: "Topics are too long" },
        { status: 400 }
      );
    }

    // API key validation
    if (!token) {
      console.error("Missing API configuration");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Read and validate system prompt
    let systemPrompt: string;
    try {
      const systemPromptPath = path.join(
        process.cwd(),
        "src",
        "app",
        "api",
        "combine-topics",
        "systemPrompt.txt"
      );
      systemPrompt = await fs.readFile(systemPromptPath, "utf-8");
      
      if (!systemPrompt || systemPrompt.length === 0) {
        throw new Error("System prompt is empty");
      }
    } catch (error) {
      console.error("Error reading system prompt:", error);
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 503 }
      );
    }

    // Make API call
    const response = await client.chat.complete({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `<topics>\n    <topic1>${topic1}</topic1>\n    <topic2>${topic2}</topic2>\n</topics>`,
        },
      ],
      temperature: 1.0,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || Array.isArray(content)) {
      console.error("Invalid AI service response");
      return NextResponse.json(
        { error: "Unable to generate combination" },
        { status: 500 }
      );
    }

    let parsedResult: unknown;
    try {
      parsedResult = JSON.parse(content);
      console.log("Parsed response:", parsedResult);
    } catch (e) {
      console.error("Failed to parse response:", content);
      return NextResponse.json(
        { error: "Unable to process response" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!validateCombinedResponse(parsedResult)) {
      console.error("Invalid response structure");
      return NextResponse.json(
        { error: "Unable to generate valid combination" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
