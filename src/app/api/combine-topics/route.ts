import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

// Initialize Mistral client with the correct configuration
const token = process.env.MISTRAL_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Ministral-3B";

const client = new Mistral({
  apiKey: token || "dummy-key",
  serverURL: endpoint,
});

const systemPrompt = `You are a creative idea generator that combines topics in unexpected and meaningful ways.
Your goal is to create interesting combinations that spark new ideas and insights.

When given two topics, generate a creative combination that captures elements of both.
Your response must be in this exact JSON format:
{
  "combinedTopic": "1-3 words that blend both topics",
  "explanation": "brief explanation of how they connect"
}

Guidelines for combinations:
1. Keep the combined topic concise (1-3 words)
2. Make connections that are surprising yet meaningful
3. Focus on actionable or concrete concepts
4. Ensure the combination maintains elements from both original topics
5. Keep the explanation brief but insightful`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic1, topic2 } = body;

    if (!topic1 || !topic2) {
      return NextResponse.json(
        { error: "Both topics are required" },
        { status: 400 }
      );
    }

    // For development/template purposes, return mock response if no API key
    if (!token) {
      return NextResponse.json({
        combinedTopic: `Combined: ${topic1} + ${topic2}`,
        explanation: "This is a mock response as no API key is configured.",
      });
    }

    const response = await client.chat.complete({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Combine these topics in a creative and meaningful way:\nTopic 1: ${topic1}\nTopic 2: ${topic2}`,
        },
      ],
      temperature: 1.0,
    });

    const content = response.choices?.[0]?.message?.content;
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
