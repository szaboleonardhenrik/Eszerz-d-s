import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Legitas - Online Szerződéskezelő Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0c4a3e 0%, #134e3a 40%, #115e45 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            L
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "48px", letterSpacing: "-1px" }}>
              Legit
            </span>
            <span style={{ color: "#6ee7b7", fontWeight: 800, fontSize: "48px" }}>
              as
            </span>
          </div>
        </div>

        {/* Main text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "900px",
            padding: "0 40px",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              fontSize: "44px",
              fontWeight: 800,
              lineHeight: 1.2,
              margin: "0 0 20px 0",
            }}
          >
            Szerződések létrehozása, aláírása és kezelése
          </h1>
          <p
            style={{
              color: "#a7f3d0",
              fontSize: "22px",
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Ptk.-konform sablonok · E-aláírás · AI elemzés · Magyar KKV-knak
          </p>
        </div>

        {/* Bottom badges */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "48px",
          }}
        >
          {["15+ sablon", "eIDAS kompatibilis", "GDPR megfelelő"].map((text) => (
            <div
              key={text}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                padding: "10px 24px",
                color: "#d1fae5",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* URL */}
        <p
          style={{
            position: "absolute",
            bottom: "24px",
            right: "40px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          legitas.hu
        </p>
      </div>
    ),
    { ...size }
  );
}
