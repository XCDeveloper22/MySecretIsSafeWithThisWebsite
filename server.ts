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

  app.get("/api/notes", async (req, res) => {
    const notes = await getNotes();
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    const notes = await getNotes();
    const newNote = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: req.body.text || "",
      color: req.body.color || "bg-yellow-200",
      location: req.body.location || "",
      isLocked: false,
      createdAt: new Date().toISOString()
    };
    notes.push(newNote);
    await saveNotes(notes);
    res.json(newNote);
  });

  app.put("/api/notes/:id", async (req, res) => {
    const notes = await getNotes();
    const index = notes.findIndex((n: any) => n.id === req.params.id);
    if (index !== -1) {
      // If note is already locked, they cannot update text or color. They can only lock it.
      if (notes[index].isLocked && (req.body.text !== undefined || req.body.color !== undefined)) {
        return res.status(403).json({ error: "This secret is locked and cannot be edited" });
      }
      notes[index] = { ...notes[index], ...req.body };
      await saveNotes(notes);
      res.json(notes[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    let notes = await getNotes();
    notes = notes.filter((n: any) => n.id !== req.params.id);
    await saveNotes(notes);
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
