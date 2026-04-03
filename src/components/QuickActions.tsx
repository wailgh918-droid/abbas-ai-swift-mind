import { FileText, Languages, Mail, Sparkles, Code, PenLine } from "lucide-react";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

const actions = [
  { icon: FileText, label: "تلخيص نص", prompt: "لخص لي هذا النص:" },
  { icon: Languages, label: "ترجمة", prompt: "ترجم لي النص التالي:" },
  { icon: Mail, label: "كتابة إيميل", prompt: "اكتب لي إيميل احترافي بخصوص:" },
  { icon: Code, label: "مساعدة برمجية", prompt: "ساعدني في كتابة كود:" },
  { icon: PenLine, label: "تحسين كتابة", prompt: "حسّن لي هذا النص:" },
  { icon: Sparkles, label: "أفكار إبداعية", prompt: "أعطني أفكاراً إبداعية حول:" },
];

const QuickActions = ({ onSelect }: QuickActionsProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
    {actions.map((action) => (
      <button
        key={action.label}
        onClick={() => onSelect(action.prompt)}
        className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl border border-border bg-background/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
      >
        <action.icon className="w-5 h-5 text-primary" />
        <span className="text-foreground">{action.label}</span>
      </button>
    ))}
  </div>
);

export default QuickActions;
