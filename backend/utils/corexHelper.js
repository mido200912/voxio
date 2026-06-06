import axios from 'axios';

// ──────────────────────────────────────────────
//  CONSTANTS & CONFIG
// ──────────────────────────────────────────────
const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = {
  // ── النماذج الأساسية ────────────────────────────────────────────────────
  // تحليل الصور: Qwen3 VL 235B مجاني تماماً ويدعم الصور بشكل ممتاز
  vision:   "qwen/qwen3-vl-235b-a22b-thinking",

  // النصوص: Owl Alpha مجاني، 1M context، سريع جداً
  text:     "openrouter/owl-alpha",

  // الكود والتصميم: Qwen3 Coder 480B مجاني تماماً - أقوى كودر مجاني
  designer: "qwen/qwen3-coder:free",

  // ── Fallbacks مُرتّبة: مجاني أولاً، ثم الأرخص ─────────────────────────
  fallbacks: [
    "openrouter/owl-alpha",                     // ✅ مجاني، 1M context
    "qwen/qwen3-coder:free",                    // ✅ مجاني، 480B، أقوى كودر
    "qwen/qwen3-235b-a22b-thinking-2507",       // ✅ مجاني تماماً، 235B
    "qwen/qwen3-next-80b-a3b-instruct:free",    // ✅ مجاني، 262K context
    "arcee-ai/trinity-mini:free",               // ✅ مجاني، 131K context
    "meta-llama/llama-3.3-70b-instruct:free",  // ✅ مجاني، موثوق
    "openai/gpt-oss-120b:free",                // ✅ مجاني، 120B params
    "openai/gpt-oss-20b:free",                 // ✅ مجاني، خفيف وسريع
    "stepfun/step-3.5-flash:free",             // ✅ مجاني، 256K context
    "z-ai/glm-4.5-air:free",                   // ✅ مجاني، agentic
    "openrouter/free",                          // ✅ router عام - آخر خيار
  ],

  // ── نماذج الصور المجانية ─────────────────────────────────────────────
  visionFallbacks: [
    "qwen/qwen3-vl-235b-a22b-thinking",        // ✅ مجاني، 235B VL thinking
    "qwen/qwen3-vl-30b-a3b-thinking",          // ✅ مجاني تماماً
    "nvidia/nemotron-nano-12b-v2-vl:free",     // ✅ مجاني، متخصص للصور
    "openrouter/free",                          // router عام يختار vision model
  ],
};

const TIMEOUTS = {
  vision: 30_000,
  text:   45_000,
  design: 60_000,
};

// Simple in-memory cache (يتنظف تلقائياً بعد 10 دقايق)
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value) {
  _cache.set(key, { value, ts: Date.now() });
}

