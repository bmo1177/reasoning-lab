export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const generateGeminiContent = async (
  systemPrompt: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  temperature = 0.7,
  maxOutputTokens = 8192
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_AI_API_KEY is not configured in .env');
  }

  // Convert generic messages to Gemini format
  const contents = history.filter(msg => msg.role !== 'system').map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  
  if (userPrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });
  }

  const payload: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      role: 'system',
      parts: [{ text: systemPrompt }]
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    let errorMsg = `Gemini API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg += ` - ${JSON.stringify(errorData)}`;
    } catch {
      errorMsg += ` - ${await response.text()}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No content returned from Gemini API');
  }

  return text;
};

export const parseJSONResponse = <T>(content: string): T => {
  try {
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanContent) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", content);
    throw new Error("Failed to parse JSON response from AI");
  }
};
