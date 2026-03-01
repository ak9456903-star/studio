'use server';
/**
 * @fileOverview An AI flow for generating YouTube thumbnails using Gemini 2.5 Flash Image (Nano-Banana).
 * Includes a fallback mechanism for quota and billing errors to ensure prototype stability.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateThumbnailInputSchema = z.object({
  title: z.string().describe('The title of the YouTube video.'),
});
export type GenerateThumbnailInput = z.infer<typeof GenerateThumbnailInputSchema>;

const GenerateThumbnailOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI or URL of the generated thumbnail image."),
    isMock: z.boolean().optional().describe("True if a fallback image was provided due to API limitations."),
});
export type GenerateThumbnailOutput = z.infer<typeof GenerateThumbnailOutputSchema>;

// A high-impact cinematic placeholder image for thumbnails (User Provided Fallback)
const FALLBACK_THUMBNAIL_URL = "https://picsum.photos/seed/youtube-viral/1280/720";

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
    try {
      // Using Gemini 2.5 Flash Image (Nano-Banana) for generation
      const prompt = `Create a high-impact, viral YouTube thumbnail for a video titled: "${title}". 
      Visual style: High contrast, cinematic lighting, vibrant colors, 16:9 aspect ratio.
      The image should look professionally designed and attention-grabbing.
      IMPORTANT: Do not include any text in the image.`;
      
      const { media } = await ai.generate({
          model: 'googleai/gemini-2.5-flash-image',
          prompt: prompt,
          config: {
              responseModalities: ['IMAGE', 'TEXT'],
          }
      });
      
      if (!media?.url) {
          throw new Error('Nano-Banana image generation failed to return a media URL.');
      }

      return { imageUrl: media.url };
    } catch (error: any) {
      console.error("Thumbnail Generation Error:", error.message);
      
      // FALLBACK: If quota exceeded (429), billing issues, or model not available
      if (
        error.message.includes('quota') || 
        error.message.includes('billing') || 
        error.message.includes('429') || 
        error.message.includes('not available') ||
        error.message.includes('limit')
      ) {
        return { 
          imageUrl: FALLBACK_THUMBNAIL_URL,
          isMock: true
        };
      }
      
      throw error;
    }
  }
);
