import { useState, useRef, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import WolfLogo from "@/components/WolfLogo";
import ChatSidebar, { type Conversation } from "@/components/ChatSidebar";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import QuickActions from "@/components/QuickActions";
import TypingIndicator from "@/components/TypingIndicator";

const DEMO_CONVERSATIONS: Conversation[] = [
  { id: "1", title: "مساعدة في كتابة تقرير", date: "اليوم" },
  { id: "2", title: "ترجمة مقال تقني", date: "اليوم" },
  { id: "3", title: "أفكار لمشروع جديد", date: "أمس" },
];

// Simulated AI response for demo purposes
const simulateResponse = (userMessage: string): string => {
  if (userMessage.includes("تلخيص")) return "بالتأكيد! أرسل لي النص وسألخصه لك بشكل واضح ومختصر. 📝";
  if (userMessage.includes("ترجمة") || userMessage.includes("ترجم")) return "جاهز للترجمة! أرسل لي النص المراد ترجمته وحدد اللغة المطلوبة. 🌍";
  if (userMessage.includes("إيميل")) return "سأساعدك في كتابة إيميل احترافي. ما هو الموضوع والنبرة المطلوبة؟ ✉️";
  if (userMessage.includes("كود") || userMessage.includes("برمج")) return "ممتاز! أخبرني بلغة البرمجة والمشكلة التي تريد حلها وسأساعدك فوراً. 💻";
  return "أهلاً بك! أنا **عباس**، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنني:\n\n- ✍️ كتابة وتحسين النصوص\n- 🌐 الترجمة بين اللغات\n- 💡 توليد أفكار إبداعية\n- 💻 المساعدة البرمجية\n\nما الذي تحتاجه؟";
};

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
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

  const handleSend = useCallback((text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setQuickActionPrompt("");

    // Simulate streaming delay
    setTimeout(() => {
      const response = simulateResponse(text);
      let displayed = "";
      const words = response.split(" ");
      let i = 0;

      const assistantId = (Date.now() + 1).toString();

      const interval = setInterval(() => {
        if (i < words.length) {
          displayed += (i > 0 ? " " : "") + words[i];
          i++;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantId) {
              return prev.map((m) => m.id === assistantId ? { ...m, content: displayed } : m);
            }
            return [...prev, { id: assistantId, role: "assistant", content: displayed }];
          });
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 40);
    }, 600);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setQuickActionPrompt("");
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onNew={handleNewChat}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            /* Welcome screen */
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
              {isTyping && (
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

        {/* Input */}
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
