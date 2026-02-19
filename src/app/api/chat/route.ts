import { NextResponse } from 'next/server';
import { smartChat, type ChatInput } from '@/ai/flows/chat-flow';

export const maxDuration = 120; // 2 minutes timeout for media analysis

export async function POST(request: Request) {
  try {
    const body: ChatInput = await request.json();

    if (!body.messages) {
      return NextResponse.json({ error: 'Missing messages in request body' }, { status: 400 });
    }

    const answer = await smartChat(body);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Smart Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
