import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const DATA_FILE = path.join(process.cwd(), "notes.json");

  async function getNotes() {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  async function saveNotes(notes: any[]) {
    await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2));
  }

  let noteMutation = Promise.resolve();

  async function mutateNotes<T>(operation: (notes: any[]) => Promise<T> | T): Promise<T> {
    const mutation = noteMutation.then(async () => {
      const notes = await getNotes();
      const result = await operation(notes);
      await saveNotes(notes);
      return result;
    });
    noteMutation = mutation.then(() => undefined, () => undefined);
    return mutation;
  }

  app.get("/api/notes", async (req, res) => {
    const notes = await getNotes();
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    const newNote = await mutateNotes((notes) => {
      const note = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        text: typeof req.body.text === "string" ? req.body.text : "",
        color: typeof req.body.color === "string" ? req.body.color : "bg-yellow-200",
        location: typeof req.body.location === "string" ? req.body.location : "",
        isLocked: false,
        createdAt: new Date().toISOString()
      };
      notes.push(note);
      return note;
    });
    res.json(newNote);
  });

  app.put("/api/notes/:id", async (req, res) => {
    const updatedNote = await mutateNotes((notes) => {
      const index = notes.findIndex((note: any) => note.id === req.params.id);
      if (index === -1) return null;
      if (notes[index].isLocked && (req.body.text !== undefined || req.body.color !== undefined || req.body.drawing !== undefined)) {
        throw new Error("This secret is locked and cannot be edited");
      }

      const updates = {
        ...(typeof req.body.text === "string" ? { text: req.body.text } : {}),
        ...(typeof req.body.color === "string" ? { color: req.body.color } : {}),
        ...(typeof req.body.location === "string" ? { location: req.body.location } : {}),
        ...(typeof req.body.drawing === "string" ? { drawing: req.body.drawing } : {}),
        ...(req.body.isLocked === true ? { isLocked: true } : {})
      };
      notes[index] = { ...notes[index], ...updates };
      return notes[index];
    }).catch((error) => {
      if (error instanceof Error && error.message === "This secret is locked and cannot be edited") {
        return "locked" as const;
      }
      throw error;
    });

    if (updatedNote === "locked") return res.status(403).json({ error: updatedNote });
    if (!updatedNote) return res.status(404).json({ error: "Not found" });
    res.json(updatedNote);
  });

  app.delete("/api/notes/:id", async (req, res) => {
    const deleted = await mutateNotes((notes) => {
      const index = notes.findIndex((note: any) => note.id === req.params.id);
      if (index === -1) return false;
      notes.splice(index, 1);
      return true;
    });
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
