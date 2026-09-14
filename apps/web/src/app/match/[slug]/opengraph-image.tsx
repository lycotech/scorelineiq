import { ImageResponse } from "next/og";
import { getFixtureBySlug } from "../../../lib/queries";

// Prisma's client needs Node APIs, not available on the Edge runtime
// ImageResponse defaults to.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fixture = await getFixtureBySlug(slug);

  if (!fixture) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            fontFamily: "sans-serif",
            fontSize: 48,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          ScorelineIQ
        </div>
      ),
      size,
    );
  }

  const p = fixture.prediction;
  const homeName = fixture.homeTeam.name;
  const awayName = fixture.awayTeam.name;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#f8fafc",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#0f172a" }}>ScorelineIQ</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 22, color: "#64748b", textTransform: "uppercase", letterSpacing: 3 }}>
            {fixture.league.name}
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: "#0f172a", lineHeight: 1.15 }}>
            {homeName} vs {awayName}
          </div>

          {p ? (
            <div style={{ display: "flex", gap: 48, marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>Home</div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#2563eb" }}>
                  {pct(p.homeWinProbability)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>Draw</div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#2563eb" }}>
                  {pct(p.drawProbability)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>Away</div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#2563eb" }}>
                  {pct(p.awayWinProbability)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>Predicted score</div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#0f172a" }}>
                  {p.predictedScoreHome}-{p.predictedScoreAway}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 28, color: "#64748b", marginTop: 12 }}>
              Prediction pending — check back closer to kickoff
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
