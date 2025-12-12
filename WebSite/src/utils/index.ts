import { API_ROOT } from "../config";
import { DocumentSource } from "../types";

export const getBotResponse = async (
  userInput: string,
  file?: File
): Promise<{ text: string; sources: DocumentSource[] }> => {
  // Basic POST to backend chat endpoint. Expects response shape { assistant_response, search_results }
  const endpoint = `${API_ROOT}/api/v1/chat/chat`;
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: userInput })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Server returned ${resp.status}: ${text}`);
    }

    const data = await resp.json();

    // Backend returns: { response: "...", sources: [...], assistant_response: {...}, search_results: {...} }
    // Extract the assistant's text response
    let assistant = data?.response || "";

    // If response is empty, try to extract from assistant_response object
    if (!assistant && data?.assistant_response) {
      const raw = data.assistant_response;
      if (typeof raw === "string") {
        assistant = raw;
      } else if (raw && typeof raw === "object") {
        // Try common fields
        if (typeof raw.content === "string") {
          assistant = raw.content;
        } else if (raw.message && typeof raw.message === "string") {
          assistant = raw.message;
        } else if (raw.choices && Array.isArray(raw.choices) && raw.choices[0]) {
          // Handle chat completion-like objects
          const choice = raw.choices[0];
          if (typeof choice.text === "string") assistant = choice.text;
          else if (choice.message && typeof choice.message.content === "string")
            assistant = choice.message.content;
        }
      }
    }

    // Extract sources from backend response
    const sources: DocumentSource[] = data?.sources || [];

    return { text: assistant, sources };
  } catch (err: any) {
    // bubble up the error to caller so it can show a message
    throw err;
  }
};
