import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User as UserIcon,
  Users,
  Hospital,
  GraduationCap,
  HeartHandshake,
  Phone,
  PhoneCall,
  Map as MapIcon,
  Bookmark,
  BadgeCheck,
  MapPin,
  Siren,
  Locate,
  Satellite,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
  Navigation2,
  Ruler,
  Mail,
  ClipboardCopy,
  Globe,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { useThemePreference } from "../hooks/useThemePreference";

// ── Types ──────────────────────────────────────────────────────────────────────
import {
  loadProviders,
  loadHotlines,
  type ProviderRecord,
  type HotlineRecord,
} from "../data/providers";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";
import { useConnectivity } from "../lib/connectivity";

// Legacy aliases used throughout this file. They map 1:1 to the
// typed registry, so the existing JSX still works. The "verified" flag
// in the old shape is now derived from verification.lastVerifiedAt.
type ProviderLocation = ProviderRecord["locations"] extends (infer L)[]
  ? L
  : { label: string; lat: number; lng: number };

interface Provider {
  id: string;
  name: string;
  type: string;
  clinic: string;
  city: string;
  tags: string[];
  phone?: string | null;
  email?: string | null;
  fb?: string | null;
  phone2?: string | null;
  verified: boolean;
  lat?: number;
  lng?: number;
  hours?: string;
  coverage?: string;
  locations?: ProviderLocation[];
}

function toLegacy(p: ProviderRecord): Provider {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    clinic: p.clinic,
    city: p.city,
    tags: p.tags,
    phone: p.phone,
    email: p.email,
    fb: p.fb,
    phone2: p.phone2,
    verified: !!p.verification.lastVerifiedAt,
    lat: p.lat,
    lng: p.lng,
    hours: p.hours?.display,
    coverage: p.coverage,
    locations: p.locations,
  };
}

function hotlineToLegacy(h: HotlineRecord): Provider {
  return {
    id: h.id,
    name: h.name,
    type: h.type,
    clinic: h.clinic,
    city: h.city,
    tags: h.tags,
    phone: h.phone,
    fb: h.fb,
    verified: !!h.verification.lastVerifiedAt,
    hours: h.hours?.display,
    coverage: h.coverage,
  };
}

type TabType = "all" | "psychologist" | "community" | "support" | "hotline";
type MapLayer = "street" | "satellite";
type SortType = "default" | "distance";
interface UserLocation {
  lat: number;
  lng: number;
}

// ── Icon map — lucide-react components, sized inline at the call site ─────────
const G = {
  search: Search,
  person: UserIcon,
  group: Users,
  hospital: Hospital,
  campus: GraduationCap,
  support: HeartHandshake,
  hotline: PhoneCall,
  phone: Phone,
  map: MapIcon,
  bookmark: Bookmark,
  bookmarkOff: Bookmark,
  verified: BadgeCheck,
  pin: MapPin,
  sos: Siren,
  nearMe: Locate,
  street: MapIcon,
  satellite: Satellite,
  collapse: ChevronUp,
  expand: ChevronDown,
  close: XIcon,
  directions: Navigation2,
  distance: Ruler,
  you: MapPin,
};

// ── Colors ─────────────────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  teal: { bg: "rgba(109,186,132,0.15)", text: "#6dba84" },
  amber: { bg: "rgba(224,133,60,0.15)", text: "#e0853c" },
  red: { bg: "rgba(224,92,110,0.15)", text: "#e05c6e" },
  blue: { bg: "var(--surface-violet-high)", text: "var(--primary)" },
};
function tagColor(tag: string) {
  if (
    ["Crisis", "24/7", "Suicide", "MHPSS", "Trauma", "PFA", "Peer", "Youth"].some((k) =>
      tag.includes(k),
    )
  )
    return TAG_COLORS.teal;
  if (
    ["Family", "Parenting", "Outreach", "Community", "Drug", "Women", "Children"].some(
      (k) => tag.includes(k),
    )
  )
    return TAG_COLORS.amber;
  if (["Emergency", "Acute"].some((k) => tag.includes(k))) return TAG_COLORS.red;
  return TAG_COLORS.blue;
}
function typeGlyph(type: string) {
  if (type === "Psychiatrist") return G.person;
  if (type.includes("Campus")) return G.campus;
  if (type === "Hospital") return G.hospital;
  if (type === "Hotline") return G.hotline;
  return G.support;
}
function typeColor(type: string) {
  if (type === "Psychiatrist") return "var(--primary)";
  if (type.includes("Campus")) return "#6dba84";
  if (type === "NGO" || type === "Clinic") return "#e0853c";
  return "var(--primary)";
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371,
    dLat = ((lat2 - lat1) * Math.PI) / 180,
    dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Database ───────────────────────────────────────────────────────────────────
const DB_PSY: Provider[] = loadProviders()
  .filter((p) => p.category === "psychiatrist")
  .map(toLegacy);
const DB_COMM: Provider[] = loadProviders()
  .filter((p) => p.category === "community")
  .map(toLegacy);
const DB_SUP: Provider[] = loadProviders()
  .filter((p) => p.category === "support")
  .map(toLegacy);
const DB_HOT: Provider[] = loadHotlines().map(hotlineToLegacy);

const TILES_STREET = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attr: "© OpenStreetMap, © CARTO",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: "© OpenStreetMap, © CARTO",
  },
};

const TILES_SATELLITE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attr: "© Esri",
};

function estimateTime(km: number): string {
  const walkMin = Math.round((km / 5) * 60);
  const driveMin = Math.round((km / 40) * 60);
  if (km < 0.5) return `~${walkMin} min walk`;
  if (km < 3) return `~${walkMin} min walk · ~${driveMin} min drive`;
  return `~${driveMin} min drive`;
}

