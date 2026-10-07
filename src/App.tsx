import { useEffect, useMemo, useState } from "react";

type IconName =
  | "grid"
  | "swap"
  | "users"
  | "network"
  | "case"
  | "model"
  | "search"
  | "bell"
  | "chevron"
  | "shield"
  | "pulse"
  | "filter"
  | "clock"
  | "device"
  | "location"
  | "card"
  | "close"
  | "menu";

const paths: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  swap: <><path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/><path d="M18 7l-3 3"/><path d="M6 17l3-3"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6"/><circle cx="17" cy="7" r="2"/><path d="M16 13c3.2 0 5 2 5 5"/></>,
  network: <><circle cx="5" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M7.4 11l8.2-4"/><path d="M7.4 13l8.2 4"/></>,
  case: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4h6v2"/><path d="M3 11h18"/><path d="M10 11v2h4v-2"/></>,
  model: <><path d="M4 18V9"/><path d="M10 18V5"/><path d="M16 18v-7"/><path d="M22 18H2"/><path d="M4 7l6-4 6 6 5-5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  chevron: <path d="M9 18l6-6-6-6"/>,
  shield: <><path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3z"/><path d="M8 12l2.5 2.5L16 9"/></>,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
  filter: <><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  device: <><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M10 18h4"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 10h18"/></>,
  close: <><path d="M5 5l14 14"/><path d="M19 5L5 19"/></>,
  menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

type Risk = "safe" | "medium" | "high" | "critical";

const transactions = [
  { id: "TXN-10482", account: "ACC-9281", amount: "₹84,200", merchant: "ElectroMart", score: 94, reason: "New device + network", risk: "critical" as Risk, time: "02:43" },
  { id: "TXN-10481", account: "ACC-1823", amount: "₹12,500", merchant: "TechWorld", score: 61, reason: "Unusual location", risk: "medium" as Risk, time: "02:41" },
  { id: "TXN-10480", account: "ACC-5512", amount: "₹2,400", merchant: "FreshMart", score: 8, reason: "Normal behavior", risk: "safe" as Risk, time: "02:38" },
  { id: "TXN-10479", account: "ACC-10294", amount: "₹46,900", merchant: "Digital Hub", score: 88, reason: "Shared payout account", risk: "high" as Risk, time: "02:34" },
  { id: "TXN-10478", account: "ACC-6751", amount: "₹7,820", merchant: "Urban Store", score: 24, reason: "Known pattern", risk: "safe" as Risk, time: "02:29" },
  { id: "TXN-10477", account: "ACC-2208", amount: "₹31,200", merchant: "Gadget Galaxy", score: 76, reason: "Velocity anomaly", risk: "high" as Risk, time: "02:27" },
];

const navItems: { label: string; icon: IconName; screen: string }[] = [
  { label: "Command Center", icon: "grid", screen: "command" },
  { label: "Transactions", icon: "swap", screen: "transactions" },
  { label: "Accounts", icon: "users", screen: "accounts" },
  { label: "Fraud Rings", icon: "network", screen: "network" },
  { label: "Investigations", icon: "case", screen: "investigations" },
  { label: "Model Insights", icon: "model", screen: "model" },
];

function ActionButton({ children, tone = "default", icon, onClick }: { children: React.ReactNode; tone?: "default" | "danger" | "ghost"; icon?: IconName; onClick?: () => void }) {
  return <div className={`button ${tone}`} role="button" tabIndex={0} onClick={onClick}>{icon && <Icon name={icon} size={16}/>}<span>{children}</span></div>;
}

