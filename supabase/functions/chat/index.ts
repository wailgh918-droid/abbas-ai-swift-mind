import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, provider, geminiApiKey, model } = await req.json();
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
            content: `أنت "عباس"، مساعد ذكاء اصطناعي سريع وذكي. تتميز بالدقة والاحترافية. أجب بلغة المستخدم (عربي أو إنجليزي). كن مختصراً ومفيداً. استخدم Markdown للتنسيق عند الحاجة.`,
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
