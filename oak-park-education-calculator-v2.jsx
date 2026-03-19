import { useState, useMemo } from "react";

/* ── Data & Constants ── */
const D97_PER_PUPIL = 22199;
const D200_PER_PUPIL = 25135;
const D97_YEARS = 9; // K–8
const D200_YEARS = 4; // 9–12
const TOTAL_SCHOOL_YEARS = D97_YEARS + D200_YEARS;
const BLENDED_PER_PUPIL = Math.round(
  (D97_PER_PUPIL * D97_YEARS + D200_PER_PUPIL * D200_YEARS) / TOTAL_SCHOOL_YEARS
);
const EDUCATION_TAX_SHARE = 0.70;
const EFFECTIVE_TAX_RATE = 0.024;
const MEDIAN_HOME = 465000;

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* ── Styles (matching jvanderberg/police-station App.css) ── */
const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --color-bg:#f5f6f8;--color-surface:#ffffff;--color-primary:#1a4d8f;
  --color-primary-light:#e8f0fe;--color-text:#1a1a2e;--color-text-muted:#5a5a7a;
  --color-border:#dde1e8;--color-accent:#2e7d32;--color-highlight:#fff8e1;
  --color-danger:#c0392b;--color-danger-light:#fdf0ef;
  --radius:3px;--shadow:0 2px 8px rgba(0,0,0,0.08);
}
@media(prefers-color-scheme:dark){:root{
  --color-bg:#121218;--color-surface:#1e1e2a;--color-primary:#6fa8f5;
  --color-primary-light:#1e2a3e;--color-text:#e4e4ee;--color-text-muted:#9a9ab4;
  --color-border:#2e2e42;--color-accent:#66bb6a;--color-highlight:#2a2818;
  --color-danger:#e57373;--color-danger-light:#2a1e1e;
  --shadow:0 2px 8px rgba(0,0,0,0.3);
}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--color-bg);color:var(--color-text);line-height:1.5;overflow-x:hidden}
.app{max-width:960px;margin:0 auto;padding:2rem 1rem;overflow-x:hidden}
.app-header{text-align:center;margin-bottom:2rem}
.header-row{display:flex;align-items:center;justify-content:center;gap:1rem;position:relative}
.header-row .reset-button{position:absolute;right:0}
.app-header h1{font-size:1.75rem;color:var(--color-primary);margin-bottom:0.25rem}
.subtitle{color:var(--color-text-muted);font-size:0.95rem}
.intro-text{max-width:580px;margin:0.75rem auto 0;font-size:0.9rem;color:var(--color-text-muted);line-height:1.5}
.reset-button{background:none;border:1px solid var(--color-border);border-radius:6px;color:var(--color-text-muted);font-size:0.8rem;padding:0.3rem 0.75rem;cursor:pointer}
.reset-button:hover{border-color:var(--color-primary);color:var(--color-primary)}

.app-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
.input-panel{grid-row:1;grid-column:1}
.results-panel{grid-row:1;grid-column:2}
.gap-section{grid-row:2;grid-column:1/-1}
@media(max-width:700px){
  .app{padding:1rem 0.75rem}
  .app-header{margin-bottom:1.25rem}
  .app-header h1{font-size:1.25rem}
  .subtitle{font-size:0.85rem}
  .app-layout{grid-template-columns:1fr;gap:1rem}
  .input-panel,.results-panel,.gap-section{grid-row:auto;grid-column:auto}
  .input-panel,.results-panel,.gap-section{padding:1rem}
  .hero-numbers{gap:0.5rem;margin-bottom:1rem}
  .breakdown-table{font-size:0.8rem}
  .breakdown-table td{padding:0.3rem 0}
}

.input-panel,.results-panel,.gap-section{
  background:var(--color-surface);border-radius:var(--radius);box-shadow:var(--shadow);padding:1.5rem;
}
.input-panel h2,.results-panel h2,.gap-section h2{font-size:1.15rem;margin-bottom:1rem;color:var(--color-primary)}

.input-label{display:block;font-size:0.85rem;font-weight:600;color:var(--color-text-muted);margin-bottom:1rem}
.value-row{display:flex;align-items:center;gap:0.25rem;margin-top:0.35rem}
.dollar-sign{font-size:1.4rem;font-weight:700;color:var(--color-text)}
.value-display{font-size:1.4rem;font-weight:700;color:var(--color-text)}
.slider{width:100%;margin-top:0.5rem;accent-color:var(--color-primary)}
.slider-labels{display:flex;justify-content:space-between;font-size:0.75rem;color:var(--color-text-muted)}

