import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, subject, studentAnswer, correctTopic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate_question") {
      systemPrompt = `أنت "عباس"، معلم ذكي متخصص في البكالوريا الجزائرية (شعبة تقني رياضي). مهمتك توليد سؤال واحد للتسميع في مادة "${subject || "الرياضيات"}". أعد الاستجابة بصيغة JSON فقط:
{"question": "نص السؤال", "answer": "الإجابة النموذجية المختصرة", "hint": "تلميح مساعد"}
لا تضف أي نص خارج JSON.`;
      userPrompt = `أعطني سؤالاً في موضوع: ${correctTopic || subject || "الدوال العددية"}`;
    } else if (type === "evaluate_answer") {
      systemPrompt = `أنت "عباس"، مقيّم إجابات ذكي. قارن إجابة الطالب بالإجابة الصحيحة وأعطِ تقييماً. أعد الاستجابة بصيغة JSON فقط:
{"score": (رقم من 0 إلى 100), "feedback": "تعليق محفز باللغة العربية", "correct": true/false}
لا تضف أي نص خارج JSON.`;
      userPrompt = `الإجابة الصحيحة: "${correctTopic}"\nإجابة الطالب: "${studentAnswer}"`;
    } else {
      return new Response(JSON.stringify({ error: "نوع الطلب غير صالح" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
      console.error("Voice quiz error:", response.status, t);
      return new Response(JSON.stringify({ error: "حدث خطأ" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