function Badge({ children, tone = "info" }: { children: React.ReactNode; tone?: Risk | "info" | "neutral" }) {
  return <span className={`badge ${tone}`}><span className="badge-dot"/>{children}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function SectionTitle({ eyebrow, title, meta }: { eyebrow?: string; title: string; meta?: React.ReactNode }) {
  return <div className="section-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<div className="section-title">{title}</div></div>{meta}</div>;
}

function Filter({ label, wide = false }: { label: string; wide?: boolean }) {
  return <div className={`filter-control ${wide ? "wide" : ""}`} role="button" tabIndex={0}>{wide && <Icon name="search" size={16}/>}<span>{label}</span>{!wide && <span className="filter-caret">⌄</span>}</div>;
}

function Sidebar({ screen, setScreen, compact, setCompact }: { screen: string; setScreen: (s: string) => void; compact: boolean; setCompact: (v: boolean) => void }) {
  return <aside className={`sidebar ${compact ? "compact" : ""}`}>
    <div className="brand">
      <div className="brand-mark"><Icon name="shield" size={22}/></div>
      <div className="brand-copy"><div className="brand-name">FININTEL</div><div className="brand-sub">REAL-TIME FRAUD INTELLIGENCE</div></div>
      <div className="sidebar-toggle" role="button" tabIndex={0} onClick={() => setCompact(!compact)}><Icon name={compact ? "menu" : "close"} size={15}/></div>
    </div>
    <div className="nav-label">WORKSPACE</div>
    <nav className="nav">
      {navItems.map((item) => <div key={item.screen} className={`nav-item ${screen === item.screen ? "active" : ""}`} role="button" tabIndex={0} onClick={() => setScreen(item.screen)} title={item.label}><Icon name={item.icon}/><span>{item.label}</span>{screen === item.screen && <span className="active-line"/>}</div>)}
    </nav>
    <div className="side-spacer"/>
    <div className="system-card"><div className="system-line"><span className="live-dot"/><span>SYSTEM ONLINE</span></div><div className="system-meta">Models · API · Graph</div></div>
    <div className="analyst">
      <div className="avatar">AS</div>
      <div className="analyst-copy"><strong>Arjun Shah</strong><span>Senior Fraud Analyst</span></div>
      <Icon name="chevron" size={14}/>
    </div>
  </aside>;
}

function AppHeader({ title, subtitle, statusLabel = "SYSTEM ONLINE" }: { title: string; subtitle: string; statusLabel?: string }) {
  return <header className="app-header">
    <div><div className="page-title">{title}</div><div className="page-subtitle">{subtitle}</div></div>
    <div className="header-actions"><Badge tone="safe">{statusLabel}</Badge><div className="icon-button" role="button" tabIndex={0}><Icon name="bell"/><span className="notification-dot"/></div><div className="avatar sm">AS</div></div>
  </header>;
}

function KpiCard({ label, value, trend, tone, bars }: { label: string; value: string; trend: string; tone: Risk | "info"; bars: number[] }) {
  return <Panel className={`kpi ${tone}`}>
    <div className="kpi-top"><span>{label}</span><span className={`status-pip ${tone}`}/></div>
    <div className="kpi-main"><div><div className="kpi-value">{value}</div><div className="kpi-trend"><span>↗</span> {trend}</div></div><div className="mini-bars">{bars.map((h, i) => <span key={i} style={{height: `${h}%`}}/>)}</div></div>
  </Panel>;
}

function RiskBar({ label, value, tone }: { label: string; value: number; tone: Risk }) {
  return <div className="risk-row"><div className="risk-row-meta"><span><span className={`legend-dot ${tone}`}/>{label}</span><strong>{value}%</strong></div><div className="bar-track"><span className={tone} style={{width: `${value}%`}}/></div></div>;
}

function TransactionTable({ onSelect, limit }: { onSelect: (id: string) => void; limit?: number }) {
  const rows = limit ? transactions.slice(0, limit) : transactions;
  return <div className="table-wrap"><table>
    <thead><tr><th>Transaction</th><th>Account</th><th>Amount</th><th>Merchant</th><th>Risk score</th><th>Reason</th><th>Action</th></tr></thead>
    <tbody>{rows.map((tx) => <tr key={tx.id} onClick={() => onSelect(tx.id)}>
      <td><span className="mono primary-id">{tx.id}</span><span className="row-time">{tx.time} AM</span></td>
      <td><span className="mono">{tx.account}</span></td><td className="amount">{tx.amount}</td><td>{tx.merchant}</td>
      <td><div className="score-cell"><strong>{String(tx.score).padStart(2, "0")}</strong><span>/100</span><span className={`score-line ${tx.risk}`} style={{width: `${Math.max(tx.score, 12)}%`}}/></div></td>
      <td>{tx.reason}</td><td><Badge tone={tx.risk}>{tx.risk === "critical" ? "Freeze" : tx.risk === "high" || tx.risk === "medium" ? "Review" : "Safe"}</Badge></td>
    </tr>)}</tbody>
  </table></div>;
}

function CommandConvergence({ onOpen }: { onOpen: () => void }) {
  const entities = [
    { x: 260, y: 140, className: "incident", type: "ACTIVE INCIDENT", label: "INV-00291" },
    { x: 76, y: 140, className: "account", type: "ACCOUNT", label: "ACC-9281" },
    { x: 260, y: 36, className: "device", type: "DEVICE", label: "DVC-77821" },
    { x: 444, y: 140, className: "payout", type: "PAYOUT", label: "PAY-1032" },
    { x: 260, y: 244, className: "ring", type: "FRAUD RING", label: "RING-03" },
  ];
  return <div className="command-convergence" role="button" tabIndex={0} onClick={onOpen}>
    <svg viewBox="0 0 520 280" role="img" aria-label="Active incident connected to an account, device, payout account and fraud ring">
      <g className="convergence-edges">
        <line x1="108" y1="140" x2="214" y2="140"/><line x1="260" y1="65" x2="260" y2="104"/>
        <line x1="306" y1="140" x2="410" y2="140"/><line x1="260" y1="176" x2="260" y2="215"/>
        <circle cx="160" cy="140" r="3"/><circle cx="260" cy="84" r="3"/><circle cx="360" cy="140" r="3"/><circle cx="260" cy="197" r="3"/>
      </g>
      {entities.map((entity) => <g key={entity.label} className={`convergence-node ${entity.className}`} transform={`translate(${entity.x} ${entity.y})`}>
        <rect x={entity.className === "incident" ? -46 : -34} y={entity.className === "incident" ? -36 : -29} width={entity.className === "incident" ? 92 : 68} height={entity.className === "incident" ? 72 : 58} rx="10"/>
        <text className="convergence-type" textAnchor="middle" y="-6">{entity.type}</text><text className="convergence-label" textAnchor="middle" y="11">{entity.label}</text>
        {entity.className === "incident" && <text className="convergence-risk" textAnchor="middle" y="25">94 · CRITICAL</text>}
      </g>)}
    </svg>
    <div className="convergence-caption"><span><i/>4 suspicious relationships confirmed</span><strong>VIEW NETWORK →</strong></div>
  </div>;
}

function CommandCenter({ setScreen, selectTransaction }: { setScreen: (s: string) => void; selectTransaction: (id: string) => void }) {
  const openThreat = () => { selectTransaction("TXN-10482"); setScreen("transaction-detail"); };
  const prioritySignals = [
    { transaction: "TXN-10482", account: "ACC-9281", risk: 94, reason: "New device + network", action: "FREEZE", tone: "critical" as Risk },
    { transaction: "TXN-10479", account: "ACC-10294", risk: 88, reason: "Shared payout account", action: "REVIEW", tone: "high" as Risk },
    { transaction: "TXN-10477", account: "ACC-2208", risk: 76, reason: "Velocity anomaly", action: "REVIEW", tone: "high" as Risk },
  ];
  return <>
    <AppHeader title="FINANCIAL FRAUD INTELLIGENCE" subtitle="Real-time threat detection and fraud investigation" statusLabel="LIVE SYSTEM"/>
    <main className="content command-center">
      <section className="threat-pulse">
        <div className="pulse-rail">
          <div className="pulse-heading"><div><div className="eyebrow cyan">THREAT PULSE</div><div className="pulse-title">Critical incident requires action</div></div><Badge tone="critical">ACTIVE INVESTIGATION</Badge></div>
          <div className="incident-core">
            <div className="incident-identity"><div className="incident-label"><span className="live-dot critical-live"/><span>CRITICAL INCIDENT</span></div><div className="incident-id mono">INV-00291</div>
              <div className="incident-links"><div><span>ACCOUNT</span><strong className="mono">ACC-9281</strong></div><div><span>TRANSACTION</span><strong className="mono">TXN-10482</strong></div></div>
            </div>
            <div className="command-risk"><div className="command-score"><svg viewBox="0 0 110 110" aria-label="Risk score 94 out of 100"><circle className="score-base" cx="55" cy="55" r="47"/><circle className="score-value" cx="55" cy="55" r="47" pathLength="100"/></svg><div><strong>94</strong><span>/ 100</span></div></div><div className="command-risk-label"><span>RISK SCORE</span><strong>CRITICAL</strong></div></div>
          </div>
          <div className="incident-story"><div className="story-kicker"><Icon name="pulse" size={16}/><span>AI RISK STORY</span></div><p><strong className="mono">ACC-9281</strong> normally operates within a predictable spending pattern. This transaction is significantly above normal behavior, occurred at an unusual time, originated from a new device and is connected to multiple accounts.</p><span className="story-link" role="button" tabIndex={0} onClick={openThreat}>VIEW FULL INVESTIGATION →</span></div>
        </div>
        <div className="pulse-evidence"><div className="eyebrow">WHY THIS MATTERS</div><div className="command-signals">
          {[["New device", "+32", 100],["Amount 4.8× account average", "+24", 75],["Unusual transaction time", "+18", 56],["Device shared with 7 accounts", "+15", 47],["Network connection", "+05", 16]].map(([label, score, width]) => <div className="command-signal" key={label as string}><div><span>{label}</span><strong>{score}</strong></div><div className="signal-track"><i style={{ width: `${width}%` }}/></div></div>)}
        </div></div>
        <div className="command-action"><div className="action-shield"><Icon name="shield" size={22}/></div><div className="eyebrow">RECOMMENDED ACTION</div><div className="command-action-title">Freeze &amp;<br/>Investigate</div><p>High transaction risk + coordinated network activity + shared device relationship.</p><ActionButton tone="danger" onClick={() => setScreen("investigations")}>OPEN INVESTIGATION →</ActionButton><ActionButton tone="ghost">MONITOR</ActionButton></div>
      </section>
      <div className="command-operations">
        <Panel className="convergence-panel"><SectionTitle eyebrow="ACTIVE INCIDENT INTELLIGENCE" title="Threat Convergence" meta={<Badge tone="critical">4 LINKS</Badge>}/><CommandConvergence onOpen={() => setScreen("network")}/></Panel>
        <div className="operations-stack">
          <Panel className="action-queue"><SectionTitle eyebrow="ORDERED BY URGENCY" title="Action Queue" meta={<span className="small-meta">25 open</span>}/><div className="queue-list">
            <div role="button" tabIndex={0} onClick={() => setScreen("investigations")}><span className="queue-marker critical"/><strong>3</strong><span>FREEZE &amp; INVESTIGATE</span><Icon name="chevron" size={14}/></div>
            <div role="button" tabIndex={0} onClick={() => setScreen("transactions")}><span className="queue-marker high"/><strong>8</strong><span>MANUAL REVIEW</span><Icon name="chevron" size={14}/></div>
            <div role="button" tabIndex={0} onClick={() => setScreen("transactions")}><span className="queue-marker medium"/><strong>14</strong><span>MONITOR</span><Icon name="chevron" size={14}/></div>
          </div></Panel>
          <Panel className="priority-signals"><SectionTitle eyebrow="ACTIONABLE NOW" title="Priority Signals" meta={<span className="small-meta">Risk ≥ 75</span>}/><div className="priority-list">
            {prioritySignals.map((signal) => <div className="priority-row" role="button" tabIndex={0} key={signal.transaction} onClick={() => { selectTransaction(signal.transaction); setScreen("transaction-detail"); }}><div><strong className="mono">{signal.transaction}</strong><span className="mono">{signal.account}</span></div><div className={`priority-score ${signal.tone}`}><strong>{signal.risk}</strong><span>/100</span></div><span className="priority-reason">{signal.reason}</span><Badge tone={signal.tone}>{signal.action}</Badge></div>)}
          </div><div className="priority-footer" role="button" tabIndex={0} onClick={() => setScreen("transactions")}>VIEW ALL TRANSACTIONS →</div></Panel>
        </div>
      </div>
      <section className="system-snapshot"><div className="snapshot-label"><Icon name="pulse" size={15}/><div><strong>SYSTEM SNAPSHOT</strong><span>Live intelligence · updated 14 sec ago</span></div></div><div className="snapshot-metrics"><div><strong>48,291</strong><span>Transactions analyzed</span></div><div><strong>84</strong><span>Accounts at risk</span></div><div><strong>6</strong><span>Fraud rings detected</span></div><div><strong>327</strong><span>High-risk transactions</span></div></div><Badge tone="safe">SYSTEM HEALTHY</Badge></section>
    </main>
  </>;
}

function Transactions({ setScreen, selectTransaction }: { setScreen: (s: string) => void; selectTransaction: (id: string) => void }) {
  return <><AppHeader title="Transaction Intelligence" subtitle="Analyze transaction behavior and AI-generated risk factors."/><main className="content">
    <Panel className="filter-panel"><div className="filter-grid"><Filter label="Search transaction, account, device…" wide/><Filter label="All risk levels"/><Filter label="Last 24 hours"/><Filter label="All merchants"/><Filter label="All locations"/><Filter label="All statuses"/><ActionButton tone="ghost" icon="filter">Clear filters</ActionButton></div></Panel>
    <Panel className="transactions-panel"><SectionTitle eyebrow="48,291 TOTAL · 327 HIGH RISK" title="Transaction Activity" meta={<div className="segmented"><span className="active">All</span><span>Flagged</span><span>Reviewed</span></div>}/><TransactionTable onSelect={(id) => {selectTransaction(id); setScreen("transaction-detail");}}/><div className="table-footer"><span>Showing 1–6 of 48,291</span><span className="pagination"><b>‹</b><b className="active">1</b><b>2</b><b>3</b><b>›</b></span></div></Panel>
  </main></>;
}

const evidence = [
  { score: 32, label: "NEW DEVICE", detail: "First seen 18 minutes ago", width: 100 },
  { score: 24, label: "AMOUNT 4.8× ACCOUNT AVERAGE", detail: "₹84,200 vs ₹17,540 baseline", width: 75 },
  { score: 18, label: "UNUSUAL TRANSACTION TIME", detail: "Outside typical 9 AM–8 PM window", width: 56 },
  { score: 15, label: "DEVICE SHARED WITH 7 ACCOUNTS", detail: "4 linked accounts currently flagged", width: 47 },
  { score: 5, label: "NETWORK CONNECTION", detail: "Connected to Fraud Ring R-03", width: 16 },
];

function TransactionDetail({ setScreen }: { setScreen: (s: string) => void }) {
  return <><AppHeader title="Transaction Investigation" subtitle="Review model evidence, behavioral context and connected risk."/><main className="content">
    <div className="breadcrumb"><span onClick={() => setScreen("transactions")}>Transactions</span><Icon name="chevron" size={13}/><strong className="mono">TXN-10482</strong></div>
    <Panel className="transaction-hero">
      <div className="tx-heading"><div><div className="eyebrow">TRANSACTION</div><div className="detail-title mono">TXN-10482</div><div className="detail-meta">Detected 02:43 AM · 18 June 2025 · Real-time model v4.2</div></div><div className="risk-hero"><div className="score-ring critical"><strong>94</strong><span>/100</span></div><div><Badge tone="critical">CRITICAL RISK</Badge><div className="recommend-inline">FREEZE &amp; INVESTIGATE</div></div></div></div>
      <div className="fact-grid">
        {[["Amount","₹84,200","card"],["Merchant","ElectroMart","card"],["Location","Chennai, IN","location"],["Device","DVC-77821","device"],["Account","ACC-9281","users"],["Payout Account","PAY-1032","swap"]].map(([label,value,icon]) => <div className="fact" key={label}><div className="fact-icon"><Icon name={icon as IconName} size={17}/></div><div><span>{label}</span><strong className={label.includes("Account") || label === "Device" ? "mono" : ""}>{value}</strong></div></div>)}
      </div>
    </Panel>
    <div className="detail-layout">
      <div className="detail-main">
        <Panel><SectionTitle eyebrow="MODEL EXPLAINABILITY · SHAP CONTRIBUTIONS" title="Why was this transaction flagged?" meta={<Badge tone="critical">+94 RISK POINTS</Badge>}/><div className="evidence-list">{evidence.map((item) => <div className="evidence-item" key={item.label}><div className="evidence-score">+{item.score}</div><div className="evidence-content"><div><strong>{item.label}</strong><span>{item.detail}</span></div><div className="contribution-track"><span style={{width: `${item.width}%`}}/></div></div></div>)}</div></Panel>
        <Panel className="risk-story">
          <div className="story-accent"><Icon name="pulse" size={22}/></div><SectionTitle eyebrow="AI-GENERATED BEHAVIORAL NARRATIVE" title="AI Risk Story" meta={<Badge tone="info">HIGH CONFIDENCE</Badge>}/>
          <div className="story-text"><strong className="mono">ACC-9281</strong> normally spends around <strong>₹3,200</strong> between <strong>9 AM and 8 PM</strong> using Device <strong className="mono">D-21</strong>.<br/><br/>This transaction is <mark>significantly higher than normal behavior</mark>, occurred at <mark>2:43 AM</mark>, and originated from a <mark>new device shared with multiple accounts</mark>. Network analysis connects this account to <strong className="link" onClick={() => setScreen("network")}>Fraud Ring R-03 →</strong></div>
          <div className="story-assessment"><div><span>FINAL ASSESSMENT</span><strong>CRITICAL · 94/100</strong></div><div className="assessment-divider"/><div><span>RECOMMENDED</span><strong>FREEZE &amp; INVESTIGATE</strong></div></div>
        </Panel>
      </div>
      <div className="detail-side">
        <Panel className="action-card critical-action"><div className="action-icon"><Icon name="shield" size={25}/></div><div className="eyebrow">RECOMMENDED ACTION</div><div className="action-risk">CRITICAL</div><div className="action-title">Freeze &amp;<br/>Investigate</div><p>High transaction risk combined with coordinated network activity.</p><ActionButton tone="danger">FREEZE ACCOUNT</ActionButton><ActionButton onClick={() => setScreen("investigations")}>OPEN INVESTIGATION</ActionButton><ActionButton tone="ghost">MONITOR ONLY</ActionButton></Panel>
        <Panel><SectionTitle title="Connected intelligence"/><div className="connection-list"><div><Icon name="device"/><span><strong>7 connected accounts</strong>Shared device DVC-77821</span></div><div><Icon name="network"/><span><strong>Fraud Ring R-03</strong>96% match confidence</span></div><div><Icon name="swap"/><span><strong>Payout PAY-1032</strong>Receives from 10 accounts</span></div></div><ActionButton tone="ghost" onClick={() => setScreen("network")}>VIEW NETWORK <span>→</span></ActionButton></Panel>
      </div>
    </div>
  </main></>;
}

const rings = [
  { id: "RING-001", accounts: 10, devices: 3, payout: 1, risk: 97, status: "Active now" },
  { id: "RING-002", accounts: 6, devices: 2, payout: 2, risk: 89, status: "Updated 4m ago" },
  { id: "RING-003", accounts: 8, devices: 4, payout: 1, risk: 91, status: "Updated 11m ago" },
];

function NetworkGraph() {
  const nodes = [
    {x:300,y:190,label:"DVC-77821",type:"DEVICE",className:"device",r:34},
    {x:510,y:190,label:"PAY-1032",type:"PAYOUT",className:"payout",r:38},
    {x:165,y:100,label:"ACC-9281",type:"ACCOUNT",className:"critical-node",r:32},
    {x:170,y:270,label:"ACC-10294",type:"ACCOUNT",className:"risk-node",r:30},
    {x:310,y:65,label:"ACC-4401",type:"ACCOUNT",className:"risk-node",r:28},
    {x:405,y:300,label:"ACC-2208",type:"ACCOUNT",className:"risk-node",r:29},
    {x:505,y:65,label:"DVC-21009",type:"DEVICE",className:"device",r:31},
    {x:635,y:125,label:"ACC-7712",type:"ACCOUNT",className:"normal-node",r:27},
    {x:640,y:285,label:"CHENNAI",type:"LOCATION",className:"location",r:30},
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[1,3],[1,5],[1,6],[6,7],[1,8],[5,8],[2,4]];
  return <div className="graph">
    <svg viewBox="0 0 760 370" role="img" aria-label="Fraud ring relationship graph">
      <defs><filter id="soft"><feGaussianBlur stdDeviation="4"/></filter></defs>
      <g className="edges">{edges.map(([a,b],i) => <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} className={i < 7 ? "suspicious-edge" : ""}/>)}</g>
      {nodes.map((node) => <g key={node.label} className={`graph-node ${node.className}`} transform={`translate(${node.x} ${node.y})`}><circle className="node-halo" r={node.r+9}/><circle r={node.r}/><text className="node-type" textAnchor="middle" y="-4">{node.type}</text><text className="node-label" textAnchor="middle" y="11">{node.label}</text></g>)}
    </svg>
    <div className="graph-legend"><span><i className="account"/>Account</span><span><i className="device"/>Device</span><span><i className="payout"/>Payout</span><span><i className="location"/>Location</span></div>
    <div className="graph-zoom"><span>＋</span><span>−</span><span>⌂</span></div>
  </div>;
}

