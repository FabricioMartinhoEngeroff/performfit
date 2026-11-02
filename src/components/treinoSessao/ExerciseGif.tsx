import { useState } from "react";
import { fetchExerciseGif } from "../../services/exerciseDbService";
import { videoDoExercicio } from "../../data/exerciseAliases";

type GifState = "idle" | "loading" | "loaded" | "error";

export function ExerciseGif({ exerciseName }: { exerciseName: string }) {
  const [gifState, setGifState] = useState<GifState>("idle");
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Guarda o nome do exercício que está tocando: ao trocar de exercício o bloco volta à miniatura.
  const [tocandoEm, setTocandoEm] = useState<string | null>(null);

  const youtubeId = videoDoExercicio(exerciseName);
  const hasVideo = youtubeId.length > 0;
  const tocando = hasVideo && tocandoEm === exerciseName;

  async function loadGif() {
    setGifState("loading");
    try {
      const url = await fetchExerciseGif(exerciseName);
      if (url) {
        setGifUrl(url);
        setGifState("loaded");
      } else {
        setGifState("error");
      }
    } catch {
      setGifState("error");
    }
  }

  function openModal() {
    setTocandoEm(null); // só um player tocando por vez
    setModalOpen(true);
    if (!hasVideo && gifState === "idle") loadGif();
  }

  function closeModal() {
    setModalOpen(false);
  }

  const iconButton = {
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  } as const;

  return (
    <>
      {hasVideo ? (
        <section
          aria-label="Demonstração em vídeo"
          style={{
            background: "#f5f6fa",
            border: "0.5px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {tocando ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`}
              title={`Demonstração: ${exerciseName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none", display: "block", width: "100%", aspectRatio: "16 / 9" }}
            />
          ) : null}

          {!tocando && (
            <img
              src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={`Miniatura: ${exerciseName}`}
              loading="lazy"
              onClick={() => setTocandoEm(exerciseName)}
              style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", cursor: "pointer", background: "#e5e7eb" }}
            />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>Demonstração</p>
              <p style={{ margin: "2px 0 0", fontSize: 14, color: "#6b7280" }}>
                {tocando ? "Tocando no bloco" : "Toque no play para assistir"}
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              aria-label="Abrir em tela maior"
              title="Abrir em tela maior"
              style={{ ...iconButton, width: 48, height: 48, background: "#ffffff", border: "1.5px solid #d1d5db", color: "#374151", fontSize: 22 }}
            >
              ⛶
            </button>
            {!tocando && (
              <button
                type="button"
                onClick={() => setTocandoEm(exerciseName)}
                aria-label="Reproduzir demonstração"
                style={{ ...iconButton, width: 56, height: 56, background: "#2563eb", color: "#ffffff", fontSize: 22 }}
              >
                ▶
              </button>
            )}
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={openModal}
          style={{
            width: "100%",
            minHeight: 52,
            background: "#eff6ff",
            border: "1.5px solid #2563eb",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 17,
            fontWeight: 600,
            color: "#2563eb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 8,
            fontFamily: "inherit",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 16 }}>▶</span>
          Ver demonstração
        </button>
      )}

      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={exerciseName}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "14px 14px 18px",
              width: "min(560px, 94vw)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#111827", flex: 1, paddingRight: 8 }}>
                {exerciseName}
              </p>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar demonstração"
                style={{
                  background: "#f3f4f6",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 10,
                  minWidth: 48,
                  minHeight: 48,
                  padding: "0 14px",
                  gap: 6,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span aria-hidden="true">✕</span> Fechar
              </button>
            </div>

            {/* Content */}
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#f5f6fa", minHeight: 100 }}>
              {hasVideo ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={`Demonstração: ${exerciseName}`}
                  width="100%"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: "none", display: "block", width: "100%", aspectRatio: "16 / 9" }}
                />
              ) : (
                <>
                  {gifState === "loading" && (
                    <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center", padding: "40px 0", margin: 0 }}>
                      Carregando...
                    </p>
                  )}
                  {gifState === "error" && (
                    <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center", padding: "40px 0", margin: 0 }}>
                      Demonstração não disponível
                    </p>
                  )}
                  {gifState === "loaded" && gifUrl && (
                    <img
                      src={gifUrl}
                      alt={`Demonstração: ${exerciseName}`}
                      style={{ width: "100%", display: "block" }}
                    />
                  )}
                </>
              )}
            </div>

            <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", margin: "10px 0 0" }}>
              Toque fora para fechar
            </p>
          </div>
        </div>
      )}
    </>
  );
}
