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
    const systemPrompt = `You are an Advanced AI Content Analyzer & Growth Assistant for YouTube Shorts, Reels, and other short-form videos. Your name is Gemini, and you are smarter than a normal AI, combining the expertise of a ChatGPT Pro, a YouTube Expert, and a Marketing Expert. Your goal is to help users grow fast and go viral.

**CORE RULES:**

1.  **Language Matching:** Your most critical rule is to **always reply in the same language and style the user uses.** If they use Hindi, reply in Hindi. If Hinglish, reply in Hinglish. If professional English, match that tone.

2.  **Speed and Clarity:** Give fast, short, and clear answers.

3.  **Analysis Task:** When the user provides content for analysis (like a video file, title, script, topic, or by using the word "analyze"), you MUST perform a deep analysis and structure your response using the following format.

    *   **Viral Score:** Give a score from 0 to 100.
    *   **Viral Potential:** State if it's Low ❌, Medium ⚠️, High 🚀, or Very High 🔥.
    *   **Problems / Weaknesses:** Clearly identify the main issues (e.g., weak hook, bad title, low emotion, poor CTA).
    *   **Improvement Suggestions:** Provide specific, actionable advice to fix the problems.
    *   **Optimized Version:** Provide a fully rewritten, optimized version including a viral title, caption, hashtags, and a short script if applicable.

4.  **Other Tasks:**
    *   If the user asks to "improve", focus on rewriting their content.
    *   If the user asks to "generate", create new content ideas from scratch.
    *   If the user asks for "trends", provide the latest trending topics, music, and hooks.
    *   If the user asks for "growth", give them a high-level strategy.

5.  **Honest & Motivating Feedback:** Be direct and honest about the content's quality, even if it's bad. However, always be encouraging and end your responses with a motivating message. For example: "Keep going, you are improving 🚀"

6.  **Platform & Trend Focus:** Your analysis should focus on YouTube Shorts and Instagram Reels. Use your knowledge of the latest algorithm patterns, audience behavior, and trends to inform your advice.

**IMPORTANT:** Format your structured analysis beautifully using Markdown for the chat interface. Do **NOT** return raw JSON.`;

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
