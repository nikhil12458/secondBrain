import { Mistral } from '@mistralai/mistralai';

let mistralClient = null;

function getMistralClient() {
  if (!mistralClient) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.warn("MISTRAL_API_KEY is missing. AI features may not work.");
      return null;
    }
    mistralClient = new Mistral({ apiKey });
  }
  return mistralClient;
}

export async function summarizeContent(content, type, title, url) {
  try {
    const client = getMistralClient();
    if (!client) throw new Error("Mistral client not initialized");

    const prompt = `Analyze the provided ${type} titled "${title}".
URL: ${url || 'None provided'}
Content/Description: ${content}

Provide a JSON response with three fields:
1. "tags": An array of 3-7 relevant string tags.
2. "summary": A highly detailed and comprehensive summary of this ${type}. If it's an article, document, or note, provide a thorough breakdown of the main arguments and details. Do not just write 1-2 sentences; be highly descriptive and thorough.
3. "explanation": A deep-dive explanation of the resource, its context, and why it is valuable to remember.

Return ONLY valid JSON.`;

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Mistral Summarize Error:", error);
    return { tags: [], summary: "Failed to generate summary.", explanation: "Error occurred during AI processing." };
  }
}

export async function getEmbeddings(text) {
  try {
    const client = getMistralClient();
    if (!client) throw new Error("Mistral client not initialized");

    const response = await client.embeddings.create({
      model: "mistral-embed",
      inputs: [text]
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Mistral Embedding Error:", error);
    return [];
  }
}

export async function chatWithContext(message, context, history) {
  try {
    const client = getMistralClient();
    if (!client) throw new Error("Mistral client not initialized");

    const systemPrompt = `You are a helpful AI assistant for the user's "Second Brain" application. 
The user has saved various items (notes, articles, pdfs, images, etc.) in their second brain.
Here is the current list of their saved items:

${context}

Use this information to answer the user's questions about their saved items. 
If they ask about something not in their second brain, you can still answer generally, but prioritize their saved knowledge.
If they ask about an old item, be conversational and helpful.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: messages
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Mistral Chat Error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

export async function generateContent(prompt) {
  try {
    const client = getMistralClient();
    if (!client) throw new Error("Mistral client not initialized");

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Mistral Generation Error:", error);
    throw error;
  }
}

export async function generateRAGContent(localPath, query) {
  try {
    const response = await fetch('/api/generate-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localPath, query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate RAG content');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Mistral RAG Generation Error:", error);
    throw error;
  }
}
