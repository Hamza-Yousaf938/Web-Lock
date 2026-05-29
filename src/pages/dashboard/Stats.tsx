import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";

type Event = { domain: string; blocked_at: string };

export default function Stats() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data } = await supabase.from("block_events")
        .select("domain, blocked_at")
        .gte("blocked_at", since.toISOString())
        .order("blocked_at", { ascending: false })
        .limit(1000);
      setEvents((data as any) || []);
    })();
  }, []);

  // top 8 domains
  const top = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => { acc[e.domain] = (acc[e.domain] || 0) + 1; return acc; }, {}),
  ).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  // blocks per day (last 7)
  const days: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const count = events.filter((e) => {
      const t = new Date(e.blocked_at);
      return t >= d && t < next;
    }).length;
    days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), count });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Stats</h1>
        <p className="mt-1 text-muted-foreground">Last 7 days of focus & blocks across your family.</p>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-border bg-surface/30 p-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-display text-lg">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Once devices start syncing block events, they'll show here.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border bg-gradient-card p-6">
            <h3 className="font-display text-lg font-semibold">Blocks per day</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <BarChart data={days}>
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="border-border bg-gradient-card p-6">
            <h3 className="font-display text-lg font-semibold">Top blocked sites</h3>
            <div className="mt-4 space-y-2">
              {top.map((t) => (
                <div key={t.domain} className="flex items-center justify-between rounded-md bg-surface-elevated px-3 py-2">
                  <span className="font-mono text-sm">{t.domain}</span>
                  <span className="text-sm font-semibold text-primary">{t.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
