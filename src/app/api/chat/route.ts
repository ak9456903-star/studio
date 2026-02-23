
import { NextResponse } from 'next/server';
import { smartChat, type ChatInput } from '@/ai/flows/chat-flow';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes timeout for AI processing

export async function POST(request: Request) {
  try {
    const body: ChatInput = await request.json();

    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Invalid or missing messages in request body' }, { status: 400 });
    }

    const answer = await smartChat(body);

    if (!answer) {
      return NextResponse.json({ error: 'AI failed to generate a response' }, { status: 500 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Smart Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during AI processing';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
