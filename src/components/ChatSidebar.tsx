import { Plus, MessageSquare, X, Trash2, Trash } from "lucide-react";
import { useState } from "react";
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
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
}

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, open, onToggle, onDelete, onDeleteAll }: ChatSidebarProps) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
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
        <div className="px-3 py-3 space-y-2">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm font-medium transition-all hover:bg-secondary text-foreground"
          >
            <Plus className="w-4 h-4 text-primary" />
            محادثة جديدة
          </button>
          {conversations.length > 0 && onDeleteAll && (
            confirmAll ? (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onDeleteAll(); setConfirmAll(false); }}
                  className="flex-1 px-2 py-2 rounded-lg bg-destructive/90 text-destructive-foreground text-xs font-medium hover:bg-destructive"
                >
                  أكيد، احذف الكل
                </button>
                <button
                  onClick={() => setConfirmAll(false)}
                  className="flex-1 px-2 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary"
                >
                  تراجع
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmAll(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash className="w-3.5 h-3.5" />
                حذف كل المحادثات
              </button>
            )
          )}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {Object.entries(grouped).map(([date, convs]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground px-3 mb-1.5 font-medium">{date}</p>
              <div className="space-y-0.5">
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-1 rounded-lg ${activeId === conv.id ? "bg-secondary" : "hover:bg-secondary/60"}`}
                  >
                    <button
                      onClick={() => onSelect(conv.id)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-right text-sm text-foreground min-w-0"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                    {onDelete && (
                      confirmId === conv.id ? (
                        <div className="flex gap-0.5 px-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(conv.id); setConfirmId(null); }}
                            className="px-2 py-1 rounded text-[10px] bg-destructive text-destructive-foreground"
                          >
                            حذف
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
                            className="px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-background"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmId(conv.id); }}
                          className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
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
