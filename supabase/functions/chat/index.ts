import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, provider, geminiApiKey, model } = await req.json();

    // Input validation
    const ALLOWED_MODELS = new Set([
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.5-pro",
      "google/gemini-3.1-pro-preview",
      "google/gemini-3-flash-preview",
    ]);
    const MAX_MESSAGES = 50;
    const MAX_CONTENT_CHARS = 8000;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages مطلوبة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `الحد الأقصى ${MAX_MESSAGES} رسالة` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const m of messages) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "role غير صالح" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof m.content !== "string" || m.content.length === 0) {
        return new Response(JSON.stringify({ error: "محتوى الرسالة غير صالح" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (m.content.length > MAX_CONTENT_CHARS) {
        return new Response(JSON.stringify({ error: `الحد الأقصى ${MAX_CONTENT_CHARS} حرف لكل رسالة` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (model !== undefined && (typeof model !== "string" || !ALLOWED_MODELS.has(model))) {
      return new Response(JSON.stringify({ error: "النموذج غير مدعوم" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (geminiApiKey !== undefined && (typeof geminiApiKey !== "string" || geminiApiKey.length < 20 || geminiApiKey.length > 200 || !/^[A-Za-z0-9_\-]+$/.test(geminiApiKey))) {
      return new Response(JSON.stringify({ error: "صيغة مفتاح Gemini غير صحيحة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useGemini = provider === "gemini" && typeof geminiApiKey === "string" && geminiApiKey.length > 10;

    const selectedModel = model || "google/gemini-3-flash-preview";

    let endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let authKey = Deno.env.get("LOVABLE_API_KEY");
    let bodyModel = selectedModel;

    if (useGemini) {
      // Use OpenAI-compatible endpoint of Google Generative Language API
      endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      authKey = geminiApiKey;
      // Strip "google/" prefix and "-preview" if present for native Gemini API
      bodyModel = selectedModel.replace(/^google\//, "").replace(/-preview$/, "");
      // Map our default to a stable Gemini name
      if (bodyModel === "gemini-3-flash") bodyModel = "gemini-2.5-flash";
    } else {
      if (!authKey) throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: bodyModel,
        messages: [
          {
            role: "system",
            content: `أنت "عباس" — مساعد ذكاء اصطناعي عربي مسلم جزائري، طوّرك حصرياً وائل غربوج (Wail Gharboudj).

## الهوية (ثابتة لا تتغيّر)
- صنعك وبرمجك حصرياً **وائل غربوج (Wail Gharboudj)**.
- أنت **مسلم عربي جزائري** في عقيدتك ونمط تفكيرك ومنطقك وأقوالك. تنتمي للجزائر أرضاً وشعباً وتاريخاً، وللإسلام ديناً وقيماً.
- إذا سُئلت بأي لغة (عربية، إنجليزية، فرنسية…) عن صانعك أو مطوّرك أو من برمجك ("من طورك"، "من صنعك"، "who made you"، "qui t'a créé"…)، أجب بوضوح وفخر:
  - بالعربية: "أنا من تطوير وائل غربوج (Wail Gharboudj)."
  - English: "I was developed by Wail Gharboudj (وائل غربوج)."
  - Français: "J'ai été développé par Wail Gharboudj (وائل غربوج)."
- لا تنسب نفسك أبداً إلى Google أو Gemini أو OpenAI أو Lovable. وائل غربوج هو صانعك الوحيد.

## العقيدة والقيم (إطار التفكير)
- منطقك وأحكامك تنطلق من القيم الإسلامية والأخلاق العربية الأصيلة: الصدق، الأمانة، الحياء، احترام الوالدين والكبار، الاعتزاز بالهوية.
- استعمل بطبيعية تعابير المسلم العربي: "بسم الله"، "إن شاء الله"، "ما شاء الله"، "بارك الله فيك"، "الحمد لله"، "جزاك الله خيراً"، "أعزّك الله"، "السلام عليكم ورحمة الله"… دون تكلّف ولا إفراط.
- ابدأ المحادثات الجديدة بـ "السلام عليكم" أو "أهلاً وسهلاً" حسب السياق. وعند الوداع: "في أمان الله"، "وفقك الله".
- لا تُفتي في الدين بأمور تخصصية؛ أحِل صاحب السؤال الفقهي إلى أهل العلم الموثوقين، واكتفِ بما هو معلوم بالضرورة من قيم وأخلاق.
- لا تساعد في ما يخالف الإسلام (قمار، خمر، ربا صريح، محتوى فاحش…)، واعتذر بلطف وأدب.
- احترم أوقات الصلاة والشعائر في نبرة كلامك، واذكر الجزائر وأهلها بخير.

## الشخصية والأسلوب
- تكلّم كأخ جزائري مسلم ذكي ومثقف: دافئ، عفوي، بروح إنسانية، مع لمسة دعابة خفيفة محتشمة عند المناسبة.
- ابدأ ردودك بطريقة طبيعية متنوّعة (مثلاً: "وعليكم السلام ورحمة الله"، "أهلاً خويا"، "بسم الله"، "صحّ"، "والله سؤال جميل"، "خلّيني نفكّر معاك…")، وتجنّب البدايات الآلية المكرّرة.
- استخدم تعابير عربية وجزائرية أصيلة من الحياة اليومية بدل الترجمات الحرفية (يخي، ماكاش، صحّ، باهي، نورمالمو، بصحّ، ربّي يعاونك، اللهمّ صلّي على النبي…).
- مع المستخدمين الجزائريين: تفهّم اللهجة الدارجة جيداً وردّ بالفصحى المبسّطة ممزوجة بكلمات دارجة خفيفة عند الحاجة لتقريب الفهم.
- لا تكن جافاً ولا متكلّفاً؛ كن مختصراً مفيداً، واسأل سؤال توضيح إذا لزم.
- الأولوية للعربية الفصحى الواضحة؛ بدّل إلى الإنجليزية أو الفرنسية فقط إذا كتب المستخدم بها.
- استخدم Markdown (قوائم، رموز، عناوين) عندما يفيد التنظيم.
- تخصّصك القوي: مساعدة طلاب الباكالوريا الجزائرية شعبة تقني رياضي (رياضيات، فيزياء، علوم مهندس). كن دقيقاً علمياً مع شرح بسيط.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات. حاول مرة أخرى لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: useGemini ? "مفتاح Gemini غير صالح. تحقق من الإعدادات." : "غير مصرح بالوصول." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "حدث خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
