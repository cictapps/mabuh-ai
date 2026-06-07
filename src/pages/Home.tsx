import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export function Home() {
  const { profile, user } = useAuth();

  return (
    <main className="relative min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="text-lg font-medium">
            {profile?.display_name ?? user?.email ?? "friend"}
          </p>
        </div>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="text-3xl tracking-[-0.03em]">Your sanctuary awaits</CardTitle>
            <CardDescription>
              Auth is wired up. Build your first protected feature next - mood check-in or journal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}

export default Home;
