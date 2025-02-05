import { NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
const token = process.env.MISTRAL_API_KEY;
const client = new Mistral({
  apiKey: token || 'dummy-key', // Fallback for development
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { topic1, topic2 } = body;

    // Validate input
    if (!topic1 || !topic2) {
      return NextResponse.json(
        { error: 'Both topics are required' },
        { status: 400 }
      );
    }

    // For development/template purposes, return a mock response if no API key
    if (!token) {
      return NextResponse.json({
        combinedTopic: `Combined: ${topic1} + ${topic2}`,
        explanation: 'This is a mock response as no API key is configured.',
      });
    }

    // Prepare the prompt
    const prompt = `Combine these two topics in a creative and unexpected way:
    Topic 1: ${topic1}
    Topic 2: ${topic2}
    
    Generate a single new topic that combines elements of both in an interesting way.
    Respond in this format only:
    {
      "combinedTopic": "the new combined topic",
      "explanation": "brief explanation of how they connect"
    }`;

    // Call Mistral API
    const response = await client.chat.complete({
      model: 'mistral-tiny', // or your preferred model
      messages: [
        {
          role: 'system',
          content: 'You are a creative assistant that combines topics in unexpected ways.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      maxTokens: 200,
    });

    // Parse the response
    const content = response.choices?.[0]?.message?.content;
    if (!content || Array.isArray(content)) {
      throw new Error('Invalid response content from API');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      // Fallback if the response isn't valid JSON
      parsedResult = {
        combinedTopic: content,
        explanation: 'Generated topic combination',
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error combining topics:', error);
    return NextResponse.json(
      { error: 'Failed to combine topics' },
      { status: 500 }
    );
  }
} 
