import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VPN_DOMAINS = [
  "expressvpn.com", "nordvpn.com", "protonvpn.com", "tunnelbear.com",
  "windscribe.com", "surfshark.com", "cyberghostvpn.com", "1.1.1.1",
  "mullvad.net", "private-internet-access.com", "purevpn.com", "hide.me",
];

const QuerySchema = z.object({ deviceToken: z.string().min(20).max(200) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ deviceToken: url.searchParams.get("deviceToken") });
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid deviceToken" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: device, error: devErr } = await supabase
    .from("devices")
    .select("id, family_id, child_id, name")
    .eq("device_token", parsed.data.deviceToken)
    .maybeSingle();

  if (devErr || !device) {
    return new Response(JSON.stringify({ error: "Unknown device" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Update last_seen
  await supabase.from("devices").update({ last_seen_at: new Date().toISOString() }).eq("id", device.id);

  // Find active focus session for this device
  const nowIso = new Date().toISOString();
  const { data: session } = await supabase
    .from("focus_sessions")
    .select("blocklist_id, intensity, ends_at")
    .eq("device_id", device.id)
    .is("ended_at", null)
    .gt("ends_at", nowIso)
    .order("started_at", { ascending: false })
    .maybeSingle();

  // Get family settings
  const { data: family } = await supabase
    .from("families")
    .select("vpn_blocklist_enabled")
    .eq("id", device.family_id)
    .maybeSingle();

  // Focus-only blocking: only return domains when a focus session is active.
  // Outside focus sessions, the extension blocks nothing.
  const domains = new Set<string>();

  if (session) {
    if (session.blocklist_id) {
      const { data: sites } = await supabase
        .from("blocklist_sites")
        .select("domain")
        .eq("blocklist_id", session.blocklist_id);
      sites?.forEach((s) => domains.add(s.domain));
    }
    if (family?.vpn_blocklist_enabled) {
      VPN_DOMAINS.forEach((d) => domains.add(d));
    }
  }

  return new Response(
    JSON.stringify({
      device_id: device.id,
      device_name: device.name,
      domains: Array.from(domains),
      focus_active: !!session,
      focus_intensity: session?.intensity ?? null,
      focus_ends_at: session?.ends_at ?? null,
      synced_at: nowIso,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
