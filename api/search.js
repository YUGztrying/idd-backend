const fetch = require('node-fetch');
const http = require('http');

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
  console.log('[REQUEST]', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('[OPTIONS] Responding with CORS headers');
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url !== '/api/search') {
    console.log('[ERROR] Wrong URL:', req.url);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (req.method !== 'POST') {
    console.log('[ERROR] Wrong method:', req.method);
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

        console.log('[PARSED] Queries:', queries ? queries.length : 0);
        console.log('[PARSED] API Key present:', apiKey ? 'YES' : 'NO');

        if (!queries || !Array.isArray(queries) || queries.length === 0) {
          console.log('[ERROR] No queries provided');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No queries provided' }));
          return;
        }

        if (!apiKey) {
          console.log('[ERROR] No API key provided');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API key required' }));
          return;
        }

        console.log('[CALLING] Perplexity for', queries.length, 'queries...');
        
        const results = await Promise.all(
          queries.map((query, index) => {
            console.log('[QUERY]', index + 1, ':', query.substring(0, 50));
            return callPerplexity(query, apiKey);
          })
        );

        console.log('[SUCCESS] All queries completed');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));
        
      } catch (parseError) {
        console.error('[PARSE ERROR]', parseError.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });

  } catch (error) {
    console.error('[SERVER ERROR]', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

async function callPerplexity(query, apiKey) {
  try {
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        max_results: 10,
        max_tokens_per_page: 1024
      })
    });

    console.log('[PERPLEXITY] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PERPLEXITY ERROR]', errorText.substring(0, 200));
      throw new Error('Perplexity error: ' + response.status);
    }

    const data = await response.json();
    console.log('[PERPLEXITY] Success! Results count:', data.results ? data.results.length : 0);
    
    // Format results into readable content
    let content = '';
    let citations = [];
    
    if (data.results && data.results.length > 0) {
      content = 'Search Results:\n\n';
      data.results.forEach((result, index) => {
        content += (index + 1) + '. ' + result.title + '\n';
        if (result.snippet) {
          content += result.snippet + '\n';
        }
        content += '\n';
        citations.push(result.url);
      });
    } else {
      content = 'No results found for this query.';
    }
    
    return {
      query,
      content: content,
      citations: citations
    };

  } catch (error) {
    console.error('[CALL ERROR]', error.message);
    return {
      query,
      error: error.message,
      content: 'Error: ' + error.message,
      citations: []
    };
  }
}

server.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
  console.log('Waiting for requests...');
});
