import { useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(320);

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({ email: parsed.data, platform: "android" });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.success("You're already on the list 👍");
      else toast.error(error.message);
      return;
    }
    setEmail("");
    toast.success("You're on the Android waitlist!");
  };

  return (
    <footer className="border-t border-border/50 bg-background/50">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Shield className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              WebLock
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Focus and parental controls that work everywhere — Chrome, Android, iOS — and even block VPN bypasses.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold">Join the Android waitlist</h4>
            <p className="mt-1 text-sm text-muted-foreground">Be first when WebLock for Android ships.</p>
            <form onSubmit={join} className="mt-4 flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@family.com"
                maxLength={320}
                required
              />
              <Button type="submit" disabled={loading}>{loading ? "..." : "Join"}</Button>
            </form>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border/50 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} WebLock. Built for focus.</p>
          <div className="flex gap-4">
            <a href="/docs/extension-sync" className="hover:text-foreground">Extension docs</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
