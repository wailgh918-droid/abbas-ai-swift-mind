import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "لم يتم إرسال صورة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `أنت محلل رياضيات خبير متخصص في المنهج الدراسي الجزائري (شعبة تقني رياضي). مهامك:

1. إذا كانت الصورة تحتوي على رسم بياني (Graph):
   - استخرج نقاط التقاطع مع المحاور
   - حدد القيم الحدية (Maximum/Minimum)
   - حدد اتجاه التغير (تزايد/تناقص)
   - حدد مجال التعريف ومجال القيم

2. إذا كانت الصورة تحتوي على معادلة مكتوبة بخط اليد:
   - حوّلها إلى صيغة رياضية واضحة
   - قدم الحل خطوة بخطوة
   - اذكر القوانين المستخدمة

3. إذا كانت مسألة فيزياء أو تكنولوجيا:
   - حدد المعطيات والمطلوب
   - قدم الحل المنهجي

استخدم العربية الفصحى مع المصطلحات التقنية المتداولة في الثانويات الجزائرية. كن دقيقاً جداً في الحسابات.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "حلل هذه الصورة الرياضية وقدم التحليل الكامل:" },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Math analyzer error:", response.status, t);
      return new Response(JSON.stringify({ error: "فشل في تحليل الصورة" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Math analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
