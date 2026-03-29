import axios from 'axios';

/**
 * Helper for CoreSys API
 * Parses the response from CoreSys which may return nested JSON strings.
 *
 * Example CoreSys raw response:
 *   { status: 'success', response: '{"response":"النص الحقيقي"}' }
 * OR:
 *   { status: 'success', response: 'النص الحقيقي' }
 */
export function extractCorexReply(data, fallback = "لم أتمكن من الرد حالياً.") {
  if (!data || data.status !== 'success') return fallback;

  let raw = data.response;
  if (!raw) return fallback;

  // If it's a JSON string like {"response":"..."}, parse it
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      // Try common keys
      raw = parsed.response || parsed.reply || parsed.text || parsed.message || raw;
    } catch (_) {
      // Not valid JSON, use as-is
    }
  }

  return raw || fallback;
}

/**
 * Unified AI Request Handler
 * Tries CoreSys first, falls back to OpenRouter if API limits are hit or server fails.
 */
export async function fetchAiResponse(fullQuestion, fallbackText = "لم أتمكن من الرد حالياً.") {
    let reply = null;

    // ✂️ Truncate question for GET requests to avoid 414 URL Too Long error
    // Each Arabic char is ~6 bytes encoded, so 3000 chars is safe (~18KB)
    const truncatedQuestion = fullQuestion.length > 3000 ? fullQuestion.substring(0, 3000) + "..." : fullQuestion;

    try {
        const apiUrl = process.env.COREX_API_URL || "https://dev-c7z.pantheonsite.io/CoreSys/chat.php";
        const aiApiKey = process.env.COREX_API_KEY || "AITHORV1_6F85B401ED";
        const requestUrl = `${apiUrl}?key=${aiApiKey}&act=assistant&a=${encodeURIComponent(truncatedQuestion)}`;

        const aiResponse = await axios.get(requestUrl, { timeout: 30000 });
        reply = extractCorexReply(aiResponse.data, null);

        if (reply && typeof reply === 'string' && (reply.includes('daily limit') || reply.includes('{"success":false'))) {
            throw new Error('CoreSys API limit reached'); 
        }
    } catch (error) {
        console.log(`🔄 CoreSys Primary failed: ${error.message}`);
        reply = null;
    }

    // 🔄 OpenRouter Fallback if CoreX fails
    if (!reply) {
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (openRouterApiKey) {
            try {
                const fallbackResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: "google/gemini-2.0-flash-001", 
                    messages: [{ role: "user", content: fullQuestion }]
                }, {
                    headers: {
                        "Authorization": `Bearer ${openRouterApiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 30000
                });
                
                if (fallbackResponse.data?.choices?.length > 0) {
                    reply = fallbackResponse.data.choices[0].message.content;
                }
            } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError.response?.data || fallbackError.message);
            }
        }
    }

    return reply || fallbackText;
}
