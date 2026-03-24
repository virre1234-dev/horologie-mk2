"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const CONDITIONS = ["Mint / Oanvänd", "Utmärkt", "Mycket bra", "Bra", "Godkänt", "Slitet"];
const COMPONENT_CONDITIONS = ["Utmärkt", "Mycket bra", "Bra", "Repor/Märken", "Slitet"];
const SERVICE_OPTIONS = ["Okänd servicehistorik", "Aldrig servad", "Servad – 0–2 år sedan", "Servad – 3–5 år sedan", "Servad – 6+ år sedan"];
const BRANDS = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "IWC", "Breitling", "TAG Heuer", "Vacheron Constantin", "Jaeger-LeCoultre", "Other"];
const VALUATION_SITES = ["chrono24", "bobswatches", "storiesoftime", "chrono.dk", "luxurywatches.se"];
const STATUS_COLORS: Record<string, string> = { inkommen: "#fbbf24", värderad: "#60a5fa", skickad: "#4ade80" };
const EMPTY_FORM = {
  brand: "", model: "", reference: "", year: "", condition: "", dialColor: "",
  caseCondition: "", crystalCondition: "", braceletCondition: "",
  service: "", hasBox: false, hasPapers: false, clientName: "", clientEmail: "", notes: ""
};

export default function App() {
  const [view, setView] = useState("inbox");
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState
cat > app/page.tsx << 'EOF'
"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const CONDITIONS = ["Mint / Oanvänd", "Utmärkt", "Mycket bra", "Bra", "Godkänt", "Slitet"];
const COMPONENT_CONDITIONS = ["Utmärkt", "Mycket bra", "Bra", "Repor/Märken", "Slitet"];
const SERVICE_OPTIONS = ["Okänd servicehistorik", "Aldrig servad", "Servad – 0–2 år sedan", "Servad – 3–5 år sedan", "Servad – 6+ år sedan"];
const BRANDS = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "IWC", "Breitling", "TAG Heuer", "Vacheron Constantin", "Jaeger-LeCoultre", "Other"];
const VALUATION_SITES = ["chrono24", "bobswatches", "storiesoftime", "chrono.dk", "luxurywatches.se"];
const STATUS_COLORS: Record<string, string> = { inkommen: "#fbbf24", värderad: "#60a5fa", skickad: "#4ade80" };
const EMPTY_FORM = {
  brand: "", model: "", reference: "", year: "", condition: "", dialColor: "",
  caseCondition: "", crystalCondition: "", braceletCondition: "",
  service: "", hasBox: false, hasPapers: false, clientName: "", clientEmail: "", notes: ""
};

