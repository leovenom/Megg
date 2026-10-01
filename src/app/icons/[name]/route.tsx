import { ImageResponse } from "next/og";
import { eggDataUri } from "@/lib/egg-art";

/** PNG app icons for the web manifest; "maskable" keeps the egg inside the 80% safe zone.
 *  "now-playing.png" is a full-bleed opaque square for iOS Media Session (no rounded corners). */
const ICONS: Record<string, { size: number; maskable: boolean; media?: boolean }> = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "now-playing.png": { size: 512, maskable: false, media: true },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_req: Request, ctx: RouteContext<"/icons/[name]">) {
  const { name } = await ctx.params;
  const icon = ICONS[name];
  if (!icon) return new Response(null, { status: 404 });
  const { size, maskable, media } = icon;
  const eggHeight = size * (maskable ? 0.58 : media ? 0.72 : 0.75);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Opaque full-bleed yolk. Media Session shows a square frame; any
          // rounded/transparent corner becomes a white wedge on the lock screen.
          backgroundColor: "#F5A623",
          backgroundImage: "linear-gradient(#F5A623, #F5A623)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
        <img src={eggDataUri({ face: true })} width={(eggHeight * 100) / 130} height={eggHeight} alt="" />
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": media ? "public, max-age=3600" : "public, max-age=86400",
      },
    },
  );
}
