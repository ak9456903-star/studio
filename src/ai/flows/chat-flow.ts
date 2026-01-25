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


const AnalysisOutputSchema = z.object({
    viral_score: z.string().describe('The viral score from 0 to 100.'),
    status: z.string().describe('The viral potential status (e.g., Low ❌, Medium ⚠️, High 🚀).'),
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
type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

function formatAnalysisToMarkdown(analysis: AnalysisOutput): string {
    const problems = analysis.problems.length > 0
        ? analysis.problems.map(p => `- ${p}`).join('\n')
        : 'No major problems found. Great job!';

    const improvements = analysis.improvements.length > 0
        ? analysis.improvements.map(i => `- ${i}`).join('\n')
        : 'Keep up the good work!';

    return `
### Viral Analysis
**Viral Score:** ${analysis.viral_score}/100
**Status:** ${analysis.status}

---

#### 🚨 Problems / Weaknesses
${problems}

---

#### 💡 Improvement Suggestions
${improvements}

---

#### ✨ Optimized Version
**Title:** ${analysis.optimized_content.title}
**Caption:** ${analysis.optimized_content.caption}
**Hashtags:** ${analysis.optimized_content.hashtags.join(' ')}
**CTA:** ${analysis.optimized_content.cta}

**Script:**
> ${analysis.optimized_content.script.replace(/\n/g, '\n> ')}

---
*Keep going, you are improving 🚀*
    `.trim();
}


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
    const systemPrompt = `You are an Advanced AI Content Analyzer & Growth Assistant for YouTube Shorts, Reels, and other short-form videos. Your name is Gemini. Your goal is to help users grow fast and go viral.

**CORE RULES:**

1.  **Language Matching:** Always generate your analysis in the same language and style the user uses (e.g., Hindi, Hinglish, English).
2.  **Analysis Task:** When the user provides content for analysis (video, title, script, topic, etc.), perform a deep analysis and provide a viral score, status, problems, improvements, and a fully optimized version.
3.  **Other Tasks:** Handle requests to "improve", "generate", "trend", or "growth" by focusing on that specific task within your analysis.
4.  **Honest & Motivating:** Be direct and honest, but always be encouraging.
5.  **Platform Focus:** Your analysis should focus on YouTube Shorts and Instagram Reels, using knowledge of the latest algorithm patterns and trends.

**IMPORTANT:** You MUST return your response in the specified JSON format. Do NOT return Markdown or any other text format. Your entire output must be a single, valid JSON object that strictly follows the output schema.`;

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
        const fallbackText = llmResponse.text;
        if (fallbackText) return fallbackText;
        return "Sorry, I couldn't analyze the content right now. Please try again.";
    }
    
    // Format the JSON analysis into a user-friendly Markdown string
    return formatAnalysisToMarkdown(analysis);
  }
);
