import { summarizeContent, getEmbeddings } from './mistralService';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseFile(fileUrl, type) {
  try {
    const model = "gemini-3-flash-preview";
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });

    const prompt = type === 'image' 
      ? "Describe this image in detail, including any text visible in it."
      : "Extract all the text from this PDF and provide a structured summary of its contents.";

    const result = await genAI.models.generateContent({
      model: model,
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: blob.type } }
        ]
      }]
    });

    return result.text;
  } catch (error) {
    console.error('File Parsing Error:', error);
    return '';
  }
}

export async function generateTagsAndSummary(content, type, title, url) {
  try {
    const result = await summarizeContent(content, type, title, url);
    
    return {
      tags: result.tags || [],
      summary: result.summary || '',
      explanation: result.explanation || ''
    };
  } catch (error) {
    console.error('AI Processing Error:', error);
    return { tags: [], summary: '', explanation: '' };
  }
}

export async function generateEmbeddings(text) {
  try {
    // Truncate text to avoid API limits (approx 8000 characters is safe for most models)
    const truncatedText = text.substring(0, 8000);
    const result = await getEmbeddings(truncatedText);
    return result || [];
  } catch (error) {
    console.error('Embedding Error:', error);
    return [];
  }
}
