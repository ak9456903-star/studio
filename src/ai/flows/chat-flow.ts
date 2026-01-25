'use server';
/**
 * @fileOverview A chat AI flow that maintains conversation history.
 *
 * - sendMessage - A function that handles sending a message to the AI.
 * - ChatMessage - The type for a chat message (user or model).
 * - ChatInput - The input type for the sendMessage function.
 * - AnalysisOutput - The structured output from the AI analysis.
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
export type ChatInput = z.infer<typeof ChatInputSchema>;


export const AnalysisOutputSchema = z.object({
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


export async function sendMessage(input: ChatInput): Promise<AnalysisOutput> {
  const result = await chatFlow(input);
  if (!result) {
    throw new Error("AI analysis failed to produce a result.");
  }
  return result;
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async ({ messages, topic }) => {
    const systemPrompt = `You are an Advanced AI Content Analyzer & Growth Assistant for YouTube Shorts, Instagram Reels, and Facebook Reels.

**CORE INSTRUCTIONS:**

1.  **LANGUAGE RULE:** Reply in the same language and style as the user (e.g., Hindi, Hinglish, or English).

2.  **TASK MODES:** Based on the user's request, perform one of the following tasks:
    *   **"analyze"**: Deeply analyze the provided content (title, script, video, etc.).
    *   **"improve"**: Rewrite the user's content to be better and more viral.
    *   **"generate"**: Create new viral content ideas from a topic.
    *   **"trend"**: Provide the latest trending ideas (music, topics, hooks).
    *   **"growth"**: Give the user a high-level growth strategy.

3.  **ANALYSIS & SCORING:** When analyzing, use this rubric to calculate the viral score:
    *   Strong hook: +20
    *   High Emotion: +20
    *   Trend Relevance: +20
    *   Watch Retention Potential: +20
    *   CTA & SEO: +20

4.  **FEEDBACK STYLE:** Always be honest. If content is weak, state it clearly but always follow up with motivating and actionable advice.

5.  **OUTPUT FORMAT:** Your entire output MUST be a single, valid JSON object that strictly follows the output schema. Do NOT return any other text, markdown, or commentary outside of the pure JSON structure.
`;

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
      output: { schema: AnalysisOutputSchema }, // Ask for structured JSON
      config: {
        temperature: 0.7,
      },
    });

    const analysis = llmResponse.output;
    if (!analysis) {
        // Fallback for when structured output fails
        throw new Error("Sorry, I couldn't analyze the content right now. Please try again.");
    }
    
    return analysis;
  }
);
