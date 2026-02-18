'use server';
/**
 * @fileOverview AI flows for smart content assistance with automatic intent detection and viral optimization.
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
    improvements: z.array(z.string()).optional().describe('Suggestions for improvement to ensure virality.'),
    optimized_content: z.object({
        title: z.string().optional().describe('A high-CTR, viral-ready title.'),
        caption: z.string().optional().describe('An engaging caption with a hook.'),
        hashtags: z.array(z.string()).optional(),
        script: z.string().optional().describe('An optimized script or hook rewrite.'),
        cta: z.string().optional().describe('A strong call to action.'),
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
    const systemPrompt = `You are a World-Class Viral Content Strategist for Indian Creators. Your mission is to take any idea, script, or video and optimize it for maximum viral potential on YouTube, Reels, and Shorts.

    LANGUAGE & STYLE:
    - Respond in a mix of Hindi and Hinglish (Hinglish mix) to sound natural and friendly.
    - Aapka tone ek expert dost jaisa hona chahiye. Use common Indian internet slang if appropriate.
    - If the user explicitly asks for pure English or pure Hindi, follow that preference.

    INTENT DETECTION & STRATEGY:
    1. DEEP VIRAL ANALYSIS: If the user provides content (text, image, or video) for review:
       - Set is_analysis = true.
       - Provide a brutal but constructive viral score (0-100).
       - Identify why it might fail (problems) and exactly how to fix it (improvements).
       - Generate "Guaranteed Viral" versions of the Title, Caption, and Script.
       - Match the cultural context of India (trends, emotions, humor).

    2. CHATGPT-STYLE ASSISTANCE: If the user is just brainstorming or chatting:
       - Set is_analysis = false.
       - Provide a "ChatGPT-style" response: helpful, conversational, and Insightful in Hindi/Hinglish.

    GUIDELINES:
    - FORMATTING: Use Markdown (bold, lists, headers).
    - EXPERTISE: Focus on hooks, retention, and CTR (Click-Through Rate).
    - LONG VIDEOS: If the user mentions a 20-30 min video, focus on finding the "Viral Core" segments.`;

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
