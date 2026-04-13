import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";

interface HuntProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_minutes: number;
}

const DURATIONS = [15, 25, 45, 60];

const wolfExpressions = [
  { threshold: 100, emoji: "🐺", label: "هادئ ومستعد" },
  { threshold: 75, emoji: "🐺", label: "مركّز" },
  { threshold: 50, emoji: "⚡", label: "في المطاردة" },
  { threshold: 25, emoji: "🔥", label: "لا تتوقف!" },
  { threshold: 0, emoji: "💪", label: "الذئب لا يستسلم!" },
];

const getWolfState = (percentRemaining: number) => {
  return wolfExpressions.find((w) => percentRemaining <= w.threshold) || wolfExpressions[0];
};

const TheHunt = ({ onClose }: HuntProps) => {
  const { user } = useAuth();
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = duration * 60;
  const percentRemaining = (secondsLeft / totalSeconds) * 100;
  const wolfState = getWolfState(100 - percentRemaining);

  const loadLeaderboard = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("user_id, duration_minutes")
      .eq("completed", true)
      .gte("created_at", since);

    if (!sessions?.length) return;

    const userTotals: Record<string, number> = {};
    sessions.forEach((s) => {
      userTotals[s.user_id] = (userTotals[s.user_id] || 0) + s.duration_minutes;
    });

    const userIds = Object.keys(userTotals);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const nameMap: Record<string, string> = {};
    profiles?.forEach((p) => {
      nameMap[p.user_id] = p.display_name || "ذئب مجهول";
    });

    const entries: LeaderboardEntry[] = userIds
      .map((uid) => ({
        user_id: uid,
        display_name: nameMap[uid] || "ذئب مجهول",
        total_minutes: userTotals[uid],
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes)
      .slice(0, 10);

    setLeaderboard(entries);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setIsComplete(true);
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const completeSession = async () => {
    if (!user) return;
    await supabase.from("focus_sessions").insert({
      user_id: user.id,
      duration_minutes: duration,
      completed: true,
    });
    loadLeaderboard();
  };

  const start = () => {
    setIsRunning(true);
    setIsComplete(false);
  };
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setSecondsLeft(duration * 60);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const circumference = 2 * Math.PI * 90;
  const strokeOffset = circumference * (1 - percentRemaining / 100);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in" dir="rtl">
      <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-2xl font-bold text-foreground mb-2">🐺 المطاردة</h2>
      <p className="text-muted-foreground text-sm mb-6">{wolfState.label}</p>

      {/* Duration selector */}
      {!isRunning && !isComplete && secondsLeft === duration * 60 && (
        <div className="flex gap-2 mb-6">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => { setDuration(d); setSecondsLeft(d * 60); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                d === duration ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {d} د
            </button>
          ))}
        </div>
      )}

      {/* Circular timer */}
      <div className="relative w-56 h-56 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl mb-1">{wolfState.emoji}</span>
          <span className="text-3xl font-bold text-foreground font-mono">{formatTime(secondsLeft)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-8">
        {!isRunning && !isComplete && (
          <button onClick={start} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            <Play className="w-4 h-4" /> ابدأ المطاردة
          </button>
        )}
        {isRunning && (
          <button onClick={pause} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-accent transition-colors">
            <Pause className="w-4 h-4" /> إيقاف مؤقت
          </button>
        )}
        {(isRunning || secondsLeft < totalSeconds) && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {isComplete && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl px-6 py-4 mb-6 text-center animate-scale-in">
          <p className="text-primary font-bold text-lg">🎉 أكملت المطاردة!</p>
          <p className="text-muted-foreground text-sm mt-1">{duration} دقيقة من التركيز العميق</p>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">لوحة صدارة القطيع (24 ساعة)</h3>
          </div>
          <div className="space-y-1.5">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                  i === 0 ? "bg-primary/10 border border-primary/20 text-primary font-semibold" : "bg-secondary/50 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{i === 0 ? "👑" : `#${i + 1}`}</span>
                  <span className="truncate max-w-[140px]">
                    {entry.display_name}
                    {i === 0 && " (قائد القطيع)"}
                  </span>
                </div>
                <span className="text-muted-foreground">{entry.total_minutes} د</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TheHunt;