function NetworkScreen({ setScreen }: { setScreen: (s: string) => void }) {
  const [selectedRing, setSelectedRing] = useState("RING-001");
  return <><AppHeader title="Fraud Network Intelligence" subtitle="Detect coordinated fraud through account, device and payout relationships."/><main className="content network-page">
    <div className="network-toolbar"><div className="table-controls"><Filter label="Search account, device, payout…" wide/><Filter label="Active rings"/><Filter label="Risk: High + Critical"/></div><div className="graph-toggle"><span className="toggle on"><i/></span><span>Show normal connections</span></div></div>
    <div className="network-layout">
      <Panel className="rings-panel"><SectionTitle eyebrow="6 ACTIVE CLUSTERS" title="Detected Fraud Rings"/><div className="ring-list">{rings.map((ring) => <div className={`ring-card ${selectedRing === ring.id ? "selected" : ""}`} role="button" tabIndex={0} onClick={() => setSelectedRing(ring.id)} key={ring.id}>
        <div className="ring-head"><div><span className="mono">{ring.id}</span><small>{ring.status}</small></div><div className="ring-risk"><strong>{ring.risk}</strong><span>RISK</span></div></div>
        <div className="ring-stats"><span><strong>{ring.accounts}</strong> Accounts</span><span><strong>{ring.devices}</strong> Devices</span><span><strong>{ring.payout}</strong> Payout</span></div>
      </div>)}</div><ActionButton tone="ghost">VIEW ALL 6 RINGS <span>→</span></ActionButton></Panel>
      <Panel className="graph-panel"><div className="graph-head"><div><div className="eyebrow">SELECTED NETWORK</div><div className="section-title">{selectedRing}</div></div><div className="table-controls"><Filter label="All node types"/><ActionButton tone="ghost">RESET VIEW</ActionButton></div></div><NetworkGraph/></Panel>
    </div>
    <div className="network-insights">
      <Panel className="pattern-card"><div className="pattern-icon"><Icon name="network" size={25}/></div><div className="eyebrow cyan">PATTERN DETECTED · 96% CONFIDENCE</div><div className="pattern-title">10 accounts share 3 devices<br/>and 1 payout account.</div><div className="pattern-details"><div><span>BEHAVIORAL PATTERN</span><strong>Similar electronics purchased in the same sequence.</strong></div><div><span>NETWORK PATTERN</span><strong>Multiple accounts converge on payout PAY-1032.</strong></div></div><ActionButton onClick={() => setScreen("investigations")}>OPEN INVESTIGATION <span>→</span></ActionButton></Panel>
      <Panel className="action-card network-action"><div className="action-icon"><Icon name="shield" size={25}/></div><div className="eyebrow">RECOMMENDED ACTION</div><div className="action-risk">CRITICAL</div><div className="action-title">Freeze &amp; Investigate</div><p>High transaction risk combined with coordinated network activity and a shared payout account.</p><div className="action-buttons"><ActionButton tone="danger">FREEZE ACCOUNTS</ActionButton><ActionButton onClick={() => setScreen("investigations")}>OPEN CASE</ActionButton><ActionButton tone="ghost">MONITOR</ActionButton></div></Panel>
    </div>
  </main></>;
}

