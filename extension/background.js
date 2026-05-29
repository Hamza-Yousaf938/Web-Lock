// WebLock background service worker — single source of truth for blocking rules.
// Mode is decided by presence of weblockToken in chrome.storage.local:
//   - cloud  → poll sync-rules API + Realtime push, honor focus sessions only
//   - local  → use localBlocklist from storage
// applyRules() is the ONLY place chrome.declarativeNetRequest is touched.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = "https://hbqrjxncrswigfffwhxx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhicXJqeG5jcnN3aWdmZmZ3aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjE1MzcsImV4cCI6MjA5MTk5NzUzN30._NValK6tiZG4VV5cYRrG10o7WDDXVqd0nEo7-RVKZ4E";
const WEBLOCK_API = `${SUPABASE_URL}/functions/v1`;
const SYNC_ALARM = "weblock-sync";
const SYNC_INTERVAL_MIN = 1; // 60 seconds — fallback safety net
const RULE_ID_BASE = 1000;

let realtimeClient = null;
let realtimeChannel = null;
let realtimeDeviceId = null;

// ---------- helpers ----------
async function getMode() {
  const { weblockToken } = await chrome.storage.local.get("weblockToken");
  return weblockToken ? "cloud" : "local";
}

function buildRules(domains) {
  return domains.slice(0, 4500).map((domain, i) => ({
    id: RULE_ID_BASE + i,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame", "sub_frame"],
    },
  }));
}

async function clearAllRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((r) => r.id),
    });
  }
}

async function applyRules(domains) {
  await clearAllRules();
  if (!domains || !domains.length) {
    console.log("[WebLock] Cleared all block rules");
    return;
  }
  const rules = buildRules(domains);
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
  console.log(`[WebLock] Applied ${rules.length} block rules`);
}

// ---------- local mode ----------
async function applyLocal() {
  const { localBlocklist = [], localEnabled = true } = await chrome.storage.local.get([
    "localBlocklist",
    "localEnabled",
  ]);
  if (!localEnabled) {
    await clearAllRules();
    return;
  }
  await applyRules(localBlocklist);
}

// ---------- cloud mode ----------
async function syncCloud() {
  const { weblockToken } = await chrome.storage.local.get("weblockToken");
  if (!weblockToken) return applyLocal();
  try {
    const url = `${WEBLOCK_API}/sync-rules?deviceToken=${encodeURIComponent(weblockToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[WebLock] sync-rules HTTP", res.status);
      return;
    }
    const data = await res.json();
    await chrome.storage.local.set({
      cloudStatus: {
        device_id: data.device_id || null,
        device_name: data.device_name || null,
        domain_count: (data.domains || []).length,
        focus_active: !!data.focus_active,
        focus_intensity: data.focus_intensity || null,
        focus_ends_at: data.focus_ends_at || null,
        synced_at: data.synced_at || new Date().toISOString(),
      },
    });
    await applyRules(data.domains || []);

    // Ensure realtime is subscribed for this device
    if (data.device_id && data.device_id !== realtimeDeviceId) {
      await setupRealtime(data.device_id);
    }
  } catch (err) {
    console.error("[WebLock] sync failed", err);
  }
}

// ---------- realtime push ----------
async function setupRealtime(deviceId) {
  try {
    await teardownRealtime();
    if (!realtimeClient) {
      realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    realtimeDeviceId = deviceId;
    realtimeChannel = realtimeClient
      .channel(`weblock-focus-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "focus_sessions",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log("[WebLock] focus_sessions change", payload.eventType);
          syncCloud();
        },
      )
      .subscribe((status) => {
        console.log("[WebLock] realtime status:", status);
      });
  } catch (err) {
    console.error("[WebLock] realtime setup failed", err);
  }
}

async function teardownRealtime() {
  if (realtimeChannel && realtimeClient) {
    try {
      await realtimeClient.removeChannel(realtimeChannel);
    } catch (_) {}
  }
  realtimeChannel = null;
  realtimeDeviceId = null;
}

// ---------- master tick ----------
async function tick() {
  const mode = await getMode();
  if (mode === "cloud") {
    await syncCloud();
  } else {
    await teardownRealtime();
    await applyLocal();
  }
}

// ---------- events ----------
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_INTERVAL_MIN });
  await tick();
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_INTERVAL_MIN });
  await tick();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) tick();
});

// React to popup / pair page changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.weblockToken || changes.localBlocklist || changes.localEnabled) {
    tick();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "WEBLOCK_SYNC_NOW") {
    tick().then(() => sendResponse({ ok: true }));
    return true; // async
  }
  if (msg?.type === "WEBLOCK_GET_STATE") {
    (async () => {
      const mode = await getMode();
      const state = await chrome.storage.local.get([
        "localBlocklist",
        "localEnabled",
        "cloudStatus",
        "weblockToken",
      ]);
      sendResponse({ mode, ...state });
    })();
    return true;
  }
});
