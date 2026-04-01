import express from "express";
import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import multer from "multer";
import ImageKit from "imagekit";
import path from "path";
import fs from "fs";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "sDTk9fWN0StnEhPo6B6ufd1wlVOIKBlE";

const app = express();
app.use(express.json());

// Set up local storage for PDFs
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Set up ImageKit
let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/upload/pdf", upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the local URL for the PDF
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.originalname });
  } catch (error) {
    console.error('PDF Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

app.post("/api/upload/image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!imagekit) {
      return res.status(500).json({ error: 'ImageKit credentials not configured' });
    }

    // Read the file from local storage to upload to ImageKit
    const fileBuffer = fs.readFileSync(req.file.path);
    
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: req.file.filename,
      folder: '/second-brain-images'
    });

    // Optionally delete the local file after uploading to ImageKit
    fs.unlinkSync(req.file.path);

    res.json({ url: response.url, fileId: response.fileId });
  } catch (error) {
    console.error('Image Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
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
      2. "summary": A highly detailed and comprehensive summary of this {type}. If it's an article, document, or note, provide a thorough breakdown of the main arguments and details. Do not just write 1-2 sentences; be highly descriptive and thorough.
      3. "explanation": A deep-dive explanation of the resource, its context, and why it is valuable to remember.
      
      Return ONLY valid JSON.
    `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const resultText = await chain.invoke({ type, title, content, url: url || 'None provided' });
    
    // Clean up potential markdown formatting in the response
    const cleanedText = resultText.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '').trim();
    let result = {};
    try {
      result = JSON.parse(cleanedText || '{}');
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
    
    const ensureString = (val) => {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) {
        return Object.values(val).map(v => typeof v === 'string' ? v : JSON.stringify(v)).join('\n\n');
      }
      return String(val || '');
    };

    let safeTags = [];
    if (Array.isArray(result.tags)) {
      safeTags = result.tags.map(t => typeof t === 'string' ? t : JSON.stringify(t));
    }

    res.json({
      tags: safeTags,
      summary: ensureString(result.summary),
      explanation: ensureString(result.explanation)
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
The user has saved various items (notes, articles, pdfs, images, etc.) in their second brain.
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
