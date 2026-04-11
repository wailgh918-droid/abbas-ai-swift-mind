import { useState, useCallback, useEffect } from "react";
import { Shield, X, Plus, Trash2, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface WolfVaultProps {
  onClose: () => void;
}

interface VaultNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

const VAULT_KEY = "abbas_vault";
const VAULT_PASS_KEY = "abbas_vault_hash";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function xorEncrypt(text: string, key: string): string {
  return btoa(
    Array.from(text)
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join("")
  );
}

function xorDecrypt(encoded: string, key: string): string {
  const decoded = atob(encoded);
  return Array.from(decoded)
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join("");
}

const WolfVault = ({ onClose }: WolfVaultProps) => {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [isNew, setIsNew] = useState(!localStorage.getItem(VAULT_PASS_KEY));
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const unlock = useCallback(() => {
    if (!password) return;
    const stored = localStorage.getItem(VAULT_PASS_KEY);
    if (isNew) {
      localStorage.setItem(VAULT_PASS_KEY, simpleHash(password));
      setUnlocked(true);
      toast.success("تم إنشاء الخزنة!");
    } else if (stored === simpleHash(password)) {
      // Load notes
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) {
        try {
          const decrypted = xorDecrypt(raw, password);
          setNotes(JSON.parse(decrypted));
        } catch { setNotes([]); }
      }
      setUnlocked(true);
    } else {
      toast.error("كلمة المرور خاطئة!");
    }
  }, [password, isNew]);

  const save = useCallback((updatedNotes: VaultNote[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(VAULT_KEY, xorEncrypt(JSON.stringify(updatedNotes), password));
  }, [password]);

  const addNote = () => {
    const note: VaultNote = { id: Date.now().toString(), title: "", content: "", createdAt: Date.now() };
    setEditingNote(note);
  };

  const saveNote = () => {
    if (!editingNote || !editingNote.title.trim()) return;
    const exists = notes.find((n) => n.id === editingNote.id);
    const updated = exists ? notes.map((n) => (n.id === editingNote.id ? editingNote : n)) : [...notes, editingNote];
    save(updated);
    setEditingNote(null);
  };

  const deleteNote = (id: string) => {
    save(notes.filter((n) => n.id !== id));
  };

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">الخزنة الحصينة</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-center space-y-2">
              <Lock className="w-12 h-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">{isNew ? "أنشئ كلمة مرور للخزنة" : "أدخل كلمة المرور"}</p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                placeholder="كلمة المرور..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pl-10 text-sm outline-none focus:border-primary/40"
                dir="auto"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={unlock} disabled={!password} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
              <Unlock className="w-4 h-4" />
              {isNew ? "إنشاء الخزنة" : "فتح الخزنة"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">الخزنة الحصينة</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={addNote} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {editingNote && (
            <div className="space-y-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
              <input
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                placeholder="العنوان..."
                className="w-full bg-transparent text-sm font-medium outline-none text-foreground placeholder:text-muted-foreground"
                dir="auto"
              />
              <textarea
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                placeholder="المحتوى السري..."
                rows={4}
                className="w-full bg-transparent text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground"
                dir="auto"
              />
              <div className="flex gap-2">
                <button onClick={saveNote} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">حفظ</button>
                <button onClick={() => setEditingNote(null)} className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground">إلغاء</button>
              </div>
            </div>
          )}

          {notes.length === 0 && !editingNote && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">الخزنة فارغة. أضف ملاحظة سرية.</p>
            </div>
          )}

          {notes.map((note) => (
            <div key={note.id} className="p-4 rounded-xl border border-border bg-background hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setEditingNote(note)}>
                  <h4 className="text-sm font-medium text-foreground">{note.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                </div>
                <button onClick={() => deleteNote(note.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WolfVault;
