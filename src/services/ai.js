const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || "Yt8SYqq7iJMQR2aQhdRWfeUHfcm3Sndc";

export async function generateTagsAndSummary(content, type, title) {
  try {
    const prompt = `
      Analyze the following ${type} titled "${title}".
      Content/Description: ${content}
      
      Provide a JSON response with two fields:
      1. "tags": An array of 3-5 relevant string tags.
      2. "summary": A concise 1-2 sentence summary.
    `;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    const result = JSON.parse(resultText || '{}');
    
    return {
      tags: result.tags || [],
      summary: result.summary || ''
    };
  } catch (error) {
    console.error('AI Processing Error:', error);
    return { tags: [], summary: '' };
  }
}

export async function generateEmbeddings(text) {
  try {
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text]
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding || [];
  } catch (error) {
    console.error('Embedding Error:', error);
    return [];
  }
}
