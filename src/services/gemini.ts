import { GoogleGenAI } from "@google/genai";

const STYLES = [
  {
    id: "cinematic-hero",
    name: "Cinematic Hero",
    description: "Dark moody background, dramatic lighting, high contrast.",
    prompt: "Cinematic Hero Look – dark moody background, dramatic lighting, high contrast, intense expression. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "royal-king",
    name: "Royal King",
    description: "Elegant outfit, golden light, luxury background.",
    prompt: "Royal King Style – elegant royal outfit style, golden light, soft depth of field, luxury palace background. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "bike-rider",
    name: "Bike Rider",
    description: "Night city, neon lights, cinematic grading.",
    prompt: "Bike Rider Attitude – night city background, neon lights, cinematic color grading, wearing a leather jacket. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "fitness-model",
    name: "Fitness Model",
    description: "Gym lighting, strong definition, sports vibe.",
    prompt: "Fitness Model Style – gym lighting, strong body definition, sports photoshoot vibe, athletic wear. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "rain-effect",
    name: "Rain Effect",
    description: "Realistic rain, wet hair, blue cinematic tone.",
    prompt: "Rain Effect Portrait – realistic rain overlay, wet hair look, blue cinematic tone, moody atmosphere. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "mafia-boss",
    name: "Mafia Boss",
    description: "Black suit, dark background, serious expression.",
    prompt: "Mafia Boss Style – black suit look, dark background, serious expression, movie poster vibe. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "gamer-setup",
    name: "Gamer Setup",
    description: "RGB lighting, blue and purple glow.",
    prompt: "Gamer Setup Look – RGB lighting room, blue and purple glow, screen light reflecting on face. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "travel-influencer",
    name: "Travel Influencer",
    description: "Mountain background, warm natural sunlight.",
    prompt: "Travel Influencer Style – mountain or outdoor scenic background, warm natural sunlight, adventurous vibe. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "street-fashion",
    name: "Street Fashion",
    description: "Urban street, graffiti wall, trendy look.",
    prompt: "Street Fashion Model – urban street, graffiti wall, trendy fashion look, streetwear. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  },
  {
    id: "studio-portrait",
    name: "Studio Portrait",
    description: "Soft studio lighting, clean background.",
    prompt: "Clean Studio Portrait – soft studio lighting, clean background, professional headshot. Ultra realistic, 4K, highly detailed, sharp focus, cinematic lighting, professional DSLR quality. Maintain the exact face identity, facial structure, and natural skin tone from the reference image. Do not change the person's identity."
  }
];

export async function generateVariation(base64Image: string, stylePrompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-2.5-flash-image";

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(",")[1],
            mimeType: "image/png",
          },
        },
        {
          text: stylePrompt,
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export { STYLES };
