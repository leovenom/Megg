import { ImageResponse } from "next/og";
import { eggDataUri } from "@/lib/egg-art";

/** PNG app icons for the web manifest; "maskable" keeps the egg inside the 80% safe zone. */
const ICONS: Record<string, { size: number; maskable: boolean; kind?: "egg" | "timer" }> = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "timer.png": { size: 512, maskable: false, kind: "timer" },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_req: Request, ctx: RouteContext<"/icons/[name]">) {
  const { name } = await ctx.params;
  const icon = ICONS[name];
  if (!icon) return new Response(null, { status: 404 });
  const { size, maskable, kind } = icon;
  if (kind === "timer") {
    const s = size;
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F6F1EA",
            borderRadius: s * 0.22,
          }}
        >
          <div
            style={{
              width: s * 0.62,
              height: s * 0.62,
              borderRadius: s,
              border: `${s * 0.055}px solid #2B2521`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: "#FFFDF8",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: s * 0.045,
                height: s * 0.2,
                background: "#2B2521",
                top: s * 0.12,
                borderRadius: s,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: s * 0.18,
                height: s * 0.045,
                background: "#F5A623",
                left: s * 0.28,
                borderRadius: s,
              }}
            />
            <div
              style={{
                width: s * 0.08,
                height: s * 0.08,
                borderRadius: s,
                background: "#F5A623",
              }}
            />
          </div>
        </div>
      ),
      { width: size, height: size },
    );
  }
  const eggHeight = size * (maskable ? 0.58 : 0.75);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5A623",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
        <img src={eggDataUri({ face: true })} width={(eggHeight * 100) / 130} height={eggHeight} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
