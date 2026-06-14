import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Download, Quote, Share2, Sparkles, Sprout } from "lucide-react";
import { isTauri } from "@tauri-apps/api/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Button } from "@/components/ui/button";
import type { NextMilestone } from "@/lib/journey/xp";

type AchievementShareCardProps = {
  level: number;
  totalXp: number;
  streak: number;
  journeysCompleted: number;
  milestoneLabel?: string;
  tierLabel?: string;
  nextMilestone?: NextMilestone | null;
  journeyDate?: Date;
};

const EXPORT_SIZE = 1080;
const MAX_LEVEL = 10;
const XP_PER_LEVEL = 50;

function downloadBlobInBrowser(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function saveAchievementImage(blob: Blob) {
  const fileName = `mabuh-ai-quiet-win-${new Date().toISOString().slice(0, 10)}.png`;
  if (isTauri()) {
    await writeFile(fileName, new Uint8Array(await blob.arrayBuffer()), {
      baseDir: BaseDirectory.Download,
    });
    return fileName;
  }
  downloadBlobInBrowser(blob, fileName);
  return fileName;
}

type SurfaceProps = AchievementShareCardProps;

function AchievementCardSurface({
  level,
  totalXp,
  streak,
  journeysCompleted,
  milestoneLabel,
  tierLabel,
  nextMilestone,
}: SurfaceProps) {
  const xpInto = totalXp % XP_PER_LEVEL;
  const xpRemaining = XP_PER_LEVEL - xpInto;
  const xpPct = Math.max(2, Math.min(100, (xpInto / XP_PER_LEVEL) * 100));
  const quoteText = milestoneLabel
    ? `Milestone reached: ${milestoneLabel}`
    : "Small steps are still meaningful progress.";
  const quoteSubtext = "I kept showing up for myself. That is worth noticing.";
  const nextStepText = nextMilestone
    ? `${nextMilestone.label} — ${nextMilestone.hint}`
    : "All milestones reached — keep going.";

  return (
    <div
      data-achievement-surface
      style={{
        width: EXPORT_SIZE,
        height: EXPORT_SIZE,
        position: "relative",
        overflow: "hidden",
        borderRadius: 56,
        border: "1.5px solid rgba(188,194,255,0.22)",
        background:
          "linear-gradient(150deg, #1a1d2c 0%, #131623 55%, #0c0f17 100%)",
        boxShadow: "0 32px 80px -40px rgba(8,10,18,0.95)",
        color: "#f3eef7",
        fontFamily:
          '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -120,
          top: -100,
          width: 540,
          height: 540,
          borderRadius: "50%",
          background:
            "radial-gradient(circle_at_center, rgba(255,185,84,0.28), transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -140,
          bottom: -140,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle_at_center, rgba(188,194,255,0.32), transparent 65%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: 200,
          top: 360,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle_at_center, rgba(212,187,255,0.18), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: 72,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <img
              src="/app-logo.svg"
              alt=""
              style={{ width: 84, height: 84, objectFit: "contain" }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Newsreader", ui-serif, Georgia, serif',
                  fontWeight: 500,
                  fontSize: 44,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#f5f1ff",
                }}
              >
                Mabuh-ai
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(188,194,255,0.65)",
                }}
              >
                A quiet win
              </p>
            </div>
          </div>
          <RankBadge level={level} />
        </div>

        <div style={{ marginTop: 56 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(188,194,255,0.6)",
            }}
          >
            My wellbeing journey
          </p>
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 22,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: '"Newsreader", ui-serif, Georgia, serif',
                fontWeight: 500,
                fontSize: 124,
                lineHeight: 1,
                letterSpacing: "-0.035em",
                color: "#f5f1ff",
              }}
            >
              Level {level}
            </h2>
            {tierLabel ? <TierPill label={tierLabel} /> : null}
          </div>
        </div>

        <div style={{ marginTop: 38 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 14,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(188,194,255,0.6)",
              }}
            >
              Progress to Level {level + 1}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "rgba(255,217,154,0.95)",
              }}
            >
              {xpRemaining} XP to go
            </p>
          </div>
          <div
            style={{
              position: "relative",
              height: 18,
              width: "100%",
              borderRadius: 999,
              background: "rgba(188,194,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${xpPct}%`,
                background:
                  "linear-gradient(90deg, #bcc2ff 0%, #d4bbff 55%, #ffb954 100%)",
                boxShadow: "0 10px 30px -10px rgba(188,194,255,0.6)",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span style={{ color: "rgba(216,212,235,0.7)" }}>
              {xpInto}/{XP_PER_LEVEL} XP
            </span>
            <span style={{ color: "rgba(216,212,235,0.55)" }}>
              {streak}🔥 streak · {journeysCompleted} journeys
            </span>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "auto",
            padding: "30px 36px 32px",
            borderRadius: 32,
            border: "1.5px solid rgba(188,194,255,0.20)",
            background:
              "linear-gradient(140deg, rgba(188,194,255,0.10) 0%, rgba(212,187,255,0.08) 50%, rgba(255,185,84,0.10) 100%)",
            overflow: "hidden",
          }}
        >
          <Quote
            aria-hidden
            style={{
              position: "absolute",
              left: -4,
              top: -18,
              width: 64,
              height: 64,
              color: "rgba(188,194,255,0.5)",
              pointerEvents: "none",
            }}
            strokeWidth={1}
          />
          <p
            style={{
              position: "relative",
              margin: 0,
              fontFamily: '"Newsreader", ui-serif, Georgia, serif',
              fontWeight: 500,
              fontSize: 32,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "#f5f1ff",
            }}
          >
            {quoteText}
          </p>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.5,
              color: "rgba(216,212,235,0.7)",
            }}
          >
            {quoteSubtext}
          </p>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 22px",
            borderRadius: 24,
            border: "1.5px solid rgba(188,194,255,0.16)",
            background: "rgba(188,194,255,0.04)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "rgba(188,194,255,0.10)",
              flexShrink: 0,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                padding: 1.5,
                background:
                  "conic-gradient(from 200deg, #bcc2ff 0deg, #d4bbff 160deg, #ffb954 320deg, #bcc2ff 360deg)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
              }}
            />
            <Sprout
              aria-hidden
              style={{ width: 26, height: 26, color: "#bcc2ff" }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(188,194,255,0.6)",
              }}
            >
              Next step
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.35,
                color: "#f5f1ff",
              }}
            >
              {nextStepText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ level }: { level: number }) {
  return (
    <div
      style={{ position: "relative", width: 168, height: 168, flexShrink: 0 }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -16,
          borderRadius: "50%",
          background:
            "radial-gradient(circle_at_center, rgba(188,194,255,0.22), transparent 70%)",
          filter: "blur(16px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          padding: 2,
          background:
            "conic-gradient(from 220deg, #bcc2ff 0deg, #d4bbff 160deg, #ffb954 300deg, #bcc2ff 360deg)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(20,22,32,0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ lineHeight: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#ffd99a",
            }}
          >
            Rank
          </p>
          <p
            style={{
              margin: "10px 0 6px",
              fontFamily: '"Newsreader", ui-serif, Georgia, serif',
              fontWeight: 500,
              fontSize: 72,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "#f5f1ff",
            }}
          >
            {level}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(216,212,235,0.6)",
            }}
          >
            of {MAX_LEVEL}
          </p>
        </div>
      </div>
    </div>
  );
}

