import { Note } from "./types";

const NOTES_STORAGE_KEY = "secret-wall-notes";

function readStoredNotes(): Note[] {
  const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
  return storedNotes ? JSON.parse(storedNotes) : [];
}

function writeStoredNotes(notes: Note[]) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function createLocalNote(note: Partial<Note>): Note {
  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    text: note.text || "",
    color: note.color || "bg-yellow-200",
    location: note.location || "",
    isLocked: false,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchNotes(): Promise<Note[]> {
  try {
    const res = await fetch("/api/notes");
    if (!res.ok) throw new Error("Failed to load notes");
    return res.json();
  } catch {
    return readStoredNotes();
  }
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error("Failed to create note");
    return res.json();
  } catch {
    const newNote = createLocalNote(note);
    writeStoredNotes([newNote, ...readStoredNotes()]);
    return newNote;
  }
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update note");
    return res.json();
  } catch {
    const notes = readStoredNotes();
    const noteIndex = notes.findIndex((note) => note.id === id);
    if (noteIndex === -1) throw new Error("Note not found");
    const updatedNote = { ...notes[noteIndex], ...updates };
    notes[noteIndex] = updatedNote;
    writeStoredNotes(notes);
    return updatedNote;
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete note");
  } catch {
    writeStoredNotes(readStoredNotes().filter((note) => note.id !== id));
  }
}
