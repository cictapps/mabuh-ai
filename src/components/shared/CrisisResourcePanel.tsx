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
  const accentBg = isImminent ? "var(--crisis-imminent-bg)" : "var(--crisis-concern-bg)";
  const borderColor = isImminent
    ? "var(--crisis-imminent-border)"
    : "var(--crisis-concern-border)";
  const accentShadow = isImminent
    ? "var(--shadow-crisis-imminent)"
    : "var(--shadow-crisis-concern)";

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
        color: "var(--crisis-text)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: accentShadow,
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
              background: isImminent
                ? "var(--crisis-imminent-icon-bg)"
                : "var(--crisis-concern-icon-bg)",
              color: isImminent
                ? "var(--crisis-imminent-icon)"
                : "var(--crisis-concern-icon)",
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
              color: isImminent
                ? "var(--crisis-imminent-title)"
                : "var(--crisis-concern-title)",
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
              color: "var(--crisis-dismiss)",
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
                background: "var(--crisis-line-bg)",
                border: "1px solid var(--crisis-line-border)",
                color: "var(--crisis-line-text)",
                textDecoration: "none",
              }}
            >
              <Phone
                size={14}
                color={
                  isImminent
                    ? "var(--crisis-imminent-icon)"
                    : "var(--crisis-concern-icon)"
                }
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
                    color: "var(--crisis-line-meta)",
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
          color: isImminent
            ? "var(--crisis-imminent-note)"
            : "var(--crisis-concern-note)",
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
            color: "var(--crisis-footnote)",
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