function Investigations() {
  const timeline = [
    ["02:31 AM","New device detected","DVC-77821 first observed on account ACC-9281"],
    ["02:37 AM","Unusual transaction initiated","Amount exceeds behavioral baseline by 4.8×"],
    ["02:43 AM","High-risk transaction detected","TXN-10482 scored critical at 94/100"],
    ["02:44 AM","Network relationship identified","Device linked to seven additional accounts"],
    ["02:45 AM","Fraud ring correlation detected","96% match to active network RING-001"],
  ];
  return <><AppHeader title="Investigation Workspace" subtitle="Consolidated evidence, chronology and analyst decisioning."/><main className="content">
    <Panel className="case-header"><div><div className="eyebrow">ACTIVE CASE</div><div className="case-title"><span className="mono">INV-00291</span><Badge tone="critical">CRITICAL</Badge><Badge tone="info">OPEN</Badge></div><p>Coordinated account takeover and payout convergence</p></div><div className="case-meta"><div><span>ASSIGNED TO</span><strong>Arjun Shah</strong></div><div><span>OPENED</span><strong>18 Jun · 02:45 AM</strong></div><ActionButton tone="ghost">ADD NOTE</ActionButton></div></Panel>
    <div className="case-layout"><div className="case-main">
      <Panel><SectionTitle eyebrow="5 CORRELATED EVENTS" title="Risk Timeline"/><div className="timeline">{timeline.map((event,i) => <div className={`timeline-item ${i === timeline.length-1 ? "active" : ""}`} key={event[0]}><div className="timeline-time">{event[0]}</div><div className="timeline-track"><span/><i/></div><div><strong>{event[1]}</strong><p>{event[2]}</p></div></div>)}</div></Panel>
      <Panel><SectionTitle eyebrow="EVIDENCE SUMMARY" title="Investigation Evidence"/><div className="evidence-tabs"><span className="active">Transactions <b>4</b></span><span>Accounts <b>10</b></span><span>Devices <b>3</b></span><span>AI Explanation</span></div><div className="case-evidence"><div className="evidence-callout"><Icon name="shield"/><div><strong>Critical transaction</strong><span className="mono">TXN-10482 · ACC-9281 · ₹84,200</span></div><Badge tone="critical">94/100</Badge></div><p>Transaction was initiated from a newly observed device at an anomalous time and shares payout infrastructure with nine other accounts.</p></div></Panel>
    </div><div className="case-side"><Panel className="action-card critical-action"><div className="action-icon"><Icon name="shield" size={25}/></div><div className="eyebrow">FINAL RECOMMENDATION</div><div className="action-risk">CRITICAL</div><div className="action-title">Freeze &amp;<br/>Investigate</div><div className="confidence"><span>AI CONFIDENCE</span><strong>96%</strong></div><ActionButton tone="danger">FREEZE 10 ACCOUNTS</ActionButton><ActionButton>ESCALATE CASE</ActionButton><ActionButton tone="ghost">MARK FALSE POSITIVE</ActionButton></Panel>
      <Panel><SectionTitle title="Investigation notes" meta={<span className="small-meta">2 notes</span>}/><div className="note"><div className="avatar xs">AS</div><div><strong>Arjun Shah <span>· 02:51</span></strong><p>Pattern aligns with device-farm activity. Awaiting payout verification.</p></div></div><div className="note-field">Add investigation note…</div></Panel>
    </div></div>
  </main></>;
}