function TierPill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 22px",
        borderRadius: 999,
        border: "1.5px solid rgba(188,194,255,0.32)",
        background:
          "linear-gradient(90deg, rgba(188,194,255,0.10) 0%, rgba(212,187,255,0.14) 100%)",
      }}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        style={{ width: 18, height: 18, color: "rgba(188,194,255,0.95)" }}
        fill="currentColor"
      >
        <path d="M12 0l1.6 8.4L22 10l-8.4 1.6L12 20l-1.6-8.4L2 10l8.4-1.6L12 0z" />
      </svg>
      <span
        style={{
          fontFamily: '"Newsreader", ui-serif, Georgia, serif',
          fontWeight: 500,
          fontSize: 22,
          color: "#d8d4eb",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the achievement image."));
    }, "image/png");
  });
}

async function rasterizeSurfaceToBlob(node: HTMLElement): Promise<Blob> {
  const width = EXPORT_SIZE;
  const height = EXPORT_SIZE;
  const styleAssets = `
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
      * { box-sizing: border-box; }
      [data-achievement-surface] {
        font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif !important;
      }
    </style>
  `;

  const html = node.outerHTML;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject x="0" y="0" width="${width}" height="${height}">
        ${styleAssets}
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image creation is not supported on this device.");
    ctx.drawImage(image, 0, 0, width, height);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AchievementShareCard(props: AchievementShareCardProps) {
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const imageBlobRef = useRef<Blob | null>(null);
  const imagePromiseRef = useRef<Promise<Blob> | null>(null);
  const [displaySize, setDisplaySize] = useState<number>(0);
  const {
    level,
    totalXp,
    streak,
    journeysCompleted,
    milestoneLabel,
    tierLabel,
    nextMilestone,
    journeyDate,
  } = props;
  const imageCacheKey = [
    level,
    totalXp,
    streak,
    journeysCompleted,
    milestoneLabel ?? "",
    tierLabel ?? "",
    nextMilestone?.label ?? "",
    nextMilestone?.hint ?? "",
    journeyDate?.toISOString() ?? "",
  ].join("|");

  useLayoutEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const update = () => {
      const width = node.getBoundingClientRect().width;
      setDisplaySize(width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    imageBlobRef.current = null;
    const imagePromise = (async () => {
      const node = surfaceRef.current;
      if (!node) throw new Error("Achievement surface is not ready yet.");
      return await rasterizeSurfaceToBlob(node);
    })();
    imagePromiseRef.current = imagePromise;
    void imagePromise
      .then((blob) => {
        if (!active) return;
        imageBlobRef.current = blob;
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [imageCacheKey]);

  const getAchievementImage = async () => {
    if (imageBlobRef.current) return imageBlobRef.current;
    const blob = await (imagePromiseRef.current ??
      (async () => {
        const node = surfaceRef.current;
        if (!node) throw new Error("Achievement surface is not ready yet.");
        return await rasterizeSurfaceToBlob(node);
      })());
    imageBlobRef.current = blob;
    return blob;
  };

  const handleDownload = async () => {
    setBusy("download");
    setNotice(null);
    try {
      const fileName = await saveAchievementImage(await getAchievementImage());
      setNotice(
        isTauri() ? `Saved ${fileName} to Downloads.` : "Achievement card downloaded.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not save the achievement card.",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy("share");
    setNotice(null);
    try {
      const blob = imageBlobRef.current ?? (await getAchievementImage());
      const file = new File([blob], "mabuh-ai-quiet-win.png", { type: "image/png" });
      const shareData = {
        title: "My Mabuh-ai quiet win",
        text: `I reached Level ${level} in my Mabuh-ai wellbeing journey.`,
        files: [file],
      };

      if (typeof navigator.share === "function") {
        const canShareFile = !navigator.canShare || navigator.canShare({ files: [file] });
        if (canShareFile) {
          await navigator.share(shareData);
          setNotice("Achievement card shared.");
          return;
        }

        const fileName = await saveAchievementImage(blob);
        await navigator.share({
          title: "My Mabuh-ai quiet win",
          text: `${shareData.text} The square card was saved as ${fileName} so you can attach it.`,
        });
        setNotice("Share sheet opened. The square card is also in Downloads.");
        return;
      }

      await saveAchievementImage(blob);
      setNotice("Sharing is unavailable here, so the square card was downloaded.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice(
        error instanceof Error ? error.message : "Could not share the achievement card.",
      );
    } finally {
      setBusy(null);
    }
  };

  const scale = displaySize > 0 ? displaySize / EXPORT_SIZE : 0;
  const wrapperStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
  };
  const scaledStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    transformOrigin: "top left",
    transform: scale > 0 ? `scale(${scale})` : "scale(0)",
    visibility: scale > 0 ? "visible" : "hidden",
  };

  return (
    <section>
      <p
        style={{
          margin: "0 0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#d8d4eb",
        }}
      >
        <Sparkles style={{ width: 14, height: 14 }} aria-hidden />
        Share your quiet win
      </p>

      <div ref={wrapperRef} style={wrapperStyle}>
        <div ref={surfaceRef} style={scaledStyle}>
          <AchievementCardSurface {...props} />
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleDownload()}
          disabled={busy !== null}
        >
          <Download aria-hidden />
          <span style={{ display: "inline-block", minWidth: "4.5rem" }}>
            {busy === "download" ? "Saving…" : "Download"}
          </span>
        </Button>
        <Button
          type="button"
          onClick={() => void handleShare()}
          disabled={busy !== null}
        >
          <Share2 aria-hidden />
          <span style={{ display: "inline-block", minWidth: "4.5rem" }}>
            {busy === "share" ? "Sharing…" : "Share"}
          </span>
        </Button>
      </div>
      {notice ? (
        <p
          style={{
            marginTop: 10,
            textAlign: "center",
            fontSize: 12,
            color: "rgba(216,212,235,0.7)",
          }}
          role="status"
        >
          {notice}
        </p>
      ) : null}
    </section>
  );
}
