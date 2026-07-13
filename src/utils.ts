import { Note } from "./types";

const NOTES_STORAGE_KEY = "secret-wall-notes";
const useBrowserStorage = import.meta.env.PROD;

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
  if (useBrowserStorage) return readStoredNotes();

  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  if (useBrowserStorage) {
    const newNote = createLocalNote(note);
    writeStoredNotes([newNote, ...readStoredNotes()]);
    return newNote;
  }

  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  if (useBrowserStorage) {
    const notes = readStoredNotes();
    const noteIndex = notes.findIndex((note) => note.id === id);
    const note = notes[noteIndex];
    if (!note) throw new Error("Note not found");
    if (note.isLocked && (updates.text !== undefined || updates.color !== undefined)) {
      throw new Error("This secret is locked and cannot be edited");
    }
    const updatedNote = { ...note, ...updates };
    notes[noteIndex] = updatedNote;
    writeStoredNotes(notes);
    return updatedNote;
  }

  const res = await fetch(`/api/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  if (useBrowserStorage) {
    writeStoredNotes(readStoredNotes().filter((note) => note.id !== id));
    return;
  }

  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}