export default function App() {
  const [view, setView] = useState("inbox");
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "Söker Chrono24...", "Kollar Bob's Watches...", "Analyserar Stories of Time...",
    "Hämtar data från Chrono.dk...", "Kollar LuxuryWatches.se...",
    "Beräknar marknadsvärde...", "Skriver kundbrev..."
  ];

  useEffect(() => { fetchCases(); }, []);

  async function fetchCases() {
    setLoadingCases(true);
    setFetchError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/watches?order=created_at.desc&select=*`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(`Fel: ${JSON.stringify(data)}`);
        setCases([]);
      } else {
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setFetchError(`Nätverksfel: ${err.message}`);
    }
    setLoadingCases(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/watches?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", "Prefer": "return=minimal"
      },
      body: JSON.stringify({ status })
    });
    fetchCases();
  }

  function openCase(c: any) {
    setSelected(c);
    setForm({
      brand: c.brand || "", model: c.model || "", reference: c.reference || "",
      year: c.year || "", condition: c.condition || "", dialColor: c.dial_color || "",
      caseCondition: c.case_condition || "", crystalCondition: c.crystal_condition || "",
      braceletCondition: c.bracelet_condition || "", service: c.service || "",
      hasBox: c.has_box || false, hasPapers: c.has_papers || false,
      clientName: c.client_name || "", clientEmail: c.client_email || "", notes: c.notes || ""
    });
    setResult(null);
    setStep("form");
    setView("valuation");
  }

  function newValuation() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setResult(null);
    setStep("form");
    setView("valuation");
  }

  async function handleValuate() {
    if (!form.brand || !form.model || !form.condition) return;
    setStep("loading");
    for (let i = 0; i < loadingMessages.length; i++) {
      setLoadingMsg(loadingMessages[i]);
      await new Promise(r => setTimeout(r, 800));
    }

    const prompt = `You are an expert luxury watch appraiser specialising in the Swedish and Nordic resale market. Search the web for current prices on Chrono24, Bob's Watches, Stories of Time (storiesoftime.com/sv), Chrono.dk and LuxuryWatches.se before valuing.

Watch Details:
- Brand: ${form.brand}
- Model: ${form.model}
- Reference number: ${form.reference || "Not provided"}
- Year: ${form.year || "Unknown"}
- Overall condition: ${form.condition}
- Dial color: ${form.dialColor || "Not specified"}
- Case condition: ${form.caseCondition || "Not specified"}
- Crystal/glass condition: ${form.crystalCondition || "Not specified"}
- Bracelet/strap condition: ${form.braceletCondition || "Not specified"}
- Service history: ${form.service || "Unknown"}
- Original box: ${form.hasBox ? "Yes" : "No"}
- Papers/certificate: ${form.hasPapers ? "Yes" : "No"}
- Additional notes: ${form.notes || "None"}

IMPORTANT: Search the web for current listing prices before responding. Base your valuation on real current market data in SEK for the Nordic market.

CRITICAL: Respond ONLY with a raw JSON object. No text before or after. Start with { end with }.

{
  "lowPrice": number,
  "midPrice": number,
  "highPrice": number,
  "recommendedPrice": number,
  "buyInPrice": number (recommendedPrice * 0.85 rounded to nearest 500),
  "reasoning": "3-4 sentences referencing actual current market prices found online",
  "conditionNotes": "1-2 sentences on how condition affected price",
  "marketTrend": "rising" or "stable" or "falling",
  "emailSubject": "string in Swedish",
  "emailBody": "Professional warm email in Swedish to ${form.clientName || "kunden"} presenting the buy-in offer. Do not reveal internal valuation or margins. Sign off from Värderingsteamet."
}`;

    try {
      const res = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      const text = data.content.map((i: any) => i.text || "").filter(Boolean).join("\n");
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setStep("result");
      if (selected) updateStatus(selected.id, "värderad");
    } catch {
      setResult({ error: true });
      setStep("result");
    }
  }

  function fmt(n: number) { return n ? Number(n).toLocaleString("sv-SE") + " kr" : "N/A"; }
  function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }

  const trendColor = result?.marketTrend === "rising" ? "#4ade80" : result?.marketTrend === "falling" ? "#f87171" : "#fbbf24";
  const trendIcon = result?.marketTrend === "rising" ? "↑" : result?.marketTrend === "falling" ? "↓" : "→";

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${result.emailSubject}\n\n${result.emailBody}`);
    setCopied(true);
    if (selected) updateStatus(selected.id, "skickad");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    document.cookie = "horologie-auth=; path=/; max-age=0";
    window.location.href = "/login";
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase" as const, display: "block", marginBottom: 6, fontFamily: "Montserrat, sans-serif" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(180,140,80,0.07) 0%, transparent 60%)", fontFamily: "Georgia, serif", color: "#e8e0d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .mt { font-family: 'Montserrat', sans-serif; }
        input, select, textarea { background: rgba(255,255,255,0.04); border: 1px solid rgba(180,140,80,0.25); color: #e8e0d0; border-radius: 2px; padding: 10px 14px; width: 100%; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 300; outline: none; transition: border-color 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: rgba(180,140,80,0.6); }
        select option { background: #1a1a1a; }
        .gold-btn { background: linear-gradient(135deg, #b48c50, #d4a853, #b48c50); color: #0a0a0a; border: none; padding: 12px 28px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: opacity 0.2s, transform 0.1s; }
        .gold-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .gold-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .ghost-btn { background: transparent; color: #b48c50; border: 1px solid rgba(180,140,80,0.4); padding: 10px 20px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: all 0.2s; }
        .ghost-btn:hover { border-color: #b48c50; background: rgba(180,140,80,0.05); }
        .nav-btn { background: transparent; color: #666; border: none; padding: 8px 16px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .nav-btn.active { color: #d4a853; border-bottom-color: #d4a853; }
        .nav-btn:hover { color: #b48c50; }
        .toggle { width: 40px; height: 22px; border-radius: 11px; border: 1px solid rgba(180,140,80,0.4); background: rgba(255,255,255,0.05); position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
        .toggle.on { background: linear-gradient(135deg, #b48c50, #d4a853); border-color: #d4a853; }
        .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; background: #e8e0d0; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; }
        .toggle.on::after { left: 20px; }
        .case-row { padding: 16px 20px; border-bottom: 1px solid rgba(180,140,80,0.08); cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .case-row:hover { background: rgba(180,140,80,0.05); }
        .price-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(180,140,80,0.2); border-radius: 2px; padding: 16px; text-align: center; }
        .email-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(180,140,80,0.2); border-radius: 2px; padding: 24px; white-space: pre-wrap; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 300; line-height: 1.8; color: #c8c0b0; }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(180,140,80,0.2); border-top-color: #b48c50; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .divider { border: none; border-top: 1px solid rgba(180,140,80,0.12); margin: 24px 0; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(180,140,80,0.2)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div>
            <div className="cg" style={{ fontSize: 22, fontWeight: 300, letterSpacing: 3, color: "#d4a853" }}>HOROLOGIE</div>
            <div className="mt" style={{ fontSize: 8, letterSpacing: 4, color: "#666", textTransform: "uppercase" }}>Watch Valuation System</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`nav-btn${view === "inbox" ? " active" : ""}`} onClick={() => setView("inbox")}>
              Inkorgen {cases.filter(c => c.status === "inkommen").length > 0 && (
                <span style={{ background: "#d4a853", color: "#0a0a0a", borderRadius: 10, padding: "1px 6px", fontSize: 9, marginLeft: 4 }}>
                  {cases.filter(c => c.status === "inkommen").length}
                </span>
              )}
            </button>
            <button className={`nav-btn${view === "valuation" ? " active" : ""}`} onClick={newValuation}>Ny värdering</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {VALUATION_SITES.map((s, i) => (
              <div key={i} className="mt" style={{ fontSize: 8, letterSpacing: 1, color: "#444", padding: "3px 7px", border: "1px solid rgba(180,140,80,0.1)", borderRadius: 1 }}>{s.toUpperCase()}</div>
            ))}
          </div>
          <button onClick={handleLogout} className="ghost-btn" style={{ padding: "6px 14px", fontSize: 9 }}>Logga ut</button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px" }}>

        {/* INBOX */}
        {view === "inbox" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <div className="cg" style={{ fontSize: 32, fontWeight: 300 }}>Inkorgen</div>
                <div className="mt" style={{ fontSize: 11, color: "#666", marginTop: 4, fontWeight: 300 }}>{cases.length} ärenden totalt</div>
              </div>
              <button className="ghost-btn" onClick={fetchCases}>↻ Uppdatera</button>
            </div>

            {fetchError && (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 2, padding: "12px 16px", marginBottom: 16 }}>
                <div className="mt" style={{ fontSize: 11, color: "#f87171", fontWeight: 300 }}>{fetchError}</div>
              </div>
            )}

            {loadingCases ? (
              <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : cases.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div className="cg" style={{ fontSize: 22, marginBottom: 8 }}>Inga ärenden ännu</div>
                <div className="mt" style={{ fontSize: 12, fontWeight: 300 }}>Inkomna värderingsförfrågningar visas här</div>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(180,140,80,0.15)", borderRadius: 2 }}>
                {cases.map((c, i) => (
                  <div key={c.id} className="case-row" onClick={() => openCase(c)} style={{ borderTop: i === 0 ? "none" : undefined }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span className="cg" style={{ fontSize: 17, fontWeight: 300 }}>{c.brand} {c.model}</span>
                        {c.reference && <span className="mt" style={{ fontSize: 10, color: "#666", fontWeight: 300 }}>Ref. {c.reference}</span>}
                      </div>
                      <div className="mt" style={{ fontSize: 11, color: "#666", fontWeight: 300 }}>
                        {c.client_name && <span>{c.client_name} · </span>}
                        {c.client_email && <span>{c.client_email} · </span>}
                        {c.condition}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div className="mt" style={{ fontSize: 10, color: "#555", fontWeight: 300 }}>{fmtDate(c.created_at)}</div>
                      <div className="mt" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: STATUS_COLORS[c.status] || "#666", padding: "3px 8px", border: `1px solid ${STATUS_COLORS[c.status] || "#666"}`, borderRadius: 10, opacity: 0.8 }}>{c.status}</div>
                      <span style={{ color: "#444", fontSize: 14 }}>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VALUATION */}
        {view === "valuation" && (
          <div className="fade-in">
            {selected && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <button className="ghost-btn" onClick={() => setView("inbox")}>← Inkorgen</button>
                <div className="mt" style={{ fontSize: 11, color: "#666", fontWeight: 300 }}>
                  Ärende: <span style={{ color: "#b48c50" }}>{selected.brand} {selected.model}</span>
                  {selected.client_name && <span> · {selected.client_name}</span>}
                </div>
              </div>
            )}

            {step === "form" && (
              <>
                <div className="cg" style={{ fontSize: 32, fontWeight: 300, marginBottom: 6, lineHeight: 1.1 }}>
                  {selected ? "Kör värdering" : "Ny värdering"}<br />
                  <em style={{ color: "#b48c50", fontSize: 28 }}>{selected ? `${selected.brand} ${selected.model}` : "manuell inmatning"}</em>
                </div>
                <div className="mt" style={{ fontSize: 12, color: "#777", letterSpacing: 1, marginBottom: 36, fontWeight: 300 }}>Fyll i detaljer och kör värderingen</div>

                {selected?.image_urls?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div className="mt" style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Bilder från kunden</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {selected.image_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 2, border: "1px solid rgba(180,140,80,0.2)" }} alt="watch" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Klockdetaljer</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {field("Märke *", <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}><option value="">Välj märke</option>{BRANDS.map(b => <option key={b}>{b}</option>)}</select>)}
                  {field("Modell *", <input placeholder="t.ex. Submariner Date" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />)}
                  {field("Referensnummer", <input placeholder="t.ex. 126610LN" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />)}
                  {field("Årsmodell", <input placeholder="t.ex. 2020" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />)}
                  {field("Generellt skick *", <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option value="">Välj skick</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Urtavlans färg", <input placeholder="t.ex. Svart, Blå sunburst" value={form.dialColor} onChange={e => setForm({ ...form, dialColor: e.target.value })} />)}
                </div>

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Detaljerat skick</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {field("Boett", <select value={form.caseCondition} onChange={e => setForm({ ...form, caseCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Glas / Kristall", <select value={form.crystalCondition} onChange={e => setForm({ ...form, crystalCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Armband / Rem", <select value={form.braceletCondition} onChange={e => setForm({ ...form, braceletCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                </div>
                <div style={{ marginTop: 14 }}>
                  {field("Servicehistorik", <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option value="">Välj alternativ</option>{SERVICE_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>)}
                </div>
                <div style={{ display: "flex", gap: 32, marginTop: 18 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setForm({ ...form, hasBox: !form.hasBox })}>
                    <div className={`toggle${form.hasBox ? " on" : ""}`} />
                    <span className="mt" style={{ fontSize: 12, fontWeight: 300, color: "#aaa" }}>Original box</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setForm({ ...form, hasPapers: !form.hasPapers })}>
                    <div className={`toggle${form.hasPapers ? " on" : ""}`} />
                    <span className="mt" style={{ fontSize: 12, fontWeight: 300, color: "#aaa" }}>Papper / Certifikat</span>
                  </label>
                </div>

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Kunduppgifter</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {field("Kundnamn", <input placeholder="t.ex. Erik Andersson" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />)}
                  {field("Kundmail", <input placeholder="t.ex. erik@mail.com" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />)}
                </div>
                <div style={{ marginTop: 14 }}>
                  {field("Övriga noteringar", <textarea rows={3} placeholder="Repor, specialedition, bifogade tillbehör m.m." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />)}
                </div>
                <div style={{ marginTop: 28 }}>
                  <button className="gold-btn" onClick={handleValuate} disabled={!form.brand || !form.model || !form.condition}>Kör värdering</button>
                </div>
              </>
            )}

            {step === "loading" && (
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><div className="spinner" /></div>
                <div className="cg" style={{ fontSize: 26, fontWeight: 300, color: "#d4a853", marginBottom: 10 }}>Analyserar marknaden</div>
                <div className="mt" style={{ fontSize: 12, color: "#777", fontWeight: 300, letterSpacing: 1 }}>{loadingMsg}</div>
              </div>
            )}

            {step === "result" && result && !result.error && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div className="cg" style={{ fontSize: 30, fontWeight: 300 }}>Värderingsrapport</div>
                    <div className="mt" style={{ fontSize: 11, color: "#777", marginTop: 4, fontWeight: 300 }}>
                      {form.brand} {form.model}{form.reference ? ` · Ref. ${form.reference}` : ""} · {form.condition}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(180,140,80,0.08)", border: "1px solid rgba(180,140,80,0.2)", padding: "7px 14px", borderRadius: 2 }}>
                    <span style={{ color: trendColor, fontSize: 14 }}>{trendIcon}</span>
                    <span className="mt" style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: trendColor, fontWeight: 500 }}>
                      {result.marketTrend === "rising" ? "Marknad stiger" : result.marketTrend === "falling" ? "Marknad faller" : "Stabil marknad"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Lågt estimat", value: fmt(result.lowPrice), sub: "Privat försäljning" },
                    { label: "Marknadssnitt", value: fmt(result.midPrice), sub: "Typiskt intervall" },
                    { label: "Vårt utpris", value: fmt(result.recommendedPrice), sub: "Rekommenderat", highlight: true },
                    { label: "Erbjudandepris", value: fmt(result.buyInPrice), sub: "Inköp −15%", gold: true },
                  ].map(({ label, value, sub, highlight, gold }: any) => (
                    <div key={label} className="price-card" style={gold ? { borderColor: "#d4a853", background: "rgba(212,168,83,0.08)" } : highlight ? { borderColor: "rgba(180,140,80,0.5)", background: "rgba(180,140,80,0.05)" } : {}}>
                      <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: gold ? "#d4a853" : highlight ? "#b48c50" : "#555", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                      <div className="cg" style={{ fontSize: gold || highlight ? 20 : 17, fontWeight: 300, color: gold ? "#d4a853" : highlight ? "#d4a853" : "#e8e0d0" }}>{value}</div>
                      <div className="mt" style={{ fontSize: 9, color: "#555", marginTop: 3, fontWeight: 300 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,80,0.12)", borderRadius: 2, padding: "14px 18px", marginBottom: 12 }}>
                  <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: "#777", textTransform: "uppercase", marginBottom: 6 }}>Värderarens analys</div>
                  <div className="mt" style={{ fontSize: 13, fontWeight: 300, color: "#b0a898", lineHeight: 1.7 }}>{result.reasoning}</div>
                </div>
                {result.conditionNotes && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,80,0.08)", borderRadius: 2, padding: "14px 18px", marginBottom: 24 }}>
                    <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 6 }}>Skickpåverkan</div>
                    <div className="mt" style={{ fontSize: 13, fontWeight: 300, color: "#8a8278", lineHeight: 1.7 }}>{result.conditionNotes}</div>
                  </div>
                )}

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 20, fontWeight: 300, marginBottom: 14, color: "#c8b890" }}>Kundbrev</div>
                {form.clientEmail && <div className="mt" style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Till: <span style={{ color: "#b48c50" }}>{form.clientEmail}</span></div>}
                <div className="mt" style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>Ämne: <span style={{ color: "#c8b890" }}>{result.emailSubject}</span></div>
                <div className="email-box">{result.emailBody}</div>

                <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="gold-btn" onClick={handleCopy}>{copied ? "✓ Kopierat" : "Kopiera brev"}</button>
                  <button className="ghost-btn" onClick={() => { setStep("form"); setResult(null); }}>Justera</button>
                  <button className="ghost-btn" onClick={() => setView("inbox")}>← Inkorgen</button>
                </div>
              </div>
            )}

            {step === "result" && result?.error && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div className="cg" style={{ fontSize: 26, color: "#f87171", marginBottom: 10 }}>Värdering misslyckades</div>
                <div className="mt" style={{ fontSize: 13, color: "#777", fontWeight: 300 }}>Något gick fel. Försök igen.</div>
                <button className="ghost-btn" style={{ marginTop: 20 }} onClick={() => setStep("form")}>Försök igen</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
EO
cat > app/page.tsx << 'EOF'
"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const CONDITIONS = ["Mint / Oanvänd", "Utmärkt", "Mycket bra", "Bra", "Godkänt", "Slitet"];
const COMPONENT_CONDITIONS = ["Utmärkt", "Mycket bra", "Bra", "Repor/Märken", "Slitet"];
const SERVICE_OPTIONS = ["Okänd servicehistorik", "Aldrig servad", "Servad – 0–2 år sedan", "Servad – 3–5 år sedan", "Servad – 6+ år sedan"];
const BRANDS = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "IWC", "Breitling", "TAG Heuer", "Vacheron Constantin", "Jaeger-LeCoultre", "Other"];
const VALUATION_SITES = ["chrono24", "bobswatches", "storiesoftime", "chrono.dk", "luxurywatches.se"];
const STATUS_COLORS: Record<string, string> = { inkommen: "#fbbf24", värderad: "#60a5fa", skickad: "#4ade80" };
const EMPTY_FORM = {
  brand: "", model: "", reference: "", year: "", condition: "", dialColor: "",
  caseCondition: "", crystalCondition: "", braceletCondition: "",
  service: "", hasBox: false, hasPapers: false, clientName: "", clientEmail: "", notes: ""
};

export default function App() {
  const [view, setView] = useState("inbox");
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "Söker Chrono24...", "Kollar Bob's Watches...", "Analyserar Stories of Time...",
    "Hämtar data från Chrono.dk...", "Kollar LuxuryWatches.se...",
    "Beräknar marknadsvärde...", "Skriver kundbrev..."
  ];

  useEffect(() => { fetchCases(); }, []);

  async function fetchCases() {
    setLoadingCases(true);
    setFetchError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/watches?order=created_at.desc&select=*`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(`Fel: ${JSON.stringify(data)}`);
        setCases([]);
      } else {
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setFetchError(`Nätverksfel: ${err.message}`);
    }
    setLoadingCases(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/watches?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", "Prefer": "return=minimal"
      },
      body: JSON.stringify({ status })
    });
    fetchCases();
  }

  function openCase(c: any) {
    setSelected(c);
    setForm({
      brand: c.brand || "", model: c.model || "", reference: c.reference || "",
      year: c.year || "", condition: c.condition || "", dialColor: c.dial_color || "",
      caseCondition: c.case_condition || "", crystalCondition: c.crystal_condition || "",
      braceletCondition: c.bracelet_condition || "", service: c.service || "",
      hasBox: c.has_box || false, hasPapers: c.has_papers || false,
      clientName: c.client_name || "", clientEmail: c.client_email || "", notes: c.notes || ""
    });
    setResult(null);
    setStep("form");
    setView("valuation");
  }

  function newValuation() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setResult(null);
    setStep("form");
    setView("valuation");
  }

  async function handleValuate() {
    if (!form.brand || !form.model || !form.condition) return;
    setStep("loading");
    for (let i = 0; i < loadingMessages.length; i++) {
      setLoadingMsg(loadingMessages[i]);
      await new Promise(r => setTimeout(r, 800));
    }

    const prompt = `You are an expert luxury watch appraiser specialising in the Swedish and Nordic resale market. Search the web for current prices on Chrono24, Bob's Watches, Stories of Time (storiesoftime.com/sv), Chrono.dk and LuxuryWatches.se before valuing.

Watch Details:
- Brand: ${form.brand}
- Model: ${form.model}
- Reference number: ${form.reference || "Not provided"}
- Year: ${form.year || "Unknown"}
- Overall condition: ${form.condition}
- Dial color: ${form.dialColor || "Not specified"}
- Case condition: ${form.caseCondition || "Not specified"}
- Crystal/glass condition: ${form.crystalCondition || "Not specified"}
- Bracelet/strap condition: ${form.braceletCondition || "Not specified"}
- Service history: ${form.service || "Unknown"}
- Original box: ${form.hasBox ? "Yes" : "No"}
- Papers/certificate: ${form.hasPapers ? "Yes" : "No"}
- Additional notes: ${form.notes || "None"}

IMPORTANT: Search the web for current listing prices before responding. Base your valuation on real current market data in SEK for the Nordic market.

CRITICAL: Respond ONLY with a raw JSON object. No text before or after. Start with { end with }.

{
  "lowPrice": number,
  "midPrice": number,
  "highPrice": number,
  "recommendedPrice": number,
  "buyInPrice": number (recommendedPrice * 0.85 rounded to nearest 500),
  "reasoning": "3-4 sentences referencing actual current market prices found online",
  "conditionNotes": "1-2 sentences on how condition affected price",
  "marketTrend": "rising" or "stable" or "falling",
  "emailSubject": "string in Swedish",
  "emailBody": "Professional warm email in Swedish to ${form.clientName || "kunden"} presenting the buy-in offer. Do not reveal internal valuation or margins. Sign off from Värderingsteamet."
}`;

    try {
      const res = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      const text = data.content.map((i: any) => i.text || "").filter(Boolean).join("\n");
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setStep("result");
      if (selected) updateStatus(selected.id, "värderad");
    } catch {
      setResult({ error: true });
      setStep("result");
    }
  }

  function fmt(n: number) { return n ? Number(n).toLocaleString("sv-SE") + " kr" : "N/A"; }
  function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }

  const trendColor = result?.marketTrend === "rising" ? "#4ade80" : result?.marketTrend === "falling" ? "#f87171" : "#fbbf24";
  const trendIcon = result?.marketTrend === "rising" ? "↑" : result?.marketTrend === "falling" ? "↓" : "→";

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${result.emailSubject}\n\n${result.emailBody}`);
    setCopied(true);
    if (selected) updateStatus(selected.id, "skickad");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    document.cookie = "horologie-auth=; path=/; max-age=0";
    window.location.href = "/login";
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase" as const, display: "block", marginBottom: 6, fontFamily: "Montserrat, sans-serif" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(180,140,80,0.07) 0%, transparent 60%)", fontFamily: "Georgia, serif", color: "#e8e0d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .mt { font-family: 'Montserrat', sans-serif; }
        input, select, textarea { background: rgba(255,255,255,0.04); border: 1px solid rgba(180,140,80,0.25); color: #e8e0d0; border-radius: 2px; padding: 10px 14px; width: 100%; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 300; outline: none; transition: border-color 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: rgba(180,140,80,0.6); }
        select option { background: #1a1a1a; }
        .gold-btn { background: linear-gradient(135deg, #b48c50, #d4a853, #b48c50); color: #0a0a0a; border: none; padding: 12px 28px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: opacity 0.2s, transform 0.1s; }
        .gold-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .gold-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .ghost-btn { background: transparent; color: #b48c50; border: 1px solid rgba(180,140,80,0.4); padding: 10px 20px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: all 0.2s; }
        .ghost-btn:hover { border-color: #b48c50; background: rgba(180,140,80,0.05); }
        .nav-btn { background: transparent; color: #666; border: none; padding: 8px 16px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .nav-btn.active { color: #d4a853; border-bottom-color: #d4a853; }
        .nav-btn:hover { color: #b48c50; }
        .toggle { width: 40px; height: 22px; border-radius: 11px; border: 1px solid rgba(180,140,80,0.4); background: rgba(255,255,255,0.05); position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
        .toggle.on { background: linear-gradient(135deg, #b48c50, #d4a853); border-color: #d4a853; }
        .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; background: #e8e0d0; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; }
        .toggle.on::after { left: 20px; }
        .case-row { padding: 16px 20px; border-bottom: 1px solid rgba(180,140,80,0.08); cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .case-row:hover { background: rgba(180,140,80,0.05); }
        .price-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(180,140,80,0.2); border-radius: 2px; padding: 16px; text-align: center; }
        .email-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(180,140,80,0.2); border-radius: 2px; padding: 24px; white-space: pre-wrap; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 300; line-height: 1.8; color: #c8c0b0; }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(180,140,80,0.2); border-top-color: #b48c50; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .divider { border: none; border-top: 1px solid rgba(180,140,80,0.12); margin: 24px 0; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(180,140,80,0.2)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div>
            <div className="cg" style={{ fontSize: 22, fontWeight: 300, letterSpacing: 3, color: "#d4a853" }}>HOROLOGIE</div>
            <div className="mt" style={{ fontSize: 8, letterSpacing: 4, color: "#666", textTransform: "uppercase" }}>Watch Valuation System</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`nav-btn${view === "inbox" ? " active" : ""}`} onClick={() => setView("inbox")}>
              Inkorgen {cases.filter(c => c.status === "inkommen").length > 0 && (
                <span style={{ background: "#d4a853", color: "#0a0a0a", borderRadius: 10, padding: "1px 6px", fontSize: 9, marginLeft: 4 }}>
                  {cases.filter(c => c.status === "inkommen").length}
                </span>
              )}
            </button>
            <button className={`nav-btn${view === "valuation" ? " active" : ""}`} onClick={newValuation}>Ny värdering</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {VALUATION_SITES.map((s, i) => (
              <div key={i} className="mt" style={{ fontSize: 8, letterSpacing: 1, color: "#444", padding: "3px 7px", border: "1px solid rgba(180,140,80,0.1)", borderRadius: 1 }}>{s.toUpperCase()}</div>
            ))}
          </div>
          <button onClick={handleLogout} className="ghost-btn" style={{ padding: "6px 14px", fontSize: 9 }}>Logga ut</button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px" }}>

        {/* INBOX */}
        {view === "inbox" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <div className="cg" style={{ fontSize: 32, fontWeight: 300 }}>Inkorgen</div>
                <div className="mt" style={{ fontSize: 11, color: "#666", marginTop: 4, fontWeight: 300 }}>{cases.length} ärenden totalt</div>
              </div>
              <button className="ghost-btn" onClick={fetchCases}>↻ Uppdatera</button>
            </div>

            {fetchError && (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 2, padding: "12px 16px", marginBottom: 16 }}>
                <div className="mt" style={{ fontSize: 11, color: "#f87171", fontWeight: 300 }}>{fetchError}</div>
              </div>
            )}

            {loadingCases ? (
              <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : cases.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div className="cg" style={{ fontSize: 22, marginBottom: 8 }}>Inga ärenden ännu</div>
                <div className="mt" style={{ fontSize: 12, fontWeight: 300 }}>Inkomna värderingsförfrågningar visas här</div>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(180,140,80,0.15)", borderRadius: 2 }}>
                {cases.map((c, i) => (
                  <div key={c.id} className="case-row" onClick={() => openCase(c)} style={{ borderTop: i === 0 ? "none" : undefined }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span className="cg" style={{ fontSize: 17, fontWeight: 300 }}>{c.brand} {c.model}</span>
                        {c.reference && <span className="mt" style={{ fontSize: 10, color: "#666", fontWeight: 300 }}>Ref. {c.reference}</span>}
                      </div>
                      <div className="mt" style={{ fontSize: 11, color: "#666", fontWeight: 300 }}>
                        {c.client_name && <span>{c.client_name} · </span>}
                        {c.client_email && <span>{c.client_email} · </span>}
                        {c.condition}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div className="mt" style={{ fontSize: 10, color: "#555", fontWeight: 300 }}>{fmtDate(c.created_at)}</div>
                      <div className="mt" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: STATUS_COLORS[c.status] || "#666", padding: "3px 8px", border: `1px solid ${STATUS_COLORS[c.status] || "#666"}`, borderRadius: 10, opacity: 0.8 }}>{c.status}</div>
                      <span style={{ color: "#444", fontSize: 14 }}>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VALUATION */}
        {view === "valuation" && (
          <div className="fade-in">
            {selected && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <button className="ghost-btn" onClick={() => setView("inbox")}>← Inkorgen</button>
                <div className="mt" style={{ fontSize: 11, color: "#666", fontWeight: 300 }}>
                  Ärende: <span style={{ color: "#b48c50" }}>{selected.brand} {selected.model}</span>
                  {selected.client_name && <span> · {selected.client_name}</span>}
                </div>
              </div>
            )}

            {step === "form" && (
              <>
                <div className="cg" style={{ fontSize: 32, fontWeight: 300, marginBottom: 6, lineHeight: 1.1 }}>
                  {selected ? "Kör värdering" : "Ny värdering"}<br />
                  <em style={{ color: "#b48c50", fontSize: 28 }}>{selected ? `${selected.brand} ${selected.model}` : "manuell inmatning"}</em>
                </div>
                <div className="mt" style={{ fontSize: 12, color: "#777", letterSpacing: 1, marginBottom: 36, fontWeight: 300 }}>Fyll i detaljer och kör värderingen</div>

                {selected?.image_urls?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div className="mt" style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Bilder från kunden</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {selected.image_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 2, border: "1px solid rgba(180,140,80,0.2)" }} alt="watch" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Klockdetaljer</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {field("Märke *", <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}><option value="">Välj märke</option>{BRANDS.map(b => <option key={b}>{b}</option>)}</select>)}
                  {field("Modell *", <input placeholder="t.ex. Submariner Date" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />)}
                  {field("Referensnummer", <input placeholder="t.ex. 126610LN" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />)}
                  {field("Årsmodell", <input placeholder="t.ex. 2020" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />)}
                  {field("Generellt skick *", <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option value="">Välj skick</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Urtavlans färg", <input placeholder="t.ex. Svart, Blå sunburst" value={form.dialColor} onChange={e => setForm({ ...form, dialColor: e.target.value })} />)}
                </div>

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Detaljerat skick</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {field("Boett", <select value={form.caseCondition} onChange={e => setForm({ ...form, caseCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Glas / Kristall", <select value={form.crystalCondition} onChange={e => setForm({ ...form, crystalCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Armband / Rem", <select value={form.braceletCondition} onChange={e => setForm({ ...form, braceletCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                </div>
                <div style={{ marginTop: 14 }}>
                  {field("Servicehistorik", <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option value="">Välj alternativ</option>{SERVICE_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>)}
                </div>
                <div style={{ display: "flex", gap: 32, marginTop: 18 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setForm({ ...form, hasBox: !form.hasBox })}>
                    <div className={`toggle${form.hasBox ? " on" : ""}`} />
                    <span className="mt" style={{ fontSize: 12, fontWeight: 300, color: "#aaa" }}>Original box</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setForm({ ...form, hasPapers: !form.hasPapers })}>
                    <div className={`toggle${form.hasPapers ? " on" : ""}`} />
                    <span className="mt" style={{ fontSize: 12, fontWeight: 300, color: "#aaa" }}>Papper / Certifikat</span>
                  </label>
                </div>

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Kunduppgifter</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {field("Kundnamn", <input placeholder="t.ex. Erik Andersson" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />)}
                  {field("Kundmail", <input placeholder="t.ex. erik@mail.com" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />)}
                </div>
                <div style={{ marginTop: 14 }}>
                  {field("Övriga noteringar", <textarea rows={3} placeholder="Repor, specialedition, bifogade tillbehör m.m." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />)}
                </div>
                <div style={{ marginTop: 28 }}>
                  <button className="gold-btn" onClick={handleValuate} disabled={!form.brand || !form.model || !form.condition}>Kör värdering</button>
                </div>
              </>
            )}

            {step === "loading" && (
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><div className="spinner" /></div>
                <div className="cg" style={{ fontSize: 26, fontWeight: 300, color: "#d4a853", marginBottom: 10 }}>Analyserar marknaden</div>
                <div className="mt" style={{ fontSize: 12, color: "#777", fontWeight: 300, letterSpacing: 1 }}>{loadingMsg}</div>
              </div>
            )}

            {step === "result" && result && !result.error && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div className="cg" style={{ fontSize: 30, fontWeight: 300 }}>Värderingsrapport</div>
                    <div className="mt" style={{ fontSize: 11, color: "#777", marginTop: 4, fontWeight: 300 }}>
                      {form.brand} {form.model}{form.reference ? ` · Ref. ${form.reference}` : ""} · {form.condition}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(180,140,80,0.08)", border: "1px solid rgba(180,140,80,0.2)", padding: "7px 14px", borderRadius: 2 }}>
                    <span style={{ color: trendColor, fontSize: 14 }}>{trendIcon}</span>
                    <span className="mt" style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: trendColor, fontWeight: 500 }}>
                      {result.marketTrend === "rising" ? "Marknad stiger" : result.marketTrend === "falling" ? "Marknad faller" : "Stabil marknad"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Lågt estimat", value: fmt(result.lowPrice), sub: "Privat försäljning" },
                    { label: "Marknadssnitt", value: fmt(result.midPrice), sub: "Typiskt intervall" },
                    { label: "Vårt utpris", value: fmt(result.recommendedPrice), sub: "Rekommenderat", highlight: true },
                    { label: "Erbjudandepris", value: fmt(result.buyInPrice), sub: "Inköp −15%", gold: true },
                  ].map(({ label, value, sub, highlight, gold }: any) => (
                    <div key={label} className="price-card" style={gold ? { borderColor: "#d4a853", background: "rgba(212,168,83,0.08)" } : highlight ? { borderColor: "rgba(180,140,80,0.5)", background: "rgba(180,140,80,0.05)" } : {}}>
                      <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: gold ? "#d4a853" : highlight ? "#b48c50" : "#555", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                      <div className="cg" style={{ fontSize: gold || highlight ? 20 : 17, fontWeight: 300, color: gold ? "#d4a853" : highlight ? "#d4a853" : "#e8e0d0" }}>{value}</div>
                      <div className="mt" style={{ fontSize: 9, color: "#555", marginTop: 3, fontWeight: 300 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,80,0.12)", borderRadius: 2, padding: "14px 18px", marginBottom: 12 }}>
                  <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: "#777", textTransform: "uppercase", marginBottom: 6 }}>Värderarens analys</div>
                  <div className="mt" style={{ fontSize: 13, fontWeight: 300, color: "#b0a898", lineHeight: 1.7 }}>{result.reasoning}</div>
                </div>
                {result.conditionNotes && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,80,0.08)", borderRadius: 2, padding: "14px 18px", marginBottom: 24 }}>
                    <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 6 }}>Skickpåverkan</div>
                    <div className="mt" style={{ fontSize: 13, fontWeight: 300, color: "#8a8278", lineHeight: 1.7 }}>{result.conditionNotes}</div>
                  </div>
                )}

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 20, fontWeight: 300, marginBottom: 14, color: "#c8b890" }}>Kundbrev</div>
                {form.clientEmail && <div className="mt" style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Till: <span style={{ color: "#b48c50" }}>{form.clientEmail}</span></div>}
                <div className="mt" style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>Ämne: <span style={{ color: "#c8b890" }}>{result.emailSubject}</span></div>
                <div className="email-box">{result.emailBody}</div>

                <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="gold-btn" onClick={handleCopy}>{copied ? "✓ Kopierat" : "Kopiera brev"}</button>
                  <button className="ghost-btn" onClick={() => { setStep("form"); setResult(null); }}>Justera</button>
                  <button className="ghost-btn" onClick={() => setView("inbox")}>← Inkorgen</button>
                </div>
              </div>
            )}

            {step === "result" && result?.error && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div className="cg" style={{ fontSize: 26, color: "#f87171", marginBottom: 10 }}>Värdering misslyckades</div>
                <div className="mt" style={{ fontSize: 13, color: "#777", fontWeight: 300 }}>Något gick fel. Försök igen.</div>
                <button className="ghost-btn" style={{ marginTop: 20 }} onClick={() => setStep("form")}>Försök igen</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
EOFcat > app/page.tsx << 'EOF'
"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const CONDITIONS = ["Mint / Oanvänd", "Utmärkt", "Mycket bra", "Bra", "Godkänt", "Slitet"];
const COMPONENT_CONDITIONS = ["Utmärkt", "Mycket bra", "Bra", "Repor/Märken", "Slitet"];
const SERVICE_OPTIONS = ["Okänd servicehistorik", "Aldrig servad", "Servad – 0–2 år sedan", "Servad – 3–5 år sedan", "Servad – 6+ år sedan"];
const BRANDS = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "IWC", "Breitling", "TAG Heuer", "Vacheron Constantin", "Jaeger-LeCoultre", "Other"];
const VALUATION_SITES = ["chrono24", "bobswatches", "storiesoftime", "chrono.dk", "luxurywatches.se"];
const STATUS_COLORS: Record<string, string> = { inkommen: "#fbbf24", värderad: "#60a5fa", skickad: "#4ade80" };
const EMPTY_FORM = {
  brand: "", model: "", reference: "", year: "", condition: "", dialColor: "",
  caseCondition: "", crystalCondition: "", braceletCondition: "",
  service: "", hasBox: false, hasPapers: false, clientName: "", clientEmail: "", notes: ""
};

export default function App() {
  const [view, setView] = useState("inbox");
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "Söker Chrono24...", "Kollar Bob's Watches...", "Analyserar Stories of Time...",
    "Hämtar data från Chrono.dk...", "Kollar LuxuryWatches.se...",
    "Beräknar marknadsvärde...", "Skriver kundbrev..."
  ];

  useEffect(() => { fetchCases(); }, []);

  async function fetchCases() {
    setLoadingCases(true);
    setFetchError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/watches?order=created_at.desc&select=*`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(`Fel: ${JSON.stringify(data)}`);
        setCases([]);
      } else {
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setFetchError(`Nätverksfel: ${err.message}`);
    }
    setLoadingCases(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/watches?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", "Prefer": "return=minimal"
      },
      body: JSON.stringify({ status })
    });
    fetchCases();
  }

  function openCase(c: any) {
    setSelected(c);
    setForm({
      brand: c.brand || "", model: c.model || "", reference: c.reference || "",
      year: c.year || "", condition: c.condition || "", dialColor: c.dial_color || "",
      caseCondition: c.case_condition || "", crystalCondition: c.crystal_condition || "",
      braceletCondition: c.bracelet_condition || "", service: c.service || "",
      hasBox: c.has_box || false, hasPapers: c.has_papers || false,
      clientName: c.client_name || "", clientEmail: c.client_email || "", notes: c.notes || ""
    });
    setResult(null);
    setStep("form");
    setView("valuation");
  }

  function newValuation() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setResult(null);
    setStep("form");
    setView("valuation");
  }

  async function handleValuate() {
    if (!form.brand || !form.model || !form.condition) return;
    setStep("loading");
    for (let i = 0; i < loadingMessages.length; i++) {
      setLoadingMsg(loadingMessages[i]);
      await new Promise(r => setTimeout(r, 800));
    }

    const prompt = `You are an expert luxury watch appraiser specialising in the Swedish and Nordic resale market. Search the web for current prices on Chrono24, Bob's Watches, Stories of Time (storiesoftime.com/sv), Chrono.dk and LuxuryWatches.se before valuing.

Watch Details:
- Brand: ${form.brand}
- Model: ${form.model}
- Reference number: ${form.reference || "Not provided"}
- Year: ${form.year || "Unknown"}
- Overall condition: ${form.condition}
- Dial color: ${form.dialColor || "Not specified"}
- Case condition: ${form.caseCondition || "Not specified"}
- Crystal/glass condition: ${form.crystalCondition || "Not specified"}
- Bracelet/strap condition: ${form.braceletCondition || "Not specified"}
- Service history: ${form.service || "Unknown"}
- Original box: ${form.hasBox ? "Yes" : "No"}
- Papers/certificate: ${form.hasPapers ? "Yes" : "No"}
- Additional notes: ${form.notes || "None"}

IMPORTANT: Search the web for current listing prices before responding. Base your valuation on real current market data in SEK for the Nordic market.

CRITICAL: Respond ONLY with a raw JSON object. No text before or after. Start with { end with }.

{
  "lowPrice": number,
  "midPrice": number,
  "highPrice": number,
  "recommendedPrice": number,
  "buyInPrice": number (recommendedPrice * 0.85 rounded to nearest 500),
  "reasoning": "3-4 sentences referencing actual current market prices found online",
  "conditionNotes": "1-2 sentences on how condition affected price",
  "marketTrend": "rising" or "stable" or "falling",
  "emailSubject": "string in Swedish",
  "emailBody": "Professional warm email in Swedish to ${form.clientName || "kunden"} presenting the buy-in offer. Do not reveal internal valuation or margins. Sign off from Värderingsteamet."
}`;

    try {
      const res = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      const text = data.content.map((i: any) => i.text || "").filter(Boolean).join("\n");
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setStep("result");
      if (selected) updateStatus(selected.id, "värderad");
    } catch {
      setResult({ error: true });
      setStep("result");
    }
  }

  function fmt(n: number) { return n ? Number(n).toLocaleString("sv-SE") + " kr" : "N/A"; }
  function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }

  const trendColor = result?.marketTrend === "rising" ? "#4ade80" : result?.marketTrend === "falling" ? "#f87171" : "#fbbf24";
  const trendIcon = result?.marketTrend === "rising" ? "↑" : result?.marketTrend === "falling" ? "↓" : "→";

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${result.emailSubject}\n\n${result.emailBody}`);
    setCopied(true);
    if (selected) updateStatus(selected.id, "skickad");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    document.cookie = "horologie-auth=; path=/; max-age=0";
    window.location.href = "/login";
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase" as const, display: "block", marginBottom: 6, fontFamily: "Montserrat, sans-serif" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(180,140,80,0.07) 0%, transparent 60%)", fontFamily: "Georgia, serif", color: "#e8e0d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .mt { font-family: 'Montserrat', sans-serif; }
        input, select, textarea { background: rgba(255,255,255,0.04); border: 1px solid rgba(180,140,80,0.25); color: #e8e0d0; border-radius: 2px; padding: 10px 14px; width: 100%; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 300; outline: none; transition: border-color 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: rgba(180,140,80,0.6); }
        select option { background: #1a1a1a; }
        .gold-btn { background: linear-gradient(135deg, #b48c50, #d4a853, #b48c50); color: #0a0a0a; border: none; padding: 12px 28px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: opacity 0.2s, transform 0.1s; }
        .gold-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .gold-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .ghost-btn { background: transparent; color: #b48c50; border: 1px solid rgba(180,140,80,0.4); padding: 10px 20px; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: all 0.2s; }
        .ghost-btn:hover { border-color: #b48c50; background: rgba(180,140,80,0.05); }
        .nav-btn { background: transparent; color: #666; border: none; padding: 8px 16px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .nav-btn.active { color: #d4a853; border-bottom-color: #d4a853; }
        .nav-btn:hover { color: #b48c50; }
        .toggle { width: 40px; height: 22px; border-radius: 11px; border: 1px solid rgba(180,140,80,0.4); background: rgba(255,255,255,0.05); position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
        .toggle.on { background: linear-gradient(135deg, #b48c50, #d4a853); border-color: #d4a853; }
        .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; background: #e8e0d0; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; }
        .toggle.on::after { left: 20px; }
        .case-row { padding: 16px 20px; border-bottom: 1px solid rgba(180,140,80,0.08); cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .case-row:hover { background: rgba(180,140,80,0.05); }
        .price-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(180,140,80,0.2); border-radius: 2px; padding: 16px; text-align: center; }
        .email-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(180,140,80,0.2); border-radius: 2px; padding: 24px; white-space: pre-wrap; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 300; line-height: 1.8; color: #c8c0b0; }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(180,140,80,0.2); border-top-color: #b48c50; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .divider { border: none; border-top: 1px solid rgba(180,140,80,0.12); margin: 24px 0; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(180,140,80,0.2)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div>
            <div className="cg" style={{ fontSize: 22, fontWeight: 300, letterSpacing: 3, color: "#d4a853" }}>HOROLOGIE</div>
            <div className="mt" style={{ fontSize: 8, letterSpacing: 4, color: "#666", textTransform: "uppercase" }}>Watch Valuation System</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`nav-btn${view === "inbox" ? " active" : ""}`} onClick={() => setView("inbox")}>
              Inkorgen {cases.filter(c => c.status === "inkommen").length > 0 && (
                <span style={{ background: "#d4a853", color: "#0a0a0a", borderRadius: 10, padding: "1px 6px", fontSize: 9, marginLeft: 4 }}>
                  {cases.filter(c => c.status === "inkommen").length}
                </span>
              )}
            </button>
            <button className={`nav-btn${view === "valuation" ? " active" : ""}`} onClick={newValuation}>Ny värdering</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {VALUATION_SITES.map((s, i) => (
              <div key={i} className="mt" style={{ fontSize: 8, letterSpacing: 1, color: "#444", padding: "3px 7px", border: "1px solid rgba(180,140,80,0.1)", borderRadius: 1 }}>{s.toUpperCase()}</div>
            ))}
          </div>
          <button onClick={handleLogout} className="ghost-btn" style={{ padding: "6px 14px", fontSize: 9 }}>Logga ut</button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px" }}>

        {/* INBOX */}
        {view === "inbox" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <div className="cg" style={{ fontSize: 32, fontWeight: 300 }}>Inkorgen</div>
                <div className="mt" style={{ fontSize: 11, color: "#666", marginTop: 4, fontWeight: 300 }}>{cases.length} ärenden totalt</div>
              </div>
              <button className="ghost-btn" onClick={fetchCases}>↻ Uppdatera</button>
            </div>

            {fetchError && (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 2, padding: "12px 16px", marginBottom: 16 }}>
                <div className="mt" style={{ fontSize: 11, color: "#f87171", fontWeight: 300 }}>{fetchError}</div>
              </div>
            )}

            {loadingCases ? (
              <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : cases.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
                <div className="cg" style={{ fontSize: 22, marginBottom: 8 }}>Inga ärenden ännu</div>
                <div className="mt" style={{ fontSize: 12, fontWeight: 300 }}>Inkomna värderingsförfrågningar visas här</div>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(180,140,80,0.15)", borderRadius: 2 }}>
                {cases.map((c, i) => (
                  <div key={c.id} className="case-row" onClick={() => openCase(c)} style={{ borderTop: i === 0 ? "none" : undefined }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span className="cg" style={{ fontSize: 17, fontWeight: 300 }}>{c.brand} {c.model}</span>
                        {c.reference && <span className="mt" style={{ fontSize: 10, color: "#666", fontWeight: 300 }}>Ref. {c.reference}</span>}
                      </div>
                      <div className="mt" style={{ fontSize: 11, color: "#666", fontWeight: 300 }}>
                        {c.client_name && <span>{c.client_name} · </span>}
                        {c.client_email && <span>{c.client_email} · </span>}
                        {c.condition}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div className="mt" style={{ fontSize: 10, color: "#555", fontWeight: 300 }}>{fmtDate(c.created_at)}</div>
                      <div className="mt" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: STATUS_COLORS[c.status] || "#666", padding: "3px 8px", border: `1px solid ${STATUS_COLORS[c.status] || "#666"}`, borderRadius: 10, opacity: 0.8 }}>{c.status}</div>
                      <span style={{ color: "#444", fontSize: 14 }}>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VALUATION */}
        {view === "valuation" && (
          <div className="fade-in">
            {selected && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <button className="ghost-btn" onClick={() => setView("inbox")}>← Inkorgen</button>
                <div className="mt" style={{ fontSize: 11, color: "#666", fontWeight: 300 }}>
                  Ärende: <span style={{ color: "#b48c50" }}>{selected.brand} {selected.model}</span>
                  {selected.client_name && <span> · {selected.client_name}</span>}
                </div>
              </div>
            )}

            {step === "form" && (
              <>
                <div className="cg" style={{ fontSize: 32, fontWeight: 300, marginBottom: 6, lineHeight: 1.1 }}>
                  {selected ? "Kör värdering" : "Ny värdering"}<br />
                  <em style={{ color: "#b48c50", fontSize: 28 }}>{selected ? `${selected.brand} ${selected.model}` : "manuell inmatning"}</em>
                </div>
                <div className="mt" style={{ fontSize: 12, color: "#777", letterSpacing: 1, marginBottom: 36, fontWeight: 300 }}>Fyll i detaljer och kör värderingen</div>

                {selected?.image_urls?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div className="mt" style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Bilder från kunden</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {selected.image_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 2, border: "1px solid rgba(180,140,80,0.2)" }} alt="watch" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Klockdetaljer</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {field("Märke *", <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}><option value="">Välj märke</option>{BRANDS.map(b => <option key={b}>{b}</option>)}</select>)}
                  {field("Modell *", <input placeholder="t.ex. Submariner Date" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />)}
                  {field("Referensnummer", <input placeholder="t.ex. 126610LN" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />)}
                  {field("Årsmodell", <input placeholder="t.ex. 2020" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />)}
                  {field("Generellt skick *", <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option value="">Välj skick</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Urtavlans färg", <input placeholder="t.ex. Svart, Blå sunburst" value={form.dialColor} onChange={e => setForm({ ...form, dialColor: e.target.value })} />)}
                </div>

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Detaljerat skick</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {field("Boett", <select value={form.caseCondition} onChange={e => setForm({ ...form, caseCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Glas / Kristall", <select value={form.crystalCondition} onChange={e => setForm({ ...form, crystalCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                  {field("Armband / Rem", <select value={form.braceletCondition} onChange={e => setForm({ ...form, braceletCondition: e.target.value })}><option value="">Välj skick</option>{COMPONENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>)}
                </div>
                <div style={{ marginTop: 14 }}>
                  {field("Servicehistorik", <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option value="">Välj alternativ</option>{SERVICE_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>)}
                </div>
                <div style={{ display: "flex", gap: 32, marginTop: 18 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setForm({ ...form, hasBox: !form.hasBox })}>
                    <div className={`toggle${form.hasBox ? " on" : ""}`} />
                    <span className="mt" style={{ fontSize: 12, fontWeight: 300, color: "#aaa" }}>Original box</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setForm({ ...form, hasPapers: !form.hasPapers })}>
                    <div className={`toggle${form.hasPapers ? " on" : ""}`} />
                    <span className="mt" style={{ fontSize: 12, fontWeight: 300, color: "#aaa" }}>Papper / Certifikat</span>
                  </label>
                </div>

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 18, color: "#c8b890", marginBottom: 14 }}>Kunduppgifter</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {field("Kundnamn", <input placeholder="t.ex. Erik Andersson" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />)}
                  {field("Kundmail", <input placeholder="t.ex. erik@mail.com" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />)}
                </div>
                <div style={{ marginTop: 14 }}>
                  {field("Övriga noteringar", <textarea rows={3} placeholder="Repor, specialedition, bifogade tillbehör m.m." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />)}
                </div>
                <div style={{ marginTop: 28 }}>
                  <button className="gold-btn" onClick={handleValuate} disabled={!form.brand || !form.model || !form.condition}>Kör värdering</button>
                </div>
              </>
            )}

            {step === "loading" && (
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><div className="spinner" /></div>
                <div className="cg" style={{ fontSize: 26, fontWeight: 300, color: "#d4a853", marginBottom: 10 }}>Analyserar marknaden</div>
                <div className="mt" style={{ fontSize: 12, color: "#777", fontWeight: 300, letterSpacing: 1 }}>{loadingMsg}</div>
              </div>
            )}

            {step === "result" && result && !result.error && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div className="cg" style={{ fontSize: 30, fontWeight: 300 }}>Värderingsrapport</div>
                    <div className="mt" style={{ fontSize: 11, color: "#777", marginTop: 4, fontWeight: 300 }}>
                      {form.brand} {form.model}{form.reference ? ` · Ref. ${form.reference}` : ""} · {form.condition}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(180,140,80,0.08)", border: "1px solid rgba(180,140,80,0.2)", padding: "7px 14px", borderRadius: 2 }}>
                    <span style={{ color: trendColor, fontSize: 14 }}>{trendIcon}</span>
                    <span className="mt" style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: trendColor, fontWeight: 500 }}>
                      {result.marketTrend === "rising" ? "Marknad stiger" : result.marketTrend === "falling" ? "Marknad faller" : "Stabil marknad"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Lågt estimat", value: fmt(result.lowPrice), sub: "Privat försäljning" },
                    { label: "Marknadssnitt", value: fmt(result.midPrice), sub: "Typiskt intervall" },
                    { label: "Vårt utpris", value: fmt(result.recommendedPrice), sub: "Rekommenderat", highlight: true },
                    { label: "Erbjudandepris", value: fmt(result.buyInPrice), sub: "Inköp −15%", gold: true },
                  ].map(({ label, value, sub, highlight, gold }: any) => (
                    <div key={label} className="price-card" style={gold ? { borderColor: "#d4a853", background: "rgba(212,168,83,0.08)" } : highlight ? { borderColor: "rgba(180,140,80,0.5)", background: "rgba(180,140,80,0.05)" } : {}}>
                      <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: gold ? "#d4a853" : highlight ? "#b48c50" : "#555", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                      <div className="cg" style={{ fontSize: gold || highlight ? 20 : 17, fontWeight: 300, color: gold ? "#d4a853" : highlight ? "#d4a853" : "#e8e0d0" }}>{value}</div>
                      <div className="mt" style={{ fontSize: 9, color: "#555", marginTop: 3, fontWeight: 300 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,80,0.12)", borderRadius: 2, padding: "14px 18px", marginBottom: 12 }}>
                  <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: "#777", textTransform: "uppercase", marginBottom: 6 }}>Värderarens analys</div>
                  <div className="mt" style={{ fontSize: 13, fontWeight: 300, color: "#b0a898", lineHeight: 1.7 }}>{result.reasoning}</div>
                </div>
                {result.conditionNotes && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,80,0.08)", borderRadius: 2, padding: "14px 18px", marginBottom: 24 }}>
                    <div className="mt" style={{ fontSize: 9, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 6 }}>Skickpåverkan</div>
                    <div className="mt" style={{ fontSize: 13, fontWeight: 300, color: "#8a8278", lineHeight: 1.7 }}>{result.conditionNotes}</div>
                  </div>
                )}

                <hr className="divider" />
                <div className="cg" style={{ fontSize: 20, fontWeight: 300, marginBottom: 14, color: "#c8b890" }}>Kundbrev</div>
                {form.clientEmail && <div className="mt" style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Till: <span style={{ color: "#b48c50" }}>{form.clientEmail}</span></div>}
                <div className="mt" style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>Ämne: <span style={{ color: "#c8b890" }}>{result.emailSubject}</span></div>
                <div className="email-box">{result.emailBody}</div>

                <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="gold-btn" onClick={handleCopy}>{copied ? "✓ Kopierat" : "Kopiera brev"}</button>
                  <button className="ghost-btn" onClick={() => { setStep("form"); setResult(null); }}>Justera</button>
                  <button className="ghost-btn" onClick={() => setView("inbox")}>← Inkorgen</button>
                </div>
              </div>
            )}

            {step === "result" && result?.error && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div className="cg" style={{ fontSize: 26, color: "#f87171", marginBottom: 10 }}>Värdering misslyckades</div>
                <div className="mt" style={{ fontSize: 13, color: "#777", fontWeight: 300 }}>Något gick fel. Försök igen.</div>
                <button className="ghost-btn" style={{ marginTop: 20 }} onClick={() => setStep("form")}>Försök igen</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
