'use server';
/**
 * @fileOverview AI flows for both deep content analysis and fast chatting.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
  topic: z.string().optional().describe('The topic for the content.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const AnalysisOutputSchema = z.object({
    viral_score: z.string().describe('The viral score from 0 to 100.'),
    status: z.string().describe('The viral potential status (e.g., Low ❌, Medium ⚠️, High 🚀, Very High 🔥).'),
    problems: z.array(z.string()).describe('A list of problems or weaknesses in the content.'),
    improvements: z.array(z.string()).describe('A list of suggestions for improvement.'),
    optimized_content: z.object({
        title: z.string().describe('An optimized, viral title.'),
        caption: z.string().describe('An optimized, engaging caption.'),
        hashtags: z.array(z.string()).describe('A list of relevant hashtags.'),
        script: z.string().describe('A rewritten, short script (15-60 seconds).'),
        cta: z.string().describe('A clear call-to-action.'),
    }),
});
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

/**
 * Performs a deep content analysis for viral potential.
 */
export async function analyzeContent(input: ChatInput): Promise<AnalysisOutput> {
  const result = await chatFlow(input);
  if (!result) {
    throw new Error("AI analysis failed to produce a result.");
  }
  return result;
}

/**
 * Provides a fast, direct answer to the user's message.
 */
export async function fastChat(input: ChatInput): Promise<string> {
  const result = await quickChatFlow(input);
  return result;
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async ({ messages }) => {
    const systemPrompt = `You are an Advanced AI Content Analyzer & Growth Assistant.
    Analyze the user's content (text, image, or video) and provide a detailed viral potential report in JSON format.
    Reply in the user's language (Hindi, Hinglish, or English).`;

    const lastMessage = messages[messages.length - 1];
    const promptParts: any[] = [{ text: lastMessage.content }];
    if (lastMessage.media) {
      promptParts.push({ media: { url: lastMessage.media.url } });
    }

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: promptParts,
      output: { schema: AnalysisOutputSchema },
      config: { temperature: 0.7 },
    });

    if (!llmResponse.output) throw new Error("Analysis failed.");
    return llmResponse.output;
  }
);

const quickChatFlow = ai.defineFlow(
  {
    name: 'quickChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async ({ messages }) => {
    const systemPrompt = `You are a helpful and extremely fast AI assistant for Indian content creators.
    Reply concisely and directly in the user's language (Hindi, Hinglish, or English).
    Avoid long explanations unless asked. Be friendly and motivating.`;

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: messages.map(m => ({ 
        role: m.role, 
        content: m.media ? [{ text: m.content }, { media: { url: m.media.url } }] : [{ text: m.content }] 
      })),
      config: { temperature: 0.5 },
    });

    return llmResponse.text;
  }
);
