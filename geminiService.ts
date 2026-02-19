
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a high-end cinematic prompt engineer. Transform this concept into a professional technical description for a generative video model: "${prompt}"`,
      config: {
        systemInstruction: "Output ONLY the final prompt. Focus on lens choice (35mm, anamorphic), lighting (Rembrandt, high-key), and camera kinetics.",
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text || prompt;
  } catch (error) {
    console.error("Gemini Desktop Bridge Error:", error);
    return prompt;
  }
};

export const suggestTimelineStructure = async (concept: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Create a 5-shot sequence plan for: "${concept}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              shotName: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              description: { type: Type.STRING }
            },
            required: ["shotName", "duration", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};
