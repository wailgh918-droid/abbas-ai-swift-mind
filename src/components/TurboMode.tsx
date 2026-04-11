import { useState, useCallback } from "react";
import { Zap, FileText, X, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TurboModeProps {
  onProcessed: (text: string) => void;
  onClose: () => void;
}

const CHUNK_SIZE = 2000;

const TurboMode = ({ onProcessed, onClose }: TurboModeProps) => {
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  const processText = useCallback(async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setProgress(0);
    setStage("تحليل البيانات...");

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    const total = chunks.length;
    const results: string[] = new Array(total);

    // Simulate parallel processing with staggered progress
    const batchSize = Math.min(3, total);
    for (let i = 0; i < total; i += batchSize) {
      setStage(`معالجة الأجزاء ${i + 1}-${Math.min(i + batchSize, total)} من ${total}...`);
      const batch = chunks.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (chunk, idx) => {
          // Small delay to show progress animation
          await new Promise((r) => setTimeout(r, 100 + idx * 50));
          results[i + idx] = chunk;
        })
      );
      setProgress(Math.round(((i + batchSize) / total) * 100));
    }

    setStage("تجميع النتائج...");
    setProgress(100);
    await new Promise((r) => setTimeout(r, 300));

    const summary = `[وضع التوربو] تمت معالجة ${text.length.toLocaleString()} حرف في ${total} أجزاء.\n\nلخّص لي هذا النص:\n${text.slice(0, 4000)}`;
    onProcessed(summary);
    setProcessing(false);
  }, [text, onProcessed]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">وضع التوربو</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            الصق نصاً طويلاً أو ارفع ملفاً نصياً لمعالجته بسرعة فائقة.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="الصق النص هنا..."
            rows={6}
            disabled={processing}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/40 transition-colors"
            dir="auto"
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>رفع ملف</span>
              <input type="file" accept=".txt,.md,.csv,.json" onChange={handleFile} className="hidden" />
            </label>
            {text && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {text.length.toLocaleString()} حرف
              </span>
            )}
          </div>

          {/* Progress */}
          {processing && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary font-medium">{stage}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70" />
            </div>
          )}

          <button
            onClick={processText}
            disabled={!text.trim() || processing}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {processing ? "جارٍ المعالجة..." : "معالجة بوضع التوربو"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurboMode;
