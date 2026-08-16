async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    
    // If successful or not a high-demand/rate-limit error, return immediately
    if (response.ok || (response.status !== 503 && response.status !== 429)) {
      return response;
    }
    
    // If we have retries left, wait with exponential backoff (1s, then 2s, then 4s)
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; 
    } else {
      return response;
    }
  }
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server API key is not configured in Netlify environment variables." })
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "You are DELAW. Answer the user directly and naturally. CRITICAL RULE: Never start your response by introducing yourself, stating your name, or saying 'Hello! I am DELAW'. Just answer the prompt directly." }]
        },
        contents: [{ parts: [{ text: message }] }]
      })
    };

    const apiResponse = await fetchWithRetry(url, options);
    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({ error: data.error?.message || "Google API request failed." })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
