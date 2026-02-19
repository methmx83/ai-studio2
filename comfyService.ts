
/**
 * Advanced ComfyUI Bridge Service
 * Logic for parsing and injecting parameters into user-uploaded JSON workflows.
 */

export const scanWorkflowForParams = (json: any) => {
  const params: any = {};
  
  for (const nodeId in json) {
    const node = json[nodeId];
    
    // Scan for resolution (EmptyLatentImage)
    if (node.class_type === "EmptyLatentImage" || node.class_type === "EmptyImage") {
      params.width = node.inputs.width;
      params.height = node.inputs.height;
    }
    
    // Scan for Steps (KSampler)
    if (node.class_type === "KSampler" || node.class_type === "KSamplerAdvanced") {
      params.steps = node.inputs.steps;
    }
    
    // Scan for Video Settings (VHS_VideoCombine)
    if (node.class_type === "VHS_VideoCombine") {
      params.fps = node.inputs.fps;
    }

    // Scan for Prompts (CLIPTextEncode)
    if (node.class_type === "CLIPTextEncode" && node.inputs.text && !params.prompt) {
      params.prompt = node.inputs.text;
    }
  }
  
  return params;
};

export const injectParamsIntoWorkflow = (json: any, params: any) => {
  const newJson = JSON.parse(JSON.stringify(json));
  
  for (const nodeId in newJson) {
    const node = newJson[nodeId];
    
    if (node.class_type === "EmptyLatentImage" || node.class_type === "EmptyImage") {
      if (params.width) node.inputs.width = params.width;
      if (params.height) node.inputs.height = params.height;
    }
    
    if (node.class_type === "KSampler" || node.class_type === "KSamplerAdvanced") {
      if (params.steps) node.inputs.steps = params.steps;
    }
    
    if (node.class_type === "VHS_VideoCombine") {
      if (params.fps) node.inputs.fps = params.fps;
    }

    // Smart prompt injection (usually first CLIPTextEncode)
    if (node.class_type === "CLIPTextEncode" && params.prompt) {
      node.inputs.text = params.prompt;
    }
  }
  
  return newJson;
};

export const queuePrompt = async (workflowJson: any) => {
  try {
    const response = await fetch('http://127.0.0.1:8188/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflowJson }),
    });
    return await response.json();
  } catch (e) {
    console.error("ComfyUI API Error:", e);
    throw e;
  }
};
