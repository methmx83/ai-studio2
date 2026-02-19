
/**
 * Local AI Service utilizing the Ollama API (Port 11434).
 * Optimized for RTX 5090 environments - 100% Offline & Private.
 */

const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
const MODEL = 'llama3'; // Llama3:8b or Llama3:70b for high-end GPUs

export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
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
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
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
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
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
