import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  device_token: z.string().min(20).max(200),
  domain: z.string().min(3).max(253),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: device } = await supabase
    .from("devices")
    .select("id, family_id, child_id")
    .eq("device_token", parsed.data.device_token)
    .maybeSingle();

  if (!device) {
    return new Response(JSON.stringify({ error: "Unknown device" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { error } = await supabase.from("block_events").insert({
    family_id: device.family_id,
    device_id: device.id,
    child_id: device.child_id,
    domain: parsed.data.domain.toLowerCase(),
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  await supabase.from("devices").update({ last_seen_at: new Date().toISOString() }).eq("id", device.id);

  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
