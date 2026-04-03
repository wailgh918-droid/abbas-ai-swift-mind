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
  <div className="flex flex-wrap justify-center gap-2">
    {actions.map((action) => (
      <button
        key={action.label}
        onClick={() => onSelect(action.prompt)}
        className="quick-action-btn"
      >
        <action.icon className="w-4 h-4 text-primary" />
        <span>{action.label}</span>
      </button>
    ))}
  </div>
);

export default QuickActions;
