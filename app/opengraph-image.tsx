import { ImageResponse } from "next/og";

export const alt =
  "eCyberCafe — browser-based photo, document, and PDF tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 72px",
          background:
            "linear-gradient(125deg, #173d2d 0%, #28533b 55%, #71916b 100%)",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 58,
              height: 58,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 17,
              background: "#fff",
              color: "#254b38",
              fontFamily: "Georgia, serif",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            e
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>eCyberCafe</div>
          <div
            style={{
              marginLeft: 8,
              border: "1px solid #ffffff66",
              borderRadius: 24,
              padding: "8px 14px",
              fontSize: 15,
            }}
          >
            PRIVATE BY DESIGN
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 960,
              fontFamily: "Georgia, serif",
              fontSize: 66,
              lineHeight: 1.08,
            }}
          >
            Everyday document tools.
            <br />
            Private by design.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            {["Passport Photo Resizer", "Target File Size", "PDF Tools"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    border: "1px solid #ffffff65",
                    borderRadius: 10,
                    padding: "13px 17px",
                    background: "#ffffff14",
                    fontSize: 18,
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
        <div style={{ color: "#e0e9da", fontSize: 18 }}>
          Browser-first tools · ecybercafe.in
        </div>
      </div>
    ),
    size,
  );
}
