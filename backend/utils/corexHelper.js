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
  if (!data) return fallback;

  // Flexible success check
  const isSuccess = data.status === 'success' || data.success === true || data.status === 'ok';
  if (!isSuccess) return fallback;

  let raw = data.response || data.reply || data.text || data.message;
  if (!raw) return fallback;

  // If it's a JSON string like {"response":"..."}, parse it
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      raw = parsed.response || parsed.reply || parsed.text || parsed.message || raw;
    } catch (_) { }
  }

  return raw || fallback;
}

/**
 * Unified AI Request Handler
 * Tries CoreSys first, falls back to OpenRouter if API limits are hit or server fails.
 */
export async function fetchAiResponse(fullQuestion, fallbackText = "لم أتمكن من الرد حالياً.", preferredModel = null) {
    let reply = null;
    const truncatedQuestion = fullQuestion.length > 12000 ? fullQuestion.substring(0, 12000) + "..." : fullQuestion;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    // 🚀 1. If user specifically chose a model (Llama/Gemma), prioritize OpenRouter FIRST
    if (preferredModel && openRouterApiKey) {
        try {
            let targetModel = preferredModel;
            // Force free tier for Meta/Google models if not already specified to avoid 402 Payment Required
            if ((targetModel.includes("meta-llama") || targetModel.includes("google")) && !targetModel.includes(":free")) {
                targetModel += ":free";
            }
            
            console.log(`🤖 AI: Requesting OpenRouter (${targetModel})...`);
            const fallbackResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: targetModel, 
                messages: [{ role: "user", content: truncatedQuestion }],
                max_tokens: 2000
            }, {
                headers: {
                    "Authorization": `Bearer ${openRouterApiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 45000
            });
            
            if (fallbackResponse.data?.choices?.length > 0) {
                reply = fallbackResponse.data.choices[0].message.content;
                console.log(`✅ AI: Response from OpenRouter successful.`);
                return reply; // Return immediately, skip CoreSys
            }
        } catch (fallbackError) {
            console.error('❌ OpenRouter failed:', fallbackError.response?.data || fallbackError.message);
            // Will gracefully fall through to CoreSys fallback below
        }
    }

    // ⚙️ 2. CoreSys Fallback (Or primary if no preferred model chosen)
    try {
        const apiUrl = process.env.COREX_API_URL || "https://dev-c7z.pantheonsite.io/CoreSys/chat.php";
        const aiApiKey = process.env.COREX_API_KEY || "AITHORV1_6F85B401ED";

        const payload = { key: aiApiKey, act: 'chat', a: truncatedQuestion };
        console.log(`🤖 AI: Requesting CoreSys (Key: ${aiApiKey.substring(0, 5)}...)`);
        
        const aiResponse = await axios.post(apiUrl, 
            new URLSearchParams(payload).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
        );
        
        reply = extractCorexReply(aiResponse.data, null);
    } catch (error) {
        console.error(`❌ CoreSys failed:`, error.message);
    }

    return reply || fallbackText;
}

/**
 * Dedicated AI function for the Website Designer (Corex Editor)
 * Uses OpenRouter POST directly — no URL truncation, sends the FULL code context.
 * Falls back to CoreSys if OpenRouter fails.
 */
export async function fetchDesignerAiResponse(systemPrompt, userPrompt, fallbackText = "Failed to generate design.") {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    // Try OpenRouter FIRST (POST = no URL length limits = full code context)
    if (openRouterApiKey) {
        try {
            console.log("🎨 Designer AI: Sending to OpenRouter (POST)...");
            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 8000
            }, {
                headers: {
                    "Authorization": `Bearer ${openRouterApiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 90000
            });
            
            if (response.data?.choices?.length > 0) {
                const reply = response.data.choices[0].message.content;
                console.log("🎨 Designer AI: Got response, length:", reply.length);
                return reply;
            }
        } catch (err) {
            console.error("🎨 Designer AI OpenRouter failed:", err.response?.data || err.message);
        }
    }
    
    // Fallback to CoreSys (GET - will truncate, but better than nothing)
    try {
        const fullQuestion = systemPrompt + "\n\nUser request: " + userPrompt;
        return await fetchAiResponse(fullQuestion, fallbackText);
    } catch (err) {
        console.error("🎨 Designer AI CoreSys fallback also failed:", err.message);
    }
    
    return fallbackText;
}
