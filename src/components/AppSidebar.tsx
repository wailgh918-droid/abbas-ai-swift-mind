import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun, Moon, Zap, Camera, Palette, Trophy, Shield, Target,
  LogOut, User, MessageSquarePlus, ChevronLeft, ChevronRight,
  Crosshair, FlaskConical, Calculator,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import WolfLogo from "./WolfLogo";

type ModalType = "turbo" | "ocr" | "image" | "ranks" | "planner" | "vault" | "hunt" | "mathAnalyzer" | "gradePredictor" | null;

interface AppSidebarProps {
  isDark: boolean;
  onToggleDark: () => void;
  onOpenModal: (modal: ModalType) => void;
  onNewChat: () => void;
}

const AppSidebar = ({ isDark, onToggleDark, onOpenModal, onNewChat }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || user.email || "");
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [user]);

  const tools = [
    { key: "hunt" as const, icon: Crosshair, label: "المطاردة" },
    { key: "mathAnalyzer" as const, icon: FlaskConical, label: "المختبر" },
    { key: "gradePredictor" as const, icon: Calculator, label: "توقع المعدل" },
    { key: "turbo" as const, icon: Zap, label: "التوربو" },
    { key: "ocr" as const, icon: Camera, label: "الماسح" },
    { key: "image" as const, icon: Palette, label: "الصور" },
    { key: "planner" as const, icon: Target, label: "المخطط" },
    { key: "vault" as const, icon: Shield, label: "الخزنة" },
    { key: "ranks" as const, icon: Trophy, label: "الرتب" },
  ];

  return (
    <aside
      className={`h-screen flex flex-col border-l border-border bg-card/80 backdrop-blur-md transition-all duration-200 shrink-0 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <WolfLogo size={24} />
            <span className="font-semibold text-foreground text-sm">عباس</span>
          </div>
        )}
        {collapsed && <WolfLogo size={24} className="mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-2 py-3">
        <button
          onClick={onNewChat}
          className={`flex items-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
          }`}
          title="محادثة جديدة"
        >
          <MessageSquarePlus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>محادثة جديدة</span>}
        </button>
      </div>

      {/* Tools */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={() => onOpenModal(t.key)}
            className={`flex items-center gap-2 w-full rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${
              collapsed ? "justify-center p-2.5" : "px-3 py-2"
            }`}
            title={t.label}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t.label}</span>}
          </button>
        ))}

        <button
          onClick={onToggleDark}
          className={`flex items-center gap-2 w-full rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2"
          }`}
          title={isDark ? "الوضع الفاتح" : "وضع الذئب الليلي"}
        >
          {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{isDark ? "الوضع الفاتح" : "الوضع الليلي"}</span>}
        </button>
      </div>

      {/* User section */}
      <div className="border-t border-border px-2 py-3 space-y-1">
        <button
          onClick={() => navigate("/profile")}
          className={`flex items-center gap-2 w-full rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2"
          }`}
          title="الملف الشخصي"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
          ) : (
            <User className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && <span className="truncate">{displayName}</span>}
        </button>

        <button
          onClick={signOut}
          className={`flex items-center gap-2 w-full rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2"
          }`}
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
