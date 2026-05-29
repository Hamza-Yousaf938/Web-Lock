import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Timer, Square, Zap, Lock, Flame } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Device = { id: string; name: string };
type Blocklist = { id: string; name: string };
type Session = { id: string; device_id: string; ends_at: string; intensity: string; blocklist_id: string };

export default function Focus() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [lists, setLists] = useState<Blocklist[]>([]);
  const [active, setActive] = useState<Session[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [form, setForm] = useState({ device_id: "", blocklist_id: "", intensity: "hard", minutes: 30 });

  const load = async () => {
    const { data: family } = await supabase.from("families").select("id").maybeSingle();
    if (family) setFamilyId(family.id);
    const [d, b, s] = await Promise.all([
      supabase.from("devices").select("id, name"),
      supabase.from("blocklists").select("id, name"),
      supabase.from("focus_sessions").select("*").is("ended_at", null).gt("ends_at", new Date().toISOString()),
    ]);
    setDevices((d.data as any) || []);
    setLists((b.data as any) || []);
    setActive((s.data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const start = async () => {
    if (!familyId) return;
    if (!form.device_id || !form.blocklist_id) return toast.error("Pick a device and blocklist");
    const ends = new Date(Date.now() + form.minutes * 60 * 1000).toISOString();
    const device = devices.find((d) => d.id === form.device_id);
    const { error } = await supabase.from("focus_sessions").insert({
      family_id: familyId,
      device_id: form.device_id,
      blocklist_id: form.blocklist_id,
      intensity: form.intensity as any,
      ends_at: ends,
    });
    if (error) return toast.error(error.message);
    toast.success(`Focus started on ${device?.name} for ${form.minutes}m`);
    load();
  };

  const stop = async (id: string) => {
    const { error } = await supabase.from("focus_sessions").update({ ended_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Stopped");
    load();
  };

  const intensityIcon = { soft: Zap, hard: Lock, nuclear: Flame } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Focus</h1>
        <p className="mt-1 text-muted-foreground">Start a focus session remotely on any paired device.</p>
      </div>

      <Card className="border-border bg-gradient-card p-6">
        <h3 className="font-display text-lg font-semibold">Start a session</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Device</Label>
            <Select value={form.device_id} onValueChange={(v) => setForm({ ...form, device_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pick a device" /></SelectTrigger>
              <SelectContent>
                {devices.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Blocklist</Label>
            <Select value={form.blocklist_id} onValueChange={(v) => setForm({ ...form, blocklist_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pick a blocklist" /></SelectTrigger>
              <SelectContent>
                {lists.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Intensity</Label>
            <Select value={form.intensity} onValueChange={(v) => setForm({ ...form, intensity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft — friendly nudge</SelectItem>
                <SelectItem value="hard">Hard — fully blocked</SelectItem>
                <SelectItem value="nuclear">Nuclear — PIN required to disable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duration: {form.minutes} minutes</Label>
            <Slider min={5} max={240} step={5} value={[form.minutes]} onValueChange={(v) => setForm({ ...form, minutes: v[0] })} className="mt-3" />
          </div>
        </div>
        <Button onClick={start} className="mt-6 shadow-glow">
          <Timer className="mr-2 h-4 w-4" /> Start focus session
        </Button>
      </Card>

      <div>
        <h3 className="font-display text-lg font-semibold">Active sessions</h3>
        {active.length === 0 ? (
          <Card className="mt-3 border-dashed border-border bg-surface/30 p-8 text-center text-sm text-muted-foreground">
            No active focus sessions.
          </Card>
        ) : (
          <div className="mt-3 grid gap-3">
            {active.map((s) => {
              const dev = devices.find((d) => d.id === s.device_id);
              const list = lists.find((l) => l.id === s.blocklist_id);
              const Icon = intensityIcon[s.intensity as keyof typeof intensityIcon] || Lock;
              return (
                <Card key={s.id} className="flex flex-wrap items-center gap-4 border-border bg-gradient-card p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-display font-semibold">{dev?.name || "Device"}</p>
                    <p className="text-xs text-muted-foreground">{list?.name} · ends {formatDistanceToNow(new Date(s.ends_at), { addSuffix: true })}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => stop(s.id)}>
                    <Square className="mr-1 h-3 w-3" /> Stop
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
