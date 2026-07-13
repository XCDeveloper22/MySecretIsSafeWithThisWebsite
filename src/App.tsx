import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";
import { 
  Plus, 
  Search, 
  ArrowUpDown, 
  X, 
  Clock, 
  Pin, 
  Sun, 
  Moon, 
  Download, 
  ChevronDown, 
  Check,
  Sparkles,
  Layers,
  ShieldCheck
} from "lucide-react";
import { Note, ColorOption } from "./types";
import { fetchNotes, createNote, deleteNote, updateNote } from "./utils";
import StickyNote from "./components/StickyNote";
import { motion, AnimatePresence } from "motion/react";
import { playRustleSound, playThumpSound } from "./audio";

// @ts-ignore
import logoImage from "./assets/images/child_fb_logo_1783957191290.jpg";
// @ts-ignore
import splashImage from "./assets/images/child_splash_1783956517640.jpg";

const COLORS: ColorOption[] = [
  { name: "Slate", className: "bg-slate-200" },
  { name: "Gray", className: "bg-gray-200" },
  { name: "Zinc", className: "bg-zinc-200" },
  { name: "Neutral", className: "bg-neutral-200" },
  { name: "Stone", className: "bg-stone-200" },
  { name: "Red", className: "bg-red-200" },
  { name: "Orange", className: "bg-orange-200" },
  { name: "Amber", className: "bg-amber-200" },
  { name: "Yellow", className: "bg-yellow-200" },
  { name: "Lime", className: "bg-lime-200" },
  { name: "Green", className: "bg-green-200" },
  { name: "Emerald", className: "bg-emerald-200" },
  { name: "Teal", className: "bg-teal-200" },
  { name: "Cyan", className: "bg-cyan-200" },
  { name: "Sky", className: "bg-sky-200" },
  { name: "Blue", className: "bg-blue-200" },
  { name: "Indigo", className: "bg-indigo-200" },
  { name: "Violet", className: "bg-violet-200" },
  { name: "Purple", className: "bg-purple-200" },
  { name: "Fuchsia", className: "bg-fuchsia-200" },
  { name: "Pink", className: "bg-pink-200" },
  { name: "Rose", className: "bg-rose-200" },
];

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [activeTab, setActiveTab] = useState<"wall" | "vault" | "export">("wall");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light"; // Defaults to true (dark mode)
  });
  
  // Immersive 3D Preview Modal States
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadNotes();
    const syncInterval = window.setInterval(loadNotes, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotes();
      }
    };
    const timer = window.setTimeout(() => setShowSplash(false), 2800);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(syncInterval);
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadNotes = async () => {
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    playRustleSound();
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("theme", nextMode ? "dark" : "light");
  };

  const handleAddNote = async () => {
    setIsCreating(true);
    playRustleSound();

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].className;
    try {
      const newNote = await createNote({ color: randomColor, text: "", location: "" });
      setNotes((currentNotes) => [newNote, ...currentNotes]);
      // Switch back to Wall if they compose a new note on another tab
      if (activeTab !== "wall") {
        setActiveTab("wall");
      }
    } catch (err) {
      console.error("Failed to create secret note:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
    } catch (err) {
      console.error("Failed to delete secret note:", err);
    }
  };

  const handleLockNote = async (id: string) => {
    try {
      const updated = await updateNote(id, { isLocked: true });
      setNotes((currentNotes) => currentNotes.map((note) => (note.id === id ? updated : note)));
      playThumpSound();
    } catch (err) {
      console.error("Failed to lock secret:", err);
    }
  };

  // Color Hex Map for drawing custom-colored sticky notes in PDF
  const colorHexMap: Record<string, string> = {
    "bg-slate-200": "#cbd5e1",
    "bg-gray-200": "#e5e7eb",
    "bg-zinc-200": "#e4e4e7",
    "bg-neutral-200": "#e5e5e5",
    "bg-stone-200": "#e7e5e4",
    "bg-red-200": "#fecaca",
    "bg-orange-200": "#fed7aa",
    "bg-amber-200": "#fde68a",
    "bg-yellow-200": "#fef08a",
    "bg-lime-200": "#d9f99d",
    "bg-green-200": "#bbf7d0",
    "bg-emerald-200": "#a7f3d0",
    "bg-teal-200": "#99f6e4",
    "bg-cyan-200": "#a5f3fc",
    "bg-sky-200": "#bae6fd",
    "bg-blue-200": "#bfdbfe",
    "bg-indigo-200": "#c7d2fe",
    "bg-violet-200": "#ddd6fe",
    "bg-purple-200": "#e9d5ff",
    "bg-fuchsia-200": "#f5d0fe",
    "bg-pink-200": "#fbcfe8",
    "bg-rose-200": "#fecdd3",
  };

  // Modern Export Tools (PDF, JSON, Text)
  const handleExportPDF = () => {
    playRustleSound();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const drawHeader = (pageNumber: number) => {
      // Draw background overlay for cream texture feel
      doc.setFillColor(253, 251, 247);
      doc.rect(0, 0, 210, 297, "F");

      // Draw elegant title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text("FreedomWall 🖍", 15, 20);
      
      // Subtitle
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122); // zinc-500
      doc.text("All secret sticky notes drawn in crayon, exported safely from the vault.", 15, 26);
      
      // Metadata & page details
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400
      const dateStr = new Date().toLocaleString();
      doc.text(`Exported: ${dateStr}`, 140, 20);
      doc.text(`Page ${pageNumber}`, 188, 26);
      
      // Clean page divider line
      doc.setDrawColor(212, 212, 216); // zinc-300
      doc.setLineWidth(0.3);
      doc.line(15, 30, 195, 30);
    };

    let pageNum = 1;
    drawHeader(pageNum);

    let startY = 36;
    let colIndex = 0; // 0 for Left col, 1 for Right col
    const cardW = 85;
    const cardH = 68;
    const colGap = 10;
    const rowGap = 8;

    notes.forEach((note) => {
      // Automatic page breaks
      if (startY + cardH > 265) {
        doc.addPage();
        pageNum++;
        drawHeader(pageNum);
        startY = 36;
        colIndex = 0;
      }

      const x = 15 + colIndex * (cardW + colGap);
      const y = startY;

      // Draw cute drop shadow
      doc.setFillColor(228, 228, 231);
      doc.rect(x + 1.2, y + 1.2, cardW, cardH, "F");

      // Retrieve and parse background RGB
      const tailwindBg = note.color || "bg-yellow-200";
      const hexColor = colorHexMap[tailwindBg] || "#fef08a";
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      
      doc.setFillColor(r, g, b);
      doc.rect(x, y, cardW, cardH, "F");

      // Card thin border
      doc.setDrawColor(161, 161, 170);
      doc.setLineWidth(0.2);
      doc.rect(x, y, cardW, cardH, "S");

      // Cute pushpin drawing
      if (note.isLocked) {
        // Needle/shadow line
        doc.setDrawColor(64, 64, 64);
        doc.setLineWidth(0.6);
        doc.line(x + cardW / 2, y + 4, x + cardW / 2 - 1.2, y + 8);

        // Pin Head
        doc.setFillColor(239, 68, 68); // red-500
        doc.circle(x + cardW / 2, y + 4, 2.2, "F");
      } else {
        // Playful metallic strip tape for draft notes
        doc.setFillColor(205, 205, 205);
        doc.rect(x + cardW / 2 - 5, y + 2.5, 10, 3.2, "F");
        doc.setDrawColor(160, 160, 160);
        doc.setLineWidth(0.1);
        doc.rect(x + cardW / 2 - 5, y + 2.5, 10, 3.2, "S");
      }

      // Wrapped Secret Text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(24, 24, 27);

      const textToDraw = note.text || "(Empty draft secret)";
      const wrappedLines = doc.splitTextToSize(textToDraw, cardW - 12);
      
      const maxLines = 8;
      let linesToDraw = wrappedLines;
      let isTruncated = false;
      if (wrappedLines.length > maxLines) {
        linesToDraw = wrappedLines.slice(0, maxLines);
        isTruncated = true;
      }

      let textY = y + 15;
      linesToDraw.forEach((line: string, i: number) => {
        let lineText = line;
        if (isTruncated && i === maxLines - 1) {
          lineText = lineText.substring(0, Math.max(0, lineText.length - 3)) + "...";
        }
        doc.text(lineText, x + 6, textY);
        textY += 4.5;
      });

      // Bottom Metadata Line
      doc.setDrawColor(Math.max(0, r - 25), Math.max(0, g - 25), Math.max(0, b - 25));
      doc.setLineWidth(0.15);
      doc.line(x + 5, y + cardH - 10, x + cardW - 5, y + cardH - 10);

      // Metadata Text
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(82, 82, 91);

      const dateString = new Date(note.createdAt).toLocaleDateString();
      doc.text(dateString, x + 6, y + cardH - 5);

      const statusString = note.isLocked ? "SECURED PIN" : "DRAFT NOTE";
      const statusW = doc.getTextWidth(statusString);
      doc.text(statusString, x + cardW - 6 - statusW, y + cardH - 5);

      // Shift columns and rows
      if (colIndex === 0) {
        colIndex = 1;
      } else {
        colIndex = 0;
        startY += cardH + rowGap;
      }
    });

    doc.save(`my_secrets_export_${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExportMenu(false);
  };

  const handleExportPPT = () => {
    playRustleSound();
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";

    // 1. Title Slide
    const titleSlide = pres.addSlide();
    titleSlide.background = { fill: isDarkMode ? "1E1E24" : "F4F1EA" };

    titleSlide.addText("FreedomWall 🖍", {
      x: 0.5,
      y: 1.8,
      w: 9.0,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: isDarkMode ? "FDE047" : "D97706", // Yellow-300 or Amber-600
      fontFace: "Helvetica",
      align: "center"
    });

    titleSlide.addText("Your crayon-drawn secret sticky notes, exported safely to presentation format.", {
      x: 0.5,
      y: 2.7,
      w: 9.0,
      h: 0.6,
      fontSize: 16,
      italic: true,
      color: isDarkMode ? "A1A1AA" : "52525B",
      fontFace: "Helvetica",
      align: "center"
    });

    titleSlide.addText(`Exported: ${new Date().toLocaleString()}\nTotal secrets: ${notes.length}`, {
      x: 0.5,
      y: 3.8,
      w: 9.0,
      h: 1.0,
      fontSize: 12,
      color: "71717A",
      fontFace: "Helvetica",
      align: "center"
    });

    // 2. Add individual slides for each secret note
    const colorHexMapPPT: Record<string, string> = {
      "bg-slate-200": "cbd5e1",
      "bg-gray-200": "e5e7eb",
      "bg-zinc-200": "e4e4e7",
      "bg-neutral-200": "e5e5e5",
      "bg-stone-200": "e7e5e4",
      "bg-red-200": "fecaca",
      "bg-orange-200": "fed7aa",
      "bg-amber-200": "fde68a",
      "bg-yellow-200": "fef08a",
      "bg-lime-200": "d9f99d",
      "bg-green-200": "bbf7d0",
      "bg-emerald-200": "a7f3d0",
      "bg-teal-200": "99f6e4",
      "bg-cyan-200": "a5f3fc",
      "bg-sky-200": "bae6fd",
      "bg-blue-200": "bfdbfe",
      "bg-indigo-200": "c7d2fe",
      "bg-violet-200": "ddd6fe",
      "bg-purple-200": "e9d5ff",
      "bg-fuchsia-200": "f5d0fe",
      "bg-pink-200": "fbcfe8",
      "bg-rose-200": "fecdd3",
    };

    notes.forEach((note, index) => {
      const slide = pres.addSlide();
      
      const tailwindBg = note.color || "bg-yellow-200";
      const hexColor = colorHexMapPPT[tailwindBg] || "fef08a";
      slide.background = { fill: hexColor };

      // Header block representing top pinned tape or pin
      slide.addText(note.isLocked ? "📌 PINNED SECRET" : "📝 DRAFT SECRET", {
        x: 0.5,
        y: 0.4,
        w: 9.0,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: "4B5563",
        fontFace: "Helvetica",
        align: "center"
      });

      // Main Text Body
      slide.addText(note.text || "(Empty secret note)", {
        x: 1.0,
        y: 1.2,
        w: 8.0,
        h: 3.2,
        fontSize: 22,
        bold: true,
        color: "18181B",
        fontFace: "Helvetica",
        align: "center",
        valign: "middle"
      });

      // Slide Footer Details
      const dateStr = new Date(note.createdAt).toLocaleString();
      slide.addText(`Secret #${index + 1} of ${notes.length}   •   Saved: ${dateStr}`, {
        x: 0.5,
        y: 4.8,
        w: 9.0,
        h: 0.4,
        fontSize: 11,
        color: "52525B",
        fontFace: "Helvetica",
        align: "center"
      });
    });

    pres.writeFile({ fileName: `my_secrets_export_${new Date().toISOString().slice(0, 10)}.pptx` });
    setShowExportMenu(false);
  };

  // Sort and filter search query on notes (using useMemo for instant, lightweight render reactions)
  const sortedNotes = React.useMemo(() => {
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [notes, sortBy]);

  const filteredNotes = React.useMemo(() => {
    return sortedNotes.filter((n) => {
      const matchesSearch = n.text.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === "vault") {
        return matchesSearch && n.isLocked;
      }
      return matchesSearch;
    });
  }, [sortedNotes, searchQuery, activeTab]);

  const totalNotesCount = notes.length;
  const lockedNotesCount = notes.filter((n) => n.isLocked).length;
  const draftNotesCount = totalNotesCount - lockedNotesCount;

  // Infinite scroll loader: loads 5 more sticky notes on scroll to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120) {
        setVisibleCount((prev) => {
          if (prev < filteredNotes.length) {
            return prev + 5;
          }
          return prev;
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredNotes.length]);

  // Reset visible items when tab, sorting or search parameters change
  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab, searchQuery, sortBy]);

  // 3D Tilt interactivity handler for preview modal
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({ x: x * 35, y: -y * 35 }); // Dynamic 3D rotation angle
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleClosePreview = () => {
    setPreviewNote(null);
    setTilt({ x: 0, y: 0 });
  };

  const mobileTabs = [
    { id: "wall" as const, label: "Wall", icon: Layers, desc: "All Secrets" },
    { id: "vault" as const, label: "Vault", icon: ShieldCheck, desc: "Pinned Secrets" },
    { id: "export" as const, label: "Export", icon: Download, desc: "Download Options" },
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-yellow-500/30 pb-28 md:pb-20 transition-colors duration-300 ${
      isDarkMode 
        ? "bg-zinc-900 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] [background-size:24px_24px] text-zinc-100" 
        : "bg-[#f4f1ea] bg-[linear-gradient(to_right,#00000007_1px,transparent_1px),linear-gradient(to_bottom,#00000007_1px,transparent_1px)] [background-size:24px_24px] text-zinc-900"
    }`}>
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950"
          >
            <img 
              src={splashImage} 
              alt="Splash Screen" 
              className="absolute inset-0 w-full h-full object-cover opacity-50" 
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 text-center px-4">
              <motion.img 
                initial={{ scale: 0.5, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}
                src={logoImage} 
                alt="Logo" 
                className="w-40 h-40 rounded-3xl mx-auto shadow-2xl shadow-yellow-500/20 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight text-yellow-300 drop-shadow"
              >
                FreedomWall 🖍
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.8 }}
                className="mt-2 text-zinc-400 font-medium"
              >
                drawn with crayon, locked forever!
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`border-b sticky top-0 z-40 px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 backdrop-blur-md transition-colors duration-300 ${
        isDarkMode 
          ? "border-zinc-800 bg-zinc-950/75" 
          : "border-zinc-300 bg-white/80 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Logo" className="w-12 h-12 rounded-xl border border-white/10 shadow-md transition-transform hover:scale-105 duration-300" referrerPolicy="no-referrer" />
          <div>
            <h1 className={`font-black text-xl tracking-tight ${isDarkMode ? "text-yellow-300" : "text-amber-600"} flex items-center gap-1.5`}>
              FreedomWall 🖍
            </h1>
            <p className={`text-xs font-semibold hidden md:block ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Write a secret, stick it! Once pinned with a red pin, click to view in full 3D interactive cards! 🤫
            </p>
            <p className={`text-[10px] font-bold block md:hidden ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
              Crayon secret safe. Click locked cards to view in interactive 3D! 🔑
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 justify-start xl:justify-end">
          {/* Search Box - Hidden on Export tab */}
          {activeTab !== "export" && (
            <div className="relative min-w-[130px] sm:w-44 flex-1 sm:flex-none">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`} size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-full py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all ${
                  isDarkMode 
                    ? "bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500" 
                    : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 shadow-sm"
                }`}
              />
            </div>
          )}

          {/* Sort Dropdown Filter - Hidden on Export tab */}
          {activeTab !== "export" && (
            <div className="relative">
              <div className={`flex items-center border rounded-full py-1 px-2.5 gap-1.5 text-xs transition-colors ${
                isDarkMode 
                  ? "bg-zinc-800/60 border-zinc-700/50 text-zinc-300" 
                  : "bg-white border-zinc-300 text-zinc-700 shadow-sm"
              }`}>
                <ArrowUpDown size={12} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className={`bg-transparent border-none outline-none cursor-pointer font-extrabold pr-1 ${isDarkMode ? "text-white" : "text-zinc-800"}`}
                >
                  <option value="newest" className={isDarkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"}>Newest</option>
                  <option value="oldest" className={isDarkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"}>Oldest</option>
                </select>
              </div>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center p-2 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-sm ${
              isDarkMode 
                ? "bg-zinc-850 border-zinc-700 hover:bg-zinc-800 text-yellow-300" 
                : "bg-white border-zinc-300 hover:bg-zinc-50 text-amber-600"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={14} className="stroke-[2.5]" /> : <Moon size={14} className="stroke-[2.5]" />}
          </button>

          {/* Export Dropdown - Hidden on mobile bottom nav, but beautiful fallback/shortcut on desktop */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                playRustleSound();
                setShowExportMenu(!showExportMenu);
              }}
              disabled={totalNotesCount === 0}
              className={`flex items-center gap-1 border rounded-full py-1.5 px-3.5 text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                isDarkMode 
                  ? "bg-zinc-800/60 border-zinc-700/50 text-zinc-200 hover:text-white" 
                  : "bg-white border-zinc-300 text-zinc-700 shadow-sm hover:bg-zinc-50"
              }`}
              title="Export sticky notes"
            >
              <Download size={13} />
              <span>Export</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-48 rounded-xl border p-1.5 z-50 shadow-xl transition-all ${
                      isDarkMode 
                        ? "bg-zinc-950/95 border-zinc-800 text-white backdrop-blur-md" 
                        : "bg-white/95 border-zinc-200 text-zinc-900 shadow-lg backdrop-blur-md"
                    }`}
                  >
                    <button
                      onClick={handleExportPDF}
                      className={`w-full flex items-center justify-between text-[11px] font-extrabold px-3 py-2 rounded-lg text-left transition-colors ${
                        isDarkMode ? "hover:bg-zinc-900 text-rose-300" : "hover:bg-zinc-100 text-rose-600"
                      }`}
                    >
                      <span>Export as PDF Document</span>
                      <span className="bg-rose-500/10 text-[9px] px-1.5 py-0.5 rounded text-rose-500 font-bold">PDF</span>
                    </button>
                    <button
                      onClick={handleExportPPT}
                      className={`w-full flex items-center justify-between text-[11px] font-extrabold px-3 py-2 rounded-lg text-left transition-colors ${
                        isDarkMode ? "hover:bg-zinc-900 text-yellow-300" : "hover:bg-zinc-100 text-amber-600"
                      }`}
                    >
                      <span>Export as PPT Presentation</span>
                      <span className="bg-yellow-500/10 text-[9px] px-1.5 py-0.5 rounded text-amber-500 font-bold">PPT</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Add Note Button - Desktop Header only */}
          <button
            onClick={handleAddNote}
            disabled={isCreating}
            className="hidden md:flex items-center gap-1.5 bg-yellow-300 text-zinc-950 px-4 py-2 rounded-full text-xs font-black hover:bg-yellow-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shrink-0 shadow shadow-yellow-500/10"
          >
            {isCreating ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <Plus size={15} className="stroke-[3]" />
            )}
            <span>{isCreating ? "Creating..." : "Create"}</span>
          </button>
        </div>
      </header>

      {/* Desktop Navigation Tabs - Hidden on Mobile */}
      <div className="hidden md:flex justify-center my-6">
        <div className={`p-1 rounded-full border flex items-center gap-1 ${
          isDarkMode ? "bg-zinc-950/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        }`}>
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playRustleSound();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition-all ${
                  isActive 
                    ? "bg-yellow-300 text-zinc-950 shadow" 
                    : isDarkMode 
                      ? "text-zinc-400 hover:text-white hover:bg-zinc-900" 
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <Icon size={14} className="stroke-[2.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center text-zinc-500 mt-20 animate-pulse font-bold text-lg">
            Opening secret crayon drawer... 🖍
          </div>
        ) : activeTab === "export" ? (
          /* EXPORT ACTIVE SCREEN FOR MOBILE & DESKTOP */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-md mx-auto mt-4 md:mt-8 p-6 rounded-3xl border transition-all duration-300 shadow-xl text-center ${
              isDarkMode ? "bg-zinc-950/60 border-zinc-800/80" : "bg-white border-zinc-200/80"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isDarkMode ? "bg-yellow-400/10" : "bg-amber-100"
            }`}>
              <Download className={isDarkMode ? "text-yellow-400" : "text-amber-600"} size={32} />
            </div>
            <h2 className={`text-xl font-black mb-1 ${isDarkMode ? "text-yellow-300" : "text-amber-700"}`}>Export & Backups Center</h2>
            <p className={`text-xs font-bold mb-6 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Download your safe sticky notes in PDF or PowerPoint format on the go!</p>

            <div className="flex flex-col gap-3">
              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={totalNotesCount === 0}
                className="w-full flex items-center justify-between text-xs font-black px-4 py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white rounded-xl transition-all shadow hover:scale-[1.02] active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <Download size={15} />
                  Export PDF Document (Color Crayon Style)
                </span>
                <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded font-black">PDF</span>
              </button>

              {/* PPT Export */}
              <button
                onClick={handleExportPPT}
                disabled={totalNotesCount === 0}
                className="w-full flex items-center justify-between text-xs font-black px-4 py-3 bg-yellow-300 hover:bg-yellow-200 disabled:opacity-40 text-zinc-950 rounded-xl transition-all shadow hover:scale-[1.02] active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <Download size={15} />
                  Export PPT Presentation (Widescreen)
                </span>
                <span className="bg-black/15 text-[9px] px-1.5 py-0.5 rounded font-black">PPT</span>
              </button>
            </div>

            {/* Note Statistics mini panel */}
            <div className={`mt-8 pt-6 border-t grid grid-cols-3 gap-2 ${
              isDarkMode ? "border-zinc-800/80" : "border-zinc-200"
            }`}>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500">Total Notes</p>
                <p className={`text-lg font-black mt-1 ${isDarkMode ? "text-white" : "text-zinc-800"}`}>{totalNotesCount}</p>
              </div>
              <div className={`text-center border-x ${
                isDarkMode ? "border-zinc-850" : "border-zinc-200"
              }`}>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500">Pinned</p>
                <p className="text-lg font-black text-red-400 mt-1">{lockedNotesCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500">Drafts</p>
                <p className={`text-lg font-black mt-1 ${isDarkMode ? "text-yellow-300" : "text-amber-600"}`}>{draftNotesCount}</p>
              </div>
            </div>
          </motion.div>
        ) : filteredNotes.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center mt-24 flex flex-col items-center">
            <div className={`w-28 h-28 rounded-3xl flex items-center justify-center rotate-6 mb-6 shadow-2xl border ${
              isDarkMode ? "bg-zinc-800/10 border-zinc-700/10" : "bg-white border-zinc-300/30"
            }`}>
              <Plus size={52} className="text-zinc-400 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-400 mb-2">
              {searchQuery ? "No matching secrets found!" : "The blackboard is empty!"}
            </h2>
            <p className="text-zinc-500 max-w-md font-semibold text-sm">
              {searchQuery 
                ? "Try a different search query." 
                : activeTab === "vault"
                  ? "You have no pinned secrets. Go back to the 'Wall', write a secret, and lock it to see it here!"
                  : "Tap the button to create a new colorful sticky note. Write your secret and hit 'Pin Secret' to lock it forever!"
              }
            </p>
          </div>
        ) : (
          /* PRIMARY NOTE DISPLAY WALL GRID */
          <div className="flex flex-col items-center w-full">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
              <AnimatePresence mode="popLayout">
                {filteredNotes.slice(0, visibleCount).map((note) => (
                  <StickyNote
                    key={note.id}
                    note={note}
                    colors={COLORS}
                    onDelete={handleDeleteNote}
                    onLock={handleLockNote}
                    onPreview={(n) => {
                      playThumpSound();
                      setPreviewNote(n);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredNotes.length > visibleCount && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  playRustleSound();
                  setVisibleCount((prev) => prev + 5);
                }}
                className={`mt-10 flex items-center gap-2 font-black px-6 py-3 rounded-full text-xs shadow-lg border transition-all transform hover:scale-[1.03] active:scale-97 ${
                  isDarkMode 
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-yellow-300" 
                    : "bg-white border-zinc-350 hover:bg-zinc-300 text-amber-700"
                }`}
              >
                <span>Show 5 More Secrets 🖍</span>
              </motion.button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) for Mobile - Hidden on Desktop & Hidden on Export tab */}
      {activeTab !== "export" && (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAddNote}
            disabled={isCreating}
            className="flex items-center justify-center bg-yellow-300 hover:bg-yellow-200 text-zinc-950 w-14 h-14 rounded-full shadow-2xl disabled:opacity-70 border border-zinc-950/10"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <Plus size={24} className="stroke-[3]" />
            )}
          </motion.button>
        </div>
      )}

      {/* Bottom Navigation Bar - Mobile ONLY (visible below md breakpoint) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-6 py-2.5 flex justify-around items-center pb-safe-bottom">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playRustleSound();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center gap-1 relative py-1 transition-all ${
                isActive ? "text-yellow-300 scale-105 font-black" : "text-zinc-500 hover:text-zinc-400 font-medium"
              }`}
            >
              <Icon size={18} className="stroke-[2.5]" />
              <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-300 rounded-full" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3D Dynamic Card Preview Modal Overlay */}
      <AnimatePresence>
        {previewNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            onClick={handleClosePreview}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full"
            >
              {/* Close Button */}
              <button 
                onClick={handleClosePreview}
                className="absolute -top-14 right-0 md:-right-14 text-white hover:text-yellow-300 transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full shadow-lg"
                title="Close Preview"
              >
                <X size={24} />
              </button>

              {/* Magnificent interactive 3D Sticky Note Card */}
              <div 
                className="w-full"
                style={{ perspective: "1500px" }}
              >
                <motion.div
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  animate={{
                    rotateX: tilt.y,
                    rotateY: tilt.x,
                    scale: 1.02
                  }}
                  transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                  className={`relative p-8 pt-16 pb-8 rounded-sm shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col justify-between min-h-[350px] ${previewNote.color}`}
                  style={{
                    transformStyle: "preserve-3d"
                  }}
                >
                  {/* Over-exaggerated 3D depth layers */}
                  <div 
                    className="absolute inset-0 border-[3px] border-black/10 rounded-sm pointer-events-none"
                    style={{ transform: "translateZ(10px)" }}
                  />

                  {/* Red pushpin casted in 3D depth */}
                  <div 
                    className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]"
                    style={{ transform: "translateZ(50px)" }}
                  >
                    <Pin size={64} className="text-red-500 fill-red-500 -rotate-12 stroke-[1.5]" />
                  </div>

                  {/* Secret Text Area */}
                  <div 
                    className="text-zinc-900 text-2xl md:text-3xl font-extrabold leading-relaxed select-text py-2 break-words whitespace-pre-wrap flex-1"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    {previewNote.text}
                  </div>

                  {/* Timestamp bottom detail */}
                  <div 
                    className="flex justify-between items-center text-xs text-black/55 font-extrabold border-t-2 border-black/10 pt-4 mt-6"
                    style={{ transform: "translateZ(20px)" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{new Date(previewNote.createdAt).toLocaleDateString()} {new Date(previewNote.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <span className="bg-black/10 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                      🔒 Locked Safe
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
