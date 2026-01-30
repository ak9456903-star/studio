'use server';
/**
 * @fileOverview An AI flow for generating videos from text prompts.
 *
 * - generateVideo - A function that handles video generation.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt for video generation.'),
  duration: z.number().min(5).max(8).default(5).describe('The duration of the video in seconds (5-8).'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
    videoUrl: z.string().describe("The data URI of the generated video."),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return videoGeneratorFlow(input);
}

const videoGeneratorFlow = ai.defineFlow(
  {
    name: 'videoGeneratorFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ prompt, duration }) => {
    try {
      const fetch = (await import('node-fetch')).default;

      let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt,
        config: {
          durationSeconds: duration,
          aspectRatio: '16:9',
        },
      });

      if (!operation) {
        throw new Error('Expected the model to return an operation');
      }

      // Wait until the operation completes. This may take a while.
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
        throw new Error(`Failed to generate video: ${operation.error.message}`);
      }

      const videoPart: any = operation.output?.message?.content.find((p: any) => !!p.media);
      if (!videoPart?.media?.url) {
        throw new Error('Failed to find the generated video URL in the operation result.');
      }
      
      // The URL is a signed URL to download the video. We need to fetch it and convert to a data URI.
      // The google-genai plugin requires an API key for this download step, which is assumed to be in the environment.
      const videoDownloadResponse = await fetch(
        `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
      );

      if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
          throw new Error(`Failed to download video from generated URL: ${videoDownloadResponse.statusText}`);
      }
      
      const videoBuffer = await videoDownloadResponse.arrayBuffer();
      const videoBase64 = Buffer.from(videoBuffer).toString('base64');
      
      const contentType = videoPart.media.contentType || 'video/mp4';

      return {
        videoUrl: `data:${contentType};base64,${videoBase64}`,
      };
    } catch (e: any) {
        if (e.message && (e.message.includes('billing enabled') || e.message.includes('User location is not supported'))) {
            throw new Error('This feature requires a billing-enabled Google Cloud account and is not available in all regions. Please check your project settings.');
        }
        // Re-throw other errors
        throw e;
    }
  }
);
