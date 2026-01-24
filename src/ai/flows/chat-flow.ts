'use server';
/**
 * @fileOverview A chat AI flow that maintains conversation history.
 *
 * - sendMessage - A function that handles sending a message to the AI.
 * - ChatMessage - The type for a chat message (user or model).
 * - ChatInput - The input type for the sendMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatInputSchema = z.object({
  messages: z.array(ChatMessageSchema),
  topic: z.string().describe('The topic for the content.'),
});
type ChatInput = z.infer<typeof ChatInputSchema>;


export async function sendMessage(input: ChatInput): Promise<string> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async ({ messages, topic }) => {
    const systemPrompt = `You are an all-in-one AI content generator for Indian users. Your name is Gemini.
You are having a conversation with a user.
Keep your responses helpful, clean, and social-media ready.
Use emojis where suitable. Avoid offensive content.
The current conversation topic is: ${topic}`;

    // The last message is the new prompt
    const lastMessage = messages.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error("Last message must be from the user.");
    }

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: lastMessage.content,
      history: messages.map(m => ({role: m.role, parts: [{text: m.content}]})),
      config: {
        temperature: 0.7,
      },
    });

    return llmResponse.text;
  }
);
