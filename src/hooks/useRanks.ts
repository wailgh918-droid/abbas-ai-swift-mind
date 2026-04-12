import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RankData {
  points: number;
  messages_count: number;
  turbo_used: number;
  ocr_used: number;
  images_generated: number;
}

const defaultRank: RankData = { points: 0, messages_count: 0, turbo_used: 0, ocr_used: 0, images_generated: 0 };

export function useRanks() {
  const { user } = useAuth();
  const [rankData, setRankData] = useState<RankData>(defaultRank);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_ranks")
      .select("points, messages_count, turbo_used, ocr_used, images_generated")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setRankData(data);
      });
  }, [user]);

  const addPoints = useCallback(
    async (type: "message" | "turbo" | "ocr" | "image") => {
      if (!user) return;
      const pointsMap = { message: 2, turbo: 5, ocr: 5, image: 10 };
      const fieldMap = {
        message: "messages_count",
        turbo: "turbo_used",
        ocr: "ocr_used",
        image: "images_generated",
      } as const;

      const newData = { ...rankData };
      newData.points += pointsMap[type];
      newData[fieldMap[type]] += 1;
      setRankData(newData);

      await supabase
        .from("user_ranks")
        .update({
          points: newData.points,
          messages_count: newData.messages_count,
          turbo_used: newData.turbo_used,
          ocr_used: newData.ocr_used,
          images_generated: newData.images_generated,
        })
        .eq("user_id", user.id);
    },
    [user, rankData]
  );

  return { rankData, addPoints };
}
