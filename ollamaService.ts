
/**
 * Local AI Service utilizing the Ollama API (Port 11434).
 * Optimized for RTX 5090 environments - 100% Offline & Private.
 */
import { useEditorStore } from './store';

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

const getSelectedModel = () => {
  return useEditorStore.getState().projectSettings.defaults.ollamaModel || 'llama3:8b';
};

export const fetchInstalledModels = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models.map((m: any) => m.name);
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
  const model = getSelectedModel();
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `Act as an expert cinematic prompt engineer. 
        Expand this simple video concept into a high-fidelity cinematic description for AI video generation.
        Include technical details for lighting, lens choice, and camera movement.
        Output ONLY the final prompt text.
        
        Input: "${prompt}"`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 200
        }
      }),
    });
    
    if (!response.ok) throw new Error("Ollama connection failed");
    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error("Ollama Enhance Error:", error);
    return prompt;
  }
};

export const analyzeScene = async (description: string): Promise<string> => {
  const model = getSelectedModel();
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `You are a professional Hollywood cinematographer. 
        Analyze this scene description: "${description}".
        Suggest exactly one technical improvement for color grading and one for lighting. 
        Be extremely concise (max 2 sentences). Output text only.`,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 100
        }
      }),
    });

    if (!response.ok) throw new Error("Ollama connection failed");
    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error("Ollama Analysis Error:", error);
    return "Local analysis engine offline. Check Ollama status.";
  }
};

export const suggestTags = async (description: string) => {
  const model = getSelectedModel();
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `Analyze the following description and return a JSON object with technical tags: lighting, cameraAngle, cameraMovement, colorPalette. 
        Description: "${description}"`,
        format: 'json',
        stream: false
      }),
    });

    if (!response.ok) throw new Error("Ollama connection failed");
    const data = await response.json();
    return JSON.parse(data.response);
  } catch (error) {
    return {
      lighting: "Unknown",
      cameraAngle: "Eye-level",
      cameraMovement: "Static",
      colorPalette: "Rec.709"
    };
  }
};
