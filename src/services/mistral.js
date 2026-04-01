import { generateEmbeddings } from './ai';
import { chatWithContext } from './mistralService';

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecB[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function createChatSession(items, initialHistory = []) {
  let history = [...initialHistory];

  return {
    sendMessage: async ({ message }) => {
      try {
        // RAG Implementation: Embed the user message and find relevant items
        const queryEmbedding = await generateEmbeddings(message);
        let relevantItems = items;

        if (queryEmbedding && queryEmbedding.length > 0) {
          const scoredItems = items.map(item => {
            const score = item.embedding 
              ? cosineSimilarity(queryEmbedding, item.embedding)
              : 0;
            return { item, score };
          });
          
          // Get top 5 most relevant items
          relevantItems = scoredItems
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => r.item);
        } else {
          // Fallback: just use recent items if embedding fails
          relevantItems = items.slice(0, 5);
        }

        const context = relevantItems.map(item => `
ID: ${item.id}
Title: ${item.title}
Type: ${item.type}
Date Saved: ${item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : 'Unknown'}
Summary: ${item.summary || 'N/A'}
Explanation: ${item.explanation || 'N/A'}
Content: ${item.content || 'N/A'}
Tags: ${(item.tags || []).join(', ')}
URL: ${item.url || 'N/A'}
`).join('\n---\n');

        const text = await chatWithContext(message, context, history);
        
        // Update history
        history.push({ role: 'user', text: message });
        history.push({ role: 'model', text: text });
        
        return { text };
      } catch (error) {
        console.error('Chat Error:', error);
        throw error;
      }
    }
  };
}
