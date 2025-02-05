import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { promises as fs } from "fs";
import path from "path";

// Initialize Mistral client with the correct configuration
const token = process.env.MISTRAL_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Ministral-3B";

const client = new Mistral({
  apiKey: token || "dummy-key",
  serverURL: endpoint,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { useCase } = body;

    console.log(`Generating for use case ${useCase}`);
    if (!useCase) {
      return NextResponse.json(
        { error: "Use case is required" },
        { status: 400 }
      );
    }

    // For development/template purposes, return mock response if no API key
    if (!token) {
      return NextResponse.json(
        { error: "Unexpected error" },
        { status: 500 }
      );
    }

    // Read system prompt from file
    const systemPromptPath = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      "generate-topics",
      "generateTopicsSystemPrompt.txt"
    );
    const systemPrompt = await fs.readFile(systemPromptPath, "utf-8");

    const response = await client.chat.complete({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate 10 interesting ideas relevant to someone who is ${useCase}.`,
        },
      ],
      temperature: 1.0,
    });
    console.log(response);

    const content = response.choices?.[0]?.message?.content;
    if (!content || Array.isArray(content)) {
      throw new Error("Invalid response content from API");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to parse API response");
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Error generating topics:", error);
    return NextResponse.json(
      { error: "Failed to generate topics" },
      { status: 500 }
    );
  }
}
