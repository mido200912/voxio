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
export async function fetchAiResponse(fullQuestion, fallbackText = "لم أتمكن من الرد حالياً.", preferredModel = null, base64Media = null) {
    let reply = null;
    const truncatedQuestion = fullQuestion.length > 12000 ? fullQuestion.substring(0, 12000) + "..." : fullQuestion;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    // Use owl-alpha as default model for customer replies
    const targetModelSelection = preferredModel || "openrouter/owl-alpha";

    // 🚀 1. Try OpenRouter FIRST
    if (openRouterApiKey) {
        let modelsToTry = [targetModelSelection];

        // When media (image, video, sticker) is provided, use only vision/multimodal models
        if (base64Media) {
            modelsToTry = [
                "google/gemini-2.0-flash:free",
                "openai/gpt-4o-mini:free",
                "openai/gpt-4o:free",
            ];
        } else {
            if (!modelsToTry.includes("openrouter/free")) {
                modelsToTry.push("openrouter/owl-alpha", "openrouter/free", "google/gemma-4-31b-it:free");
            }
        }

        for (let targetModel of modelsToTry) {
            try {
                console.log(`🤖 AI: Requesting OpenRouter (${targetModel})...`);
                
                let contentPayload = truncatedQuestion;
                if (base64Media) {
                    contentPayload = [
                        { type: "text", text: truncatedQuestion },
                        { type: "image_url", image_url: { url: base64Media } }
                    ];
                }

                const fallbackResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: targetModel, 
                    messages: [{ role: "user", content: contentPayload }],
                    max_tokens: base64Media ? 4000 : 2000
                }, {
                    headers: {
                        "Authorization": `Bearer ${openRouterApiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: base64Media ? 300000 : 45000
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

    // ⚙️ 2. CoreSys Fallback — SKIP if media is present (CoreSys doesn't support images)
    if (!base64Media) {
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

/**
 * Transcribe WhatsApp Voice Notes to Text (STT)
 * Uses Groq Whisper API (preferred) or OpenAI Whisper API.
 */
export async function transcribeAudio(buffer, fileName = "audio.ogg", mimeType = "audio/ogg") {
    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!openaiKey && !groqKey) {
        console.error("[STT] No API keys configured for transcription (OPENAI_API_KEY or GROQ_API_KEY)");
        return "[رسالة صوتية: عذراً، ميزة فك التشفير غير مفعلة لعدم توفر مفتاح API]";
    }

    const apiUrl = groqKey
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";
    const apiKey = groqKey || openaiKey;

    // Strip codecs params from mime type (e.g., "audio/ogg; codecs=opus" → "audio/ogg")
    const cleanMime = mimeType.split(';')[0].trim();
    // Use proper file extension based on mime type
    const extMap = {
        'audio/ogg': 'ogg', 'audio/oga': 'oga',
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
        'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
        'audio/wav': 'wav', 'audio/x-wav': 'wav',
        'audio/webm': 'webm', 'audio/flac': 'flac',
        'audio/amr': 'amr', 'audio/3gpp': '3gp'
    };
    const ext = extMap[cleanMime] || fileName.split('.').pop() || 'ogg';
    const safeFileName = 'audio.' + ext;

    console.log(`🎙️ [STT] Sending to ${groqKey ? 'Groq' : 'OpenAI'} Whisper...`);
    console.log(`🎙️ [STT] File size: ${(buffer.length / 1024).toFixed(1)} KB, MIME: "${mimeType}" → clean: "${cleanMime}", file: "${safeFileName}"`);

    try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: cleanMime });
        formData.append("file", blob, safeFileName);
        formData.append("model", "whisper-large-v3");
        formData.append("language", "ar");
        formData.append("temperature", "0");

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            },
            body: formData,
            signal: AbortSignal.timeout(35000)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "Unknown error");
            console.error(`❌ [STT] API error ${response.status}: ${errorBody}`);
            if (response.status === 413) return "[رسالة صوتية: الملف كبير جداً]";
            if (response.status === 401 || response.status === 403) return "[رسالة صوتية: خطأ في مفتاح API]";
            return "[رسالة صوتية غير واضحة]";
        }

        const result = await response.json();

        if (result.text) {
            const transcribed = result.text.trim();
            console.log(`✅ [STT] Success (${transcribed.length} chars): "${transcribed.substring(0, 60)}..."`);
            return transcribed;
        } else {
            console.error("❌ [STT] API returned no text:", JSON.stringify(result));
            return "[رسالة صوتية: لم يتم التعرف على نص واضح]";
        }
    } catch (e) {
        console.error("❌ [STT] Transcription failed:", e.message);
        if (e.name === 'TimeoutError' || e.code === 'ECONNABORTED') {
            return "[رسالة صوتية: انتهت مهلة المعالجة]";
        }
    }

    return "[رسالة صوتية غير واضحة]";
}
