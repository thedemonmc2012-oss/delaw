export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DELAW AI Chat</title>
    <style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .chat-container { width: 100%; max-width: 600px; background: #1e293b; border-radius: 12px; display: flex; flex-direction: column; height: 80vh; box-shadow: 0 4px 20px rgba(0,0,0,0.5); overflow: hidden; }
        .chat-header { background: #334155; padding: 16px; font-weight: bold; text-align: center; font-size: 1.2rem; }
        .chat-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .message { padding: 10px 14px; border-radius: 8px; max-width: 80%; line-height: 1.4; word-break: break-word; }
        .user { background: #3b82f6; align-self: flex-end; }
        .ai { background: #475569; align-self: flex-start; }
        .chat-input { display: flex; padding: 12px; background: #334155; gap: 8px; }
        input { flex: 1; padding: 10px; border: none; border-radius: 6px; background: #1e293b; color: white; font-size: 1rem; }
        button { padding: 10px 20px; border: none; border-radius: 6px; background: #3b82f6; color: white; font-weight: bold; cursor: pointer; }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">DELAW AI Assistant</div>
        <div class="chat-messages" id="messages">
            <div class="message ai">Hello! How can I help you today?</div>
        </div>
        <div class="chat-input">
            <input type="text" id="userInput" placeholder="Type your message here..." onkeydown="if(event.key==='Enter') sendMessage()">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>
    <script>
        async function sendMessage() {
            const input = document.getElementById('userInput');
            const container = document.getElementById('messages');
            const text = input.value.trim();
            if (!text) return;

            container.innerHTML += '<div class="message user">' + text + '</div>';
            input.value = '';
            container.scrollTop = container.scrollHeight;

            try {
                const res = await fetch('', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error || "No response";
                container.innerHTML += '<div class="message ai">' + reply + '</div>';
            } catch (err) {
                container.innerHTML += '<div class="message ai">Error connecting to server.</div>';
            }
            container.scrollTop = container.scrollHeight;
        }
    </script>
</body>
</html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

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

      const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
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
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
