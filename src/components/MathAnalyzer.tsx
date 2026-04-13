import { useState, useRef } from "react";
import { X, Upload, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MathAnalyzerProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

const MathAnalyzer = ({ onClose, onSendToChat }: MathAnalyzerProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الحد 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setIsLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("math-analyzer", {
        body: { image },
      });
      if (error) throw error;
      setResult(data.analysis || "لم يتم العثور على محتوى رياضي في الصورة.");
    } catch (e: any) {
      toast.error(e.message || "فشل في تحليل الصورة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">📐 محلل الرياضيات</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!image ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">ارفع صورة المعادلة أو الرسم البياني</p>
              <p className="text-muted-foreground text-sm mt-1">PNG, JPG حتى 10MB</p>
            </div>
          ) : (
            <div className="space-y-3">
              <img src={image} alt="Math" className="w-full rounded-xl border border-border" />
              <div className="flex gap-2">
                <button
                  onClick={analyze}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {isLoading ? "جاري التحليل..." : "حلّل الصورة"}
                </button>
                <button
                  onClick={() => { setImage(null); setResult(""); }}
                  className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors text-sm"
                >
                  صورة أخرى
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">📊 نتيجة التحليل:</h3>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result}</div>
              {onSendToChat && (
                <button
                  onClick={() => onSendToChat(`تحليل رياضي:\n${result}`)}
                  className="w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  أرسل للمحادثة للمتابعة
                </button>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
};

export default MathAnalyzer;
