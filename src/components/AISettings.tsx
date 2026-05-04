import { useState, useEffect } from "react";
import { X, Key, Sparkles, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import { getAISettings, saveAISettings, type AIProvider } from "@/lib/streamChat";

interface Props {
  onClose: () => void;
}

const LOVABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (سريع)" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (الأقوى)" },
];

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (سريع)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (الأقوى)" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

const AISettings = ({ onClose }: Props) => {
  const [provider, setProvider] = useState<AIProvider>("lovable");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const s = getAISettings();
    setProvider(s.provider);
    setApiKey(s.geminiApiKey || "");
    setModel(s.model || "google/gemini-3-flash-preview");
  }, []);

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    setModel(p === "lovable" ? "google/gemini-3-flash-preview" : "gemini-2.5-flash");
  };

  const handleSave = () => {
    if (provider === "gemini" && (!apiKey || apiKey.length < 10)) {
      toast.error("الرجاء إدخال مفتاح Gemini صالح");
      return;
    }
    saveAISettings({ provider, geminiApiKey: apiKey.trim(), model });
    toast.success("تم حفظ الإعدادات");
    onClose();
  };

  const models = provider === "lovable" ? LOVABLE_MODELS : GEMINI_MODELS;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Key className="w-4 h-4" /> إعدادات الذكاء الاصطناعي
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Provider */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">مزوّد الخدمة</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleProviderChange("lovable")}
                className={`p-3 rounded-xl border text-sm transition-all ${
                  provider === "lovable"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Sparkles className="w-4 h-4 mx-auto mb-1" />
                Lovable AI
                <span className="block text-[10px] opacity-70 mt-0.5">بدون مفتاح</span>
              </button>
              <button
                onClick={() => handleProviderChange("gemini")}
                className={`p-3 rounded-xl border text-sm transition-all ${
                  provider === "gemini"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Key className="w-4 h-4 mx-auto mb-1" />
                Gemini شخصي
                <span className="block text-[10px] opacity-70 mt-0.5">مفتاحك الخاص</span>
              </button>
            </div>
          </div>

          {/* API Key */}
          {provider === "gemini" && (
            <div className="animate-fade-in">
              <label className="text-sm font-medium text-foreground mb-2 block">
                مفتاح Gemini API
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary/60"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                احصل على مفتاحك من{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Google AI Studio
                </a>
                . يُحفظ المفتاح محلياً في متصفحك فقط.
              </p>
            </div>
          )}

          {/* Model */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">النموذج</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary/60"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;