import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Message } from "@/components/ChatMessage";

export interface DbConversation {
  id: string;
  title: string;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setConversations(data);
      });
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId || !user) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
        }
      });
  }, [activeConvId, user]);

  const createConversation = useCallback(
    async (title: string): Promise<string | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error || !data) return null;
      setConversations((prev) => [{ id: data.id, title, created_at: new Date().toISOString() }, ...prev]);
      setActiveConvId(data.id);
      return data.id;
    },
    [user]
  );

  const saveMessage = useCallback(
    async (conversationId: string, role: "user" | "assistant", content: string) => {
      if (!user) return;
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content,
      });
    },
    [user]
  );

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
  }, []);

  return {
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    setMessages,
    createConversation,
    saveMessage,
    handleNewChat,
  };
}
