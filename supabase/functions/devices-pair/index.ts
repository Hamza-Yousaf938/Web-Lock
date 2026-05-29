import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  pairing_code: z.string().regex(/^\d{6}$/, "Pairing code must be 6 digits"),
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

  const nowIso = new Date().toISOString();

  // Look up device by pairing code (must not be expired, must not be already paired)
  const { data: device, error: lookupErr } = await supabase
    .from("devices")
    .select("id, device_token, paired_at, pairing_code_expires_at")
    .eq("pairing_code", parsed.data.pairing_code)
    .maybeSingle();

  if (lookupErr || !device) {
    return new Response(JSON.stringify({ error: "Invalid pairing code" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (device.paired_at) {
    return new Response(JSON.stringify({ error: "Code already used" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!device.pairing_code_expires_at || new Date(device.pairing_code_expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Pairing code expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Mark paired, clear pairing code
  await supabase.from("devices").update({
    paired_at: nowIso,
    last_seen_at: nowIso,
    pairing_code: null,
    pairing_code_expires_at: null,
  }).eq("id", device.id);

  return new Response(
    JSON.stringify({ device_token: device.device_token, paired_at: nowIso }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
