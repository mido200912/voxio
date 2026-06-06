import axios from 'axios';

/**
 * Helper for CoreSys API
 */
export function extractCorexReply(data, fallback = "لم أتمكن من الرد حالياً.") {
  if (!data) return fallback;

  const isSuccess = data.status === 'success' || data.success === true || data.status === 'ok';
  if (!isSuccess) return fallback;

  let raw = data.response || data.reply || data.text || data.message;
  if (!raw) return fallback;

  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      raw = parsed.response || parsed.reply || parsed.text || parsed.message || raw;
    } catch (_) { }
  }

  return raw || fallback;
}

/**
 * Unified AI Request Handler (Fixed & Enhanced)
 */
export async function fetchAiResponse(fullQuestion, fallbackText = "لم أتمكن من الرد حالياً.", preferredModel = null, base64Media = null, systemPrompt = null) {
    let reply = null;
    let lastError = null;
    const truncatedQuestion = fullQuestion.length > 12000 ? fullQuestion.substring(0, 12000) + "..." : fullQuestion;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    // Default model
    const targetModelSelection = preferredModel || "openrouter/owl-alpha";

    // 🚀 1. Try OpenRouter FIRST
    if (openRouterApiKey) {
        let modelsToTry = [targetModelSelection];

        // 📸 لو فيه صورة، نضع كل موديلات الـ Vision المجانية بالترتيب كـ Fallback لحمايتك من السقوط
        if (base64Media) {
            console.log(`📸 Media input detected, size: ${(base64Media.length / 1024).toFixed(0)}KB`);
            modelsToTry = [
                "moonshotai/kimi-k2.6:free",
                "google/gemini-2.5-flash:free",
                "qwen/qwen2.5-vl-7b-instruct:free"
            ];
            
            // التأكد من أن البايس 64 يبدأ بـ data URI المعتمد لدى الموديلات
            if (typeof base64Media === 'string' && !base64Media.startsWith('data:')) {
                // افتراض أنها jpeg إذا لم يذكر، يمكنك تعديلها ديناميكياً بحسب المدخلات
                base64Media = `data:image/jpeg;base64,${base64Media}`;
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

                // بناء هيكل الرسائل بشكل صحيح وفصل الـ system prompt إن وجد
                const messages = [];
                if (systemPrompt) {
                    messages.push({ role: "system", content: systemPrompt });
                }
                messages.push({ role: "user", content: contentPayload });

                const fallbackResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: targetModel, 
                    messages: messages,
                    max_tokens: base64Media ? 4000 : 2000
                }, {
                    headers: {
                        "Authorization": `Bearer ${openRouterApiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: base64Media ? 90000 : 45000 // 90 ثانية كافية جداً، 300 ثانية (5 دقائق) رقم ضخم قد يعلق السيرفر
                });
                
                if (fallbackResponse.data?.choices?.length > 0) {
                    const content = fallbackResponse.data.choices[0].message?.content;
                    if (content) {
                        reply = content;
                        console.log(`✅ AI: Response from OpenRouter successful (${targetModel}).`);
                        return reply; 
                    } else {
                        console.warn(`⚠️ OpenRouter returned empty content for ${targetModel}, trying next...`);
                    }
                } else {
                    console.warn(`⚠️ OpenRouter choices array empty for ${targetModel}, trying next...`);
                }
            } catch (fallbackError) {
                const errMsg = fallbackError.response?.data?.error?.message || fallbackError.message;
                console.error(`❌ OpenRouter failed for ${targetModel}:`, errMsg);
                lastError = errMsg;
            }
        }
    }

    // ⚙️ 2. CoreSys Fallback — SKIP if media is present
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

    if (!reply && lastError) {
        console.error(`❌ All vision models failed. Last error: ${lastError}`);
        return `⚠️ Error: ${lastError}`;
    }
    return reply || fallbackText;
}

/**
 * Dedicated AI function for the Website Designer
 */
export async function fetchDesignerAiResponse(systemPrompt, userPrompt, fallbackText = "Failed to generate design.", preferredModel = null) {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (openRouterApiKey) {
        let targetModel = preferredModel || "openrouter/pareto-code";
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
                    }
                } else {
                    console.warn(`⚠️ Designer AI OpenRouter choices array empty for ${model}, trying next...`);
                }
            } catch (err) {
                console.error(`🎨 Designer AI OpenRouter failed for ${model}:`, err.response?.data?.error?.message || err.message);
            }
        }
    }
    
    // Fallback to CoreSys
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
 */
export async function transcribeAudio(buffer, fileName = "audio.ogg", mimeType = "audio/ogg") {
    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!openaiKey && !groqKey) {
        console.error("[STT] No API keys configured for transcription");
        return "[رسالة صوتية: عذراً، ميزة فك التشفير غير مفعلة لعدم توفر مفتاح API]";
    }

    const apiUrl = groqKey
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";
    const apiKey = groqKey || openaiKey;

    const cleanMime = mimeType.split(';')[0].trim();
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
            console.log(`✅ [STT] Success (${transcribed.length} chars)`);
            return transcribed;
        } else {
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