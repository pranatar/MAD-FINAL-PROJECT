import { action } from "./_generated/server";

export const listModels = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "API Key not set";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) return `Error: ${await response.text()}`;
    
    const data = await response.json();
    return data.models.map((m: any) => m.name);
  },
});
