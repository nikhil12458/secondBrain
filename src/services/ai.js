export async function generateTagsAndSummary(content, type, title) {
  try {
    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type, title })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const result = await response.json();
    
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
    const response = await fetch('/api/ai/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding || [];
  } catch (error) {
    console.error('Embedding Error:', error);
    return [];
  }
}
