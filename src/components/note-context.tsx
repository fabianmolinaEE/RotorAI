import { createContext, useContext, useState, type ReactNode } from "react";

interface NoteCtx {
  notes: Record<string, string>;
  setNote: (woId: string, text: string) => void;
}

const Ctx = createContext<NoteCtx | null>(null);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const setNote = (woId: string, text: string) =>
    setNotes((prev) => ({ ...prev, [woId]: text }));
  return <Ctx.Provider value={{ notes, setNote }}>{children}</Ctx.Provider>;
}

export function useNotes(): NoteCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotes must be used inside NoteProvider");
  return v;
}
