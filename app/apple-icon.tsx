import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#254b38",
          color: "#fff",
          fontFamily: "Georgia, serif",
          fontSize: 136,
          fontWeight: 700,
        }}
      >
        <span style={{ position: "relative", top: -5 }}>D</span>
        <span
          style={{
            position: "absolute",
            bottom: 38,
            left: 47,
            width: 86,
            height: 8,
            backgroundColor: "#d7b66e",
          }}
        />
      </div>
    ),
    size,
  );
}