function createProviderPinIcon(color: string, letter: string) {
  // Using a divIcon lets Leaflet render the pin as inline DOM, so the
  // color is read from CSS custom properties set on the wrapper. This
  // makes the pin theme-aware: the find-help-screen tokens above
  // resolve --pin-color, --pin-stroke, --pin-letter, and --pin-shine
  // for either the cream light theme or the dark twilight theme.
  const html = `
    <div class="find-help-pin" style="--pin-color:${color};">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <path
          d="M18 1.5C9.16 1.5 2 8.66 2 17.5c0 11.45 13.34 23.88 14.86 25.26a1.7 1.7 0 0 0 2.28 0C20.66 41.38 34 28.95 34 17.5 34 8.66 26.84 1.5 18 1.5Z"
          fill="${color}"
          stroke="var(--pin-stroke)"
          stroke-opacity="0.85"
          stroke-width="2"
        />
        <circle cx="18" cy="17.5" r="9.5" fill="var(--pin-shine)" />
        <text
          x="18"
          y="21.5"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="12"
          font-weight="700"
          fill="var(--pin-letter)"
        >${letter}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "find-help-pin-wrap",
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  });
}

// ── Live Map ───────────────────────────────────────────────────────────────────
function LiveMap({
  providers,
  focusProvider,
  userLocation,
  mapLayer,
  theme,
  onCollapse,
  onResetFocus,
}: {
  providers: Provider[];
  focusProvider: Provider | null;
  userLocation: UserLocation | null;
  mapLayer: MapLayer;
  theme: "light" | "dark";
  onCollapse?: () => void;
  onResetFocus?: (() => void) | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!mapRef.current || ready.current) return;
    ready.current = true;
    leafletRef.current = L;
    const map = L.map(mapRef.current!, {
      center: [10.78, 122.65],
      zoom: 9,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const initialLayer = mapLayer === "satellite" ? TILES_SATELLITE : TILES_STREET[theme];
    tileLayerRef.current = L.tileLayer(initialLayer.url, {
      attribution: initialLayer.attr,
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    rebuildMarkers(L, map, providers);
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        ready.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    rebuildMarkers(L, map, providers);
  }, [providers]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map || !focusProvider?.lat || !focusProvider?.lng) return;
    if (userLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [focusProvider.lat, focusProvider.lng],
      );
      map.fitBounds(bounds.pad(0.3), { animate: true, duration: 1.2 });
    } else {
      map.flyTo([focusProvider.lat, focusProvider.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    }
    const marker = markersRef.current.get(focusProvider.id);
    if (marker) setTimeout(() => marker.openPopup(), 1400);
  }, [focusProvider, userLocation]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);
    const layer = mapLayer === "satellite" ? TILES_SATELLITE : TILES_STREET[theme];
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attr,
      maxZoom: 19,
    }).addTo(map);
  }, [mapLayer, theme]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map || !userLocation) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;border-radius:50%;background:var(--find-help-user-dot);border:3px solid var(--background);box-shadow:0 0 0 4px var(--find-help-user-dot-ring);"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:var(--font-sans);font-weight:600;font-size:12px;color:var(--find-help-text-strong);">You are here</div>`,
      );
    map.flyTo([userLocation.lat, userLocation.lng], 13, { animate: true, duration: 1.5 });
  }, [userLocation]);

  function pinColor(p: Provider) {
    if (p.type === "Psychiatrist") return "var(--find-help-pin-psychiatrist)";
    if (p.type === "Hotline") return "var(--find-help-pin-hotline)";
    if (p.type === "Hospital" || p.type === "Community Program")
      return "var(--find-help-pin-hospital)";
    if (p.type.includes("Campus")) return "var(--find-help-pin-campus)";
    return "var(--find-help-pin-community)";
  }

  function rebuildMarkers(L: any, map: any, list: Provider[]) {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current.clear();

    list
      .filter((p) => p.lat && p.lng)
      .forEach((p) => {
        const color = pinColor(p);
        const letter =
          p.type === "Psychiatrist"
            ? "P"
            : p.type.includes("Campus")
              ? "C"
              : p.type === "Hospital"
                ? "H"
                : p.type === "Hotline"
                  ? "S"
                  : "•";
        const icon = createProviderPinIcon(color, letter);
        const marker = L.marker([p.lat!, p.lng!], { icon }).addTo(map);
        marker.bindPopup(
          `
        <div style="font-family:var(--font-sans);min-width:190px;">
          <div class="find-help-popup__title">${escapeHtml(p.name)}</div>
          <div class="find-help-popup__meta">${escapeHtml(p.type)}</div>
          ${p.clinic ? `<div class="find-help-popup__clinic">${escapeHtml(p.clinic)}</div>` : ""}
          <div class="find-help-popup__actions">
            ${p.phone ? `<a class="find-help-popup__action find-help-popup__action--call" href="tel:${p.phone}">Call</a>` : ""}
            ${p.lat && p.lng ? `<a class="find-help-popup__action find-help-popup__action--directions" href="https://maps.google.com/?saddr=Current+Location&daddr=${p.lat},${p.lng}&dirflg=d" target="_blank" rel="noreferrer">Directions</a>` : ""}
          </div>
        </div>`,
          { maxWidth: 220, className: "find-help-popup" },
        );
        markersRef.current.set(p.id, marker);
      });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          background: "var(--find-help-surface-low)",
        }}
      />
      {(onCollapse || onResetFocus) && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 1000,
            display: "flex",
            gap: 6,
          }}
        >
          {onResetFocus && (
            <button
              onClick={onResetFocus}
              aria-label="Reset focused provider"
              style={{
                height: 30,
                padding: "0 10px",
                borderRadius: 8,
                background: "var(--find-help-pill-bg)",
                border: "1px solid var(--find-help-pill-border)",
                color: "var(--text-on-surface-strong)",
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <G.close size={12} /> Reset
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              aria-label="Collapse map"
              style={{
                height: 30,
                padding: "0 10px",
                borderRadius: 8,
                background: "var(--find-help-pill-bg)",
                border: "1px solid var(--find-help-pill-border)",
                color: "var(--find-help-pill-text)",
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <G.collapse size={12} /> Collapse
            </button>
          )}
        </div>
      )}
      <div
        aria-label="Region 6, Western Visayas"
        style={{
          position: "absolute",
          left: 10,
          bottom: 12,
          zIndex: 1000,
          height: 30,
          padding: "0 10px",
          borderRadius: 8,
          background: "var(--find-help-pill-bg)",
          border: "1px solid var(--find-help-pill-border)",
          color: "var(--find-help-pill-text)",
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          pointerEvents: "none",
          maxWidth: "calc(100% - 20px)",
        }}
      >
        <G.pin size={12} color="var(--primary)" />
        <span
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          Region 6 · Western Visayas
        </span>
      </div>
    </div>
  );
}

// ── Tag chip ───────────────────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  const c = tagColor(label);
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        fontSize: 10,
        padding: "3px 8px",
        borderRadius: 20,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

