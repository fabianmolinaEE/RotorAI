import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Wrench,
  Sparkles,
  Gauge,
  Smartphone,
  Users,
  Building2,
} from "lucide-react";
import { getDataService } from "@/data/dataService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hialeah — shop software built for mechanics" },
      {
        name: "description",
        content:
          "One app, four roles, every ticket pinned to the exact subsystem. Shop software for independent mechanics and dealership service departments.",
      },
      { property: "og:title", content: "Hialeah — shop software built for mechanics" },
      {
        property: "og:description",
        content:
          "One app, four roles, every ticket pinned to the exact subsystem.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Wrench, title: "Tickets pinned to subsystems", body: "Every work order maps to the exact part of the car. No more free-text bay notes." },
  { icon: Sparkles, title: "AI urgency triage", body: "Intake gets graded the moment it lands. High-risk jobs surface before they slip." },
  { icon: Gauge, title: "Quote cost breakdowns", body: "Show labor, parts, supplies, and fees clearly before a quote goes to the customer." },
  { icon: Smartphone, title: "Tech-first mobile flow", body: "Built for greasy hands. One thumb, one tap, no dropdown spelunking." },
  { icon: Users, title: "Customer portal", body: "Owners see what their car needs, not a wall of jargon. Approvals in two taps." },
  { icon: Building2, title: "Dealership ready", body: "Multi-bay, multi-tech, multi-make. Roll it out across a service department." },
];

function Landing() {
  const svc = getDataService();
  const { data: wos = [] } = useQuery({ queryKey: ["wos"], queryFn: () => svc.getWorkOrders() });
  const { data: techs = [] } = useQuery({ queryKey: ["techs"], queryFn: () => svc.getTechnicians() });
  const heroId = "wo_001";

  const active = wos.filter((w) => w.status !== "completed" && w.status !== "invoiced").length;
  const roleCards = [
    { label: "Owner", to: "/owner", body: "P&L, capacity, lead pipeline.", accent: "oklch(0.62 0.18 245)" },
    { label: "Manager", to: "/manager", body: "Today's bay, tasks, intake.", accent: "oklch(0.6 0.18 290)" },
    { label: "Technician", to: "/tech", body: "Your tickets, your tools, your time.", accent: "oklch(0.72 0.16 75)" },
    { label: "Customer", to: "/portal", body: "Your car, plain English.", accent: "oklch(0.62 0.18 162)" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm bg-primary" />
            <span className="text-sm font-semibold tracking-tight">Hialeah</span>
          </div>
          <nav className="ml-10 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#viewer" className="hover:text-foreground">3D viewer</a>
            <a href="#roles" className="hover:text-foreground">Roles</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/owner" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline">Sign in</Link>
            <Link
              to="/demo"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="race-stripes absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-8 left-0 right-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="car-animate h-16 w-auto" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 55 L30 30 L70 20 L130 20 L155 30 L180 52 L190 55 Z" fill="currentColor" opacity="0.07" />
            <path d="M150 55 a18 18 0 0 1 36 0" fill="currentColor" opacity="0.07" />
            <path d="M24 55 a18 18 0 0 1 36 0" fill="currentColor" opacity="0.07" />
          </svg>
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for mechanics, not accountants
            </div>
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
              Shop software that<br />knows the car.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              One app, four roles, every ticket pinned to the exact subsystem.
              For independent mechanics and dealership service departments that
              want to stop fighting their tools.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/demo"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Open the demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/work-orders/$id"
                params={{ id: heroId }}
                className="inline-flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium hover:bg-muted"
              >
                See a live ticket
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
              <span><span className="font-medium text-foreground tabular-nums">{active}</span> open tickets in demo shop</span>
              <span><span className="font-medium text-foreground tabular-nums">{techs.length}</span> technicians on roster</span>
              <span><span className="font-medium text-foreground">4</span> role views, instant switch</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3D viewer teaser */}
      <section id="viewer" className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-primary">3D vehicle ticket</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Click a subsystem.<br />Get the quote, the tools, the tech.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Every ticket opens on the car itself. Front brakes flagged red,
              electrical amber, everything else dim. One glance and the bay
              knows what's wrong.
            </p>
            <Link
              to="/work-orders/$id"
              params={{ id: heroId }}
              className="mt-6 inline-flex h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Open Maria's Civic ticket <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted/30">
            <ViewerStub />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary">Features</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Opinionated where it matters.</h2>
            <p className="mt-3 text-muted-foreground">
              Generic shop tools force mechanics to act like accountants.
              We do the opposite.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card glass-card-interactive rounded-2xl p-6">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles strip */}
      <section id="roles" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary">Four roles, one app</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Switch perspectives instantly.</h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {roleCards.map((r) => (
              <Link
                key={r.label}
                to={r.to}
                className="group rounded-2xl glass-card glass-card-interactive border-t-2 p-5"
                style={{ borderTopColor: r.accent }}
              >
                <div className="text-sm font-semibold tracking-tight">{r.label}</div>
                <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">See it on a real shop's data.</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            The demo is loaded with Hialeah Auto Works — real-shaped tickets,
            real-shaped quotes, every role click-through.
          </p>
          <Link
            to="/demo"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open the demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-primary" />
            Hialeah — shop software
          </div>
          <div>Demo build · seeded with mock data</div>
        </div>
      </footer>
    </div>
  );
}

function ViewerStub() {
  // Stylized SVG stand-in for the future 3D viewer.
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.18 245)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="oklch(0.62 0.18 245)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#g)" />
      {/* car silhouette */}
      <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" fill="none">
        <path d="M60 200 L100 150 L170 130 L260 130 L320 155 L350 200 Z" />
        <line x1="170" y1="130" x2="170" y2="200" />
        <line x1="260" y1="130" x2="260" y2="200" />
        <circle cx="130" cy="210" r="22" />
        <circle cx="310" cy="210" r="22" />
      </g>
      {/* front brakes hot dot */}
      <g>
        <circle cx="130" cy="210" r="10" fill="oklch(0.6 0.22 27)" fillOpacity="0.9" />
        <circle cx="130" cy="210" r="18" fill="oklch(0.6 0.22 27)" fillOpacity="0.18" />
        <text x="148" y="214" fontSize="10" fill="oklch(0.6 0.22 27)" fontFamily="Inter, sans-serif">brakes_front · fix</text>
      </g>
      {/* electrical warm dot */}
      <g>
        <circle cx="215" cy="155" r="7" fill="oklch(0.75 0.16 75)" />
        <circle cx="215" cy="155" r="14" fill="oklch(0.75 0.16 75)" fillOpacity="0.18" />
        <text x="228" y="159" fontSize="10" fill="oklch(0.6 0.16 75)" fontFamily="Inter, sans-serif">electrical · check</text>
      </g>
      <text x="20" y="30" fontSize="10" fill="currentColor" fillOpacity="0.5" fontFamily="Inter, sans-serif">WO-2871 · 2019 Honda Civic · Maria Reyes</text>
    </svg>
  );
}