function Accounts({ setScreen }: { setScreen: (s: string) => void }) {
  const accounts = [
    ["ACC-10294","91","42","7","12","UNDER INVESTIGATION","critical"],
    ["ACC-9281","94","36","5","10","FROZEN","critical"],
    ["ACC-2208","76","63","3","8","MANUAL REVIEW","high"],
    ["ACC-1823","61","18","2","4","MONITORING","medium"],
    ["ACC-5512","08","28","0","2","NORMAL","safe"],
  ];
  return <><AppHeader title="Account Intelligence" subtitle="Monitor account behavior, risk and network relationships."/><main className="content"><Panel className="filter-panel"><div className="filter-grid account-filters"><Filter label="Search account ID…" wide/><Filter label="All risk levels"/><Filter label="All statuses"/><Filter label="Connected accounts"/><ActionButton tone="ghost" icon="filter">Clear filters</ActionButton></div></Panel><Panel className="transactions-panel"><SectionTitle eyebrow="84 ACCOUNTS AT RISK" title="Account Risk Monitor"/><div className="table-wrap"><table><thead><tr><th>Account</th><th>Risk Score</th><th>Transactions</th><th>High-Risk Events</th><th>Connections</th><th>Status</th><th></th></tr></thead><tbody>{accounts.map(a => <tr key={a[0]} onClick={() => a[0] === "ACC-9281" && setScreen("transaction-detail")}><td className="mono primary-id">{a[0]}</td><td><div className={`account-score ${a[6]}`}>{a[1]}<span>/100</span></div></td><td>{a[2]}</td><td>{a[3]}</td><td>{a[4]}</td><td><Badge tone={a[6] as Risk}>{a[5]}</Badge></td><td><Icon name="chevron" size={15}/></td></tr>)}</tbody></table></div></Panel></main></>;
}