// ── Provider Card ──────────────────────────────────────────────────────────────
function ProviderCard({
  e,
  saved,
  onSave,
  onFocus,
  onDetail,
  isFocused,
  distKm,
}: {
  e: Provider;
  saved: boolean;
  onSave: (id: string) => void;
  onFocus: (p: Provider) => void;
  onDetail: (p: Provider) => void;
  isFocused: boolean;
  distKm?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (isFocused) setExpanded(true);
  }, [isFocused]);
  const hasMap = !!(e.lat && e.lng);
  const tc = typeColor(e.type);

  const TypeIcon = typeGlyph(e.type);

  return (
    <div
      style={{
        background: isFocused ? "var(--find-help-focus-bg)" : "var(--find-help-surface)",
        margin: "0 0 1px",
        padding: "13px 16px",
        borderBottom: "1px solid var(--find-help-soft-divider)",
        borderLeft: isFocused ? "2px solid var(--primary)" : "2px solid transparent",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={() => {
        setExpanded((x) => !x);
        if (hasMap) onFocus(e);
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            flexShrink: 0,
            background: isFocused
              ? `${tc}22`
              : e.type === "Psychiatrist"
                ? "var(--find-help-icon-violet-tint-bg)"
                : e.type.includes("Campus")
                  ? "var(--find-help-icon-hospital-tint-bg)"
                  : e.type === "Hospital"
                    ? "var(--find-help-icon-hospital-tint-bg)"
                    : e.type === "NGO" || e.type === "Clinic"
                      ? "var(--find-help-icon-ngo-tint-bg)"
                      : "var(--find-help-icon-violet-tint-bg)",
            border: `1px solid ${tc}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tc,
            transition: "all 0.2s",
          }}
        >
          <TypeIcon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--find-help-text-strong)",
              lineHeight: 1.3,
              marginBottom: 2,
            }}
          >
            {e.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: tc,
              fontWeight: 500,
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>
              {e.type} · {e.city}
            </span>
            {distKm !== undefined && (
              <span
                style={{
                  color: "var(--text-on-surface-strong)",
                  fontWeight: 400,
                  fontSize: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <G.distance size={10} /> {fmtDist(distKm)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {e.tags.slice(0, 2).map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {hasMap && (
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onFocus(e);
                }}
                aria-label="Show on map"
                title="Show on map"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: isFocused ? "var(--surface-violet-medium)" : "transparent",
                  border: "none",
                  color: isFocused
                    ? "var(--primary)"
                    : "var(--find-help-icon-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(ev) => {
                  if (!isFocused) {
                    ev.currentTarget.style.background = "var(--surface-violet-medium)";
                    ev.currentTarget.style.color = "var(--find-help-icon-muted)";
                  }
                }}
                onMouseLeave={(ev) => {
                  if (!isFocused) {
                    ev.currentTarget.style.background = "transparent";
                    ev.currentTarget.style.color = "var(--find-help-icon-muted)";
                  }
                }}
              >
                <G.pin size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                onSave(e.id);
              }}
              aria-label={saved ? "Remove from saved" : "Save provider"}
              aria-pressed={saved}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "transparent",
                border: "none",
                color: saved ? "var(--primary)" : "var(--find-help-icon-muted)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(ev) => {
                if (!saved) {
                  ev.currentTarget.style.background = "var(--surface-violet-medium)";
                  ev.currentTarget.style.color = "var(--find-help-icon-muted)";
                }
              }}
              onMouseLeave={(ev) => {
                if (!saved) {
                  ev.currentTarget.style.background = "transparent";
                  ev.currentTarget.style.color = "var(--find-help-icon-muted)";
                }
              }}
            >
              <G.bookmark size={16} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          {e.verified && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 9,
                color: "var(--find-help-tip-text)",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              <G.verified size={10} /> VERIFIED
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--surface-violet-medium)",
          }}
        >
          {/* Clinic info */}
          {e.clinic ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-on-surface-strong)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <G.hospital size={12} /> {e.clinic}
            </div>
          ) : (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-on-surface-strong)",
                marginBottom: 10,
                fontStyle: "italic",
              }}
            >
              Contact via walk-in or referral
            </div>
          )}
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {e.phone && e.phone2 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-on-surface-strong)",
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Select number to call:
                </div>
                <a
                  href={`tel:${e.phone}`}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    background: "var(--surface-violet-medium)",
                    color: "var(--primary)",
                    border: "1px solid var(--border-violet-medium)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    textDecoration: "none",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <G.phone size={12} /> {e.phone}
                </a>
                <a
                  href={`tel:${e.phone2}`}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    background: "var(--surface-violet-low)",
                    color: "var(--find-help-icon-muted)",
                    border: "1px solid var(--border-violet-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    textDecoration: "none",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <G.phone size={12} /> {e.phone2}
                </a>
              </div>
            ) : e.phone ? (
              <a
                href={`tel:${e.phone}`}
                onClick={(ev) => ev.stopPropagation()}
                style={{
                  flex: 1,
                  minWidth: 80,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--surface-violet-medium)",
                  color: "var(--primary)",
                  border: "1px solid var(--border-violet-medium)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <G.phone size={14} /> Call
              </a>
            ) : (
              <div
                style={{
                  flex: 1,
                  minWidth: 80,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--surface-violet-low)",
                  border: "1px solid var(--border-violet-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "var(--text-on-surface-strong)",
                }}
              >
                No number
              </div>
            )}
            {/* Share button */}
            <button
              onClick={async (ev) => {
                ev.stopPropagation();
                const text = [e.name, e.type, e.clinic, e.city, e.phone]
                  .filter(Boolean)
                  .join(" · ");
                try {
                  await navigator.clipboard.writeText(text);
                } catch {
                  // Clipboard access may be unavailable in the WebView.
                }
                const btn = ev.currentTarget as HTMLButtonElement;
                const orig = btn.innerHTML;
                btn.innerHTML = "Copied!";
                setTimeout(() => {
                  btn.innerHTML = orig;
                }, 1500);
              }}
              aria-label="Copy provider info"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--surface-violet-medium)",
                color: "var(--text-on-surface-strong)",
                border: "1px solid var(--border-violet-medium)",
                cursor: "pointer",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardCopy size={14} />
            </button>
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                onDetail(e);
              }}
              style={{
                flex: 1,
                minWidth: 80,
                height: 36,
                borderRadius: 8,
                background: "var(--surface-violet-high)",
                color: "var(--primary)",
                border: "1px solid var(--border-violet-high)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hotline Card ───────────────────────────────────────────────────────────────
function HotlineCard({ h }: { h: Provider }) {
  return (
    <div
      style={{
        background: "var(--find-help-hotline-bg)",
        margin: "0 0 1px",
        padding: "12px 16px",
        borderBottom: "1px solid var(--find-help-hotline-border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(160, 68, 68, 0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-danger-strong)",
          flexShrink: 0,
        }}
      >
        <G.sos size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--find-help-text-strong)",
            marginBottom: 2,
          }}
        >
          {h.name}
        </div>
        <div style={{ fontSize: 10, color: "var(--find-help-text-muted)" }}>
          {h.phone} · {h.coverage} · {h.hours}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {h.fb && (
          <a
            href={h.fb}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--find-help-fb-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              fontSize: 11,
              color: "var(--find-help-fb-text)",
              fontWeight: 700,
            }}
          >
            fb
          </a>
        )}
        {h.phone && (
          <a
            href={`tel:${h.phone}`}
            aria-label="Call hotline"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--text-danger-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              color: "var(--crisis-line-text)",
            }}
          >
            <G.phone size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

// ── SOS Modal ─────────────────────────────────────────────────────────────────
function SOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          background: "var(--find-help-sos-bg)",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 44px",
          border: "1px solid rgba(160, 68, 68, 0.32)",
          borderBottom: "none",
          color: "var(--find-help-sos-text)",
          boxShadow: "var(--shadow-card-soft)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--border-violet-medium)",
            margin: "0 auto 20px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(160, 68, 68, 0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-danger-strong)",
            }}
          >
            <G.sos size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-danger-strong)",
              }}
            >
              Need immediate help?
            </div>
            <div
              style={{ fontSize: 12, color: "var(--find-help-sos-muted)", marginTop: 2 }}
            >
              Call any crisis line now
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DB_HOT.map((h) => (
            <a
              key={h.id}
              href={`tel:${h.phone}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--crisis-line-bg)",
                border: "1px solid rgba(160, 68, 68, 0.22)",
                borderRadius: 12,
                padding: "12px 16px",
                textDecoration: "none",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--find-help-text-strong)",
                  }}
                >
                  {h.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--find-help-sos-muted)",
                    marginTop: 2,
                  }}
                >
                  {h.phone} · {h.coverage}
                </div>
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "var(--text-danger-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--crisis-line-text)",
                  flexShrink: 0,
                }}
              >
                <G.phone size={16} />
              </div>
            </a>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "14px",
            borderRadius: 12,
            background: "var(--surface-violet-low)",
            border: "1px solid var(--border-violet-soft)",
            color: "var(--text-on-surface-strong)",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Detail Screen ──────────────────────────────────────────────────────────────
