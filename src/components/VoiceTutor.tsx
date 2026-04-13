import { useState, useCallback, useRef, useEffect } from "react";
import { X, Mic, MicOff, Volume2, VolumeX, Play, RotateCcw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import WolfLogo from "./WolfLogo";

interface VoiceTutorProps {
  onClose: () => void;
}

type QuizState = "idle" | "loading" | "asking" | "listening" | "evaluating" | "result";

interface QuizData {
  question: string;
  answer: string;
  hint: string;
}

interface EvalResult {
  score: number;
  feedback: string;
  correct: boolean;
}

const SUBJECTS = [
  { id: "math", label: "الرياضيات", topics: ["الدوال العددية", "الأعداد المركبة", "الاحتمالات", "المتتاليات"] },
  { id: "physics", label: "الفيزياء", topics: ["الميكانيك", "الكهرباء", "الموجات", "النشاط الإشعاعي"] },
  { id: "tech", label: "التكنولوجيا", topics: ["المنطق التوافقي", "المنطق التتابعي", "الإلكترونيك"] },
];

const VoiceTutor = ({ onClose }: VoiceTutorProps) => {
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedTopic, setSelectedTopic] = useState(SUBJECTS[0].topics[0]);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      synthRef.current.cancel();
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  const generateQuestion = useCallback(async () => {
    setQuizState("loading");
    setEvalResult(null);
    setTranscript("");
    setShowHint(false);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "generate_question",
            subject: selectedSubject.label,
            correctTopic: selectedTopic,
          }),
        }
      );

      if (!resp.ok) throw new Error("فشل في توليد السؤال");
      const data = await resp.json();

      if (data.question) {
        setQuizData(data);
        setQuizState("asking");
        speak(data.question, () => setQuizState("listening"));
      } else {
        throw new Error("لم يتم استلام سؤال");
      }
    } catch (e) {
      console.error(e);
      toast.error("فشل في توليد السؤال. حاول مرة أخرى.");
      setQuizState("idle");
    }
  }, [selectedSubject, selectedTopic, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("المتصفح لا يدعم التعرف على الصوت");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = "";

    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setQuizState("listening");
    };

    recognition.onend = () => {
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript.trim());
        evaluateAnswer(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setQuizState("listening");
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const evaluateAnswer = useCallback(async (studentAnswer: string) => {
    if (!quizData) return;
    setQuizState("evaluating");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "evaluate_answer",
            studentAnswer,
            correctTopic: quizData.answer,
          }),
        }
      );

      if (!resp.ok) throw new Error("فشل في التقييم");
      const data = await resp.json();

      setEvalResult(data);
      setQuizState("result");

      // Speak the feedback
      if (data.feedback) {
        speak(data.feedback);
      }
    } catch (e) {
      console.error(e);
      toast.error("فشل في تقييم الإجابة");
      setQuizState("listening");
    }
  }, [quizData, speak]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">المعلم الصوتي</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Subject & Topic Selection */}
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSubject(s); setSelectedTopic(s.topics[0]); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedSubject.id === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedSubject.topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    selectedTopic === t
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Wolf Avatar + State */}
          <div className="flex flex-col items-center py-4">
            <div className={`relative transition-all duration-300 ${isSpeaking ? "animate-pulse" : ""}`}>
              <WolfLogo size={80} className="opacity-90" />
              {isSpeaking && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${8 + Math.random()*12}px`, animationDelay: `${i*0.1}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              {quizState === "idle" && "اختر المادة وابدأ التسميع"}
              {quizState === "loading" && "جارٍ تحضير السؤال..."}
              {quizState === "asking" && "عباس يطرح السؤال..."}
              {quizState === "listening" && "🎙️ أجب الآن..."}
              {quizState === "evaluating" && "جارٍ تقييم إجابتك..."}
              {quizState === "result" && "النتيجة"}
            </p>
          </div>

          {/* Question Display */}
          {quizData && quizState !== "idle" && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{quizData.question}</p>
              </div>
              {showHint && (
                <p className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
                  💡 {quizData.hint}
                </p>
              )}
              {!showHint && quizState === "listening" && (
                <button onClick={() => setShowHint(true)} className="text-xs text-primary hover:underline">
                  إظهار التلميح
                </button>
              )}
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">إجابتك:</p>
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          )}

          {/* Result */}
          {evalResult && quizState === "result" && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 animate-scale-in">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الدقة:</span>
                <span className={`text-2xl font-bold ${scoreColor(evalResult.score)}`}>
                  {evalResult.score}%
                </span>
              </div>
              <p className="text-sm text-foreground">{evalResult.feedback}</p>
              {!evalResult.correct && quizData && (
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">الإجابة الصحيحة:</p>
                  <p className="text-sm text-foreground mt-1">{quizData.answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {quizState === "idle" && (
              <button
                onClick={generateQuestion}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" />
                ابدأ التسميع
              </button>
            )}

            {quizState === "listening" && (
              <>
                {!recognitionRef.current ? (
                  <button
                    onClick={startListening}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors animate-pulse"
                  >
                    <Mic className="w-4 h-4" />
                    اضغط للإجابة
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-xl font-medium text-sm hover:bg-destructive/90 transition-colors"
                  >
                    <MicOff className="w-4 h-4" />
                    إرسال الإجابة
                  </button>
                )}
              </>
            )}

            {quizState === "asking" && isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-sm hover:bg-secondary/80 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                تخطي
              </button>
            )}

            {(quizState === "result" || quizState === "loading") && quizState === "result" && (
              <button
                onClick={generateQuestion}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                سؤال آخر
              </button>
            )}
          </div>

          {(quizState === "loading" || quizState === "evaluating") && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTutor;
