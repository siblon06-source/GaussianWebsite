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

// Vi mappar upp exakt samma länk-lista här som du har i din SplatCanvas 
// för att veta vilka id:n som faktiskt har en aktiv 3D-fil.
const activeSplatUrls: Record<number, string> = {
  1: "https://dl.dropboxusercontent.com/scl/fi/bxept122250lt1h6drdpo/splat1.splat?rlkey=0asjiet4wihak3fjrx78vsagd&raw=1",
  2: "https://dl.dropboxusercontent.com/scl/fi/rg4e6alq7sj9bx8py96ah/splat2.splat?rlkey=zrqk89869k92uq8drqwxpyhak&raw=1"
  // Om du lägger till kort 3, 4, 5 osv. i framtiden men inte lägger till en länk här, blir de automatiskt "Not Active".
};

export default function SplatCard({ id, title, location, year, imgSrc, onClick }: SplatCardProps) {
  // Kontrollera om detta kort har en giltig länk tilldelad
  const isActive = !!activeSplatUrls[id];

  return (
    <>
      <button
        onClick={isActive ? onClick : undefined} // Stäng av klick-funktionen om inaktiv
        disabled={!isActive} // Inaktivera knappen i webbläsaren om den inte är aktiv
        className={`splat-card ${!isActive ? "is-inactive" : ""}`}
        aria-label={isActive ? `Open 3D scan: ${title}` : `${title} (Not active)`}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: isActive ? "pointer" : "not-allowed", // Ändra muspekare till "förbjudet" om inaktiv
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#111116",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease, opacity 0.4s ease",
          opacity: isActive ? 1 : 0.4, // Gör hela kortet blekt/transparent om inaktivt
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
              transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease",
              filter: isActive ? "none" : "grayscale(100%) brightness(0.6)" // Gör bilden svartvit och mörkare om inaktiv
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
            border: `1px solid ${isActive ? "rgba(200,169,110,0.25)" : "rgba(239, 68, 68, 0.25)"}`, // Röd ram om inaktiv
            borderRadius: "100px",
            padding: "0.3rem 0.75rem",
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isActive ? "#C8A96E" : "#EF4444", // Röd prick om inaktiv
              display: "block",
            }} />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: isActive ? "#C8A96E" : "#EF4444", // Röd text om inaktiv
            }}>
              {isActive ? "3D Scan" : "Not Active"}
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
            color: isActive ? "#C8A96E" : "#5A5A66", // Nedtonad text om inaktiv
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
            color: isActive ? "#F0EDE8" : "#6A6A76", // Nedtonad titel om inaktiv
            marginBottom: "0.75rem",
            lineHeight: 1.2,
          }}>
            {title}
          </h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: isActive ? "#8A8A96" : "#4A4A56",
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
            }}>
              {isActive ? "View in 3D" : "Offline"}
            </span>
            {isActive && (
              <svg 
                className="card-arrow"
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ transition: "transform 0.3s ease" }}
              >
                <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C8A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* CSS-stilar – Notera tillägget :not(.is-inactive) */}
      <style>{`
        /* Skala bara upp kortet om det faktiskt är aktivt */
        .splat-card:not(.is-inactive):hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(200, 169, 110, 0.1);
        }

        /* Zooma bara in bilden om kortet är aktivt */
        .splat-card:not(.is-inactive):hover .card-img {
          transform: scale(1.06);
          filter: brightness(1.15) contrast(1.05);
        }

        /* Skjut pilen lite snyggt åt höger */
        .splat-card:not(.is-inactive):hover .card-arrow {
          transform: translateX(4px);
        }
      `}</style>
    </>
  );
}