import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export interface APIErrorResponse {
  error: string;
  status: number;
}

export async function validateAPIKey(): Promise<APIErrorResponse | null> {
  if (!process.env.GOOGLE_API_KEY) {
    return {
      error: "API configuration is missing",
      status: 500
    };
  }
  return null;
}

export async function readSystemPrompt(promptPath: string): Promise<{ prompt: string; error?: APIErrorResponse }> {
  try {
    const systemPrompt = await fs.readFile(promptPath, "utf-8");
    
    if (!systemPrompt || systemPrompt.length === 0) {
      return {
        prompt: "",
        error: {
          error: "System prompt is empty",
          status: 500
        }
      };
    }

    return { prompt: systemPrompt };
  } catch (error) {
    console.error("Error reading system prompt:", error);
    return {
      prompt: "",
      error: {
        error: "Failed to load system configuration",
        status: 500
      }
    };
  }
}

export function createErrorResponse(error: string, status: number = 500) {
  return NextResponse.json({ error }, { status });
}

export async function parseJSON<T>(content: string): Promise<{ data?: T; error?: APIErrorResponse }> {
  try {
    // Clean the response if it contains markdown code blocks
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content
        .replace(/```json\n?/g, '')  // Remove ```json and optional newline
        .replace(/```\n?/g, '')      // Remove closing ``` and optional newline
        .trim();                     // Remove any extra whitespace
    }

    // Log the cleaning process if it happened
    if (cleanContent !== content) {
      console.log('[JSON Parser] Cleaned markdown from response');
      console.log('[JSON Parser] Original:', content);
      console.log('[JSON Parser] Cleaned:', cleanContent);
    }

    const parsedData = JSON.parse(cleanContent);
    return { data: parsedData };
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return {
      error: {
        error: "Failed to parse response",
        status: 500
      }
    };
  }
} 