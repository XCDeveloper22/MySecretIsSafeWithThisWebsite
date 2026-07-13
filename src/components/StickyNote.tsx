import React, { useState, useRef } from "react";
import { Trash2, Palette, Clock, Pin, Lock, Check, Maximize2 } from "lucide-react";
import { Note, ColorOption } from "../types";
import { updateNote } from "../utils";
import { motion } from "motion/react";
import { playThumpSound } from "../audio";

interface StickyNoteProps {
  key?: any;
  note: Note;
  onDelete: (id: string) => void;
  colors: ColorOption[];
  onLock: (id: string) => void;
  onPreview: (note: Note) => void;
}

export default function StickyNote({ note, onDelete, colors, onLock, onPreview }: StickyNoteProps) {
  const [text, setText] = useState(note.text);
  const [color, setColor] = useState(note.color);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a stable rotation angle based on note ID for a realistic chaotic board look
  const getRotationAngle = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 6); // -5 to 5 degrees
  };

  const rotateDeg = getRotationAngle(note.id);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (note.isLocked) return;
    setText(e.target.value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateNote(note.id, { text: e.target.value });
    }, 1000); // 1000ms debounce during typing to minimize network overhead and avoid congesting the server
  };

  const handleBlur = () => {
    if (note.isLocked) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    updateNote(note.id, { text });
  };

  const handleColorChange = (newColor: string) => {
    if (note.isLocked) return;
    setColor(newColor);
    setShowPalette(false);
    updateNote(note.id, { color: newColor });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    onDelete(note.id);
  };

  const handleLockNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text.trim()) return;
    playThumpSound();
    onLock(note.id);
  };

  const handleCardClick = () => {
    if (note.isLocked) {
      onPreview(note);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.3, rotate: rotateDeg - 20, y: 100 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: rotateDeg, 
        y: 0 
      }}
      exit={{ opacity: 0, scale: 0.5, rotate: rotateDeg + 15, y: 50 }}
      whileHover={{ 
        y: -12, 
        scale: 1.05, 
        rotate: rotateDeg * 0.5,
        zIndex: 20,
        boxShadow: "0 25px 35px rgba(0,0,0,0.35)"
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 18 
      }}
      onClick={handleCardClick}
      className={`relative pt-10 pb-4 px-5 rounded-sm min-h-[240px] flex flex-col justify-between transition-colors duration-300 ${color} shadow-[5px_10px_20px_rgba(0,0,0,0.22)] ${note.isLocked ? "cursor-pointer group/card" : ""}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      {/* 3D Curled Bottom Corner shadow */}
      <div className="absolute bottom-1 right-1 left-1 h-3 bg-black/15 blur-sm rounded-[50%] -z-10 pointer-events-none" />

      {/* Folded Paper Corner Effect */}
      <div className="absolute right-0 bottom-0 w-5 h-5 bg-black/10 rounded-tl-md pointer-events-none" />

      {/* Push pin at the top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 drop-shadow-lg transition-transform hover:scale-110">
        <Pin size={32} className="text-red-500 fill-red-500 -rotate-12 stroke-[1.5]" />
      </div>

      {note.isLocked && (
        <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/10 hover:bg-black/20 p-1.5 rounded-full text-zinc-800" title="Preview 3D Card">
          <Maximize2 size={13} className="stroke-[2.5]" />
        </div>
      )}

      {note.isLocked ? (
        <div className="flex-1 text-zinc-800 text-lg font-medium leading-relaxed select-none break-words whitespace-pre-wrap py-2 pr-1 select-text">
          {text || <span className="italic text-zinc-400">Empty secret...</span>}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="Type a secret..."
          className="flex-1 bg-transparent resize-none outline-none text-zinc-800 placeholder:text-zinc-500/70 text-lg font-medium leading-relaxed"
          maxLength={300}
        />
      )}
      
      <div className="mt-4 flex flex-col gap-2.5">
        {/* Timestamp */}
        <div className="flex flex-col gap-1 text-[11px] text-black/50 font-bold border-t border-black/5 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="shrink-0 opacity-70" />
            <span>{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {!note.isLocked ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowPalette(!showPalette)}
                    className="p-1.5 text-zinc-700 hover:bg-black/10 rounded-full transition-colors"
                    title="Change Color"
                  >
                    <Palette size={15} />
                  </button>
                  
                  {showPalette && (
                    <div className="absolute left-0 bottom-full mb-2 flex flex-wrap gap-1.5 p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-black/10 w-44 z-30">
                      {colors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => handleColorChange(c.className)}
                          className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 ${c.className} ${color === c.className ? 'ring-2 ring-black/40' : ''}`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLockNote}
                  disabled={!text.trim()}
                  className="flex items-center gap-1 bg-black/90 hover:bg-black text-white text-[11px] px-2.5 py-1 rounded-full font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  title="Pin & Lock Secret"
                >
                  <Lock size={10} />
                  Pin Secret
                </button>
              </>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-zinc-700/80 font-bold bg-black/5 px-2.5 py-1 rounded-full border border-black/5">
                <Check size={11} className="text-emerald-700" />
                Pinned & Protected
              </span>
            )}
          </div>

          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-zinc-700 hover:text-red-700 hover:bg-black/10 rounded-full transition-colors"
            title="Delete Secret"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      
      {showPalette && (
        <div 
          className="fixed inset-0 z-20"
          onClick={(e) => {
            e.stopPropagation();
            setShowPalette(false);
          }}
        />
      )}
    </motion.div>
  );
}
