'use server';
/**
 * @fileOverview An AI flow for generating YouTube thumbnails using Gemini 2.5 Flash Image (Nano-Banana).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateThumbnailInputSchema = z.object({
  title: z.string().describe('The title of the YouTube video.'),
});
export type GenerateThumbnailInput = z.infer<typeof GenerateThumbnailInputSchema>;

const GenerateThumbnailOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI of the generated thumbnail image."),
});
export type GenerateThumbnailOutput = z.infer<typeof GenerateThumbnailOutputSchema>;

export async function generateThumbnail(input: GenerateThumbnailInput): Promise<GenerateThumbnailOutput> {
  return thumbnailGeneratorFlow(input);
}

const thumbnailGeneratorFlow = ai.defineFlow(
  {
    name: 'thumbnailGeneratorFlow',
    inputSchema: GenerateThumbnailInputSchema,
    outputSchema: GenerateThumbnailOutputSchema,
  },
  async ({ title }) => {
    // Using Gemini 2.5 Flash Image (Nano-Banana) for generation/editing
    const prompt = `Create a high-impact, viral YouTube thumbnail for: "${title}". 
    Visual style: High contrast, cinematic lighting, 16:9 aspect ratio, 4K resolution.
    The image should be visually striking and grab attention instantly.
    IMPORTANT: Do not include any text in the image.`;
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: prompt,
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
        }
    });
    
    if (!media?.url) {
        throw new Error('Nano-Banana image generation failed.');
    }

    return { imageUrl: media.url };
  }
);
