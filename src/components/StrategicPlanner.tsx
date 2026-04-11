import { useState, useCallback } from "react";
import { Target, X, Loader2, CheckCircle2, Circle, Plus } from "lucide-react";
import { toast } from "sonner";

interface StrategicPlannerProps {
  onClose: () => void;
  onSendToChat: (text: string) => void;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  day: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const StrategicPlanner = ({ onClose, onSendToChat }: StrategicPlannerProps) => {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const generatePlan = useCallback(async () => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `حوّل هذا الهدف إلى 5-7 مهام يومية صغيرة. لكل مهمة اكتب سطراً بالصيغة: "اليوم X: وصف المهمة". الهدف: ${goal}`,
            },
          ],
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("فشل");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) full += c;
          } catch {}
        }
      }

      const parsed = full.split("\n").filter((l) => l.trim()).map((line, i) => ({
        id: `${Date.now()}-${i}`,
        text: line.replace(/^(اليوم\s*\d+\s*:\s*|[-*•]\s*)/i, "").trim(),
        done: false,
        day: `اليوم ${i + 1}`,
      }));
      setTasks(parsed);
    } catch {
      toast.error("فشل في إنشاء الخطة");
    } finally {
      setLoading(false);
    }
  }, [goal]);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">المساعد الاستراتيجي</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-muted-foreground">أدخل هدفك الكبير وسيحوّله عباس إلى مهام يومية.</p>

          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="مثال: تعلم البرمجة بلغة Python في شهر..."
            rows={2}
            disabled={loading}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/40 transition-colors"
            dir="auto"
          />

          {!loading && tasks.length === 0 && (
            <button
              onClick={generatePlan}
              disabled={!goal.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              أنشئ الخطة
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">جارٍ التخطيط...</span>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                    task.done
                      ? "border-primary/30 bg-primary/5 line-through text-muted-foreground"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  {task.done ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 text-right">
                    <p className="text-xs text-primary font-medium">{task.day}</p>
                    <p className="text-sm">{task.text}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setTasks([]); setGoal(""); }}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                خطة جديدة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategicPlanner;
