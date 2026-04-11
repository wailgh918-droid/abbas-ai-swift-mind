import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

const ChatInput = ({ onSend, disabled, initialValue = "" }: ChatInputProps) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoice = (transcript: string) => {
    setValue((prev) => (prev ? prev + " " + transcript : transcript));
  };

  return (
    <div className="flex items-end gap-2 p-3 border border-border rounded-2xl bg-card shadow-sm transition-all focus-within:border-primary/40 focus-within:shadow-md">
      <VoiceInput onTranscript={handleVoice} disabled={disabled} />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اكتب رسالتك هنا..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[40px] max-h-[160px] py-2"
        dir="auto"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="shrink-0 p-2 rounded-full bg-foreground text-background transition-all hover:opacity-80 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ChatInput;
