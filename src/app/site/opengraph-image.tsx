import { ImageResponse } from "next/og";

// Imagem de preview (card do WhatsApp/redes) para as páginas do site.
export const alt = "Rede RWP — Pizzarias e gestão para franqueados";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0c0e",
          color: "#f6f5f3",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "84px",
              height: "84px",
              borderRadius: "20px",
              background: "#ee5a24",
              fontSize: "40px",
              fontWeight: 900,
            }}
          >
            RWP
          </div>
          <div style={{ fontSize: "34px", letterSpacing: "6px", color: "#c3c3c0" }}>REDE RWP</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1.05 }}>
            Quatro marcas de pizza.
          </div>
          <div style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1.05, color: "#ee5a24" }}>
            Uma rede que sabe gerir.
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "28px", color: "#c3c3c0" }}>
          <span>Pizza Pizza</span>
          <span>·</span>
          <span>Rei da Pizza</span>
          <span>·</span>
          <span>We Love Pizza</span>
          <span>·</span>
          <span>Royal Pizza</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
