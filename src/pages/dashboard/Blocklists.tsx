import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Ban, X, Shield } from "lucide-react";
import { toast } from "sonner";

type Blocklist = { id: string; name: string; kind: string; description: string | null; is_active: boolean };
type Site = { id: string; blocklist_id: string; domain: string };

const VPN_DOMAINS = [
  "expressvpn.com", "nordvpn.com", "protonvpn.com", "tunnelbear.com",
  "windscribe.com", "surfshark.com", "cyberghostvpn.com", "1.1.1.1",
  "mullvad.net", "private-internet-access.com", "purevpn.com", "hide.me",
];

const domainSchema = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

export default function Blocklists() {
  const [lists, setLists] = useState<Blocklist[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vpnEnabled, setVpnEnabled] = useState(true);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: family } = await supabase.from("families").select("id, vpn_blocklist_enabled").maybeSingle();
    if (family) {
      setFamilyId(family.id);
      setVpnEnabled(family.vpn_blocklist_enabled);
    }
    const [{ data: bl }, { data: si }] = await Promise.all([
      supabase.from("blocklists").select("*").order("created_at", { ascending: true }),
      supabase.from("blocklist_sites").select("*"),
    ]);
    setLists((bl as any) || []);
    setSites((si as any) || []);
  };
  useEffect(() => { load(); }, []);

  const toggleVpn = async (v: boolean) => {
    if (!familyId) return;
    setVpnEnabled(v);
    const { error } = await supabase.from("families").update({ vpn_blocklist_enabled: v }).eq("id", familyId);
    if (error) toast.error(error.message);
    else toast.success(v ? "VPN blocking ON" : "VPN blocking OFF");
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !familyId) return;
    const { error } = await supabase.from("blocklists").insert({
      family_id: familyId, name: newName.trim().slice(0, 80), kind: "custom",
    });
    if (error) return toast.error(error.message);
    setOpen(false); setNewName(""); toast.success("Blocklist created");
    load();
  };

  const removeList = async (id: string) => {
    if (!confirm("Delete this blocklist?")) return;
    const { error } = await supabase.from("blocklists").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addSite = async (blId: string) => {
    const d = (newDomain[blId] || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!domainSchema.test(d)) return toast.error("Enter a valid domain (e.g. example.com)");
    const { error } = await supabase.from("blocklist_sites").insert({ blocklist_id: blId, domain: d });
    if (error) {
      if (error.code === "23505") toast.error("Already in list");
      else toast.error(error.message);
      return;
    }
    setNewDomain({ ...newDomain, [blId]: "" });
    load();
  };

  const removeSite = async (id: string) => {
    const { error } = await supabase.from("blocklist_sites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Blocklists</h1>
          <p className="mt-1 text-muted-foreground">Manage block profiles. Devices sync these in real-time.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> New blocklist</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a blocklist</DialogTitle></DialogHeader>
            <form onSubmit={createList} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Homework hours" maxLength={80} />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* VPN master toggle */}
      <Card className="flex items-center gap-4 border-border bg-gradient-card p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
          <Shield className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold">Block VPN bypass apps</p>
          <p className="text-xs text-muted-foreground">
            Pre-loaded list of {VPN_DOMAINS.length} VPN domains. Prevents kids from installing tunnels around your rules.
          </p>
        </div>
        <Switch checked={vpnEnabled} onCheckedChange={toggleVpn} />
      </Card>

      <div className="grid gap-4">
        {lists.map((bl) => {
          const blSites = sites.filter((s) => s.blocklist_id === bl.id);
          return (
            <Card key={bl.id} className="border-border bg-gradient-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-semibold">{bl.name}</p>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">{bl.kind}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{blSites.length} sites blocked</p>
                </div>
                {bl.kind === "custom" && (
                  <Button size="icon" variant="ghost" onClick={() => removeList(bl.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {blSites.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-mono">
                    {s.domain}
                    <button onClick={() => removeSite(s.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {blSites.length === 0 && <span className="text-xs text-muted-foreground">No sites yet.</span>}
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={newDomain[bl.id] || ""}
                  onChange={(e) => setNewDomain({ ...newDomain, [bl.id]: e.target.value })}
                  placeholder="example.com"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSite(bl.id); } }}
                />
                <Button onClick={() => addSite(bl.id)} variant="outline">Add</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
