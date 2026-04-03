import { Plus, MessageSquare, ChevronLeft } from "lucide-react";
import WolfLogo from "./WolfLogo";

export interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, open, onToggle }: ChatSidebarProps) => {
  if (!open) return null;

  const grouped = conversations.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const key = conv.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {});

  return (
    <aside className="w-72 h-full border-r border-border bg-sidebar flex flex-col animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <WolfLogo size={28} />
          <span className="font-semibold text-foreground">عباس</span>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm font-medium transition-all hover:border-primary/50 hover:wolf-glow text-foreground"
        >
          <Plus className="w-4 h-4 text-primary" />
          محادثة جديدة
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {Object.entries(grouped).map(([date, convs]) => (
          <div key={date}>
            <p className="text-xs text-muted-foreground px-3 mb-1.5">{date}</p>
            <div className="space-y-0.5">
              {convs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`sidebar-item w-full text-right ${activeId === conv.id ? "sidebar-item-active" : ""}`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
