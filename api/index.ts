import express from "express";
import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "sDTk9fWN0StnEhPo6B6ufd1wlVOIKBlE";

const app = express();
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { content, type, title, url } = req.body;
    
    const model = new ChatMistralAI({
      apiKey: MISTRAL_API_KEY,
      modelName: "mistral-small-latest",
      temperature: 0.3,
    });

    const prompt = PromptTemplate.fromTemplate(`
      Analyze the following {type} titled "{title}".
      URL: {url}
      Content/Description: {content}
      
      Provide a JSON response with three fields:
      1. "tags": An array of 3-7 relevant string tags.
      2. "summary": A highly detailed and comprehensive summary of this {type}. If it's a video, summarize the expected key points, themes, and narrative of the video based on the title and description. If it's an article, document, or note, provide a thorough breakdown of the main arguments and details. Do not just write 1-2 sentences; be highly descriptive and thorough.
      3. "explanation": A deep-dive explanation of the resource, its context, and why it is valuable to remember.
      
      Return ONLY valid JSON.
    `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const resultText = await chain.invoke({ type, title, content, url: url || 'None provided' });
    
    // Clean up potential markdown formatting in the response
    const cleanedText = resultText.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '').trim();
    const result = JSON.parse(cleanedText || '{}');
    
    res.json({
      tags: result.tags || [],
      summary: result.summary || '',
      explanation: result.explanation || ''
    });
  } catch (error) {
    console.error('Summarize Error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.post("/api/ai/embed", async (req, res) => {
  try {
    const { text } = req.body;
    
    const embeddings = new MistralAIEmbeddings({
      apiKey: MISTRAL_API_KEY,
      modelName: "mistral-embed",
    });

    const result = await embeddings.embedQuery(text);
    res.json({ embedding: result });
  } catch (error) {
    console.error('Embedding Error:', error);
    res.status(500).json({ error: 'Failed to generate embeddings' });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context, history } = req.body;
    
    const model = new ChatMistralAI({
      apiKey: MISTRAL_API_KEY,
      modelName: "mistral-small-latest",
      temperature: 0.7,
    });

    const systemInstruction = `You are a helpful AI assistant for the user's "Second Brain" application. 
The user has saved various items (notes, articles, videos, images, etc.) in their second brain.
Here is the current list of their saved items:

${context}

Use this information to answer the user's questions about their saved items. 
If they ask about something not in their second brain, you can still answer generally, but prioritize their saved knowledge.
If they ask about an old item, be conversational and helpful.`;

    const messages = [
      { role: "system", content: systemInstruction },
      ...(history || []).map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    const response = await model.invoke(messages);
    
    res.json({ text: response.content });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});

export default app;
