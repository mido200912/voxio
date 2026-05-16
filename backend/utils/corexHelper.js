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

    // Use a default free model if none is specified so we don't default to the unreliable CoreSys
    const targetModelSelection = preferredModel || "inclusionai/ring-2.6-1t:free";

    // 🚀 1. Try OpenRouter FIRST
    if (openRouterApiKey) {
        let modelsToTry = [targetModelSelection];
        if (!modelsToTry.includes("openrouter/free")) {
            // Add a chain of reliable free models
            modelsToTry.push("openrouter/free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free");
        }

        for (let targetModel of modelsToTry) {
            try {
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
                    const content = fallbackResponse.data.choices[0].message?.content;
                    if (content) {
                        reply = content;
                        console.log(`✅ AI: Response from OpenRouter successful (${targetModel}).`);
                        return reply; // Return immediately, skip CoreSys
                    } else {
                        console.warn(`⚠️ OpenRouter returned empty content for ${targetModel}, trying next...`);
                        console.warn("Full Response:", JSON.stringify(fallbackResponse.data, null, 2));
                    }
                } else {
                    console.warn(`⚠️ OpenRouter choices array empty for ${targetModel}, trying next...`);
                    console.warn("Full Response:", JSON.stringify(fallbackResponse.data, null, 2));
                }
            } catch (fallbackError) {
                console.error(`❌ OpenRouter failed for ${targetModel}:`, fallbackError.response?.data?.error?.message || fallbackError.message);
                // Will gracefully fall through to the next model in the array, or eventually to CoreSys
            }
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
export async function fetchDesignerAiResponse(systemPrompt, userPrompt, fallbackText = "Failed to generate design.", preferredModel = null) {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    // Try OpenRouter FIRST (POST = no URL length limits = full code context)
    if (openRouterApiKey) {
        let targetModel = preferredModel || "openrouter/owl-alpha";
        let modelsToTry = [targetModel];
        if (!modelsToTry.includes("openrouter/free")) {
            modelsToTry.push("openrouter/free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free");
        }
        
        for (let model of modelsToTry) {
            try {
                console.log(`🎨 Designer AI: Sending to OpenRouter (${model})...`);
                
                const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: model,
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
                    timeout: 60000
                });
                
                if (response.data?.choices?.length > 0) {
                    const content = response.data.choices[0].message?.content;
                    if (content) {
                        console.log(`✅ Designer AI: Got response from ${model}, length:`, content.length);
                        return content;
                    } else {
                        console.warn(`⚠️ Designer AI OpenRouter returned empty content for ${model}, trying next...`);
                        console.warn("Full Response:", JSON.stringify(response.data, null, 2));
                    }
                } else {
                    console.warn(`⚠️ Designer AI OpenRouter choices array empty for ${model}, trying next...`);
                    console.warn("Full Response:", JSON.stringify(response.data, null, 2));
                }
            } catch (err) {
                console.error(`🎨 Designer AI OpenRouter failed for ${model}:`, err.response?.data?.error?.message || err.message);
            }
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
