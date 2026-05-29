import { Link } from "react-router-dom";
import { ArrowRight, Shield, Smartphone, Chrome, Apple, Lock, Calendar, Activity, Users, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const features = [
  { icon: Shield, title: "Focus modes", desc: "Study, Exam, Assignment & custom profiles. One-click lock-in." },
  { icon: Users, title: "Per-child profiles", desc: "Different rules for each kid. Avatars, ages, screen-time goals." },
  { icon: Calendar, title: "Smart schedules", desc: "Block social Mon–Fri 8am–3pm. Bedtime rules. Auto on/off." },
  { icon: Ban, title: "VPN bypass blocking", desc: "Pre-loaded list of known VPN domains so kids can't tunnel around the rules." },
  { icon: Lock, title: "Parent PIN & Nuclear mode", desc: "Lock the rules so they can't be disabled mid-session — not even by you." },
  { icon: Activity, title: "Real stats per child", desc: "See attempts blocked, focus minutes, top distractions." },
];

const platforms = [
  { icon: Chrome, name: "Chrome Extension", status: "Available now", available: true },
  { icon: Smartphone, name: "Android App", status: "Coming soon", available: false },
  { icon: Apple, name: "iOS App", status: "Planned", available: false },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Now syncing across devices
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Block distractions <span className="text-gradient">everywhere</span> your family browses.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              One dashboard controls every device — Chrome, Android, iOS. Even blocks the VPN bypasses kids try to install.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="shadow-glow">
                <Link to="/auth?mode=signup">Get started free <ArrowRight className="ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#platforms">See platforms</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card. Free for one device, forever.</p>
          </div>

          {/* Hero card preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="relative rounded-2xl border border-border bg-gradient-card p-2 shadow-elevated">
              <div className="rounded-xl bg-surface p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                      <Shield className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold">Maya's Chromebook</p>
                      <p className="text-xs text-muted-foreground">Study mode · 47 min remaining</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Active</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Blocked today", val: "23" },
                    { label: "Focus minutes", val: "94" },
                    { label: "Top blocked", val: "tiktok.com" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-surface-elevated p-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="mt-1 font-display text-xl font-bold">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-border/50 bg-surface/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Set up in 3 minutes</h2>
            <p className="mt-3 text-muted-foreground">No technical skills. No router config. Just install and lock.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Create your family", d: "Sign up as the parent. Add your kids' profiles." },
              { n: "02", t: "Pair their devices", d: "Install the Chrome extension (or future Android app), enter a 6-digit code." },
              { n: "03", t: "Set the rules", d: "Pick blocklists, schedules, or one-tap focus modes. Done." },
            ].map((s) => (
              <Card key={s.n} className="border-border bg-gradient-card p-6">
                <p className="font-display text-3xl font-bold text-primary">{s.n}</p>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Built for real focus, not lip service.</h2>
            <p className="mt-3 text-muted-foreground">The features parents and students actually need.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border bg-gradient-card p-6 transition hover:border-primary/40 hover:shadow-glow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section id="platforms" className="border-t border-border/50 bg-surface/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">One brain. Every device.</h2>
            <p className="mt-3 text-muted-foreground">Edit rules once on the web. They sync down to every paired device.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {platforms.map((p) => (
              <Card key={p.name} className="border-border bg-gradient-card p-6 text-center">
                <p.icon className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-4 font-display text-base font-semibold">{p.name}</h3>
                <p className={`mt-1 text-xs ${p.available ? "text-success" : "text-muted-foreground"}`}>{p.status}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="container max-w-3xl">
          <h2 className="text-center font-display text-4xl font-bold">Questions, answered.</h2>
          <Accordion type="single" collapsible className="mt-10">
            {[
              { q: "How does WebLock block sites if mobile Chrome doesn't support extensions?", a: "Our upcoming Android app uses Android's VpnService API to create a local DNS filter — no root needed. It blocks sites in every browser and app, not just Chrome. iOS will use Network Extension." },
              { q: "Can my kid bypass it with a VPN?", a: "No. WebLock ships with a pre-loaded VPN-domain blocklist that prevents downloads of common VPN apps and blocks their connection servers. You can toggle it with one switch." },
              { q: "Does the Chrome extension still work standalone?", a: "Yes. The extension can run with local rules only, OR sync with your WebLock cloud account for cross-device control." },
              { q: "What's Nuclear mode?", a: "Once activated, Nuclear mode requires the parent PIN to disable — even you can't break focus mid-session. Perfect for exams." },
              { q: "Is it free?", a: "Free for one paired device per family. Unlimited devices on the upcoming family plan." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="border-border">
                <AccordionTrigger className="font-display text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 py-20">
        <div className="container">
          <Card className="mx-auto max-w-3xl border-border bg-gradient-card p-12 text-center shadow-elevated">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to give your family their focus back?</h2>
            <p className="mt-3 text-muted-foreground">Set up your family workspace in under three minutes.</p>
            <Button asChild size="lg" className="mt-8 shadow-glow">
              <Link to="/auth?mode=signup">Create your family account <ArrowRight className="ml-1" /></Link>
            </Button>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {["No credit card", "Free forever for 1 device", "Cancel anytime"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
