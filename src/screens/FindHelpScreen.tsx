import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { GISFeature } from "./GISFeature";

export const FindHelpScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#121416",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "calc(env(safe-area-inset-top, 0px) + 14px) 16px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: "1px solid rgba(188,194,255,0.06)",
          background: "rgba(16,18,24,0.96)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: "rgba(188,194,255,0.35)",
              marginBottom: 2,
            }}
          >
            Support
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f5f1ff", margin: 0 }}>
            Find Help
          </h1>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/")}>
          Back
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <GISFeature />
      </div>
    </div>
  );
};
