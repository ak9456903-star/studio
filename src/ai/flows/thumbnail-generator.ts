'use server';
/**
 * @fileOverview An AI flow for generating YouTube thumbnails from a video title.
 *
 * - generateThumbnail - A function that handles thumbnail generation.
 * - GenerateThumbnailInput - The input type for the generateThumbnail function.
 * - GenerateThumbnailOutput - The return type for the generateThumbnail function.
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
    // A more detailed prompt to guide the AI in creating a good thumbnail.
    const prompt = `Create a vibrant, high-contrast, and click-worthy YouTube thumbnail for a video titled: "${title}". 
    The image should be visually striking, emotionally engaging, and relevant to the video title.
    Focus on a central, clear subject. Use bold colors.
    IMPORTANT: Do NOT include any text in the image itself. The title will be overlayed later.`;
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { text: prompt }
        ],
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
            aspectRatio: '16:9', // YouTube thumbnail aspect ratio
        }
    });
    
    if (!media?.url) {
        throw new Error('Image generation failed to return a URL for the thumbnail.');
    }

    return { imageUrl: media.url };
  }
);
