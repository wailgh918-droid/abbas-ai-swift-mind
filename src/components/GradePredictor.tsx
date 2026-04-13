import { useState } from "react";
import { X, Calculator, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GradePredictorProps {
  onClose: () => void;
}

// معاملات شعبة تقني رياضي
const subjects = [
  { id: "math", label: "الرياضيات", coeff: 7 },
  { id: "tech", label: "التكنولوجيا (هندسة)", coeff: 6 },
  { id: "physics", label: "الفيزياء", coeff: 5 },
  { id: "arabic", label: "اللغة العربية", coeff: 3 },
  { id: "french", label: "اللغة الفرنسية", coeff: 2 },
  { id: "english", label: "اللغة الإنجليزية", coeff: 2 },
  { id: "philo", label: "الفلسفة", coeff: 2 },
  { id: "history", label: "التاريخ والجغرافيا", coeff: 2 },
  { id: "islamic", label: "العلوم الإسلامية", coeff: 2 },
  { id: "amazigh", label: "الأمازيغية (اختياري)", coeff: 1, optional: true },
];

const GradePredictor = ({ onClose }: GradePredictorProps) => {
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ average: number; message: string } | null>(null);

  const updateGrade = (id: string, value: string) => {
    const num = parseFloat(value);
    if (value === "" || (num >= 0 && num <= 20)) {
      setGrades((prev) => ({ ...prev, [id]: value }));
    }
  };

  const calculate = () => {
    let totalWeighted = 0;
    let totalCoeff = 0;
    const activeSubs = subjects.filter((s) => {
      const v = grades[s.id];
      return v !== undefined && v !== "";
    });

    if (activeSubs.length < 3) {
      setResult({ average: 0, message: "أدخل على الأقل 3 مواد للحصول على تقدير." });
      return;
    }

    activeSubs.forEach((s) => {
      const grade = parseFloat(grades[s.id]);
      if (!isNaN(grade)) {
        totalWeighted += grade * s.coeff;
        totalCoeff += s.coeff;
      }
    });

    const avg = totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
    const rounded = Math.round(avg * 100) / 100;

    let message = "";
    if (rounded >= 16) message = "🏆 أنت ذئب القمة! أداء استثنائي، استمر في المطاردة!";
    else if (rounded >= 15) message = "🐺 أنت تقترب من القمة، استمر في المطاردة!";
    else if (rounded >= 12) message = "⚡ أداء جيد! ركّز أكثر على الرياضيات والتكنولوجيا للوصول للقمة.";
    else if (rounded >= 10) message = "🔥 الذئب لا يستسلم! نحتاج لتركيز أكبر في مادة التكنولوجيا والرياضيات.";
    else message = "💪 لا تيأس! الذئب الحقيقي يقاتل حتى النهاية. ركّز على المواد ذات المعاملات العالية.";

    setResult({ average: rounded, message });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5" /> توقع المعدل
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-4 pt-3 text-xs text-muted-foreground">شعبة تقني رياضي — أدخل علاماتك التقديرية</p>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <label className="flex-1 text-sm text-foreground">
                {s.label} <span className="text-muted-foreground text-xs">(×{s.coeff})</span>
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                placeholder="—"
                value={grades[s.id] || ""}
                onChange={(e) => updateGrade(s.id, e.target.value)}
                className="w-16 text-center py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <button
            onClick={calculate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <TrendingUp className="w-4 h-4" /> احسب المعدل التقديري
          </button>

          {result && (
            <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-2 animate-scale-in">
              {result.average > 0 && (
                <>
                  <div className="text-3xl font-bold text-foreground">{result.average.toFixed(2)}/20</div>
                  <Progress value={(result.average / 20) * 100} className="h-2" />
                </>
              )}
              <p className="text-sm text-foreground mt-2">{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradePredictor;
