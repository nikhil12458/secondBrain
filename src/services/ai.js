import { summarizeContent, getEmbeddings } from './mistralService';

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
    const result = await getEmbeddings(text);
    return result || [];
  } catch (error) {
    console.error('Embedding Error:', error);
    return [];
  }
}
