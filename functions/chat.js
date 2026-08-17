export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const message = body.message;

    // Check if the Cloudflare AI binding is available
    if (!env.AI) {
      return new Response(JSON.stringify({ error: "Cloudflare AI binding is not configured in wrangler.toml or dashboard." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Run a built-in open-source model directly on Cloudflare
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: "system", content: "You are DELAW, an advanced personal AI assistant. Answer the user's prompt directly and naturally without introducing yourself or stating your name." },
        { role: "user", content: message }
      ]
    });

    // Format the response structure to match your frontend expectations
    const aiText = response.response || "No response generated.";
    
    const formattedData = {
      candidates: [
        {
          content: {
            parts: [
              { text: aiText }
            ]
          }
        }
      ]
    };

    return new Response(JSON.stringify(formattedData), {
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
