const WEBLOCK_API = "https://hbqrjxncrswigfffwhxx.supabase.co/functions/v1";
const $ = (id) => document.getElementById(id);

$("go").addEventListener("click", async () => {
  const code = $("code").value.trim();
  if (!/^\d{6}$/.test(code)) {
    $("status").textContent = "Enter all 6 digits";
    $("status").className = "status err";
    return;
  }
  $("go").disabled = true;
  $("status").textContent = "Pairing…";
  $("status").className = "status";
  try {
    const res = await fetch(WEBLOCK_API + "/devices-pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairing_code: code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    await chrome.storage.local.set({ weblockToken: data.device_token });
    try { chrome.runtime.sendMessage({ type: "WEBLOCK_SYNC_NOW" }); } catch (_) {}
    $("status").textContent = "✅ Paired! You can close this tab.";
    $("status").className = "status ok";
  } catch (err) {
    $("status").textContent = "❌ " + (err.message || "Pairing failed");
    $("status").className = "status err";
    $("go").disabled = false;
  }
});
