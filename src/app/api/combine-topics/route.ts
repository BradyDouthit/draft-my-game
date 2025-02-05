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
    // Parse the request body
    const body = await request.json();
    const { topic1, topic2 } = body;

    // Validate input
    if (!topic1 || !topic2) {
      return NextResponse.json(
        { error: "Both topics are required" },
        { status: 400 }
      );
    }

    // Read system prompt from file
    const systemPromptPath = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      "combine-topics",
      "systemPrompt.txt"
    );
    const systemPrompt = await fs.readFile(systemPromptPath, "utf-8");

    // Prepare the prompt
    const prompt = `<topics>
    <topic1>${topic1}</topic1>
    <topic2>Topic 2: ${topic2}</topic2>
    </topics>
    `;

    // Call Mistral API with the correct configuration
    const response = await client.chat.complete({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1.0,
    });

    // Parse the response
    const content = response.choices?.[0]?.message?.content;
    console.log(response.choices)
    if (!content || Array.isArray(content)) {
      throw new Error("Invalid response content from API");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      // Fallback if the response isn't valid JSON
      parsedResult = {
        combinedTopic: content,
        explanation: "Generated topic combination",
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Error combining topics:", error);
    return NextResponse.json(
      { error: "Failed to combine topics" },
      { status: 500 }
    );
  }
}
