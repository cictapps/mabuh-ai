import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MoodType, Suggestion } from "../types";
import { SUGGESTIONS, getMoodMeta } from "../data";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";

interface SuggestionsScreenProps {
  dominantMood: MoodType | null;
  refreshToken?: number | null;
}

interface GuidancePayload {
  dominant_mood: string | null;
  suggestions: Suggestion[];
  insights: { id: string; title: string; body: string; color: string }[];
}

interface BackendMoodEntry {
  id: string;
  mood: string;
  tags: string[];
  journal: string;
  timestamp_ms: number;
}

const isMoodType = (value: string | null): value is MoodType =>
  value === "stressed" || value === "worried" || value === "okay" || value === "calm" || value === "happy";

export const SuggestionsScreen: React.FC<SuggestionsScreenProps> = ({ dominantMood, refreshToken }) => {
  const [backendMood, setBackendMood] = useState<MoodType | null>(dominantMood);
  const [backendSuggestions, setBackendSuggestions] = useState<Suggestion[] | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ count: number; latest: number | null } | null>(null);

  useEffect(() => {
    let active = true;
    const loadGuidance = async () => {
      try {
        const payload = await invoke<GuidancePayload>("get_guidance");
        if (!active) return;
        setBackendMood(isMoodType(payload.dominant_mood) ? payload.dominant_mood : null);
        setBackendSuggestions(payload.suggestions ?? []);
        const entries = await invoke<BackendMoodEntry[]>("list_mood_entries");
        const latest = entries.length
          ? Math.max(...entries.map((e) => e.timestamp_ms))
          : null;
        setDebugInfo({ count: entries.length, latest });
      } catch {
        // Keep frontend fallback when backend is unavailable.
      }
    };
    loadGuidance();
    return () => {
      active = false;
    };
  }, [dominantMood, refreshToken]);

  const mood = backendMood ?? dominantMood ?? "calm";
  const meta = getMoodMeta(mood);
  const suggestions = backendSuggestions ?? SUGGESTIONS[mood] ?? [];

  return (
    <div
      className="screen-enter"
      style={{ padding: "30px 22px 52px", display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.3)",
            marginBottom: 10,
          }}
        >
          Tailored for you
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          Gentle guidance
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Based on your recent emotional pattern
        </p>
      </div>

      {debugInfo && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(188,194,255,0.06)",
            fontSize: 11,
            color: "rgba(188,194,255,0.55)",
          }}
        >
          Backend debug: entries={debugInfo.count} | latest=
          {debugInfo.latest
            ? new Date(debugInfo.latest).toLocaleString()
            : "none"}
        </div>
      )}

      {/* Dominant mood banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 14,
          background: `${meta.color}0f`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: meta.color,
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#e8eaf0", marginBottom: 2 }}>
            Based on your recent mood:{" "}
            <span style={{ color: meta.color }}>{meta.label}</span>
          </p>
          <p style={{ fontSize: 12, color: "rgba(188,194,255,0.38)" }}>
            {meta.definition}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} />
        ))}
      </div>
    </div>
  );
};
