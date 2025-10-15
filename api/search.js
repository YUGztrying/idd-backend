// api/search.js - Version corrigée pour Vercel

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // CORS headers pour toutes les réponses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    const body = await request.json();
    const { queries, apiKey } = body;

    // Validation
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(JSON.stringify({ error: 'No queries provided' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map(query => callPerplexity(query, apiKey))
    );

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process search request'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
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
}// api/search.js - Version corrigée pour Vercel

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // CORS headers pour toutes les réponses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    const body = await request.json();
    const { queries, apiKey } = body;

    // Validation
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(JSON.stringify({ error: 'No queries provided' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map(query => callPerplexity(query, apiKey))
    );

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process search request'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
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