function DetailScreen({
  e,
  onClose,
  distKm,
  userLocation,
  onFlyTo,
  online,
}: {
  e: Provider;
  onClose: () => void;
  distKm?: number;
  userLocation: any;
  onFlyTo: (lat: number, lng: number) => void;
  online: boolean;
}) {
  const [selectedLocIdx, setSelectedLocIdx] = useState(0);
  const tc = typeColor(e.type);
  const C = {
    bg: "var(--find-help-screen-bg)",
    surface: "var(--find-help-surface)",
    border: "var(--find-help-border-soft)",
    borderStrong: "var(--find-help-border-strong)",
    text: "var(--find-help-text)",
    textStrong: "var(--find-help-text-strong)",
    muted: "var(--find-help-text-muted)",
    accent: "var(--primary)",
  };
  const hasMultiLoc = !!(e.locations && e.locations.length > 1);
  const selectedLoc = hasMultiLoc ? e.locations![selectedLocIdx] : null;
  const activeLat = selectedLoc?.lat ?? e.lat;
  const activeLng = selectedLoc?.lng ?? e.lng;
  const TypeIcon = typeGlyph(e.type);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            marginBottom: 16,
          }}
        >
          <ChevronLeft size={14} /> Back to results
        </button>
        {/* Avatar */}
        <div
          style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "var(--surface-violet-medium)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tc,
              flexShrink: 0,
              border: `1.5px solid var(--surface-violet-medium)`,
            }}
          >
            <TypeIcon size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: C.text,
                lineHeight: 1.3,
                marginBottom: 4,
              }}
            >
              {e.name}
            </div>
            <div style={{ fontSize: 12, color: tc, fontWeight: 600, marginBottom: 6 }}>
              {e.type}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {e.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "0 16px" } as React.CSSProperties}
      >
        {/* Distance card — only when location known */}
        {distKm !== undefined && (
          <div
            style={{
              background: "var(--find-help-distance-bg)",
              border: "1px solid var(--find-help-distance-border)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <G.pin size={20} color="var(--find-help-distance-text)" />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--find-help-distance-text)",
                }}
              >
                {fmtDist(distKm)} away
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--find-help-distance-meta)",
                  marginTop: 1,
                }}
              >
                {estimateTime(distKm)}
              </div>
            </div>
          </div>
        )}

        {/* Info rows */}
        <div
          style={{
            background: C.surface,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {e.clinic && (
            <div
              style={{
                padding: "13px 16px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <G.hospital size={14} color={C.muted} />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Clinic / Location
                </div>
                <div style={{ fontSize: 13, color: C.textStrong }}>{e.clinic}</div>
              </div>
            </div>
          )}
          <div
            style={{
              padding: "13px 16px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <G.pin size={14} color={C.muted} />
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                City
              </div>
              <div style={{ fontSize: 13, color: C.textStrong }}>{e.city}</div>
            </div>
          </div>
          {e.phone && (
            <div
              style={{
                padding: "13px 16px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <G.phone size={14} color={C.muted} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Phone
                </div>
                <div style={{ fontSize: 13, color: C.textStrong }}>{e.phone}</div>
                {e.phone2 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--find-help-icon-muted)",
                      marginTop: 3,
                    }}
                  >
                    {e.phone2}
                  </div>
                )}
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard?.writeText(
                    e.phone! + (e.phone2 ? " / " + e.phone2 : ""),
                  );
                }}
                style={{
                  background: "var(--surface-violet-medium)",
                  border: "1px solid var(--border-violet-medium)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 10,
                  color: C.accent,
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                Copy
              </button>
            </div>
          )}
          {e.email && (
            <div
              style={{
                padding: "13px 16px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <Mail size={14} color={C.muted} />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Email
                </div>
                <div style={{ fontSize: 12, color: C.textStrong }}>{e.email}</div>
              </div>
            </div>
          )}
          {e.verified && (
            <div
              style={{
                padding: "13px 16px",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <G.verified size={14} color="#6dba84" />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Verification
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--find-help-tip-text)",
                    fontWeight: 600,
                  }}
                >
                  Verified provider
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location picker for multi-clinic providers */}
        {hasMultiLoc && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <G.pin size={11} /> Select Clinic Location
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {e.locations!.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedLocIdx(idx);
                    onFlyTo(loc.lat, loc.lng);
                  }}
                  style={{
                    background:
                      selectedLocIdx === idx ? "var(--surface-violet-high)" : C.surface,
                    border: `1.5px solid ${selectedLocIdx === idx ? "var(--find-help-icon-muted)" : C.border}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        selectedLocIdx === idx
                          ? "var(--primary)"
                          : "var(--surface-violet-icon)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: selectedLocIdx === idx ? "var(--background)" : C.muted,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: selectedLocIdx === idx ? C.text : C.muted,
                        lineHeight: 1.3,
                      }}
                    >
                      {loc.label}
                    </div>
                    {userLocation && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--find-help-distance-meta)",
                          marginTop: 2,
                        }}
                      >
                        {fmtDist(
                          haversineKm(
                            userLocation.lat,
                            userLocation.lng,
                            loc.lat,
                            loc.lng,
                          ),
                        )}{" "}
                        away
                        {selectedLocIdx === idx && " · selected"}
                      </div>
                    )}
                  </div>
                  {selectedLocIdx === idx && (
                    <G.verified size={13} color="var(--primary)" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}
        >
          {/* Share row */}
          <button
            onClick={async () => {
              const parts = [e.name, e.type, e.clinic, e.city, e.phone, e.email].filter(
                Boolean,
              );
              const text = parts.join(" · ");
              try {
                await navigator.clipboard.writeText(text);
              } catch {
                // Clipboard access may be unavailable in the WebView.
              }
              const btn = document.activeElement as HTMLButtonElement;
              if (btn) {
                const o = btn.textContent;
                btn.textContent = "Copied to clipboard!";
                setTimeout(() => {
                  btn.textContent = o;
                }, 1800);
              }
            }}
            style={{
              height: 40,
              borderRadius: 10,
              background: "var(--surface-violet-medium)",
              color: "var(--find-help-icon-muted)",
              border: "1px solid var(--border-violet-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <ClipboardCopy size={13} /> Copy provider info
          </button>
          {e.phone && e.phone2 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Select number to call:
              </div>
              <a
                href={`tel:${e.phone}`}
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: "var(--surface-violet-medium)",
                  color: C.accent,
                  border: "1px solid var(--border-violet-high)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <G.phone size={16} /> {e.phone}
              </a>
              <a
                href={`tel:${e.phone2}`}
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: "var(--surface-violet-medium)",
                  color: "var(--find-help-icon-muted)",
                  border: "1px solid var(--border-violet-medium)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <G.phone size={16} /> {e.phone2}
              </a>
            </div>
          ) : e.phone ? (
            <a
              href={`tel:${e.phone}`}
              style={{
                height: 48,
                borderRadius: 12,
                background: "var(--surface-violet-medium)",
                color: C.accent,
                border: "1px solid var(--border-violet-high)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <G.phone size={16} /> Call {e.name.split(" ").slice(0, 2).join(" ")}
            </a>
          ) : (
            <div
              style={{
                height: 48,
                borderRadius: 12,
                background: "var(--surface-violet-low)",
                border: "1px solid var(--border-violet-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "var(--text-on-surface-strong)",
              }}
            >
              No phone number — contact via walk-in or referral
            </div>
          )}
          {activeLat && activeLng && online && (
            <a
              href={`https://maps.google.com/?saddr=Current+Location&daddr=${activeLat},${activeLng}&dirflg=d`}
              target="_blank"
              rel="noreferrer"
              style={{
                height: 48,
                borderRadius: 12,
                background: "var(--find-help-link-blue-soft)",
                color: "var(--find-help-link-blue-text)",
                border: "1px solid var(--find-help-link-blue-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <G.directions size={16} /> Get Directions
              {selectedLoc && (
                <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>
                  · {selectedLoc.label.split(",")[0]}
                </span>
              )}
            </a>
          )}
          {activeLat && activeLng && !online && (
            <div className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-violet-soft)] bg-[var(--surface-violet-low)] text-sm text-[color:var(--text-kicker)]">
              <G.directions size={16} /> Directions need internet
            </div>
          )}
          {e.fb && (
            <a
              href={e.fb}
              target="_blank"
              rel="noreferrer"
              style={{
                height: 48,
                borderRadius: 12,
                background: "var(--find-help-fb-bg)",
                color: "var(--find-help-fb-text)",
                border: "1px solid var(--find-help-fb-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Globe size={16} /> View Facebook Page
            </a>
          )}
          {e.email && (
            <a
              href={`mailto:${e.email}`}
              style={{
                height: 48,
                borderRadius: 12,
                background: "var(--surface-violet-medium)",
                color: C.accent,
                border: "1px solid var(--border-violet-medium)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Mail size={16} /> Send Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Recently Viewed ────────────────────────────────────────────────────────────
function RecentlyViewed({
  ids,
  allProviders,
  onSelect,
}: {
  ids: string[];
  allProviders: Provider[];
  onSelect: (p: Provider) => void;
}) {
  if (ids.length === 0) return null;
  const C = {
    surface: "var(--find-help-surface)",
    border: "var(--find-help-border-soft)",
    muted: "var(--find-help-text-muted)",
    accent: "var(--primary)",
  };
  const recent = ids
    .map((id) => allProviders.find((p) => p.id === id))
    .filter(Boolean) as Provider[];

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          padding: "14px 16px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Recently Viewed
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>{recent.length}</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "0 16px 12px",
          scrollbarWidth: "none",
        }}
      >
        {recent.map((p) => {
          const TypeIcon = typeGlyph(p.type);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                flexShrink: 0,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                minWidth: 140,
                maxWidth: 160,
              }}
            >
              <div style={{ color: typeColor(p.type), marginBottom: 4 }}>
                <TypeIcon size={16} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--find-help-text-strong)",
                  lineHeight: 1.3,
                  marginBottom: 2,
                }}
              >
                {p.name.split(",")[0]}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{p.city}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Saved Screen ───────────────────────────────────────────────────────────────
function SavedScreen({
  savedIds,
  allProviders,
  onClose,
  onDetail,
  onFocus,
  getDistance,
}: {
  savedIds: Set<string>;
  allProviders: Provider[];
  onClose: () => void;
  onDetail: (p: Provider) => void;
  onFocus: (p: Provider) => void;
  getDistance: (p: Provider) => number | undefined;
}) {
  const C = {
    bg: "var(--find-help-screen-bg)",
    surface: "var(--find-help-surface)",
    border: "var(--find-help-border-soft)",
    borderStrong: "var(--find-help-border-strong)",
    text: "var(--find-help-text)",
    textStrong: "var(--find-help-text-strong)",
    muted: "var(--find-help-text-muted)",
    accent: "var(--primary)",
  };
  const saved = allProviders.filter((p) => savedIds.has(p.id));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 16px 12px",
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            marginBottom: 14,
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textStrong, margin: 0 }}>
              Saved Resources
            </h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
              {saved.length} saved provider{saved.length !== 1 ? "s" : ""}
            </p>
          </div>
          <G.bookmark size={22} color={C.accent} fill="currentColor" />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" } as React.CSSProperties}>
        {saved.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <G.bookmark
              size={36}
              color={C.muted}
              style={{ marginBottom: 12, opacity: 0.3 }}
            />
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 6 }}>
              No saved resources yet
            </div>
            <div style={{ fontSize: 12, color: "var(--text-on-surface-strong)" }}>
              Tap the bookmark on any provider to save them here
            </div>
          </div>
        ) : (
          saved.map((p) => {
            const tc = typeColor(p.type);
            const dist = getDistance(p);
            const TypeIcon = typeGlyph(p.type);
            return (
              <div
                key={p.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
                onClick={() => {
                  onDetail(p);
                  onFocus(p);
                  onClose();
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 11,
                    flexShrink: 0,
                    background:
                      p.type === "Psychiatrist"
                        ? "var(--find-help-icon-violet-tint-bg)"
                        : p.type.includes("Campus") || p.type === "Hospital"
                          ? "var(--find-help-icon-hospital-tint-bg)"
                          : "var(--find-help-icon-ngo-tint-bg)",
                    border: `1px solid ${tc}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: tc,
                  }}
                >
                  <TypeIcon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.textStrong,
                      marginBottom: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{ fontSize: 11, color: tc, fontWeight: 500, marginBottom: 3 }}
                  >
                    {p.type} · {p.city}
                    {dist !== undefined && (
                      <span
                        style={{
                          color: "var(--text-on-surface-strong)",
                          fontWeight: 400,
                        }}
                      >
                        {" "}
                        · {fmtDist(dist)}
                      </span>
                    )}
                  </div>
                  {p.phone && (
                    <div style={{ fontSize: 11, color: "var(--text-on-surface-strong)" }}>
                      {p.phone}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-end",
                  }}
                >
                  {p.verified && (
                    <G.verified size={11} color="var(--find-help-tip-text)" />
                  )}
                  <ChevronRight size={14} color="var(--find-help-icon-muted)" />
                </div>
              </div>
            );
          })
        )}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px 8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-on-surface-strong)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{count}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
type SheetState = "collapsed" | "peek" | "expanded";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: "0px",
  peek: "92px",
  expanded: "min(78dvh, 640px)",
};

export function GISFeature() {
  const navigate = useNavigate();
  const online = useConnectivity();
  const { resolved: resolvedTheme } = useThemePreference();
  const [tab, setTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [focusProvider, setFocusProvider] = useState<Provider | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>("street");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [sosOpen, setSosOpen] = useState(false);
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [sheet, setSheet] = useState<SheetState>("peek");
  const reduceMotion = useReducedMotion();

  const openDetail = useCallback((p: Provider) => {
    setDetailProvider(p);
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== p.id);
      return [p.id, ...filtered].slice(0, 6);
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNearMe = useCallback(() => {
    if (sortBy === "distance" && userLocation) {
      setSortBy("default");
      setUserLocation(null);
      setFocusProvider(null);
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy("distance");
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("Could not get your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [sortBy, userLocation]);

  const getDistance = useCallback(
    (p: Provider): number | undefined => {
      if (!userLocation || !p.lat || !p.lng) return undefined;
      return haversineKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
    },
    [userLocation],
  );

  // Sort all sections by distance when Near Me is active
  const sortList = useCallback(
    (arr: Provider[]) => {
      if (sortBy !== "distance" || !userLocation) return arr;
      return [...arr].sort(
        (a, b) => (getDistance(a) ?? 99999) - (getDistance(b) ?? 99999),
      );
    },
    [sortBy, userLocation, getDistance],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    function f(arr: Provider[]) {
      const result = arr.filter((e) => {
        const mq =
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.clinic.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q));
        return mq;
      });
      return sortList(result);
    }
    return { psy: f(DB_PSY), comm: f(DB_COMM), sup: f(DB_SUP) };
  }, [search, sortList]);

  const mapProviders = useMemo(() => {
    if (tab === "hotline") return [];
    if (tab === "psychologist") return filtered.psy;
    if (tab === "community") return filtered.comm;
    if (tab === "support") return filtered.sup;
    return [...filtered.psy, ...filtered.comm, ...filtered.sup];
  }, [tab, filtered]);

  const tabs: { key: TabType; label: string; glyph: LucideIcon }[] = [
    { key: "all", label: "All", glyph: LayoutGrid },
    { key: "psychologist", label: "Psychologists", glyph: G.person },
    { key: "community", label: "Group", glyph: G.group },
    { key: "support", label: "Support", glyph: G.support },
    { key: "hotline", label: "Hotlines", glyph: G.sos },
  ];

  const C = {
    bg: "var(--find-help-screen-bg)",
    surface: "var(--find-help-surface)",
    border: "var(--find-help-border-soft)",
    borderStrong: "var(--find-help-border-strong)",
    text: "var(--find-help-text)",
    textStrong: "var(--find-help-text-strong)",
    muted: "var(--find-help-text-muted)",
    accent: "var(--primary)",
  };
  const isNearMode = sortBy === "distance" && !!userLocation;
  const allProviders = [...DB_PSY, ...DB_COMM, ...DB_SUP];

  return (
    <div
      style={{
        background: C.bg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {sosOpen && <SOSModal onClose={() => setSosOpen(false)} />}
      {savedOpen && (
        <SavedScreen
          savedIds={saved}
          allProviders={allProviders}
          onClose={() => setSavedOpen(false)}
          onDetail={openDetail}
          onFocus={setFocusProvider}
          getDistance={getDistance}
        />
      )}
      {detailProvider && (
        <DetailScreen
          e={detailProvider}
          onClose={() => setDetailProvider(null)}
          distKm={getDistance(detailProvider)}
          userLocation={userLocation}
          online={online}
          onFlyTo={(lat, lng) => {
            setDetailProvider((prev) => (prev ? { ...prev, lat, lng } : prev));
            setFocusProvider((prev) => (prev ? { ...prev, lat, lng } : prev));
          }}
        />
      )}

      {/* ── Sticky top header ── */}
      <div style={{ flexShrink: 0, background: C.bg, zIndex: 20 }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "var(--app-header-top) 16px 12px",
            background: "var(--find-help-header-bg)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--find-help-header-border)",
          }}
        >
          <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: 4 }}>
            <Button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
            >
              <ChevronLeft size={20} />
            </Button>
            <div style={{ minWidth: 0, paddingLeft: 4 }}>
              <h1
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                  color: "var(--text-on-surface)",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Find Help
              </h1>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.2,
                  color: "var(--find-help-icon-muted)",
                  margin: "3px 0 0",
                }}
              >
                Resources nearby
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Button
              type="button"
              onClick={handleNearMe}
              disabled={locating}
              aria-pressed={isNearMode}
              aria-label={
                isNearMode
                  ? "Showing nearest first — tap to clear"
                  : "Sort by distance from you"
              }
              size="sm"
              variant="outline"
              className={cn(
                "h-8 rounded-full px-3 text-xs font-semibold",
                isNearMode
                  ? "border-[var(--find-help-link-blue-border)] bg-[var(--find-help-link-blue-soft)] text-[color:var(--find-help-distance-text)] hover:bg-[var(--find-help-link-blue-soft)]"
                  : "",
              )}
            >
              <G.nearMe size={14} />
              {locating ? "Locating…" : isNearMode ? "Nearest" : "Near"}
            </Button>
            {saved.size > 0 && (
              <Button
                type="button"
                onClick={() => setSavedOpen(true)}
                aria-label="Saved resources"
                variant="outline"
                size="icon"
                className="relative size-9 rounded-full"
              >
                <G.bookmark size={14} fill="currentColor" />
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "var(--primary)",
                    color: "var(--background)",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {saved.size}
                </span>
              </Button>
            )}
          </div>
        </header>
      </div>

      {/* ── Map fills the rest of the screen ── */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          background: "var(--find-help-surface-low)",
        }}
      >
        {tab !== "hotline" && online ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              // Below the floating overlays and sheet. Leaflet uses
              // internal z-indexes up to ~700 inside this container,
              // so we keep it at 0 and push overlays into a sibling
              // layer above.
              zIndex: 0,
            }}
          >
            <LiveMap
              providers={mapProviders}
              focusProvider={focusProvider}
              userLocation={userLocation}
              mapLayer={mapLayer}
              theme={resolvedTheme}
              onResetFocus={focusProvider ? () => setFocusProvider(null) : null}
            />
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(160deg, rgba(255,123,123,0.10), rgba(255,185,84,0.05))",
              display: "grid",
              placeItems: "center",
              padding: 24,
            }}
          >
            {!online && tab !== "hotline" && (
              <div className="max-w-xs rounded-[1.75rem] border border-[var(--border-violet-soft)] bg-card p-5 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
                <MapIcon className="mx-auto mb-3 text-primary" size={24} />
                <p className="m-0 font-serif text-xl text-foreground">
                  Map unavailable offline
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--text-kicker)]">
                  Provider listings, phone numbers, and saved details are still available
                  below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Floating overlays layer — sits above the map's Leaflet panes.
            Leaflet assigns internal z-indexes up to ~700 (popup-pane), so
            we use 1000+ to guarantee our overlays and the sheet paint
            above the map. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            pointerEvents: "none",
          }}
          aria-hidden={false}
        >
          {/* Floating search + tabs overlay */}
          {tab !== "hotline" && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                right: 12,
                zIndex: 30,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                pointerEvents: "none",
              }}
            >
              <Card
                className="rounded-[1.25rem] border-[var(--find-help-border-soft)] bg-card/95 p-2 shadow-[var(--find-help-shadow)] backdrop-blur-xl"
                style={{ pointerEvents: "auto" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 8px 0 4px",
                  }}
                >
                  <div
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-violet-icon)] text-primary"
                    aria-hidden
                  >
                    <G.search size={15} />
                  </div>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search resources…"
                    aria-label="Search resources"
                    className="h-10 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                  />
                  {search && (
                    <Button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                    >
                      <G.close size={14} />
                    </Button>
                  )}
                </div>
                <div
                  className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1"
                  style={{ scrollbarWidth: "none" }}
                  role="tablist"
                  aria-label="Resource categories"
                >
                  {tabs.map((t) => {
                    const TabIcon = t.glyph;
                    const isActive = tab === t.key;
                    return (
                      <Button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => {
                          setTab(t.key);
                          setFocusProvider(null);
                        }}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-8 shrink-0 rounded-full px-3 text-xs font-semibold",
                          !isActive &&
                            "text-muted-foreground hover:bg-[var(--surface-violet-low)] hover:text-foreground",
                        )}
                      >
                        <TabIcon size={12} /> {t.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Bottom controls: Street/Satellite on the left, Show-list on the right. */}
          <AnimatePresence>
            {online && sheet !== "expanded" && tab !== "hotline" && (
              <motion.div
                key="map-type-toggle"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                role="group"
                aria-label="Map type"
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: `calc(${SHEET_HEIGHTS[sheet]} + var(--find-help-bottom-clearance, 0px) + 12px)`,
                  zIndex: 1100,
                  display: "inline-flex",
                  alignItems: "center",
                  height: 40,
                  padding: 3,
                  gap: 2,
                  borderRadius: 999,
                  background: "var(--find-help-pill-bg)",
                  border: "1px solid var(--find-help-pill-border)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: "var(--find-help-shadow)",
                  pointerEvents: "auto",
                }}
              >
                {(["street", "satellite"] as MapLayer[]).map((l) => {
                  const Icon = l === "street" ? G.street : G.satellite;
                  const isActive = mapLayer === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setMapLayer(l)}
                      aria-pressed={isActive}
                      aria-label={l === "street" ? "Street map" : "Satellite imagery"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        height: 32,
                        padding: "0 12px",
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 11,
                        fontWeight: 600,
                        background: isActive
                          ? "var(--find-help-toggle-active-bg)"
                          : "transparent",
                        color: isActive
                          ? "var(--find-help-toggle-active-text)"
                          : "var(--text-on-surface-strong)",
                        transition: "background 0.15s ease, color 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Icon size={12} />
                      {l === "street" ? "Street" : "Satellite"}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sheet !== "expanded" && tab !== "hotline" && (
              <motion.button
                key="show-list-fab"
                type="button"
                onClick={() => setSheet("expanded")}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  right: 16,
                  bottom: `calc(${SHEET_HEIGHTS[sheet]} + var(--find-help-bottom-clearance, 0px) + 12px)`,
                  transform: "none",
                  zIndex: 1100,
                  pointerEvents: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 999,
                  background: "var(--find-help-fab-bg)",
                  border: "1px solid var(--border-violet-soft)",
                  color: "var(--find-help-fab-text)",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: "var(--find-help-fab-shadow)",
                  letterSpacing: "0.01em",
                }}
                aria-label="Show resource list"
              >
                <G.map size={14} color="var(--find-help-fab-text)" />
                Show list
                {(() => {
                  const count =
                    tab === "psychologist"
                      ? filtered.psy.length
                      : tab === "community"
                        ? filtered.comm.length
                        : tab === "support"
                          ? filtered.sup.length
                          : filtered.psy.length +
                            filtered.comm.length +
                            filtered.sup.length;
                  return (
                    <span
                      style={{
                        marginLeft: 4,
                        minWidth: 20,
                        height: 20,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: "var(--find-help-fab-count-bg)",
                        color: "var(--find-help-fab-text)",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {count}
                    </span>
                  );
                })()}
              </motion.button>
            )}
          </AnimatePresence>

          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "var(--find-help-bottom-clearance, 0px)",
              zIndex: 1099,
              background: C.surface,
              pointerEvents: "none",
            }}
          />

          {/* ── Draggable bottom sheet (resource list) ── */}
          <motion.div
            drag={sheet === "expanded" ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.2 }}
            dragMomentum={false}
            onDragEnd={(_e, info) => {
              if (sheet !== "expanded") return;
              const velocity = info.velocity.y;
              const offset = info.offset.y;
              if (velocity > 500 || offset > 80) {
                setSheet("peek");
              } else if (velocity < -500 || offset < -80) {
                // already expanded, no-op
              }
            }}
            animate={
              reduceMotion
                ? { height: SHEET_HEIGHTS[sheet] }
                : { height: SHEET_HEIGHTS[sheet] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 360, damping: 36 }
            }
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "var(--find-help-bottom-clearance, 0px)",
              zIndex: 1100,
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              background: C.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              border: "1px solid var(--find-help-border)",
              borderBottom: "none",
              boxShadow: "var(--find-help-sheet-shadow)",
              overflow: "hidden",
              touchAction: sheet === "expanded" ? "pan-y" : "none",
            }}
            aria-label="Resource list"
          >
            {/* Sheet header / grabber — toggle on click, drag handled by parent */}
            <button
              type="button"
              onClick={() =>
                setSheet((prev) => (prev === "expanded" ? "peek" : "expanded"))
              }
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={sheet === "expanded" ? "Collapse list" : "Expand list"}
              aria-expanded={sheet === "expanded"}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 6,
                padding: "8px 16px 10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                width: "100%",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 999,
                  background: "var(--find-help-toggle-active-bg)",
                }}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-on-surface)",
                }}
              >
                <span>
                  {(() => {
                    if (tab === "hotline") {
                      return `${DB_HOT.length} hotline${DB_HOT.length === 1 ? "" : "s"}`;
                    }
                    if (tab === "psychologist") {
                      return `${filtered.psy.length} resource${filtered.psy.length === 1 ? "" : "s"}`;
                    }
                    if (tab === "community") {
                      return `${filtered.comm.length} resource${filtered.comm.length === 1 ? "" : "s"}`;
                    }
                    if (tab === "support") {
                      return `${filtered.sup.length} resource${filtered.sup.length === 1 ? "" : "s"}`;
                    }
                    const total =
                      filtered.psy.length + filtered.comm.length + filtered.sup.length;
                    return `${total} resource${total === 1 ? "" : "s"}`;
                  })()}
                </span>
                <span
                  style={{
                    color: "var(--find-help-icon-muted)",
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {sheet === "expanded" ? (
                    <>
                      <G.collapse size={12} /> Tap to collapse
                    </>
                  ) : (
                    <>
                      <G.expand size={12} /> Tap to expand
                    </>
                  )}
                </span>
              </div>
            </button>

            {/* Sheet body — only scrollable when expanded */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: sheet === "expanded" ? "auto" : "hidden",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
              }}
            >
              <RecentlyViewed
                ids={recentIds}
                allProviders={allProviders}
                onSelect={(p) => {
                  openDetail(p);
                  setFocusProvider(p);
                }}
              />

              {(tab === "all" || tab === "hotline") && (
                <div>
                  {tab === "all" && (
                    <SectionHeader
                      label="Emergency Hotlines"
                      count={DB_HOT.length}
                      color="#e05c6e"
                    />
                  )}
                  {DB_HOT.map((h) => (
                    <HotlineCard key={h.id} h={h} />
                  ))}
                </div>
              )}

              {(tab === "all" || tab === "psychologist") && filtered.psy.length > 0 && (
                <div>
                  <SectionHeader
                    label="Psychologists"
                    count={filtered.psy.length}
                    color={C.accent}
                  />
                  {filtered.psy.map((e) => (
                    <ProviderCard
                      key={e.id}
                      e={e}
                      saved={saved.has(e.id)}
                      onSave={toggleSave}
                      onFocus={setFocusProvider}
                      onDetail={openDetail}
                      isFocused={focusProvider?.id === e.id}
                      distKm={getDistance(e)}
                    />
                  ))}
                </div>
              )}

              {(tab === "all" || tab === "community") && filtered.comm.length > 0 && (
                <div>
                  <SectionHeader
                    label="Community & Group"
                    count={filtered.comm.length}
                    color="#6dba84"
                  />
                  {filtered.comm.map((e) => (
                    <ProviderCard
                      key={e.id}
                      e={e}
                      saved={saved.has(e.id)}
                      onSave={toggleSave}
                      onFocus={setFocusProvider}
                      onDetail={openDetail}
                      isFocused={focusProvider?.id === e.id}
                      distKm={getDistance(e)}
                    />
                  ))}
                </div>
              )}

              {(tab === "all" || tab === "support") && filtered.sup.length > 0 && (
                <div>
                  <SectionHeader
                    label="Support Connections"
                    count={filtered.sup.length}
                    color="#e0853c"
                  />
                  {filtered.sup.map((e) => (
                    <ProviderCard
                      key={e.id}
                      e={e}
                      saved={saved.has(e.id)}
                      onSave={toggleSave}
                      onFocus={setFocusProvider}
                      onDetail={openDetail}
                      isFocused={focusProvider?.id === e.id}
                      distKm={getDistance(e)}
                    />
                  ))}
                </div>
              )}

              {filtered.psy.length === 0 &&
                filtered.comm.length === 0 &&
                filtered.sup.length === 0 &&
                tab !== "hotline" && (
                  <div
                    style={{
                      margin: "16px",
                      padding: "28px 20px",
                      textAlign: "center",
                      color: C.muted,
                      fontSize: 13,
                      borderRadius: 16,
                      background: "var(--surface-violet-low)",
                      border: "1px dashed var(--border-violet-soft)",
                    }}
                  >
                    <G.search
                      size={26}
                      color={C.muted}
                      style={{ marginBottom: 8, opacity: 0.5 }}
                    />
                    <p
                      className="font-serif"
                      style={{
                        fontSize: 14,
                        color: "var(--find-help-icon-muted)",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      No resources match your search.
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-on-surface-strong)",
                        margin: "6px 0 0",
                      }}
                    >
                      Try a different keyword or city.
                    </p>
                  </div>
                )}
              <div style={{ height: 24 }} />
            </div>
          </motion.div>

          {/* Hotline-only banner when the map is hidden */}
          {tab === "hotline" && (
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                right: 16,
                zIndex: 5,
                padding: "14px 16px",
                background: "var(--crisis-imminent-bg)",
                borderRadius: 16,
                border: "1px solid var(--crisis-imminent-border)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "1.1px",
                  textTransform: "uppercase",
                  color: "var(--crisis-imminent-title)",
                  marginBottom: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <G.sos size={12} /> In immediate danger?
              </p>
              <p
                className="font-serif"
                style={{
                  fontSize: 14,
                  color: "var(--find-help-text-strong)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                If you're in crisis, tap any number below. These lines are free and
                confidential.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
