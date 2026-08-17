export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();
      const message = body.message;

      if (!env.AI) {
        return new Response(JSON.stringify({ error: "Cloudflare AI binding is not configured." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: "system", content: "You are DELAW, an advanced personal AI assistant. Answer the user's prompt directly and naturally without introducing yourself or stating your name." },
          { role: "user", content: message }
        ]
      });

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
};
