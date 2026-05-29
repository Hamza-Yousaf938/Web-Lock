import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const pinSchema = z.string().regex(/^\d{4,8}$/, "PIN must be 4-8 digits");

// Lightweight client-side hash for parent PIN. Server won't accept it as auth — just for local gating.
async function hashPin(pin: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Settings() {
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("families").select("id, name, parent_pin_hash").maybeSingle();
      if (data) {
        setFamilyId(data.id);
        setFamilyName(data.name);
        setHasPin(!!data.parent_pin_hash);
      }
    })();
  }, []);

  const saveName = async () => {
    if (!familyId) return;
    setBusy(true);
    const { error } = await supabase.from("families").update({ name: familyName.slice(0, 80) }).eq("id", familyId);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const setPinOnFamily = async () => {
    if (!familyId) return;
    const parsed = pinSchema.safeParse(pin);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const hashed = await hashPin(parsed.data);
    const { error } = await supabase.from("families").update({ parent_pin_hash: hashed }).eq("id", familyId);
    setBusy(false);
    if (error) return toast.error(error.message);
    setPin("");
    setHasPin(true);
    toast.success("Parent PIN set");
  };

  const clearPin = async () => {
    if (!familyId) return;
    const { error } = await supabase.from("families").update({ parent_pin_hash: null }).eq("id", familyId);
    if (error) return toast.error(error.message);
    setHasPin(false);
    toast.success("PIN removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Family workspace, parent PIN, and account.</p>
      </div>

      <Card className="border-border bg-gradient-card p-6">
        <h3 className="font-display text-lg font-semibold">Family name</h3>
        <p className="mt-1 text-xs text-muted-foreground">Shown in the dashboard header.</p>
        <div className="mt-4 flex gap-2">
          <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} maxLength={80} />
          <Button onClick={saveName} disabled={busy}>Save</Button>
        </div>
      </Card>

      <Card className="border-border bg-gradient-card p-6">
        <h3 className="font-display text-lg font-semibold">Parent PIN</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Used by Nuclear mode and (future) Android uninstall protection. {hasPin ? "PIN is set." : "No PIN set."}
        </p>
        <div className="mt-4 flex gap-2">
          <Input type="password" inputMode="numeric" pattern="\d*" maxLength={8} placeholder="4–8 digits" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          <Button onClick={setPinOnFamily} disabled={busy}>{hasPin ? "Update PIN" : "Set PIN"}</Button>
          {hasPin && <Button variant="outline" onClick={clearPin}>Remove</Button>}
        </div>
      </Card>

      <Card className="border-border bg-gradient-card p-6">
        <h3 className="font-display text-lg font-semibold">Billing</h3>
        <p className="mt-1 text-sm text-muted-foreground">You're on the Free plan. Family plan with unlimited devices coming soon.</p>
      </Card>
    </div>
  );
}
