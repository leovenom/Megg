import { ImageResponse } from "next/og";
import { eggDataUri } from "@/lib/egg-art";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}: Just the way you like it. A boiled-egg timer with a smiling egg.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 110px",
          gap: 80,
          background: "radial-gradient(circle at 26% 55%, #FBE3B0 0%, #F6F1EA 42%)",
          color: "#2B2521",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 300, height: 390 }}>
          <div
            style={{
              position: "absolute",
              left: 20,
              bottom: -14,
              width: 260,
              height: 44,
              background: "radial-gradient(closest-side, rgba(90, 60, 30, 0.22), rgba(90, 60, 30, 0))",
            }}
          />
          <img src={eggDataUri({ face: true })} width={300} height={390} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 168, letterSpacing: -6, lineHeight: 1 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 52, marginTop: 18, color: "#6B5E55" }}>Just the way you like it</div>
          <div
            style={{
              display: "flex",
              marginTop: 44,
              alignSelf: "flex-start",
              padding: "14px 28px",
              borderRadius: 999,
              background: "#2B2521",
              color: "#F6F1EA",
              fontSize: 30,
            }}
          >
            Boiled egg timer
          </div>
        </div>
      </div>
    ),
    size,
  );
}
