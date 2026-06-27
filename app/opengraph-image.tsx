import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ShrinkTo — free, private, in-browser file tools";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1a73e8 0%, #6a5cff 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>ShrinkTo</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 900 }}>
          Compress images &amp; PDFs, 100% in your browser
        </div>
        <div style={{ fontSize: 32, marginTop: 28, opacity: 0.92 }}>
          No upload · No signup · No limits
        </div>
      </div>
    ),
    size,
  );
}
