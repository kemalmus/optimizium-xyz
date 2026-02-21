'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [introStarted, setIntroStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [widgetStatus, setWidgetStatus] = useState<"idle" | "loading" | "ready" | "warning">("idle");
  const [warningText, setWarningText] = useState("");

  const urlParams = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }, []);

  const lang = urlParams.lang || "pl";
  const agentId = urlParams.agent_id || null;

  const dynamicVars = useMemo(() => {
    const mapping: Record<string, string> = {
      lead_id: "lead_id",
      company: "company",
      contact_name: "contact_name",
      lang: "lang",
      offer_version: "offer_version",
      campaign: "campaign",
      sender_name: "sender_name"
    };
    const vars: Record<string, string> = {};
    for (const [urlKey, widgetKey] of Object.entries(mapping)) {
      if (urlParams[urlKey]) vars[widgetKey] = urlParams[urlKey];
    }
    if (!vars.lang) vars.lang = "pl";
    if (!vars.offer_version) vars.offer_version = "recruitment-v1";
    return vars;
  }, [urlParams]);

  const greeting = useMemo(() => {
    if (urlParams.contact_name && urlParams.company)
      return `${urlParams.contact_name} z ${urlParams.company}`;
    return urlParams.contact_name || urlParams.company || null;
  }, [urlParams]);

  useEffect(() => {
    if (!agentId) {
      setWidgetStatus("warning");
      setWarningText(
        lang === "en"
          ? "Agent ID not configured. Add ?agent_id=YOUR_ID to URL."
          : "Brak Agent ID. Dodaj ?agent_id=YOUR_ID do URL."
      );
      return;
    }

    setWidgetStatus("loading");

    // Check if script is already loaded
    if (typeof document !== 'undefined' && document.querySelector('script[src*="convai-widget-embed"]')) {
      createWidget();
      return;
    }

    // Load ElevenLabs widget script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    script.onload = () => createWidget();
    script.onerror = () => {
      setWidgetStatus("warning");
      setWarningText(
        lang === "en"
          ? "Failed to load widget. Refresh the page."
          : "Nie udało się załadować widgetu. Odśwież stronę."
      );
    };
    document.head.appendChild(script);

    function createWidget() {
      const container = document.getElementById("elevenlabs-widget-container");
      if (container && agentId) {
        container.innerHTML = "";
        const widget = document.createElement("elevenlabs-convai");
        widget.setAttribute("agent-id", agentId);
        if (Object.keys(dynamicVars).length > 0) {
          widget.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));
        }
        if (dynamicVars.lang) {
          widget.setAttribute("override-language", dynamicVars.lang);
        }
        container.appendChild(widget);
        setWidgetStatus("ready");
      }
    }
  }, [agentId, dynamicVars, lang]);

  const t = {
    title: lang === "en" ? "Talk to our AI Assistant" : "Porozmawiaj z asystentem AI ds. Oferty",
    subtitle:
      lang === "en"
        ? "Learn how AI can streamline your recruitment agency"
        : "Dowiedz się, jak AI może usprawnić pracę Twojej agencji rekrutacyjnej",
    features:
      lang === "en"
        ? ["4 half-day practical workshops", "Ongoing online retainer support", "AI implementation support"]
        : ["4 półdniowe warsztaty praktyczne", "Bieżące wsparcie retainerowe online", "Wsparcie przy wdrożeniach AI"],
    widgetTitle: lang === "en" ? "Start Conversation" : "Rozpocznij rozmowę",
    widgetSubtitle: lang === "en" ? "Click below to talk with the assistant" : "Kliknij poniżej, aby porozmawiać z asystentem",
    loading: lang === "en" ? "Loading widget..." : "Ładowanie widgetu...",
    ready: lang === "en" ? "Widget ready to talk" : "Widget gotowy do rozmowy",
    welcome: lang === "en" ? "Welcome" : "Witamy",
    footer: lang === "en" ? "This conversation is powered by AI." : "Ta rozmowa jest obsługiwana przez AI.",
  };

  // Intro video functionality
  const handleIntroStart = () => {
    if (!introStarted && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
      setIntroStarted(true);
    }
  };

  return (
    <>
      {/* Intro Video */}
      {!introDone && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background cursor-pointer"
          onClick={handleIntroStart}
        >
          <video
            ref={videoRef}
            src="/logo-text-final.mp4"
            playsInline
            onEnded={() => setIntroDone(true)}
            className="max-w-[80%] max-h-[80%] object-contain"
          />
          {!introStarted && (
            <button className="mt-10 start-button">
              <span className="start-button-icon">
                ▶
              </span>
              <span>Start Experience</span>
              <span className="start-button-ping" />
            </button>
          )}
        </div>
      )}

      <div className={`flex min-h-screen flex-col relative overflow-hidden transition-opacity duration-700 ${introDone ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-purple/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass-card">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/optimizium_logo.png"
                alt="Optimizium"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-wide text-brand-teal">
              OΠTIMIZIUM
            </span>
          </div>
          <span className="hidden sm:inline-block bg-primary rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
            AI Consulting
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[520px] space-y-6">
          {/* Welcome Card */}
          <div className="glass-card holographic-border rounded-2xl overflow-hidden glow-purple">
            {/* Card Header */}
            <div className="bg-primary px-6 py-8 text-center">
              <h1 className="text-2xl font-bold text-primary-foreground mb-2">{t.title}</h1>
              <p className="text-primary-foreground/80 text-[15px] leading-relaxed">{t.subtitle}</p>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {greeting && (
                <div className="mb-4 rounded-lg bg-muted/50 p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{t.welcome}</div>
                  <div className="font-semibold text-foreground">{greeting}</div>
                </div>
              )}

              <div className="space-y-3">
                {t.features.map((feature, i) =>
                  <div key={i} className="flex items-start gap-3 text-[15px] text-muted-foreground">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-success text-[11px] text-primary-foreground font-bold">
                      ✓
                    </div>
                    <span>{feature}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Widget Card */}
          <div className="glass-card rounded-2xl p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-1">{t.widgetTitle}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t.widgetSubtitle}</p>

            <div id="elevenlabs-widget-container">
              {widgetStatus === "idle" || widgetStatus === "warning" ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                  <div className="text-4xl mb-3">🎙️</div>
                  <div className="font-semibold text-foreground mb-1">Widget konfiguracja</div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Aby uruchomić widget, ustaw <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">AGENT_ID</code> w URL.
                  </p>
                  <div className="rounded-md bg-muted border border-border px-3 py-2 font-mono text-xs text-foreground overflow-x-auto">
                    ?agent_id=YOUR_AGENT_ID
                  </div>
                </div>
              ) : null}
            </div>

            {/* Status Messages */}
            {widgetStatus === "loading" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-secondary/20 border border-secondary/30 px-4 py-3 text-sm text-secondary">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-secondary" />
                <span>{t.loading}</span>
              </div>
            )}
            {widgetStatus === "ready" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-success/10 border border-brand-success/30 px-4 py-3 text-sm text-brand-success">
                <span>✓</span>
                <span>{t.ready}</span>
              </div>
            )}
            {widgetStatus === "warning" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-warning/10 border border-brand-warning/30 px-4 py-3 text-sm text-brand-warning">
                <span>⚠</span>
                <span>{warningText}</span>
              </div>
            )}
          </div>

          {/* Debug Panel */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button
              onClick={() => setDebugOpen(!debugOpen)}
              className="w-full flex items-center justify-between bg-muted/30 px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span>🔧 Debug: Dynamic Variables</span>
              <span className="text-sm">{debugOpen ? "▼" : "▶"}</span>
            </button>
            {debugOpen && (
              <div className="p-4">
                <pre className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(
                    { urlParams, dynamicVariables: dynamicVars, agentId: agentId || "NOT CONFIGURED" },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-muted-foreground">
        <p>
          Asystent AI reprezentujący{" "}
          <span className="text-brand-teal font-semibold">Optimizium</span>{" "}
          · v{urlParams.offer_version || "1.0"}
        </p>
        <p className="mt-1 opacity-70">{t.footer}</p>
      </footer>
    </div>
    </>);
}
