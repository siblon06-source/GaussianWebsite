"use client";

import { useState } from "react";
import SplatCard from "./SplatCard";
import SplatViewer from "./SplatViewer";

const splats = [
  {
    id: 1,
    title: "Central Station Expansion",
    location: "Stockholm",
    year: "2024",
    imgSrc: "/img1.jpg",
  },
  {
    id: 2,
    title: "Waterfront Development",
    location: "Gothenburg",
    year: "2024",
    imgSrc: "/img2.jpg",
  },
  {
    id: 3,
    title: "Historic Quarter Renovation",
    location: "Malmo",
    year: "2025",
    imgSrc: "/img3.jpg",
  },
  {
    id: 4,
    title: "New District Master Plan",
    location: "Uppsala",
    year: "2025",
    imgSrc: "/img4.jpg",
  },
  {
    id: 5,
    title: "Industrial Heritage Site",
    location: "Vasteras",
    year: "2025",
    imgSrc: "/img5.jpg",
  },
  {
    id: 6,
    title: "Harbour Bridge Project",
    location: "Helsingborg",
    year: "2025",
    imgSrc: "/img6.jpg",
  },
];

export default function SplatGrid() {
  const [activeId, setActiveId] = useState<number | null>(null);

  const activeSplat = splats.find((s) => s.id === activeId) ?? null;

  return (
    <>
      <section
        style={{
          background: "#0A0A0C",
          padding: "clamp(4rem, 8vw, 8rem) clamp(1.5rem, 6vw, 6rem)",
        }}
      >
        {/* Section header */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            marginBottom: "clamp(2.5rem, 5vw, 4rem)",
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}>
            <div>
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.7rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#C8A96E",
                marginBottom: "0.6rem",
              }}>
                Project Archive
              </p>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#F0EDE8",
                lineHeight: 1.1,
              }}>
                Scanned locations
              </h2>
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              color: "#8A8A96",
              maxWidth: "28ch",
              lineHeight: 1.6,
            }}>
              Hover to preview. Click to explore in full 3D.
            </p>
          </div>

          {/* Divider */}
          <div style={{
            marginTop: "2rem",
            height: "1px",
            background: "linear-gradient(to right, rgba(200,169,110,0.3), transparent)",
          }} />
        </div>

        {/* Grid */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: "clamp(1rem, 2vw, 1.5rem)",
          }}
        >
          {splats.map((splat) => (
            <SplatCard
              key={splat.id}
              id={splat.id}
              title={splat.title}
              location={splat.location}
              year={splat.year}
              imgSrc={splat.imgSrc}
              onClick={() => setActiveId(splat.id)}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "2rem clamp(1.5rem, 6vw, 6rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "0.8rem",
          color: "#8A8A96",
          letterSpacing: "0.04em",
        }}>
          Simon Strandanger &mdash; Digital Twins
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.75rem",
          color: "#3A3A46",
        }}>
          Gaussian Splat Technology
        </p>
      </footer>

      {/* Splat viewer panel */}
      <SplatViewer
        isOpen={activeId !== null}
        splatId={activeId}
        title={activeSplat?.title ?? ""}
        location={activeSplat?.location ?? ""}
        onClose={() => setActiveId(null)}
      />
    </>
  );
}