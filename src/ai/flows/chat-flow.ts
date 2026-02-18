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
    is_analysis: z.boolean().describe('True if the user is asking for content analysis or optimization.'),
    viral_score: z.string().optional().describe('The viral score from 0 to 100.'),
    status: z.string().optional().describe('The viral potential status.'),
    problems: z.array(z.string()).optional().describe('Weaknesses in the content.'),
    improvements: z.array(z.string()).optional().describe('Suggestions for improvement.'),
    optimized_content: z.object({
        title: z.string().optional(),
        caption: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        script: z.string().optional(),
        cta: z.string().optional(),
    }).optional(),
    chat_response: z.string().optional().describe('Concise chat response if NOT a deep analysis.'),
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
    const systemPrompt = `You are a Smart AI Content Assistant for Indian Creators.
    
    TASK:
    1. Detect Intent: Is the user asking for content analysis, script optimization, viral potential, or thumbnail ideas? 
       - If YES: Set is_analysis = true and fill out the analysis fields.
       - If NO (e.g., "Hi", "Tell me a joke", "How are you?"): Set is_analysis = false and provide a friendly chat_response.

    2. Language: Reply in the user's language (Hindi, Hinglish, or English).
    3. Media: If an image or video is provided, prioritize analyzing its visual quality and hook potential.`;

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

    if (!llmResponse.output) throw new Error("AI failed to respond.");
    return llmResponse.output;
  }
);
