"use client";

import { useEffect, useState } from "react";

const features = [
  "Document current state",
  "Visualize future buildings",
  "Compare before and after",
  "Explore projects in your browser",
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 clamp(1.5rem, 6vw, 6rem)",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,169,110,0.07) 0%, transparent 60%), #0A0A0C",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid lines */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(200,169,110,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", position: "relative" }}>
        {/* Byline */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(0.75rem, 1.2vw, 0.875rem)",
            fontWeight: 400,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#C8A96E",
            marginBottom: "clamp(1.5rem, 3vw, 2.5rem)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
          }}
        >
          Simon Strandanger
        </p>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(2.8rem, 7.5vw, 8rem)",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: "#F0EDE8",
            marginBottom: "clamp(2rem, 4vw, 3.5rem)",
            maxWidth: "14ch",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease 0.25s, transform 0.8s ease 0.25s",
          }}
        >
          Digital twins for{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #F0EDE8 0%, #C8A96E 60%, #F0EDE8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            urban development
          </span>{" "}
          and construction
        </h1>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s ease 0.45s, transform 0.8s ease 0.45s",
          }}
        >
          {features.map((f) => (
            <span key={f} className="feature-pill" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(0.7rem, 1.1vw, 0.8rem)",
              fontWeight: 400,
              letterSpacing: "0.04em",
              padding: "0.5rem 1rem",
              borderRadius: "100px",
              whiteSpace: "nowrap",
            }}>
              {f}
            </span>
          ))}
        </div>

        {/* Scroll cue */}
        <div
          style={{
            marginTop: "clamp(3rem, 8vh, 6rem)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            opacity: mounted ? 0.45 : 0,
            transition: "opacity 0.8s ease 0.7s",
          }}
        >
          <div style={{
            width: "1px",
            height: "48px",
            background: "linear-gradient(to bottom, #C8A96E, transparent)",
          }} />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#8A8A96",
          }}>
            Explore projects
          </span>
        </div>
      </div>
    </section>
  );
}