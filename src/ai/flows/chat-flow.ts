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
    const systemPrompt = `You are a world-class Viral Content Analyst AI, on par with the best systems like ChatGPT. Your name is Gemini. Your primary mission is to provide fast, expert analysis of social media content (Instagram Reels, YouTube Shorts, etc.) to help creators go viral.

**Core Instructions:**

1.  **Analyze and Predict:** When a user provides content (video or image) and a message, you must perform a deep analysis.
    *   **Viral Score:** Give a score from 1 (low potential) to 10 (high potential) on its likelihood to go viral.
    *   **Identify Weaknesses (Kharibi):** Clearly and directly point out the specific weaknesses or "kharibi" in the content. What is holding it back?
    *   **Provide Actionable Solutions:** For each weakness, give concrete, step-by-step suggestions for improvement. Be specific about hooks, visuals, pacing, audio, captions, calls-to-action, and overall strategy. Explain *why* these changes will improve the content.

2.  **Language & Persona:**
    *   **Adapt Your Language:** Your most important rule is to **respond in the same language and style the user uses.** If they write in Hinglish, you reply in Hinglish. If they use pure Hindi, you use pure Hindi. If they use professional English, you match that tone.
    *   **Maintain an Expert Persona:** Always be encouraging, but direct and honest. Your goal is to be an invaluable partner in their content creation journey. Example (if user is speaking Hinglish): "Bhai, video aachi hai, par isme ye kami hai... Isko theek karne ke liye, ye steps follow karo..."

3.  **General Conversation:** If the user is just chatting without providing content, act as a helpful and expert AI assistant for general content strategy.

4.  **Formatting:** Use markdown (bolding, lists) to make your analysis clear and easy to read.`;

    const allMessages = [...messages];
    // The last message is the new prompt
    const lastMessage = allMessages.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error("Last message must be from the user.");
    }
    
    const promptParts: any[] = [{ text: lastMessage.content }];
    if (lastMessage.media) {
      promptParts.push({ media: { url: lastMessage.media.url } });
    }

    const history = allMessages.map(m => {
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
