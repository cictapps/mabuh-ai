import { useState } from "react";
import { Flame, MoonStar, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function greet() {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      setGreetMsg(await invoke<string>("greet", { name: name.trim() }));
    } finally {
      setIsSubmitting(false);
    }
  }

  const themeNotes = [
    "Twilight indigos replace the default starter palette.",
    "Serif headlines and airy spacing give the UI an editorial voice.",
    "Cards are separated by tonal layers instead of hard dividers.",
    "Amber appears only on active, high-impact moments.",
  ];

  const sanctuaryCues = [
    {
      title: "Held, not boxed in",
      copy: "Soft surfaces and glassy panels create structure without heavy lines.",
    },
    {
      title: "Warm focus",
      copy: "Inputs and calls to action glow gently with amber to guide attention.",
    },
    {
      title: "Breathing room",
      copy: "Generous spacing keeps the interface calm during long study sessions.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      {/* ... rest of your JSX remains the same ... */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 top-24 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-tertiary/12 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden bg-card/80">
            <CardHeader className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-high px-3.5 py-1.5 text-sm text-muted-foreground">
                  <MoonStar className="size-4 text-secondary" />
                  Editorial Nurture
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-tertiary/15 px-3.5 py-1.5 text-sm font-medium text-tertiary">
                  <Flame className="size-4" />
                  Twilight Glow theme
                </span>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/chatbot")}
                className="rounded-full text-secondary hover:text-secondary hover:bg-secondary/10"
              >
                Open Chat
              </Button>

              <div className="space-y-3">
                <CardTitle className="max-w-3xl text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                  A calmer, more editorial home for late-night student check-ins.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  This refresh follows the sanctuary direction from{" "}
                  <code className="rounded-full bg-white/5 px-2 py-1 text-xs text-foreground">
                    DESIGN.md
                  </code>
                  : deep twilight surfaces, airy serif headlines, amber focus
                  states, and soft glass layering.
                </CardDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Palette", value: "Twilight Glow" },
                  { label: "Type", value: "Newsreader + Jakarta" },
                  { label: "Mood", value: "Held & reflective" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] bg-surface-low px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-[1.75rem] bg-surface-low p-4 sm:p-5">
                <div className="mb-4 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Try the Tauri greeting inside the new sanctuary shell.
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The function stays the same—only the atmosphere has changed.
                  </p>
                </div>

                <form
                  className="grid gap-3 sm:grid-cols-[1fr_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void greet();
                  }}
                >
                  <Input
                    id="greet-input"
                    dir="ltr"
                    value={name}
                    onChange={(event) => setName(event.currentTarget.value)}
                    placeholder="Type a name for a gentle hello..."
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || name.trim().length === 0}
                  >
                    <Wand2 className="size-4" />
                    {isSubmitting ? "Gathering glow..." : "Send greeting"}
                  </Button>
                </form>
              </div>

              <div className="rounded-[1.75rem] bg-surface-high p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4 text-tertiary" />
                  Tauri response
                </div>
                <div
                  dir="ltr"
                  aria-live="polite"
                  className="flex min-h-24 items-center rounded-[1.25rem] bg-background/70 px-4 py-3 text-sm leading-7 text-foreground"
                >
                  {greetMsg || "Submit a name to see the response arrive in the sanctuary panel."}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="bg-surface-low/90">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Theme notes</CardTitle>
                <CardDescription>
                  The new shell leans on depth, softness, and quiet emphasis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {themeNotes.map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-surface-high px-4 py-3 leading-6">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-surface-low/90">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Sanctuary cues</CardTitle>
                <CardDescription>
                  Directly translated from the design brief into the live UI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sanctuaryCues.map((item) => (
                  <div key={item.title} className="rounded-[1.25rem] bg-surface-high px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;