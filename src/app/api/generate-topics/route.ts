import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { useCase } = body;

    if (!useCase || typeof useCase !== "string") {
      return NextResponse.json(
        { error: "Use case must be a non-empty string" },
        { status: 400 }
      );
    }

    if (useCase.length > 200) {
      return NextResponse.json(
        { error: "Use case is too long (max 200 characters)" },
        { status: 400 }
      );
    }

    // API key validation
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "API configuration is missing" },
        { status: 500 }
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
        "generate-topics",
        "generateTopicsSystemPrompt.txt"
      );
      systemPrompt = await fs.readFile(systemPromptPath, "utf-8");

      if (!systemPrompt || systemPrompt.length === 0) {
        throw new Error("System prompt is empty");
      }
    } catch (error) {
      console.error("Error reading system prompt:", error);
      return NextResponse.json(
        { error: "Failed to load system configuration" },
        { status: 500 }
      );
    }

    // Make API call
    const prompt = `${systemPrompt}\n\nGenerate 10 interesting ideas relevant to someone who is ${useCase}.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();

    let parsedResult: unknown;
    try {
      if (content.includes("```json")) {
        content = content.replaceAll("```json", "").replaceAll("```", "");
      }
      parsedResult = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "AI response was not in valid JSON format" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!validateTopicsResponse(parsedResult)) {
      console.error("Invalid response structure:", parsedResult);
      return NextResponse.json(
        { error: "AI response did not match expected format" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Unexpected error generating topics:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
