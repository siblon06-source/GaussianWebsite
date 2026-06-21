import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gaussian Splat Archive",
  description: "Explore 3D digital twins and aerial scans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        style={{ 
          background: "#0A0A0C", 
          margin: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}
      >
        {children}
      </body>
    </html>
  );
}