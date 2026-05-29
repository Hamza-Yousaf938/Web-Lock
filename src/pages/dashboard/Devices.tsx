import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Smartphone, Chrome, Apple, Copy, CheckCircle2, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

type Device = {
  id: string; name: string; platform: string; pairing_code: string | null;
  pairing_code_expires_at: string | null; paired_at: string | null; last_seen_at: string | null;
  child_id: string | null;
};
type Child = { id: string; name: string };

const platformIcon = (p: string) => p === "android" ? Smartphone : p === "ios" ? Apple : Chrome;

export default function Devices() {
  const [items, setItems] = useState<Device[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "chrome_extension", child_id: "" });

  const load = async () => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("devices").select("*").order("created_at", { ascending: false }),
      supabase.from("children").select("id, name"),
    ]);
    setItems((d as any) || []);
    setChildren((c as any) || []);
  };
  useEffect(() => { load(); }, []);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
  const generateToken = () => crypto.randomUUID() + "-" + crypto.randomUUID();

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name required");
    const { data: family } = await supabase.from("families").select("id").maybeSingle();
    if (!family) return toast.error("Family not found");

    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const token = generateToken();

    const { error } = await supabase.from("devices").insert({
      family_id: family.id,
      name: form.name.trim().slice(0, 80),
      platform: form.platform as any,
      child_id: form.child_id || null,
      device_token: token,
      pairing_code: code,
      pairing_code_expires_at: expires,
    });
    if (error) return toast.error(error.message);
    toast.success(`Pairing code: ${code}`);
    setOpen(false);
    setForm({ name: "", platform: "chrome_extension", child_id: "" });
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied");
  };

  const remove = async (id: string) => {
    if (!confirm("Unpair and remove this device?")) return;
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Device removed");
    load();
  };

  const downloadExtension = () => {
    fetch("/weblock-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "weblock-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Devices</h1>
          <p className="mt-1 text-muted-foreground">Pair Chrome extensions and mobile apps to your family.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadExtension}>
            <Download className="mr-1 h-4 w-4" /> Download extension
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/docs/extension-sync"><BookOpen className="mr-1 h-4 w-4" /> Install guide</Link>
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Pair device</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pair a new device</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div>
                <Label>Device name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Maya's Chromebook" maxLength={80} />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chrome_extension">Chrome Extension</SelectItem>
                    <SelectItem value="android">Android (coming soon)</SelectItem>
                    <SelectItem value="ios">iOS (planned)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign to child (optional)</Label>
                <Select value={form.child_id} onValueChange={(v) => setForm({ ...form, child_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Generate pairing code</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-border bg-surface/30 p-12 text-center">
          <Smartphone className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-display text-lg">No devices yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Generate a pairing code, then enter it in the device's WebLock app.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((d) => {
            const Icon = platformIcon(d.platform);
            const isPaired = !!d.paired_at;
            const codeValid = d.pairing_code && d.pairing_code_expires_at && new Date(d.pairing_code_expires_at) > new Date();
            return (
              <Card key={d.id} className="flex flex-wrap items-center gap-4 border-border bg-gradient-card p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="font-display font-semibold">{d.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {d.platform.replace("_", " ")} ·{" "}
                    {isPaired
                      ? d.last_seen_at
                        ? `last seen ${formatDistanceToNow(new Date(d.last_seen_at), { addSuffix: true })}`
                        : "paired"
                      : "awaiting pairing"}
                  </p>
                </div>
                {!isPaired && codeValid && (
                  <button onClick={() => copyCode(d.pairing_code!)} className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-lg font-bold tracking-widest text-primary">
                    {d.pairing_code} <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
                {isPaired && <CheckCircle2 className="h-5 w-5 text-success" />}
                <Button size="icon" variant="ghost" onClick={() => remove(d.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
