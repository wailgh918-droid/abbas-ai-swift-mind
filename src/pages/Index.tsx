import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Sun, Moon, Zap, Camera, Palette, Trophy, Shield, Target, LogOut } from "lucide-react";
import { toast } from "sonner";
import WolfLogo from "@/components/WolfLogo";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import QuickActions from "@/components/QuickActions";
import TypingIndicator from "@/components/TypingIndicator";
import TurboMode from "@/components/TurboMode";
import PredictiveActions from "@/components/PredictiveActions";
import OCRScanner from "@/components/OCRScanner";
import ImageGenerator from "@/components/ImageGenerator";
import PackRanks from "@/components/PackRanks";
import StrategicPlanner from "@/components/StrategicPlanner";
import WolfVault from "@/components/WolfVault";
import { streamChat } from "@/lib/streamChat";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useRanks } from "@/hooks/useRanks";

type ModalType = "turbo" | "ocr" | "image" | "ranks" | "planner" | "vault" | null;

const Index = () => {
  const { signOut } = useAuth();
  const {
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    setMessages,
    createConversation,
    saveMessage,
    handleNewChat,
  } = useConversations();
  const { rankData, addPoints } = useRanks();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [quickActionPrompt, setQuickActionPrompt] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

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
    addPoints("message");

    // Create conversation if needed
    let convId = activeConvId;
    if (!convId) {
      const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
      convId = await createConversation(title);
    }

    // Save user message
    if (convId) saveMessage(convId, "user", text);

    const assistantId = (Date.now() + 1).toString();
    let assistantContent = "";

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
          // Save assistant message
          if (convId && assistantContent) saveMessage(convId, "assistant", assistantContent);
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
  }, [messages, activeConvId, createConversation, saveMessage, addPoints, setMessages]);

  const hasMessages = messages.length > 0;

  // Map conversations for sidebar
  const sidebarConvs = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    date: new Date(c.created_at).toLocaleDateString("ar-SA"),
  }));

  const toolButtons = [
    { key: "turbo" as const, icon: Zap, label: "التوربو" },
    { key: "ocr" as const, icon: Camera, label: "الماسح" },
    { key: "image" as const, icon: Palette, label: "الصور" },
    { key: "planner" as const, icon: Target, label: "المخطط" },
    { key: "vault" as const, icon: Shield, label: "الخزنة" },
    { key: "ranks" as const, icon: Trophy, label: "الرتب" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        conversations={sidebarConvs}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onNew={handleNewChat}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-w-0 gradient-bg ${isDark ? "wolf-eyes-effect" : ""}`}>
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/60 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <WolfLogo size={28} />
            <h1 className="font-semibold text-foreground">عباس</h1>
          </div>
          <div className="flex items-center gap-1">
            {toolButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setActiveModal(btn.key)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                title={btn.label}
              >
                <btn.icon className="w-4 h-4" />
              </button>
            ))}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              title={isDark ? "الوضع الفاتح" : "وضع الذئب الليلي"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in">
              <div className="mb-8">
                <WolfLogo size={72} className="opacity-90" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">مرحباً، أنا عباس</h2>
              <p className="text-muted-foreground text-center mb-10 max-w-md text-base">
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

        {/* Predictive Actions + Input */}
        <div className="px-4 pb-4 pt-2 max-w-3xl mx-auto w-full space-y-2 relative z-10">
          {hasMessages && !isTyping && (
            <PredictiveActions messages={messages} onSelect={(p) => handleSend(p)} />
          )}
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

      {/* Modals */}
      {activeModal === "turbo" && (
        <TurboMode
          onProcessed={(text) => { setActiveModal(null); addPoints("turbo"); handleSend(text); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "ocr" && (
        <OCRScanner
          onResult={(text) => { setActiveModal(null); addPoints("ocr"); handleSend(text); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "image" && (
        <ImageGenerator onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "ranks" && (
        <PackRanks rankData={rankData} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "planner" && (
        <StrategicPlanner
          onClose={() => setActiveModal(null)}
          onSendToChat={(text) => { setActiveModal(null); handleSend(text); }}
        />
      )}
      {activeModal === "vault" && (
        <WolfVault onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
};

export default Index;
