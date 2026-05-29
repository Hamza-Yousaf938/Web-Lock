import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const childSchema = z.object({
  name: z.string().trim().min(1, "Required").max(80),
  age: z.coerce.number().int().min(2).max(25).optional().or(z.literal("")),
});

type Child = { id: string; name: string; age: number | null; avatar_url: string | null };

export default function Children() {
  const [items, setItems] = useState<Child[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "" as string | number });

  const load = async () => {
    const { data } = await supabase.from("children").select("*").order("created_at", { ascending: true });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = childSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const { data: family } = await supabase.from("families").select("id").maybeSingle();
    if (!family) return toast.error("Family not found");

    const { error } = await supabase.from("children").insert({
      family_id: family.id,
      name: parsed.data.name,
      age: parsed.data.age ? Number(parsed.data.age) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Child added");
    setOpen(false);
    setForm({ name: "", age: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this child profile?")) return;
    const { error } = await supabase.from("children").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Children</h1>
          <p className="mt-1 text-muted-foreground">Manage profiles for the kids you protect.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add child</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a child</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-4">
              <div>
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} required />
              </div>
              <div>
                <Label htmlFor="cage">Age (optional)</Label>
                <Input id="cage" type="number" min={2} max={25} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Add child</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-border bg-surface/30 p-12 text-center">
          <User className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-display text-lg">No children yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first child to start pairing devices.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id} className="flex items-center gap-4 border-border bg-gradient-card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.age ? `Age ${c.age}` : "Age not set"}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
