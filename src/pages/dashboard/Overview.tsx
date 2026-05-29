import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Smartphone, Ban, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Overview() {
  const [stats, setStats] = useState({ devices: 0, children: 0, blockedToday: 0, activeFocus: 0 });
  const [familyName, setFamilyName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: family } = await supabase.from("families").select("name").maybeSingle();
      if (family) setFamilyName(family.name);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [{ count: dev }, { count: ch }, { count: blocks }, { count: focus }] = await Promise.all([
        supabase.from("devices").select("*", { count: "exact", head: true }),
        supabase.from("children").select("*", { count: "exact", head: true }),
        supabase.from("block_events").select("*", { count: "exact", head: true }).gte("blocked_at", today.toISOString()),
        supabase.from("focus_sessions").select("*", { count: "exact", head: true }).is("ended_at", null).gt("ends_at", new Date().toISOString()),
      ]);

      setStats({ devices: dev || 0, children: ch || 0, blockedToday: blocks || 0, activeFocus: focus || 0 });
    })();
  }, []);

  const cards = [
    { label: "Active focus sessions", value: stats.activeFocus, icon: Timer, accent: "text-success" },
    { label: "Blocked today", value: stats.blockedToday, icon: Ban, accent: "text-primary" },
    { label: "Paired devices", value: stats.devices, icon: Smartphone, accent: "text-accent" },
    { label: "Children", value: stats.children, icon: Activity, accent: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome back{familyName ? `, ${familyName}` : ""} 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening in your family today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border bg-gradient-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.accent}`} />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-gradient-card p-6">
          <h3 className="font-display text-lg font-semibold">Quick start</h3>
          <p className="mt-1 text-sm text-muted-foreground">Set up your family in three steps.</p>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="font-display font-bold text-primary">1.</span>
              <div className="flex-1">
                <p className="font-medium">Add a child profile</p>
                <Link to="/dashboard/children" className="text-xs text-primary hover:underline">Go to Children →</Link>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-display font-bold text-primary">2.</span>
              <div className="flex-1">
                <p className="font-medium">Pair a device</p>
                <Link to="/dashboard/devices" className="text-xs text-primary hover:underline">Get a pairing code →</Link>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-display font-bold text-primary">3.</span>
              <div className="flex-1">
                <p className="font-medium">Customize blocklists</p>
                <Link to="/dashboard/blocklists" className="text-xs text-primary hover:underline">Edit blocklists →</Link>
              </div>
            </li>
          </ol>
        </Card>

        <Card className="border-border bg-gradient-card p-6">
          <h3 className="font-display text-lg font-semibold">Connect your Chrome extension</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop a few lines into your existing extension's <code className="rounded bg-secondary px-1 text-xs">background.js</code> to sync rules from this cloud.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/docs/extension-sync">View integration snippet →</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
