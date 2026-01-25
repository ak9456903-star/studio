import { NextResponse } from 'next/server';
import { sendMessage, type ChatInput } from '@/ai/flows/chat-flow';

export async function POST(request: Request) {
  try {
    const body: ChatInput = await request.json();

    if (!body.messages || !body.topic) {
      return NextResponse.json({ error: 'Missing messages or topic in request body' }, { status: 400 });
    }

    const analysisResult = await sendMessage(body);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
