// WebLock popup — auto-switches between local and cloud mode.
const $ = (id) => document.getElementById(id);
const DASHBOARD_URL = "https://id-preview--2d4a9409-6b51-4123-aa12-cb817eee057a.lovable.app/dashboard";

function normalize(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function fmtTimeLeft(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "ending…";
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m left`;
  return `${mins}m left`;
}

async function render() {
  const state = await chrome.runtime.sendMessage({ type: "WEBLOCK_GET_STATE" });
  if (!state) return;

  const badge = $("modeBadge");
  if (state.mode === "cloud") {
    badge.textContent = "Cloud";
    badge.className = "badge cloud";
    $("localView").classList.add("hidden");
    $("cloudView").classList.remove("hidden");
    renderCloud(state.cloudStatus);
  } else {
    badge.textContent = "Local";
    badge.className = "badge local";
    $("cloudView").classList.add("hidden");
    $("localView").classList.remove("hidden");
    renderLocal(state.localBlocklist || [], state.localEnabled !== false);
  }
}

function renderLocal(sites, enabled) {
  $("enableToggle").checked = enabled;
  const ul = $("siteList");
  ul.innerHTML = "";
  sites.forEach((s) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = s;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.textContent = "×";
    btn.title = "Remove";
    btn.addEventListener("click", () => removeSite(s));
    li.appendChild(span);
    li.appendChild(btn);
    ul.appendChild(li);
  });
  $("emptyHint").classList.toggle("hidden", sites.length > 0);
}

function renderCloud(status) {
  if (!status) {
    $("deviceName").textContent = "Syncing…";
    $("domainCount").textContent = "—";
    $("focusState").textContent = "—";
    return;
  }
  $("deviceName").textContent = status.device_name ? `Paired as: ${status.device_name}` : "Paired";
  $("domainCount").textContent = String(status.domain_count ?? 0);
  const fs = $("focusState");
  if (status.focus_active) {
    fs.textContent = (status.focus_intensity || "on").toUpperCase();
    fs.classList.add("active");
    const t = $("focusTimer");
    t.classList.remove("hidden");
    t.textContent = `🎯 Focus session — ${fmtTimeLeft(status.focus_ends_at)}`;
  } else {
    fs.textContent = "Off";
    fs.classList.remove("active");
    $("focusTimer").classList.add("hidden");
  }
  $("syncedAt").textContent = status.synced_at
    ? new Date(status.synced_at).toLocaleTimeString()
    : "—";
}

async function addSite() {
  const raw = $("newDomain").value;
  const domain = normalize(raw);
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    alert("Enter a valid domain like example.com");
    return;
  }
  const { localBlocklist = [] } = await chrome.storage.local.get("localBlocklist");
  if (localBlocklist.includes(domain)) {
    $("newDomain").value = "";
    return;
  }
  await chrome.storage.local.set({ localBlocklist: [...localBlocklist, domain] });
  $("newDomain").value = "";
  render();
}

async function removeSite(domain) {
  const { localBlocklist = [] } = await chrome.storage.local.get("localBlocklist");
  await chrome.storage.local.set({
    localBlocklist: localBlocklist.filter((d) => d !== domain),
  });
  render();
}

async function toggleEnabled(e) {
  await chrome.storage.local.set({ localEnabled: e.target.checked });
}

async function unpair() {
  if (!confirm("Unpair this device? Cloud rules will stop applying.")) return;
  await chrome.storage.local.remove(["weblockToken", "cloudStatus"]);
  render();
}

// ---------- wire up ----------
document.addEventListener("DOMContentLoaded", () => {
  render();
  $("addBtn").addEventListener("click", addSite);
  $("newDomain").addEventListener("keydown", (e) => { if (e.key === "Enter") addSite(); });
  $("enableToggle").addEventListener("change", toggleEnabled);
  $("pairBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("openDashBtn").addEventListener("click", () => chrome.tabs.create({ url: DASHBOARD_URL }));
  $("syncNowBtn").addEventListener("click", async () => {
    $("syncNowBtn").textContent = "Syncing…";
    await chrome.runtime.sendMessage({ type: "WEBLOCK_SYNC_NOW" });
    setTimeout(() => { $("syncNowBtn").textContent = "Sync now"; render(); }, 600);
  });
  $("unpairBtn").addEventListener("click", unpair);
});

chrome.storage.onChanged.addListener(render);
