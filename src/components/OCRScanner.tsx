import { useState, useRef, useCallback } from "react";
import { Camera, X, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OCRScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

const OCR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr`;

const OCRScanner = ({ onResult, onClose }: OCRScannerProps) => {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (dataUrl: string) => {
    setProcessing(true);
    setPreview(dataUrl);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("يجب تسجيل الدخول");
      const resp = await fetch(OCR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "فشل OCR");
      setResult(data.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل في المعالجة");
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [processImage]);

  const handleUse = () => {
    if (result) {
      onResult(`[OCR] النص المستخرج:\n${result}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">الماسح الضوئي الذكي</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!preview ? (
            <>
              <p className="text-sm text-muted-foreground">التقط صورة أو ارفع ملفاً لاستخراج النص بالذكاء الاصطناعي.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">التقط صورة</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" ref={fileRef} />
                </label>
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ارفع صورة</span>
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
              </div>
            </>
          ) : (
            <>
              <img src={preview} alt="Preview" className="w-full rounded-xl border border-border max-h-48 object-contain" />
              {processing ? (
                <div className="flex items-center justify-center gap-2 py-4 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">جارٍ استخراج النص...</span>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="w-4 h-4 text-primary" />
                    النص المستخرج:
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl bg-background border border-border p-3 text-sm text-foreground whitespace-pre-wrap" dir="auto">
                    {result}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleUse} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all">
                      أرسل للتحليل
                    </button>
                    <button onClick={() => { setPreview(null); setResult(null); }} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-all">
                      صورة أخرى
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRScanner;
