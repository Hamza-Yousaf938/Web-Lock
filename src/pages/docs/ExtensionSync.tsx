import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ExtensionSync() {
  const downloadExtension = () => {
    fetch("/weblock-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "weblock-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link to="/dashboard/devices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Devices
      </Link>

      <div className="mt-6 mb-10">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Install WebLock for Chrome</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Works in Chrome, Edge, Brave, Arc and any Chromium browser. Takes about 60 seconds.
        </p>
      </div>

      <Card className="border-border bg-gradient-card p-8">
        <div className="text-center">
          <Download className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-display text-xl font-semibold">Step 1 — Download the extension</h2>
          <p className="mt-1 text-sm text-muted-foreground">A small .zip file (~20KB).</p>
          <Button onClick={downloadExtension} size="lg" className="mt-5">
            <Download className="mr-2 h-4 w-4" /> Download weblock-extension.zip
          </Button>
        </div>
      </Card>

      <ol className="mt-8 space-y-5">
        <Step n={2} title="Unzip the file" body="Right-click the downloaded file → Extract All / Open With Archive Utility." />
        <Step n={3} title="Open chrome://extensions" body="Paste chrome://extensions into the address bar and hit Enter. (Use edge://extensions, brave://extensions, etc., on other browsers.)" />
        <Step n={4} title="Enable Developer mode" body="Toggle the Developer mode switch in the top-right corner." />
        <Step n={5} title="Click Load unpacked" body="Select the unzipped weblock-extension folder. The WebLock icon appears in your toolbar — pin it for easy access." />
        <Step n={6} title="Click the WebLock icon → Pair with WebLock Cloud" body="A pair tab opens. Enter the 6-digit pairing code from the Devices page. Done." />
      </ol>

      <Card className="mt-8 border-success/40 bg-success/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
          <div className="text-sm">
            <p className="font-semibold">After pairing</p>
            <p className="mt-1 text-muted-foreground">
              The popup switches to <span className="font-medium text-foreground">Cloud mode</span>. All blocking is then controlled
              from this dashboard — add sites to a blocklist, start a Focus session, or set a schedule, and the extension picks up
              the changes within ~60 seconds. To go back to manual control, click <span className="font-medium text-foreground">Unpair this device</span> in the popup.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4 rounded-xl border border-border bg-surface/30 p-5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
        {n}
      </div>
      <div>
        <h3 className="font-display font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
