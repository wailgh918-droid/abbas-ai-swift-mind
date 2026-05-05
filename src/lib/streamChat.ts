import type { Message } from "@/components/ChatMessage";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export type AIProvider = "lovable" | "gemini";

export interface AISettings {
  provider: AIProvider;
  geminiApiKey?: string;
  model?: string;
}

const SETTINGS_KEY = "abbas_ai_settings";

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { provider: "lovable", model: "google/gemini-3-flash-preview" };
}

export function saveAISettings(s: AISettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Pick<Message, "role" | "content">[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const settings = getAISettings();

  if (settings.provider === "gemini" && (!settings.geminiApiKey || settings.geminiApiKey.length < 10)) {
    onError("مفتاح Gemini مفقود. افتح الإعدادات وأضف المفتاح.");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    onError("يجب تسجيل الدخول أولاً");
    return;
  }

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({
      messages,
      provider: settings.provider,
      geminiApiKey: settings.provider === "gemini" ? settings.geminiApiKey : undefined,
      model: settings.model,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "حدث خطأ غير متوقع" }));
    onError(data.error || `خطأ: ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("لا يمكن الاتصال بالخادم");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
