import { Plus, MessageSquare, X } from "lucide-react";
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
  const grouped = conversations.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const key = conv.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {});

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:relative z-50 w-72 h-full border-r border-border bg-background flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <WolfLogo size={24} />
            <span className="font-semibold text-foreground text-sm">عباس</span>
          </div>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 py-3">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm font-medium transition-all hover:bg-secondary text-foreground"
          >
            <Plus className="w-4 h-4 text-primary" />
            محادثة جديدة
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {Object.entries(grouped).map(([date, convs]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground px-3 mb-1.5 font-medium">{date}</p>
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
    </>
  );
};

export default ChatSidebar;
