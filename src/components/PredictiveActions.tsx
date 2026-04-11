import { useMemo } from "react";
import { ArrowLeft, FileText, Languages, PenLine, Code, Sparkles, BarChart3 } from "lucide-react";
import type { Message } from "@/components/ChatMessage";

interface PredictiveActionsProps {
  messages: Message[];
  onSelect: (prompt: string) => void;
}

interface Prediction {
  icon: React.ElementType;
  label: string;
  prompt: string;
  keywords: string[];
}

const predictions: Prediction[] = [
  { icon: FileText, label: "لخّص أكثر", prompt: "لخّص النص السابق بشكل أقصر", keywords: ["ملخص", "تلخيص", "لخص", "summary"] },
  { icon: Languages, label: "ترجم للإنجليزية", prompt: "ترجم ردك السابق إلى الإنجليزية", keywords: ["ترجم", "ترجمة", "translate"] },
  { icon: PenLine, label: "أعد الصياغة", prompt: "أعد صياغة ردك السابق بأسلوب مختلف", keywords: ["اكتب", "كتابة", "صياغة", "write"] },
  { icon: Code, label: "اشرح الكود", prompt: "اشرح الكود السابق سطراً بسطر", keywords: ["كود", "برمجة", "code", "function", "```"] },
  { icon: BarChart3, label: "حلّل أعمق", prompt: "حلّل الموضوع السابق بشكل أعمق مع أمثلة", keywords: ["تحليل", "حلل", "analyze", "analysis"] },
  { icon: Sparkles, label: "أعطني أمثلة", prompt: "أعطني أمثلة عملية على ما ذكرته", keywords: ["مثال", "أمثلة", "example"] },
  { icon: ArrowLeft, label: "أكمل", prompt: "أكمل من حيث توقفت", keywords: [] },
];

function scorePredictions(lastContent: string): Prediction[] {
  const lower = lastContent.toLowerCase();
  const scored = predictions.map((p) => {
    const score = p.keywords.reduce((s, kw) => s + (lower.includes(kw) ? 2 : 0), 0);
    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

const PredictiveActions = ({ messages, onSelect }: PredictiveActionsProps) => {
  const suggestions = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return [];
    return scorePredictions(lastAssistant.content);
  }, [messages]);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap animate-fade-in">
      {suggestions.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.prompt)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/80 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
        >
          <s.icon className="w-3 h-3" />
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default PredictiveActions;
