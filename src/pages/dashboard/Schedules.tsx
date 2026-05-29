import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

type Schedule = {
  id: string; name: string; days_of_week: number[]; start_time: string; end_time: string;
  is_active: boolean; blocklist_id: string | null; child_id: string | null;
};
type Blocklist = { id: string; name: string };
type Child = { id: string; name: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Schedules() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [lists, setLists] = useState<Blocklist[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", blocklist_id: "", child_id: "",
    days: [1, 2, 3, 4, 5] as number[],
    start_time: "08:00", end_time: "15:00",
  });

  const load = async () => {
    const { data: f } = await supabase.from("families").select("id").maybeSingle();
    if (f) setFamilyId(f.id);
    const [s, b, c] = await Promise.all([
      supabase.from("schedules").select("*").order("created_at", { ascending: false }),
      supabase.from("blocklists").select("id, name"),
      supabase.from("children").select("id, name"),
    ]);
    setItems((s.data as any) || []);
    setLists((b.data as any) || []);
    setChildren((c.data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !form.name.trim() || !form.blocklist_id) return toast.error("Fill name + blocklist");
    const { error } = await supabase.from("schedules").insert({
      family_id: familyId,
      name: form.name.trim().slice(0, 80),
      blocklist_id: form.blocklist_id,
      child_id: form.child_id || null,
      days_of_week: form.days,
      start_time: form.start_time,
      end_time: form.end_time,
    });
    if (error) return toast.error(error.message);
    toast.success("Schedule created");
    setOpen(false);
    load();
  };

  const toggle = async (id: string, v: boolean) => {
    const { error } = await supabase.from("schedules").update({ is_active: v }).eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete schedule?")) return;
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const toggleDay = (d: number) => {
    setForm({ ...form, days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d].sort() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Schedules</h1>
          <p className="mt-1 text-muted-foreground">Recurring rules that auto-apply at set times.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> New schedule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New schedule</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="School hours" maxLength={80} /></div>
              <div>
                <Label>Blocklist</Label>
                <Select value={form.blocklist_id} onValueChange={(v) => setForm({ ...form, blocklist_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                  <SelectContent>{lists.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Child (optional)</Label>
                <Select value={form.child_id} onValueChange={(v) => setForm({ ...form, child_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All children" /></SelectTrigger>
                  <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Days</Label>
                <div className="mt-2 flex gap-2">
                  {DAYS.map((d, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(i)} className={`h-9 w-9 rounded-md text-xs font-medium transition ${form.days.includes(i) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Create schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-border bg-surface/30 p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-display text-lg">No schedules yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a recurring rule to auto-block during certain hours.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center gap-4 border-border bg-gradient-card p-5">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-display font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.days_of_week.map((d) => DAYS[d]).join(", ")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                </p>
              </div>
              <Switch checked={s.is_active} onCheckedChange={(v) => toggle(s.id, v)} />
              <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