function ModelInsights() {
  return <><AppHeader title="Model Intelligence" subtitle="Understand how the fraud detection system performs."/><main className="content">
    <div className="model-kpis">{[["Precision","96.2%","+1.1%"],["Recall","93.8%","+0.6%"],["PR-AUC","95.1%","+0.8%"],["False Positive Rate","1.8%","−0.3%"]].map(v => <Panel className="model-kpi" key={v[0]}><span>{v[0]}</span><strong>{v[1]}</strong><small>{v[2]} vs previous version</small></Panel>)}</div>
    <div className="model-layout"><Panel><SectionTitle eyebrow="VALIDATION SET · LAST 30 DAYS" title="Model Comparison" meta={<Badge tone="info">v4.2 ACTIVE</Badge>}/><div className="model-table"><div className="model-row header"><span>MODEL</span><span>PRECISION</span><span>RECALL</span><span>PR-AUC</span></div>{[["Logistic Regression","88.4%","84.2%","86.1%"],["XGBoost","95.6%","92.7%","94.4%"],["CatBoost","96.2%","93.8%","95.1%"]].map((m,i) => <div className={`model-row ${i===2?"active":""}`} key={m[0]}><span>{m[0]} {i===2 && <Badge tone="safe">ACTIVE</Badge>}</span><strong>{m[1]}</strong><strong>{m[2]}</strong><strong>{m[3]}</strong></div>)}</div><p className="model-note">Performance metrics shown from the current validation set. Production selection remains subject to drift and fairness review.</p></Panel>
    <Panel><SectionTitle eyebrow="GLOBAL FEATURE IMPORTANCE" title="Top Risk Factors"/><div className="factors">{[["Amount anomaly",31],["New device",24],["Transaction timing",18],["Shared device",15],["Network behavior",12]].map((f,i) => <div className="factor" key={f[0]}><div><span>{f[0]}</span><strong>{f[1]}%</strong></div><div className="factor-bar"><span style={{width:`${f[1]*3}%`}} className={`factor-${i}`}/></div></div>)}</div></Panel></div>
  </main></>;
}

