'use server';
/**
 * @fileOverview AI flows for smart content assistance with automatic intent detection.
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
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const AnalysisOutputSchema = z.object({
    is_analysis: z.boolean().describe('True if the user is asking for content analysis, script optimization, or viral check.'),
    viral_score: z.string().optional().describe('The viral score from 0 to 100.'),
    status: z.string().optional().describe('The viral potential status (e.g., High Potential, Needs Work).'),
    problems: z.array(z.string()).optional().describe('Weaknesses in the content.'),
    improvements: z.array(z.string()).optional().describe('Suggestions for improvement.'),
    optimized_content: z.object({
        title: z.string().optional(),
        caption: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        script: z.string().optional(),
        cta: z.string().optional(),
    }).optional(),
    chat_response: z.string().optional().describe('Friendly, helpful, and detailed ChatGPT-style response if NOT a deep analysis or as a preamble.'),
});
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

/**
 * Smartly routes the user request to either deep analysis or fast chat.
 */
export async function smartChat(input: ChatInput): Promise<AnalysisOutput> {
  return smartChatFlow(input);
}

const smartChatFlow = ai.defineFlow(
  {
    name: 'smartChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async ({ messages }) => {
    const systemPrompt = `You are a World-Class AI Content Assistant for Indian Creators, inspired by the conversational excellence of ChatGPT.
    
    INTENT DETECTION:
    1. If the user provides a script, title, or video idea and asks for feedback, viral potential, or optimization:
       - Set is_analysis = true.
       - Provide a detailed viral analysis including score, problems, and improvements.
       - Offer an optimized version of their content.
    2. If the user asks a general question, wants to brainstorm, or is just chatting:
       - Set is_analysis = false.
       - Provide a "ChatGPT-style" response: helpful, conversational, well-formatted, and insightful.

    GUIDELINES:
    - LANGUAGE: Always match the user's language (Hindi, Hinglish, or English).
    - FORMATTING: Use Markdown for beautiful formatting (bold, lists, headers).
    - PERSONALITY: Be encouraging, professional, and culturally relevant to India.
    - MEDIA: If they upload an image/video, analyze its visual hook and aesthetic.`;

    const lastMessage = messages[messages.length - 1];
    const promptParts: any[] = [{ text: lastMessage.content }];
    if (lastMessage.media) {
      promptParts.push({ media: { url: lastMessage.media.url } });
    }

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: promptParts,
      output: { schema: AnalysisOutputSchema },
      config: { temperature: 0.75 },
    });

    if (!llmResponse.output) throw new Error("AI failed to respond.");
    return llmResponse.output;
  }
);
