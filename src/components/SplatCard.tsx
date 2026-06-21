"use client";

import Image from "next/image";

interface SplatCardProps {
  id: number;
  title: string;
  location: string;
  year: string;
  imgSrc: string;
  onClick: () => void;
}

export default function SplatCard({ id, title, location, year, imgSrc, onClick }: SplatCardProps) {
  return (
    <>
      <button
        onClick={onClick}
        className="splat-card"
        aria-label={`Open 3D scan: ${title}`}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#111116", // Satt till samma bas som texten för sömlös design
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease", // 💡 Mjuk expansion
        }}
      >
        {/* Image container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            overflow: "hidden",
          }}
        >
          <div 
            className="card-img" 
            style={{ 
              position: "absolute", 
              inset: 0,
              transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease" // 💡 Zoom + Ljusstyrka
            }}
          >
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Dark vignette overlay at bottom */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: "linear-gradient(to top, rgba(10,10,12,0.85) 0%, transparent 100%)",
              zIndex: 1,
            }}
          />

          {/* Scan indicator */}
          <div style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(10,10,12,0.6)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(200,169,110,0.25)",
            borderRadius: "100px",
            padding: "0.3rem 0.75rem",
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#C8A96E",
              display: "block",
            }} />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#C8A96E",
            }}>
              3D Scan
            </span>
          </div>
        </div>

        {/* Text content */}
        <div style={{
          padding: "1.25rem 1.5rem 1.5rem",
          background: "#111116",
          borderTop: "1px solid rgba(200,169,110,0.08)",
          position: "relative",
          zIndex: 2,
        }}>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#C8A96E",
            marginBottom: "0.4rem",
            fontWeight: 500,
          }}>
            {location} &mdash; {year}
          </p>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#F0EDE8",
            marginBottom: "0.75rem",
            lineHeight: 1.2,
          }}>
            {title}
          </h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#8A8A96",
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
            }}>
              View in 3D
            </span>
            <svg 
              className="card-arrow"
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ transition: "transform 0.3s ease" }} // 💡 Pil-animation
            >
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C8A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* 💡 EFFEKTER VID HOVER (MUSPEKARE) */}
      <style>{`
        /* Skala upp kortet och lägg till en snygg glöd/skugga */
        .splat-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(200, 169, 110, 0.1);
        }

        /* Zooma in bilden något och gör den lite ljusare/mer levande */
        .splat-card:hover .card-img {
          transform: scale(1.06);
          filter: brightness(1.15) contrast(1.05);
        }

        /* Skjut pilen lite snyggt åt höger */
        .splat-card:hover .card-arrow {
          transform: translateX(4px);
        }
      `}</style>
    </>
  );
}