type EntryPage = "home" | "login" | "register" | "transition" | "dashboard";

function NetworkPreview() {
  return <div className="network-preview" aria-hidden="true">
    <svg viewBox="0 0 420 260" role="presentation">
      <g className="network-lines">
        <path d="M82 65L190 116L300 70L348 172L210 210L190 116L82 65" />
        <path d="M190 116L348 172" />
      </g>
      {[
        ["82", "65", "ACCOUNT"],
        ["190", "116", "DEVICE"],
        ["300", "70", "ACCOUNT"],
        ["348", "172", "PAYOUT"],
        ["210", "210", "FRAUD RING"],
      ].map(([cx, cy, label]) => <g className="network-node" key={label + cx}>
        <circle cx={cx} cy={cy} r="5" />
        <text x={Number(cx) + 11} y={Number(cy) + 4}>{label}</text>
      </g>)}
    </svg>
  </div>;
}

function StatusLine({ label, active = true }: { label: string; active?: boolean }) {
  return <div className="status-line"><span className={`live-dot ${active ? "" : "inactive"}`} />{label}</div>;
}

function EntryShell({ children, onNavigate }: { children: React.ReactNode; onNavigate: (page: EntryPage) => void }) {
  return <div className="entry-shell">
    <header className="entry-header">
      <button className="entry-brand" onClick={() => onNavigate("home")} aria-label="Go to FININTEL home">
        <span className="brand-mark"><Icon name="shield" size={21} /></span>
        <span><strong>FININTEL</strong><small>REAL-TIME FINANCIAL FRAUD INTELLIGENCE</small></span>
      </button>
      <div className="entry-header-actions"><StatusLine label="INTELLIGENCE ENGINE ONLINE" /><button className="button entry-login-button" onClick={() => onNavigate("login")}>ANALYST LOGIN <span>→</span></button></div>
    </header>
    {children}
    <footer className="entry-footer"><span>FININTEL INTELLIGENCE SYSTEM</span><span>SECURE · EXPLAINABLE · CONNECTED</span></footer>
  </div>;
}

function HomePage({ onNavigate }: { onNavigate: (page: EntryPage) => void }) {
  return <EntryShell onNavigate={onNavigate}>
    <main className="entry-main home-main">
      <section className="home-copy">
        <div className="eyebrow cyan">ENTER THE INTELLIGENCE SYSTEM</div>
        <h1>Financial fraud<br /><span>intelligence.</span></h1>
        <p className="entry-lede">Detect suspicious transactions. Uncover hidden fraud networks. Understand risk before it becomes loss.</p>
        <div className="capability-grid">
          <div><span className="capability-index">01</span><strong>BEHAVIORAL DETECTION</strong><p>Identify abnormal transaction behavior.</p></div>
          <div><span className="capability-index">02</span><strong>NETWORK INTELLIGENCE</strong><p>Discover coordinated fraud rings and hidden relationships.</p></div>
          <div><span className="capability-index">03</span><strong>EXPLAINABLE AI</strong><p>Understand why transactions and accounts are considered risky.</p></div>
        </div>
        <div className="entry-cta-row"><button className="primary-entry-button" onClick={() => onNavigate("login")}>ENTER FININTEL <span>→</span></button><span>Already have analyst access? <button className="text-button" onClick={() => onNavigate("login")}>SIGN IN</button></span></div>
      </section>
      <section className="home-visual">
        <div className="visual-label">RELATIONSHIP INTELLIGENCE <span>LIVE</span></div>
        <NetworkPreview />
        <div className="intelligence-panel">
          <div className="eyebrow">INTELLIGENCE ENGINE</div>
          <StatusLine label="RISK ENGINE · ONLINE" />
          <StatusLine label="NETWORK ANALYSIS · ONLINE" />
          <StatusLine label="MODEL STATUS · ACTIVE" />
        </div>
      </section>
    </main>
  </EntryShell>;
}

