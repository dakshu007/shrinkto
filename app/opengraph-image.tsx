import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ShrinkTo - free, private, in-browser file tools";

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
          background: "linear-gradient(150deg, #5a9cf8 0%, #1a73e8 100%)",
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
            }}
          >
            <svg width="46" height="46" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 3.6C12.67 8.22 15.78 11.33 20.4 12C15.78 12.67 12.67 15.78 12 20.4C11.33 15.78 8.22 12.67 3.6 12C8.22 11.33 11.33 8.22 12 3.6Z" />
            </svg>
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
