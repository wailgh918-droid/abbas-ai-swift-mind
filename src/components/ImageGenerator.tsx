import { useState, useCallback } from "react";
import { Palette, X, Loader2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ImageGeneratorProps {
  onClose: () => void;
}

const IMG_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

const ImageGenerator = ({ onClose }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const resp = await fetch(IMG_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "فشل التوليد");
      if (data.image) {
        setImageUrl(data.image);
      } else {
        toast.error("لم يتم إنتاج صورة");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل في توليد الصورة");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const download = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `abbas-art-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Mega Art Studio</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">صِف الصورة التي تريدها وسيقوم عباس بتوليدها بجودة عالية.</p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: ذئب رمادي يقف على قمة جبل عند الغروب..."
            rows={3}
            disabled={loading}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/40 transition-colors"
            dir="auto"
          />

          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">جارٍ الإبداع...</p>
            </div>
          )}

          {imageUrl && !loading && (
            <div className="space-y-3 animate-fade-in">
              <img src={imageUrl} alt="Generated" className="w-full rounded-xl border border-border" />
              <div className="flex gap-2">
                <button onClick={download} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all">
                  <Download className="w-4 h-4" />
                  تحميل
                </button>
                <button onClick={() => { setImageUrl(null); setPrompt(""); }} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-all">
                  صورة جديدة
                </button>
              </div>
            </div>
          )}

          {!loading && !imageUrl && (
            <button
              onClick={generate}
              disabled={!prompt.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              ولّد الصورة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
