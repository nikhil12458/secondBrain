import { generateEmbeddings } from './ai';

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
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

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, context, history })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update history
        history.push({ role: 'user', text: message });
        history.push({ role: 'model', text: data.text });
        
        return { text: data.text };
      } catch (error) {
        console.error('Chat Error:', error);
        throw error;
      }
    }
  };
}
