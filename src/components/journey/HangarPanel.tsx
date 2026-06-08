import { useMemo, useState } from "react";
import {
  Palette,
  MapPin,
  UserPlus,
  Plus,
  Settings2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import type { JourneyPlane, JourneyTheme } from "@/types";
import { normalizeCheckpointTime, sortCheckpoints } from "@/lib/journey/schedule";

const THEME_OPTIONS: { key: JourneyTheme; label: string; gradient: string }[] = [
  { key: "dusk", label: "Dusk", gradient: "from-indigo-500/40 to-fuchsia-500/30" },
  { key: "dawn", label: "Dawn", gradient: "from-amber-400/40 to-rose-400/30" },
  { key: "meadow", label: "Meadow", gradient: "from-emerald-400/40 to-teal-400/30" },
];

const PLANE_OPTIONS: { key: JourneyPlane; label: string; icon: string }[] = [
  { key: "trainer", label: "Trainer", icon: "🛩️" },
  { key: "cruiser", label: "Cruiser", icon: "✈️" },
  { key: "glider", label: "Glider", icon: "🪽" },
];

type Section = "look" | "waypoints" | "people";

export function HangarPanel() {
  const theme = useJourneyStore((s) => s.theme);
  const plane = useJourneyStore((s) => s.plane);
  const setTheme = useJourneyStore((s) => s.setTheme);
  const setPlane = useJourneyStore((s) => s.setPlane);
  const checkpoints = useJourneyStore((s) => s.checkpoints);
  const addCheckpoint = useJourneyStore((s) => s.addCheckpoint);
  const removeCheckpoint = useJourneyStore((s) => s.removeCheckpoint);
  const emergencyContacts = useJourneyStore((s) => s.emergencyContacts);
  const addEmergencyContact = useJourneyStore((s) => s.addEmergencyContact);
  const updateEmergencyContact = useJourneyStore((s) => s.updateEmergencyContact);
  const removeEmergencyContact = useJourneyStore((s) => s.removeEmergencyContact);

  const [openSection, setOpenSection] = useState<Section | null>("look");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sortedCheckpoints = useMemo(
    () => sortCheckpoints(checkpoints),
    [checkpoints],
  );

  const handleAddCheckpoint = () => {
    const normalized = normalizeCheckpointTime(time);
    const cleanLabel = label.trim();
    if (!cleanLabel || !normalized) {
      setError("Add a checkpoint name and a time like 02:30 PM.");
      return;
    }
    addCheckpoint({
      id: `checkpoint-${Date.now()}`,
      label: cleanLabel,
      time: normalized,
    });
    setLabel("");
    setTime("");
    setError(null);
  };

  const toggleSection = (section: Section) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.04)] text-foreground">
            <Settings2 className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d8d4eb]">
              Hangar
            </p>
            <CardTitle className="font-serif text-2xl tracking-[-0.02em]">
              Customise your journey
            </CardTitle>
          </div>
        </div>
        <CardDescription className="mt-2">
          Pick a vibe, plan your waypoints, and add people you can lean on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Section
          icon={<Palette className="size-4" />}
          title="Look & feel"
          hint="Sky tone and companion"
          open={openSection === "look"}
          onToggle={() => toggleSection("look")}
        >
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
              Sky tone
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => {
                const selected = theme === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTheme(option.key)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors",
                      selected
                        ? "border-[rgba(255,185,84,0.32)] bg-[rgba(255,185,84,0.08)]"
                        : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.03)] hover:bg-[rgba(188,194,255,0.06)]",
                    )}
                  >
                    <span
                      className={cn("h-6 w-full rounded-full bg-gradient-to-r", option.gradient)}
                      aria-hidden
                    />
                    <span className="text-xs font-semibold">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
              Companion
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PLANE_OPTIONS.map((option) => {
                const selected = plane === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPlane(option.key)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                      selected
                        ? "border-[rgba(255,185,84,0.32)] bg-[rgba(255,185,84,0.08)]"
                        : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.03)] hover:bg-[rgba(188,194,255,0.06)]",
                    )}
                  >
                    <span className="text-xl leading-none">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section
          icon={<MapPin className="size-4" />}
          title="Waypoints"
          hint={`${sortedCheckpoints.length} planned`}
          open={openSection === "waypoints"}
          onToggle={() => toggleSection("waypoints")}
        >
          <div className="space-y-2">
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Label (e.g. Lunch pause)"
            />
            <Input
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="Time (e.g. 02:30 PM)"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button onClick={handleAddCheckpoint} className="w-full">
              <Plus className="size-4" />
              Add waypoint
            </Button>
          </div>

          {sortedCheckpoints.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.02)] p-3 text-xs leading-relaxed text-[#d8d4eb]">
              No waypoints yet. Add one above to plan a soft moment in your day.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedCheckpoints.map((checkpoint) => (
                <li
                  key={checkpoint.id}
                  className="flex items-center gap-3 rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] px-3.5 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {checkpoint.label}
                    </span>
                    <span className="block text-xs text-[#d8d4eb]">
                      {checkpoint.time}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCheckpoint(checkpoint.id)}
                    aria-label={`Remove ${checkpoint.label}`}
                    className="rounded-full p-1.5 text-[#d8d4eb] transition-colors hover:bg-[rgba(188,194,255,0.06)] hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          icon={<UserPlus className="size-4" />}
          title="Trusted people"
          hint={
            emergencyContacts.filter((c) => c.name.trim()).length === 0
              ? "Add one"
              : `${emergencyContacts.filter((c) => c.name.trim()).length} saved`
          }
          open={openSection === "people"}
          onToggle={() => toggleSection("people")}
        >
          <p className="text-xs leading-relaxed text-[#d8d4eb]">
            Save a few people you can call from the Pause view. These are private to your device.
          </p>
          <div className="space-y-2">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-2.5"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={contact.name}
                    onChange={(event) =>
                      updateEmergencyContact(contact.id, {
                        ...contact,
                        name: event.target.value,
                      })
                    }
                    placeholder="Name"
                  />
                  <Input
                    type="tel"
                    value={contact.phone}
                    onChange={(event) =>
                      updateEmergencyContact(contact.id, {
                        ...contact,
                        phone: event.target.value,
                      })
                    }
                    placeholder="Phone"
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-[#d8d4eb] transition-colors hover:bg-[rgba(188,194,255,0.06)] hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addEmergencyContact}
              className="w-full"
            >
              <UserPlus className="size-4" />
              Add another person
            </Button>
          </div>
        </Section>
      </CardContent>
    </Card>
  );
}

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function Section({ icon, title, hint, open, onToggle, children }: SectionProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        open
          ? "border-[rgba(188,194,255,0.16)] bg-[rgba(188,194,255,0.04)]"
          : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.02)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span className="grid size-8 place-items-center rounded-xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.04)] text-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          <span className="block text-[11px] text-[#d8d4eb]">{hint}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-[#d8d4eb] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="space-y-4 px-3.5 pb-4">{children}</div> : null}
    </div>
  );
}
