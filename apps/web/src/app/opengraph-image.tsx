import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 20,
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#0f172a" }}>ScorelineIQ</div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#64748b" }}>
          Data-driven football predictions and accuracy tracking
        </div>
      </div>
    ),
    size,
  );
}
