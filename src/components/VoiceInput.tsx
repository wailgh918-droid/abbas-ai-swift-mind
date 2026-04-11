import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput = ({ onTranscript, disabled }: VoiceInputProps) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggle = useCallback(() => {
    if (!supported) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, supported, onTranscript]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`shrink-0 p-2 rounded-full transition-all ${
        listening
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "text-muted-foreground hover:text-primary hover:bg-secondary"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      title={listening ? "إيقاف" : "تحدث مع عباس"}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};

export default VoiceInput;