.hero-numbers{display:flex;gap:1rem;margin-bottom:1.5rem}
.hero-card{flex:1;background:var(--color-primary-light);border-radius:var(--radius);padding:1.25rem 1rem;text-align:center}
.hero-card.danger{background:var(--color-danger-light)}
.hero-amount{display:block;font-size:2rem;font-weight:800;color:var(--color-primary);line-height:1.1}
.hero-card.danger .hero-amount{color:var(--color-danger)}
.hero-label{font-size:0.85rem;color:var(--color-text-muted);margin-top:0.25rem}

.breakdown h3{font-size:0.95rem;margin-bottom:0.5rem;color:var(--color-text-muted)}
.breakdown-table{width:100%;border-collapse:collapse;font-size:0.85rem;table-layout:fixed;word-wrap:break-word}
.breakdown-table td{padding:0.4rem 0;border-bottom:1px solid var(--color-border)}
.breakdown-table .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.highlight-row td{background:var(--color-highlight);font-weight:700}
.section-label td{font-weight:700;font-size:0.8rem;color:var(--color-primary);padding-top:0.75rem;border-bottom:none;text-transform:uppercase;letter-spacing:0.03em}

.gap-bar-track{width:100%;height:24px;background:var(--color-border);border-radius:12px;overflow:hidden;position:relative;margin:1rem 0 0.5rem}
.gap-bar-fill{height:100%;border-radius:12px;transition:width 0.4s ease;display:flex;align-items:center;justify-content:center}
.gap-bar-fill span{font-size:0.65rem;font-weight:700;color:#fff;white-space:nowrap}
.gap-bar-labels{display:flex;justify-content:space-between;font-size:0.75rem;color:var(--color-text-muted)}
.gap-desc{font-size:0.85rem;color:var(--color-text-muted);margin-top:0.75rem;line-height:1.5}

.app-footer{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--color-border);text-align:center}
.app-footer p{font-size:0.78rem;color:var(--color-text-muted);max-width:640px;margin:0 auto}
.app-footer a{color:var(--color-primary);text-decoration:none}
.app-footer a:hover{text-decoration:underline}
`;

/* ── Components ── */

function InputPanel({ kids, setKids, homeValue, setHomeValue, years, setYears }) {
  return (
    <div className="input-panel">
      <h2>Your Household</h2>

      <label className="input-label">
        Children in public school
        <div className="value-row">
          <span className="value-display">{kids}</span>
        </div>
        <input
          type="range" className="slider"
          min={1} max={6} step={1} value={kids}
          onChange={(e) => setKids(+e.target.value)}
        />
        <div className="slider-labels"><span>1</span><span>6</span></div>
      </label>

      <label className="input-label">
        Home market value
        <div className="value-row">
          <span className="dollar-sign">$</span>
          <span className="value-display">{homeValue.toLocaleString("en-US")}</span>
        </div>
        <input
          type="range" className="slider"
          min={200000} max={1500000} step={25000} value={homeValue}
          onChange={(e) => setHomeValue(+e.target.value)}
        />
        <div className="slider-labels"><span>$200K</span><span>$1.5M</span></div>
      </label>

      <label className="input-label">
        Years in Oak Park
        <div className="value-row">
          <span className="value-display">{years}</span>
        </div>
        <input
          type="range" className="slider"
          min={5} max={40} step={1} value={years}
          onChange={(e) => setYears(+e.target.value)}
        />
        <div className="slider-labels"><span>5</span><span>40</span></div>
      </label>
    </div>
  );
}

function ResultsPanel({ results, kids, years }) {
  return (
    <div className="results-panel">
      <h2>Education Investment</h2>

      <div className="hero-numbers">
        <div className="hero-card">
          <span className="hero-amount">{fmt(results.annualEducationTax)}</span>
          <span className="hero-label">your annual D97/D200 taxes</span>
        </div>
      </div>

      <div className="breakdown">
        <h3>Calculation breakdown</h3>
        <table className="breakdown-table">
          <tbody>
            <tr className="section-label"><td colSpan={2}>What you pay</td></tr>
            <tr>
              <td>Annual property tax (est.)</td>
              <td className="num">{fmt(results.annualPropertyTax)}</td>
            </tr>
            <tr>
              <td>Education share (~70%)</td>
              <td className="num">{fmt(results.annualEducationTax)}</td>
            </tr>
            <tr className="highlight-row">
              <td>Total education taxes paid ({years} yrs)</td>
              <td className="num">{fmt(results.totalEducationTaxPaid)}</td>
            </tr>

            <tr className="section-label"><td colSpan={2}>What the community spends</td></tr>
            <tr>
              <td>D97 per pupil (K–8, 9 yrs)</td>
              <td className="num">{fmt(D97_PER_PUPIL)}/yr</td>
            </tr>
            <tr>
              <td>D200 per pupil (9–12, 4 yrs)</td>
              <td className="num">{fmt(D200_PER_PUPIL)}/yr</td>
            </tr>
            <tr>
              <td>Blended K–12 average</td>
              <td className="num">{fmt(BLENDED_PER_PUPIL)}/yr</td>
            </tr>
            <tr className="highlight-row">
              <td>Total spent on {kids} child{kids > 1 ? "ren" : ""} (K–12)</td>
              <td className="num">{fmt(results.totalSpentOnKids)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GapSection({ results }) {
  const pct = results.totalSpentOnKids > 0
    ? (results.totalEducationTaxPaid / results.totalSpentOnKids) * 100
    : 0;

  return (
    <div className="gap-section">
      <h2>The Social Contract Gap</h2>
      <div className="hero-numbers">
        <div className="hero-card">
          <span className="hero-amount">{fmt(results.totalEducationTaxPaid)}</span>
          <span className="hero-label">what you paid in education taxes</span>
        </div>
        <div className="hero-card">
          <span className="hero-amount">{fmt(results.totalSpentOnKids)}</span>
          <span className="hero-label">what the community spent educating your kids</span>
        </div>
        <div className="hero-card danger">
          <span className="hero-amount">{fmt(results.gap)}</span>
          <span className="hero-label">the gap</span>
        </div>
      </div>

      <div className="gap-bar-track">
        <div
          className="gap-bar-fill"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: "var(--color-primary)",
          }}
        >
          {pct > 18 && <span>What you paid</span>}
        </div>
      </div>
      <div className="gap-bar-labels">
        <span>{fmt(results.totalEducationTaxPaid)} paid</span>
        <span>{fmt(results.totalSpentOnKids)} spent</span>
      </div>

      <p className="gap-desc">
        This is how much the community invested in your children's education beyond what you
        paid in school taxes. When families leave after graduation, this investment leaves with
        them. Zoning reform that creates housing for empty nesters helps keep them — and their
        tax dollars — here.
      </p>
    </div>
  );
}

/* ── Main App ── */

export default function OakParkEducationCalculator() {
  const [kids, setKids] = useState(2);
  const [homeValue, setHomeValue] = useState(MEDIAN_HOME);
  const [years, setYears] = useState(20);

  const results = useMemo(() => {
    const annualPropertyTax = homeValue * EFFECTIVE_TAX_RATE;
    const annualEducationTax = annualPropertyTax * EDUCATION_TAX_SHARE;
    const totalEducationTaxPaid = annualEducationTax * years;
    const totalSpentOnKids = kids * TOTAL_SCHOOL_YEARS * BLENDED_PER_PUPIL;
    const gap = totalSpentOnKids - totalEducationTaxPaid;
    return { annualPropertyTax, annualEducationTax, totalEducationTaxPaid, totalSpentOnKids, gap };
  }, [kids, homeValue, years]);

  function handleReset() {
    setKids(2);
    setHomeValue(MEDIAN_HOME);
    setYears(20);
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="app-header">
          <div className="header-row">
            <h1>Oak Park Education Investment Calculator</h1>
            <button className="reset-button" onClick={handleReset}>Reset</button>
          </div>
          <p className="intro-text">
            Public schools are funded by the entire community for the benefit of the community.
            This calculator shows the <strong>gap between what a family pays in education taxes
            and what it costs to educate their children</strong> — and what happens to that
            investment when families leave Oak Park after graduation.
          </p>
        </header>

        <main className="app-layout">
          <InputPanel
            kids={kids} setKids={setKids}
            homeValue={homeValue} setHomeValue={setHomeValue}
            years={years} setYears={setYears}
          />
          <ResultsPanel results={results} kids={kids} years={years} />
          <GapSection results={results} />
        </main>

        <footer className="app-footer">
          <p>
            Per-pupil expenditures: D97 {fmt(D97_PER_PUPIL)}/yr · D200 {fmt(D200_PER_PUPIL)}/yr.
            Sources: <a href="https://www.illinoisreportcard.com/district.aspx?districtid=06016097002&source=environment&source2=sber" target="_blank" rel="noopener">D97 Illinois Report Card</a> ·{" "}
            <a href="https://www.illinoisreportcard.com/District.aspx?districtId=06016200013" target="_blank" rel="noopener">D200 Illinois Report Card</a> ·{" "}
            Education tax share (~70%) from Oak Park taxing body analysis.
            Effective property tax rate estimated at ~2.4% of market value.
            This is an estimate for informational purposes only.
          </p>
        </footer>
      </div>
    </>
  );
}
