export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const message = body.message;
    const apiKey = env.GEMINI_API_KEY; // Access environment variables in Cloudflare

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server API key is not configured in Cloudflare environment variables." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "You are DELAW. Answer the user directly and naturally. CRITICAL RULE: Never start your response by introducing yourself, stating your name, or saying 'Hello! I am DELAW'. Just answer the prompt directly." }]
        },
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Google API request failed." }), {
        status: apiResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
