import React from "react";
import { GISFeature } from "./GISFeature";

export const FindHelpScreen: React.FC = () => {
  return (
    <div
      className="screen-enter"
      style={{
        height: "100dvh",
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        background: "#121416",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
      }}
    >
      <GISFeature />
    </div>
  );
};
