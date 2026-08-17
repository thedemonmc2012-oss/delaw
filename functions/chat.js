export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const message = body.message;

    if (!env.AI) {
      return new Response(JSON.stringify({ error: "Cloudflare AI binding is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: "system", content: "You are DELAW, an advanced personal AI assistant. Answer the user's prompt directly and naturally without introducing yourself or stating your name." },
        { role: "user", content: message }
      ]
    });

    const aiText = response.response || "No response generated.";

    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: aiText }] } }]
    }), {
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
