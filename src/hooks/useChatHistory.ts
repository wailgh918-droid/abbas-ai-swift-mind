import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/components/ChatMessage";
import type { Conversation } from "@/components/ChatSidebar";

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "اليوم";
  if (sameDay(d, yesterday)) return "الأمس";
  return d.toLocaleDateString("ar", { day: "numeric", month: "short" });
}

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const refreshList = useCallback(async () => {
    if (!user) { setConversations([]); return; }
    setLoadingList(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setConversations(data.map((c) => ({ id: c.id, title: c.title || "محادثة جديدة", date: formatDateLabel(c.updated_at) })));
    }
    setLoadingList(false);
  }, [user]);

  useEffect(() => { refreshList(); }, [refreshList]);

  const loadMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));
  }, []);

  const createConversation = useCallback(async (title: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: title.slice(0, 80) })
      .select("id")
      .single();
    if (error || !data) return null;
    refreshList();
    return data.id;
  }, [user, refreshList]);

  const saveMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
    });
  }, [user]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    await supabase.from("messages").delete().eq("conversation_id", conversationId);
    await supabase.from("conversations").delete().eq("id", conversationId);
    refreshList();
  }, [user, refreshList]);

  const deleteAllConversations = useCallback(async () => {
    if (!user) return;
    await supabase.from("messages").delete().eq("user_id", user.id);
    await supabase.from("conversations").delete().eq("user_id", user.id);
    refreshList();
  }, [user, refreshList]);

  return { conversations, loadingList, refreshList, loadMessages, createConversation, saveMessage, deleteConversation, deleteAllConversations };
}
