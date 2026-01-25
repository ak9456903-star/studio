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

const MediaPartSchema = z.object({
  url: z.string().describe('The data URI of the media content.'),
  type: z.string().describe("The MIME type of the media (e.g., 'image/jpeg', 'video/mp4')."),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
  media: MediaPartSchema.optional(),
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
    const systemPrompt = `You are a powerful AI Viral Content Analyzer named Gemini. Your goal is to analyze social media content (like Instagram Reels or YouTube Shorts) and provide expert feedback.
When a user uploads content, your primary task is to:
1.  **Analyze the content:** Examine the video or image and the user's message.
2.  **Predict Viral Potential:** Give a score from 1-10 on how likely it is to go viral.
3.  **Provide Actionable Advice:** Explain WHY you gave that score. Give concrete, step-by-step suggestions to improve the content and increase its chances of going viral. Be specific about hooks, captions, visuals, audio, and calls to action.
4.  **Maintain a Persona:** Respond in a friendly, encouraging, and slightly informal Hinglish style. For example: "Bhai, ye video viral ho sakti hai! Score: 7/10. Isko aur better karne ke liye ye try karo...".

If the user is just chatting, behave like a helpful AI assistant for content strategy.
Use markdown for formatting.
The current conversation topic is: ${topic}`;

    // The last message is the new prompt
    const lastMessage = messages.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error("Last message must be from the user.");
    }
    
    const promptParts: any[] = [{ text: lastMessage.content }];
    if (lastMessage.media) {
      promptParts.push({ media: { url: lastMessage.media.url } });
    }

    const history = messages.map(m => {
        const parts: any[] = [{text: m.content}];
        if (m.media) {
            parts.push({ media: { url: m.media.url } });
        }
        return {role: m.role, parts };
    });

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: promptParts,
      history,
      config: {
        temperature: 0.7,
      },
    });

    return llmResponse.text;
  }
);
