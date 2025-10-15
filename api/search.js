// api/search.js
// Vercel Serverless Function pour IDD Platform

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { queries, apiKey } = req.body;

    // Validation
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'No queries provided' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map(query => callPerplexity(query, apiKey))
    );

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Failed to process search request'
    });
  }
}

// Call Perplexity API
async function callPerplexity(query, apiKey) {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a due diligence investigator. Search for factual information about corruption, fraud, legal issues, sanctions, or controversies. Provide only verified information with sources. If no information is found, say so clearly.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_citations: true,
        return_related_questions: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      query,
      content: data.choices[0].message.content,
      citations: data.citations || []
    };

  } catch (error) {
    return {
      query,
      error: error.message,
      content: null,
      citations: []
    };
  }
}
