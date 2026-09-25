import { ImageResponse } from "next/og";
import { eggDataUri } from "@/lib/egg-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <img src={eggDataUri({ face: true })} width={104} height={135} alt="" />
      </div>
    ),
    size,
  );
}
