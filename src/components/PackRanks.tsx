import { Trophy, X, Star, Flame, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { RankData } from "@/hooks/useRanks";

interface PackRanksProps {
  rankData: RankData;
  onClose: () => void;
}

const RANKS = [
  { name: "جرو 🐺", minPoints: 0, icon: Star, color: "text-muted-foreground" },
  { name: "متجول 🐾", minPoints: 50, icon: Flame, color: "text-yellow-500" },
  { name: "صياد ⚡", minPoints: 150, icon: Zap, color: "text-blue-500" },
  { name: "حارس 🛡️", minPoints: 300, icon: Trophy, color: "text-purple-500" },
  { name: "قائد القطيع 👑", minPoints: 500, icon: Trophy, color: "text-primary" },
];

function getRank(points: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) return { current: RANKS[i], next: RANKS[i + 1] || null, index: i };
  }
  return { current: RANKS[0], next: RANKS[1], index: 0 };
}

const PackRanks = ({ rankData, onClose }: PackRanksProps) => {
  const { current, next } = getRank(rankData.points);
  const progress = next ? ((rankData.points - current.minPoints) / (next.minPoints - current.minPoints)) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">رتبة القطيع</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-center space-y-2">
            <div className="text-4xl">{current.name.split(" ").pop()}</div>
            <h4 className="text-lg font-bold text-foreground">{current.name}</h4>
            <p className="text-2xl font-bold text-primary">{rankData.points} نقطة</p>
          </div>

          {next && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{current.name}</span>
                <span>{next.name}</span>
              </div>
              <Progress value={progress} className="h-3 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70" />
              <p className="text-xs text-center text-muted-foreground">{next.minPoints - rankData.points} نقطة للرتبة التالية</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "الرسائل", value: rankData.messages_count, icon: "💬" },
              { label: "التوربو", value: rankData.turbo_used, icon: "⚡" },
              { label: "المسح", value: rankData.ocr_used, icon: "📷" },
              { label: "الصور", value: rankData.images_generated, icon: "🎨" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border">
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackRanks;
