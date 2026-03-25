import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function createChatSession(items) {
  // Format items into a readable context
  const context = items.map(item => `
ID: ${item.id}
Title: ${item.title}
Type: ${item.type}
Date Saved: ${item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : 'Unknown'}
Summary: ${item.summary || 'N/A'}
Content: ${item.content || 'N/A'}
Tags: ${(item.tags || []).join(', ')}
URL: ${item.url || 'N/A'}
`).join('\n---\n');

  const systemInstruction = `You are a helpful AI assistant for the user's "Second Brain" application. 
The user has saved various items (notes, articles, videos, images, etc.) in their second brain.
Here is the current list of their saved items:

${context}

Use this information to answer the user's questions about their saved items. 
If they ask about something not in their second brain, you can still answer generally, but prioritize their saved knowledge.
If they ask about an old item, be conversational and helpful.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    },
  });

  return chat;
}
