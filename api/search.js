const http = require('http');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only POST to /api/search
  if (req.url !== '/api/search' || req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { queries, apiKey } = JSON.parse(body);

        if (!queries || !Array.isArray(queries) || queries.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No queries provided' }));
          return;
        }

        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API key required' }));
          return;
        }

        const results = await Promise.all(
          queries.map(query => callPerplexity(query, apiKey))
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));
      } catch (parseError) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

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
            content: 'You are a due diligence investigator. Search for factual information about corruption, fraud, legal issues, sanctions, or controversies.'
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
      throw new Error(`Perplexity error: ${response.status}`);
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
      content: 'Error fetching data',
      citations: []
    };
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
