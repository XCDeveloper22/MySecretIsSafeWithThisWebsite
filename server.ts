import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getNotesCollection } from "./lib/mongodb";

type NoteUpdate = {
  text?: string;
  color?: string;
  location?: string;
  drawing?: string;
  isLocked?: boolean;
};

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;
  const notes = await getNotesCollection();

  app.get("/api/notes", async (_req, res) => {
    const storedNotes = await notes.find({}).sort({ createdAt: -1 }).toArray();
    res.json(storedNotes);
  });

  app.post("/api/notes", async (req, res) => {
    const note = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: typeof req.body.text === "string" ? req.body.text : "",
      color: typeof req.body.color === "string" ? req.body.color : "bg-yellow-200",
      location: typeof req.body.location === "string" ? req.body.location : "",
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    await notes.insertOne(note);
    res.json(note);
  });

  app.put("/api/notes/:id", async (req, res) => {
    const existingNote = await notes.findOne({ id: req.params.id });
    if (!existingNote) return res.status(404).json({ error: "Not found" });

    const updates: NoteUpdate = {
      ...(typeof req.body.text === "string" ? { text: req.body.text } : {}),
      ...(typeof req.body.color === "string" ? { color: req.body.color } : {}),
      ...(typeof req.body.location === "string" ? { location: req.body.location } : {}),
      ...(typeof req.body.drawing === "string" ? { drawing: req.body.drawing } : {}),
      ...(req.body.isLocked === true ? { isLocked: true } : {}),
    };

    if (
      existingNote.isLocked &&
      (updates.text !== undefined || updates.color !== undefined || updates.drawing !== undefined)
    ) {
      return res.status(403).json({ error: "locked" });
    }

    const updatedNote = { ...existingNote, ...updates };
    await notes.replaceOne({ id: req.params.id }, updatedNote);
    res.json(updatedNote);
  });

  app.delete("/api/notes/:id", async (req, res) => {
    const result = await notes.deleteOne({ id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: "Not found" });
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
