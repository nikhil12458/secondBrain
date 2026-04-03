import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatMistralAI } from "@langchain/mistralai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import fs from "fs";
import path from "path";

export class RAGService {
  private embeddings: MistralAIEmbeddings;
  private model: ChatMistralAI;
  private vectorStore: MemoryVectorStore | null = null;

  constructor() {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY is not set");
    }

    this.embeddings = new MistralAIEmbeddings({
      apiKey: apiKey,
      model: "mistral-embed",
    });

    this.model = new ChatMistralAI({
      apiKey: apiKey,
      model: "mistral-large-latest",
      temperature: 0,
    });
  }

  async extractTextFromFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`Extracting text from ${filePath} (ext: ${ext})`);
    
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      console.log(`Extracted ${data.text.length} characters from PDF`);
      return data.text;
    } else if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      console.log(`Starting OCR with Tesseract...`);
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      console.log(`Extracted ${text.length} characters from Image via OCR`);
      return text;
    }
    
    throw new Error(`Unsupported file type: ${ext}`);
  }

  async processDocument(filePath: string): Promise<void> {
    console.log(`Processing document: ${filePath}`);
    const text = await this.extractTextFromFile(filePath);
    
    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from the document.");
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([text]);
    console.log(`Split document into ${docs.length} chunks`);
    
    console.log(`Creating embeddings and vector store...`);
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      docs,
      this.embeddings
    );
    console.log(`Vector store ready.`);
  }

  async generateLinkedInPost(query: string): Promise<string> {
    if (!this.vectorStore) {
      throw new Error("No document processed yet");
    }

    const retriever = this.vectorStore.asRetriever();

    const prompt = PromptTemplate.fromTemplate(`
You are an AI assistant.

ONLY use the provided context.
Do NOT generate anything outside context.

Context:
{context}

Task:
{query}
    `);

    const formatDocs = (docs: any[]) => docs.map((doc) => doc.pageContent).join("\n\n");

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocs),
        query: new RunnablePassthrough(),
      },
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke(query);
    return result;
  }
}