function LoginPage({ onNavigate, onSuccess }: { onNavigate: (page: EntryPage) => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid analyst email.");
    if (!password) return setError("Password is required.");
    setError("");
    onSuccess();
  };
  return <EntryShell onNavigate={onNavigate}>
    <main className="auth-main">
      <section className="auth-intro"><div className="eyebrow cyan">FININTEL ANALYST PORTAL</div><h1>Secure access.</h1><p>Secure access to real-time fraud detection, network intelligence and explainable risk analysis.</p><div className="auth-capabilities"><span>BEHAVIORAL DETECTION</span><span>NETWORK INTELLIGENCE</span><span>EXPLAINABLE AI</span></div><NetworkPreview /></section>
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="eyebrow cyan">SECURE ACCESS</div><h2>Authenticate as an analyst.</h2><p className="auth-card-subtitle">Use your authorized FININTEL credentials to continue.</p>
        <label>EMAIL / ANALYST ID<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="analyst@company.com" autoComplete="username" /></label>
        <label>PASSWORD<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" /></label>
        <div className="auth-options"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember this device</label><button type="button" className="text-button">Forgot password?</button></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-entry-button full-width" type="submit">SIGN IN <span>→</span></button>
        <div className="auth-switch">Don't have an analyst account? <button type="button" className="text-button" onClick={() => onNavigate("register")}>CREATE ACCOUNT</button></div>
        <StatusLine label="INTELLIGENCE ENGINE ONLINE" />
      </form>
    </main>
  </EntryShell>;
}

function RegisterPage({ onNavigate }: { onNavigate: (page: EntryPage) => void }) {
  const [form, setForm] = useState({ name: "", email: "", analystId: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: event.target.value });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.analystId || !form.password || !form.confirm) return setError("Complete all required fields.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a valid analyst email.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setError("");
    onNavigate("login");
  };
  return <EntryShell onNavigate={onNavigate}>
    <main className="auth-main register-main">
      <section className="auth-intro"><div className="eyebrow cyan">CONTROLLED ACCESS</div><h1>Join the<br /><span>intelligence system.</span></h1><p>Request secure access to the FININTEL intelligence platform.</p><NetworkPreview /></section>
      <form className="auth-card register-card" onSubmit={submit} noValidate>
        <div className="eyebrow cyan">CREATE ANALYST ACCOUNT</div><h2>Request secure access.</h2><p className="auth-card-subtitle">Registration is reviewed before analyst access is enabled.</p>
        <div className="field-grid"><label>FULL NAME<input value={form.name} onChange={update("name")} placeholder="Your full name" autoComplete="name" /></label><label>WORK EMAIL<input type="email" value={form.email} onChange={update("email")} placeholder="analyst@company.com" autoComplete="email" /></label><label>ANALYST ID<input value={form.analystId} onChange={update("analystId")} placeholder="e.g. AS-2048" /></label><label>ACCESS LEVEL<select defaultValue="Fraud Analyst"><option>Fraud Analyst</option><option>Senior Fraud Analyst</option><option>Investigator</option></select></label><label>PASSWORD<input type="password" value={form.password} onChange={update("password")} placeholder="Create a password" autoComplete="new-password" /></label><label>CONFIRM PASSWORD<input type="password" value={form.confirm} onChange={update("confirm")} placeholder="Repeat your password" autoComplete="new-password" /></label></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-entry-button full-width" type="submit">CREATE ACCOUNT <span>→</span></button>
        <div className="auth-switch">Already have an account? <button type="button" className="text-button" onClick={() => onNavigate("login")}>SIGN IN</button></div>
      </form>
    </main>
  </EntryShell>;
}

function SecureTransition({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1100);
    return () => window.clearTimeout(timer);
  }, [onComplete]);
  return <div className="transition-screen"><div className="transition-card"><div className="brand-mark"><Icon name="shield" size={24} /></div><div className="eyebrow cyan">FININTEL</div><h1>SECURE SESSION ESTABLISHED</h1><div className="transition-checks"><span>✓ Identity verified</span><span>✓ Fraud intelligence engine connected</span><span>✓ Network analysis available</span></div><div className="transition-entering">ENTERING COMMAND CENTER<span>...</span></div></div></div>;
}

function App() {
  const initialPath = window.location.pathname;
  const initialPage: EntryPage = initialPath === "/login" ? "login" : initialPath === "/register" ? "register" : initialPath === "/dashboard" ? "dashboard" : "home";
  const [entryPage, setEntryPage] = useState<EntryPage>(initialPage);
  const [screen, setScreen] = useState("command");
  const [compact, setCompact] = useState(false);
  const [, setSelectedTransaction] = useState("TXN-10482");
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setEntryPage(path === "/login" ? "login" : path === "/register" ? "register" : path === "/dashboard" ? "dashboard" : "home");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const navigateEntry = (page: EntryPage) => {
    const path = page === "home" ? "/" : page === "login" ? "/login" : page === "register" ? "/register" : "/dashboard";
    window.history.pushState({}, "", path);
    setEntryPage(page);
  };
  const content = useMemo(() => {
    if (screen === "transactions") return <Transactions setScreen={setScreen} selectTransaction={setSelectedTransaction}/>;
    if (screen === "transaction-detail") return <TransactionDetail setScreen={setScreen}/>;
    if (screen === "accounts") return <Accounts setScreen={setScreen}/>;
    if (screen === "network") return <NetworkScreen setScreen={setScreen}/>;
    if (screen === "investigations") return <Investigations/>;
    if (screen === "model") return <ModelInsights/>;
    return <CommandCenter setScreen={setScreen} selectTransaction={setSelectedTransaction}/>;
  }, [screen]);
  if (entryPage === "home") return <HomePage onNavigate={navigateEntry}/>;
  if (entryPage === "login") return <LoginPage onNavigate={navigateEntry} onSuccess={() => { window.history.pushState({}, "", "/dashboard"); setEntryPage("transition"); }}/>;
  if (entryPage === "register") return <RegisterPage onNavigate={navigateEntry}/>;
  if (entryPage === "transition") return <SecureTransition onComplete={() => setEntryPage("dashboard")}/>;
  return <div className="app-shell"><Sidebar screen={screen === "transaction-detail" ? "transactions" : screen} setScreen={setScreen} compact={compact} setCompact={setCompact}/><div className="app-main">{content}</div></div>;
}

export default App;
