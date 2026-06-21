"use client";

import { useEffect, useRef, useState } from "react"; // 💡 Lagt till useState här
import SplatCanvas from "./SplatCanvas";

interface SplatViewerProps {
  isOpen: boolean;
  splatId: number | null;
  title: string;
  location: string;
  onClose: () => void;
}

export default function SplatViewer({ isOpen, splatId, title, location, onClose }: SplatViewerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // 💡 Håll reda på om 3D-modellen ska synas eller inte (default: false eller true)
  const [showModel, setShowModel] = useState<boolean>(true);

  // Hantera Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Scroll-låsning och autofokus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();

      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100); 
    } else {
      document.body.style.overflow = "";
      setShowModel(true); // Återställ toggle-knappen när vi stänger fönstret
    }

    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <div
        className={`backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "all" : "none",
          transition: "opacity 0.3s ease",
          zIndex: 40,
        }}
      />

      <div
        ref={panelRef}
        className={`splat-panel ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        style={{
          position: isOpen ? "relative" : "absolute", 
          visibility: isOpen ? "visible" : "hidden",
          background: "#0D0D12",
          borderTop: "1px solid rgba(200,169,110,0.15)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          height: "85vh",
          width: "100%",
          maxHeight: "800px",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          marginTop: "2rem",
          marginBottom: "2rem",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Panel Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem clamp(1.5rem, 4vw, 3rem)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontFamily: "sans-serif", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C8A96E", marginBottom: "0.2rem" }}>
              {location}
            </p>
            <h2 style={{ fontFamily: "sans-serif", fontSize: "clamp(1rem, 2vw, 1.4rem)", fontWeight: 600, letterSpacing: "-0.02em", color: "#F0EDE8" }}>
              {title}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            
            {/* 💡 HÄR ÄR DEN NYA TOGGLE-KNAPPEN */}
            {isOpen && splatId !== null && (
              <button
                onClick={() => setShowModel(!showModel)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.9rem",
                  background: showModel ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.02)",
                  border: showModel ? "1px solid #C8A96E" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "100px",
                  cursor: "pointer",
                  color: showModel ? "#F0EDE8" : "#8A8A96",
                  fontFamily: "sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{showModel ? "🟢 CAD Model On" : "⚫ CAD Model Off"}</span>
              </button>
            )}

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.9rem",
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "100px",
            }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#C8A96E", display: "block", animation: "pulse 2s ease infinite" }} />
              <span style={{ fontFamily: "sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C8A96E" }}>
                Live 3D
              </span>
            </div>

            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close viewer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#8A8A96", cursor: "pointer", padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3D Canvas Area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* 💡 SKICKA MED showModel TILL CANVASEN HÄR */}
          {splatId !== null && isOpen && (
            <SplatCanvas 
              key={splatId} 
              splatId={splatId} 
              isOpen={isOpen} 
              showModel={showModel} 
            />
          )}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </>
  );
}