// ──────────────────────────────────────────────
//  CORE HTTP HELPER  (مع retry تلقائي)
// ──────────────────────────────────────────────
async function openRouterRequest(payload, timeoutMs = TIMEOUTS.text, retries = 2) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY غير موجود");

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL || "https://app.local",
    "X-Title": "AI Assistant",
  };

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(OPENROUTER_BASE, payload, { headers, timeout: timeoutMs });
      const content = res.data?.choices?.[0]?.message?.content;
      if (content) return content;
      throw new Error("الرد فارغ من النموذج");
    } catch (err) {
      lastErr = err;
      const isRetryable = err.code === 'ECONNRESET' || err.code === 'ECONNABORTED'
        || (err.response?.status >= 500);
      if (!isRetryable || attempt === retries) break;
      const delay = 1000 * (attempt + 1); // 1s, 2s
      console.warn(`⚠️ Attempt ${attempt + 1} failed (${err.message}), retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ──────────────────────────────────────────────
//  IMAGE ANALYSIS  (شرح تفصيلي احترافي)
// ──────────────────────────────────────────────
const VISION_PROMPT = `أنت محلل صور خبير. قم بوصف هذه الصورة بشكل **تفصيلي واحترافي** باللغة العربية وفق النقاط التالية:

1. **المحتوى العام**: ما الذي تصوره الصورة بشكل عام؟
2. **الأشخاص** (إن وجدوا): العدد، الجنس التقريبي، الملابس، التعبيرات، أوضاع الجسد، أي نص ظاهر على الملابس.
3. **الأشياء والعناصر**: كل عنصر مرئي مع وصفه الدقيق (اللون، الحجم، الموضع).
4. **النصوص والكتابات**: استخرج أي نص أو لوحة أو شعار ظاهر في الصورة حرفياً.
5. **الخلفية والمكان**: هل هو داخلي أم خارجي؟ طبيعي أم اصطناعي؟ وصف الألوان والإضاءة.
6. **الجودة الفنية**: زاوية التصوير، جودة الصورة، الإضاءة، العمق.
7. **الانطباع العام**: ما الشعور أو الرسالة التي تنقلها الصورة؟

كن دقيقاً ومفصلاً قدر الإمكان — هذا الوصف سيُستخدم للإجابة عن أسئلة الصورة.`;

async function analyzeImage(base64Media) {
  // ضمان صيغة data URI
  if (!base64Media.startsWith('data:')) {
    base64Media = `data:image/jpeg;base64,${base64Media}`;
  }

  console.log(`📸 [Vision] بدء تحليل الصورة (${(base64Media.length / 1024).toFixed(0)} KB)…`);

  for (const model of MODELS.visionFallbacks) {
    try {
      console.log(`🔍 [Vision] تجربة: ${model}`);
      const description = await openRouterRequest({
        model,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            { type: "image_url", image_url: { url: base64Media, detail: "high" } },
          ],
        }],
        max_tokens: 1500,
        temperature: 0.2,
      }, TIMEOUTS.vision, 1); // retry واحد فقط للصور

      console.log(`✅ [Vision] تم التحليل بـ ${model} (${description.length} حرف)`);
      return description;
    } catch (err) {
      console.warn(`⚠️ [Vision] ${model} فشل: ${err.message}`);
    }
  }

  console.error("❌ [Vision] كل نماذج الصور فشلت");
  return ""; // fallback: إرسال السؤال بدون وصف صورة
}

// ──────────────────────────────────────────────
//  SYSTEM PROMPT  (ذكاء وأسلوب أفضل)
// ──────────────────────────────────────────────
const DEFAULT_SYSTEM_PROMPT = `أنت مساعد ذكي ومتخصص، تتميز بـ:
- الردود الدقيقة والمفيدة مع أمثلة عملية عند الحاجة.
- أسلوب واضح ومباشر بدون حشو أو تكرار.
- استخدام العربية الفصحى المبسطة والمفهومة.
- إذا كان السؤال عن صورة، استند إلى وصفها الدقيق واذكر التفاصيل المرتبطة بالسؤال مباشرة.
- لا تذكر أنك نموذج لغوي أو تعتذر دون داعٍ — فقط أجب بثقة واحترافية.`;

// ──────────────────────────────────────────────
//  MAIN: fetchAiResponse
// ──────────────────────────────────────────────
/**
 * @param {string}  fullQuestion   - السؤال الكامل
 * @param {string}  fallbackText   - رد احتياطي
 * @param {string}  preferredModel - نموذج مفضل (اختياري)
 * @param {string}  base64Media    - صورة base64 (اختياري)
 * @param {string}  systemPrompt   - system prompt مخصص (اختياري)
 */
export async function fetchAiResponse(
  fullQuestion,
  fallbackText = "لم أتمكن من الرد حالياً.",
  preferredModel = null,
  base64Media = null,
  systemPrompt = null
) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY غير مضبوط");
    return fallbackText;
  }

  // اختصار السؤال الطويل
  const question = fullQuestion.length > 12_000
    ? fullQuestion.substring(0, 12_000) + "…"
    : fullQuestion;

  // Cache key (بدون الصور لأنها كبيرة)
  const cacheKey = !base64Media ? `q::${question.slice(0, 200)}` : null;
  if (cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) { console.log("⚡ [Cache] رد من الكاش"); return cached; }
  }

  try {
    let userContent = question;

    // ── مسار الصور: تحليل أولاً ثم إرسال الوصف ──
    if (base64Media) {
      const imageDescription = await analyzeImage(base64Media);

      userContent = imageDescription
        ? `${question}\n\n━━━ وصف الصورة التفصيلي ━━━\n${imageDescription}\n━━━━━━━━━━━━━━━━━━━━━━━━`
        : question;
    }

    // ── بناء رسائل المحادثة ──
    const messages = [
      { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ];

    console.log(`🤖 [AI] إرسال إلى ${preferredModel || MODELS.text}…`);

    const reply = await openRouterRequest({
      model: preferredModel || MODELS.text,
      messages,
      max_tokens: 2000,
      temperature: 0.6,
    }, TIMEOUTS.text);

    if (cacheKey) cacheSet(cacheKey, reply);
    return reply;

  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`❌ [AI] فشل الرد:`, msg);
    return `⚠️ حدث خطأ: ${msg}`;
  }
}

// ──────────────────────────────────────────────
//  DESIGNER AI  (مُحسَّن)
// ──────────────────────────────────────────────
/**
 * @param {string} systemPrompt   - تعليمات التصميم
 * @param {string} userPrompt     - طلب المستخدم
 * @param {string} fallbackText   - رد احتياطي
 * @param {string} preferredModel - نموذج مفضل
 */
export async function fetchDesignerAiResponse(
  systemPrompt,
  userPrompt,
  fallbackText = "Failed to generate design.",
  preferredModel = null
) {
  if (!process.env.OPENROUTER_API_KEY) return fallbackText;

  const modelsToTry = [
    preferredModel || MODELS.designer,
    ...MODELS.fallbacks,
  ].filter(Boolean);

  for (const model of modelsToTry) {
    try {
      console.log(`🎨 [Designer] تجربة النموذج: ${model}…`);

      const reply = await openRouterRequest({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }, TIMEOUTS.design, 1);

      console.log(`✅ [Designer] رد ناجح من ${model} (${reply.length} حرف)`);
      return reply;

    } catch (err) {
      console.warn(`⚠️ [Designer] ${model} فشل:`, err.message);
    }
  }

  // Fallback للـ AI العادي
  try {
    console.log("↩️ [Designer] تجربة الـ fallback العام…");
    return await fetchAiResponse(`${systemPrompt}\n\nUser request: ${userPrompt}`, fallbackText);
  } catch (err) {
    console.error("❌ [Designer] الـ fallback فشل أيضاً:", err.message);
  }

  return fallbackText;
}

// ──────────────────────────────────────────────
//  SPEECH-TO-TEXT  (Whisper)
// ──────────────────────────────────────────────
const MIME_TO_EXT = {
  'audio/ogg': 'ogg', 'audio/oga': 'oga',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
  'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
  'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/webm': 'webm', 'audio/flac': 'flac',
  'audio/amr': 'amr', 'audio/3gpp': '3gp',
};

/**
 * @param {Buffer} buffer   - بيانات الصوت
 * @param {string} fileName - اسم الملف
 * @param {string} mimeType - نوع الملف
 */
export async function transcribeAudio(buffer, fileName = "audio.ogg", mimeType = "audio/ogg") {
  const groqKey  = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const apiKey   = groqKey || openaiKey;

  if (!apiKey) {
    console.error("[STT] لا يوجد API key للتفريغ الصوتي");
    return "[رسالة صوتية: ميزة التفريغ غير مفعّلة]";
  }

  const apiUrl = groqKey
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";

  const cleanMime  = mimeType.split(';')[0].trim();
  const ext        = MIME_TO_EXT[cleanMime] || fileName.split('.').pop() || 'ogg';
  const safeFile   = `audio.${ext}`;

  console.log(`🎙️ [STT] إرسال إلى ${groqKey ? 'Groq' : 'OpenAI'} Whisper (${safeFile})…`);

  try {
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: cleanMime }), safeFile);
    formData.append("model", "whisper-large-v3");
    formData.append("language", "ar");
    formData.append("temperature", "0");
    formData.append("response_format", "json");

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: formData,
      signal: AbortSignal.timeout(35_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`❌ [STT] HTTP ${res.status}: ${body}`);
      if (res.status === 413) return "[رسالة صوتية: الملف كبير جداً، يُرجى تقصيره]";
      if (res.status === 401 || res.status === 403) return "[رسالة صوتية: خطأ في مفتاح API]";
      return "[رسالة صوتية: خطأ في التفريغ]";
    }

    const { text } = await res.json();
    if (text?.trim()) {
      console.log(`✅ [STT] تم التفريغ (${text.trim().length} حرف)`);
      return text.trim();
    }
    return "[رسالة صوتية: لم يُكتشف نص واضح]";

  } catch (e) {
    console.error("❌ [STT] فشل التفريغ:", e.message);
    if (e.name === 'TimeoutError') return "[رسالة صوتية: انتهت مهلة المعالجة]";
    return "[رسالة صوتية غير واضحة]";
  }
}

// ──────────────────────────────────────────────
//  LEGACY HELPER  (للتوافق مع الكود القديم)
// ──────────────────────────────────────────────
export function extractCorexReply(data, fallback = "لم أتمكن من الرد حالياً.") {
  if (!data) return fallback;
  const ok = data.status === 'success' || data.success === true || data.status === 'ok';
  if (!ok) return fallback;
  let raw = data.response || data.reply || data.text || data.message;
  if (!raw) return fallback;
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const p = JSON.parse(raw);
      raw = p.response || p.reply || p.text || p.message || raw;
    } catch (_) {}
  }
  return raw || fallback;
}