export async function createChatSession(items, initialHistory = []) {
  // Format items into a readable context
  const context = items.map(item => `
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

  let history = [...initialHistory];

  // Return a mock chat object that matches the expected interface
  return {
    sendMessage: async ({ message }) => {
      try {
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
