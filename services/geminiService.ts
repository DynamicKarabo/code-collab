/// <reference types="vite/client" />

interface ChatContext {
  currentFile: string;
  fileContent: string;
}

export const streamCodeAssistant = async function* (
  prompt: string,
  context: ChatContext,
  useThinkingMode: boolean = false
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        context,
        useThinkingMode
      }),
    });

    if (!response.ok) {
      // Try to parse error message
      let errorMsg = 'Unknown error';
      try {
        const errData = await response.json();
        errorMsg = errData.error || errorMsg;
      } catch (e) {
        errorMsg = response.statusText;
      }
      throw new Error(`Server Error: ${errorMsg}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    yield `Error: ${error.message || "Something went wrong with the AI service."}`;
  }
};