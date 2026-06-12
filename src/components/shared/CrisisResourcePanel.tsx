import { Phone, Siren, X } from "lucide-react";
import { useState } from "react";
import { CRISIS_RESOURCES, type CrisisResource } from "@/lib/crisis";

interface CrisisResourcePanelProps {
  resource: CrisisResource;
  level: "concern" | "imminent";
  onDismiss?: () => void;
}

export const CrisisResourcePanel: React.FC<CrisisResourcePanelProps> = ({
  resource,
  level,
  onDismiss,
}) => {
  const [expanded, setExpanded] = useState(true);
  if (!expanded) return null;

  const isImminent = level === "imminent";
  const accentBg = isImminent
    ? "linear-gradient(160deg, rgba(255,123,123,0.18), rgba(255,185,84,0.10))"
    : "linear-gradient(160deg, rgba(255,185,84,0.14), rgba(188,194,255,0.10))";
  const borderColor = isImminent ? "rgba(255,123,123,0.32)" : "rgba(255,185,84,0.28)";

  return (
    <div
      role={isImminent ? "alert" : "status"}
      aria-live={isImminent ? "assertive" : "polite"}
      style={{
        position: "relative",
        borderRadius: 22,
        padding: "16px 16px 14px",
        border: `1px solid ${borderColor}`,
        background: accentBg,
        color: "#f5e5e5",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: isImminent
          ? "0 28px 80px -40px rgba(255,123,123,0.45)"
          : "0 24px 60px -40px rgba(255,185,84,0.40)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            aria-hidden
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 12,
              background: isImminent ? "rgba(255,123,123,0.22)" : "rgba(255,185,84,0.22)",
              color: isImminent ? "rgba(255,170,170,1)" : "rgba(255,217,154,1)",
              flexShrink: 0,
            }}
          >
            <Siren size={16} />
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.25,
              color: isImminent ? "rgba(255,210,210,1)" : "rgba(255,225,184,1)",
            }}
          >
            {isImminent ? "You don't have to face this alone" : resource.title}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              onDismiss();
            }}
            aria-label="Dismiss crisis resources"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              padding: 4,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        )}
      </header>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {resource.lines.map((line) => (
          <li key={`${line.label}-${line.number}`}>
            <a
              href={line.tel ?? "#"}
              onClick={(e) => {
                if (!line.tel) e.preventDefault();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f7eaea",
                textDecoration: "none",
              }}
            >
              <Phone
                size={14}
                color={isImminent ? "rgba(255,170,170,0.95)" : "rgba(255,217,154,0.95)"}
                aria-hidden
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {line.label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.3,
                    marginTop: 2,
                  }}
                >
                  {line.number}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: isImminent ? "rgba(255,200,200,0.85)" : "rgba(255,225,184,0.85)",
          lineHeight: 1.5,
        }}
      >
        {resource.note}
      </p>

      {Object.keys(CRISIS_RESOURCES).length > 1 && (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.45,
          }}
        >
          {isImminent
            ? "If you are outside the Philippines, contact local emergency services or visit findahelpline.com."
            : "International helplines are available at findahelpline.com."}
        </p>
      )}
    </div>
  );
};

export default CrisisResourcePanel;
