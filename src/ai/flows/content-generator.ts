'use server';
/**
 * @fileOverview A content generator AI flow.
 *
 * - generateContent - A function that handles the content generation.
 * - GenerateContentInput - The input type for the generateContent function.
 * - GenerateContentOutput - The return type for the generateContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContentInputSchema = z.object({
  taskType: z.string().describe('The type of content to generate.'),
  topic: z.string().describe('The topic for the content.'),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

export type GenerateContentOutput = string;

export async function generateContent(input: GenerateContentInput): Promise<GenerateContentOutput> {
  return contentGeneratorFlow(input);
}

const promptTemplate = `You are an all-in-one AI content generator for Indian users.

Task type: {TOOL_TYPE}

Rules:
- Language: english or Hindi as required
- Keep content viral, clean, and social-media ready
- Use emojis where suitable
- Avoid offensive content

If Task type = "Instagram Caption":
Generate 10 trendy captions with 3 hashtags each.

If Task type = "YouTube Title":
Generate 5 click-worthy titles and 1 SEO description (150 words).

If Task type = "Instagram Bio":
Generate 5 short bios under 150 characters.

If Task type = "Hashtag Generator":
Generate 20 hashtags (10 high reach + 10 low competition).

If Task type = "Motivation/Bhakti":
Generate 10 short inspirational quotes in simple Hindi.

User Input Topic: {USER_INPUT}`;


const contentGeneratorFlow = ai.defineFlow(
  {
    name: 'contentGeneratorFlow',
    inputSchema: GenerateContentInputSchema,
    outputSchema: z.string(),
  },
  async ({ taskType, topic }) => {
    const prompt = promptTemplate
        .replace('{TOOL_TYPE}', taskType)
        .replace('{USER_INPUT}', topic);

    const llmResponse = await ai.generate({
      prompt: prompt,
      config: {
        temperature: 0.8,
      }
    });

    return llmResponse.text;
  }
);
