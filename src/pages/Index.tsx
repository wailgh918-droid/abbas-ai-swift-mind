import { useState, useRef, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import WolfLogo from "@/components/WolfLogo";
import ChatSidebar, { type Conversation } from "@/components/ChatSidebar";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import QuickActions from "@/components/QuickActions";
import TypingIndicator from "@/components/TypingIndicator";
import { streamChat } from "@/lib/streamChat";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickActionPrompt, setQuickActionPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setQuickActionPrompt("");

    const assistantId = (Date.now() + 1).toString();
    let assistantContent = "";

    // Build message history for context
    const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    try {
      await streamChat({
        messages: history,
        onDelta: (chunk) => {
          assistantContent += chunk;
          const current = assistantContent;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantId) {
              return prev.map((m) => m.id === assistantId ? { ...m, content: current } : m);
            }
            return [...prev, { id: assistantId, role: "assistant", content: current }];
          });
        },
        onDone: () => {
          setIsTyping(false);
          // Add to conversation list if new
          if (!activeConvId && assistantContent) {
            const newConv: Conversation = {
              id: assistantId,
              title: text.slice(0, 40) + (text.length > 40 ? "..." : ""),
              date: "اليوم",
            };
            setConversations((prev) => [newConv, ...prev]);
            setActiveConvId(assistantId);
          }
        },
        onError: (error) => {
          setIsTyping(false);
          toast.error(error);
        },
      });
    } catch (e) {
      setIsTyping(false);
      toast.error("فشل الاتصال بالخادم. حاول مرة أخرى.");
      console.error(e);
    }
  }, [messages, activeConvId]);

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setQuickActionPrompt("");
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onNew={handleNewChat}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <WolfLogo size={28} />
          <h1 className="font-semibold text-foreground">عباس</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">AI</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in">
              <div className="mb-6">
                <WolfLogo size={80} className="opacity-80" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">مرحباً، أنا عباس</h2>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                مساعدك الذكي السريع. اختر إجراءً سريعاً أو اكتب ما تريد.
              </p>
              <QuickActions onSelect={setQuickActionPrompt} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isTyping && !messages.some(m => m.role === "assistant" && m.id === (Date.now() + 1).toString()) && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <WolfLogo size={20} />
                  </div>
                  <div className="chat-bubble-assistant">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-2 max-w-3xl mx-auto w-full">
          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
            initialValue={quickActionPrompt}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">
            عباس قد يُخطئ أحياناً. تحقق من المعلومات المهمة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
