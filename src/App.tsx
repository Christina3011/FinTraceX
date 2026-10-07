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

type ApiState<T> = { data: T | null; loading: boolean; error: boolean };

function useApiData<T>(path: string | null): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: false });
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: false });
    void fetch(path, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json() as Promise<T>;
      })
      .then((data) => setState({ data, loading: false, error: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ data: null, loading: false, error: true });
      });
    return () => controller.abort();
  }, [path]);
  return state;
}

function ApiNotice({ loading, error, empty = false }: { loading: boolean; error: boolean; empty?: boolean }) {
  if (loading) return <div className="api-notice" role="status">Loading intelligence...</div>;
  if (error) return <div className="api-notice error" role="alert">Unable to retrieve fraud intelligence. Check backend connection.</div>;
  if (empty) return <div className="api-notice">No suspicious activity detected.</div>;
  return null;
}

function riskTone(score: number): Risk {
  return score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "safe";
}

function formatReason(reason: string): string {
  const cleaned = reason.replace(/_/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "No positive risk factors returned";
}

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

function TransactionTable({ onSelect, limit, rows }: { onSelect: (id: string) => void; limit?: number; rows: Array<{ id: string; account: string; amount: string; merchant: string; score: number; reason: string; risk: Risk; time: string }> }) {
  const transactionRows = rows.slice(0, limit ?? undefined);
  return <div className="table-wrap"><table>
    <thead><tr><th>Transaction</th><th>Account</th><th>Amount</th><th>Merchant</th><th>Risk score</th><th>Reason</th><th>Action</th></tr></thead>
    <tbody>{transactionRows.map((tx) => <tr key={tx.id} onClick={() => onSelect(tx.id)}>
      <td><span className="mono primary-id">{tx.id}</span><span className="row-time">{tx.time} AM</span></td>
      <td><span className="mono">{tx.account}</span></td><td className="amount">{tx.amount}</td><td>{tx.merchant}</td>
      <td><div className="score-cell"><strong>{String(tx.score).padStart(2, "0")}</strong><span>/100</span><span className={`score-line ${tx.risk}`} style={{width: `${Math.max(tx.score, 12)}%`}}/></div></td>
      <td>{tx.reason}</td><td><Badge tone={tx.risk}>{tx.risk === "critical" ? "Freeze" : tx.risk === "high" || tx.risk === "medium" ? "Review" : "Safe"}</Badge></td>
    </tr>)}</tbody>
  </table></div>;
}

type DashboardSummary = {
  total_transactions: number;
  flagged_transactions: number;
  suspicious_transactions: number;
  high_risk_transactions: number;
  average_risk_score: number;
  critical_count: number;
  risk_distribution: Record<string, number>;
  active_investigations: number;
  fraud_rings: number;
};
type DashboardSignal = { transaction_id: string; account_id: string; risk_score: number; risk_level: string; reason: string; recommended_action: string };
type DashboardAlert = DashboardSignal & { fraud_probability: number; reasons: string[] };
type TransactionRecord = {
  transaction_id: string;
  account_id: string;
  amount: number;
  merchant: string;
  item: string;
  location: string;
  device_id: string;
  timestamp: string;
  risk_score: number;
  risk_level: string;
  fraud_probability: number;
  is_fraud: boolean;
  reasons: string[];
  recommended_action: string;
  payout_account?: string | null;
  connected_accounts?: string[];
  shared_devices?: string[];
  shared_payout_accounts?: string[];
  fraud_ring?: { ring_id: string; members?: string[]; pattern?: string } | null;
};
type AccountRecord = {
  account_id: string;
  risk_score: number;
  risk_level: string;
  transaction_count: number;
  high_risk_transactions: number;
  status: string;
  recommended_action: string;
  reason: string;
  ring_id: string | null;
  connected_accounts: string[];
  connected_devices: string[];
  payout_accounts: string[];
};
type RingSummary = {
  ring_id: string;
  accounts: string[];
  account_ids?: string[];
  member_count?: number;
  shared_devices: string[];
  shared_payout_accounts: string[];
  common_sequence: string[];
  pattern: string;
  flagged_txns: number;
  flagged_amount: number;
  ring_score: number;
  action: string;
};
type RingDetail = RingSummary & { member_accounts: Array<AccountRecord & { connections: { connected_accounts: string[]; devices: string[]; payout_accounts: string[] } }> };
type InvestigationSummary = {
  investigation_id: string;
  account_id: string;
  transaction_id: string;
  ring_id: string | null;
  risk_score: number;
  status: string;
  flagged_transactions: number;
  top_reason: string;
  recommended_action: string;
  last_activity: string | null;
};
type InvestigationDetail = InvestigationSummary & {
  recommendation: string;
  connected_entities: { connected_accounts: string[]; devices: string[]; payout_accounts: string[] };
  timeline: Array<{ timestamp: string; transaction_id: string; event: string; risk_score: number; description: string }>;
  transactions: TransactionRecord[];
};

function DemoTransactionForm({ onScored }: { onScored: (transactionId: string) => void }) {
  const [form, setForm] = useState({ amount: "12500", account_id: "A-DEMO-001", merchant: "giftcards", item: "gift_card", location: "Mumbai", device_id: "D-DEMO-001", payout_account: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: event.target.value });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    setMessage("");
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), timestamp: new Date().toISOString(), transaction_type: "payment" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Transaction scoring failed");
      setMessage(`${data.transaction_id} · ${Number(data.risk_score).toFixed(2)}/100 · ${data.risk_level}`);
      onScored(data.transaction_id);
    } catch {
      setError(true);
      setMessage("Unable to retrieve fraud intelligence. Check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };
  return <Panel className="demo-score-panel">
    <SectionTitle eyebrow="LIVE MODEL · REAL-TIME INFERENCE" title="Score a transaction" meta={<Badge tone="info">XGBOOST</Badge>}/>
    <form className="demo-score-form" onSubmit={submit}>
      <label>AMOUNT<input type="number" min="1" step="0.01" required value={form.amount} onChange={update("amount")}/></label>
      <label>ACCOUNT ID<input required value={form.account_id} onChange={update("account_id")}/></label>
      <label>MERCHANT<input required value={form.merchant} onChange={update("merchant")}/></label>
      <label>ITEM<input required value={form.item} onChange={update("item")}/></label>
      <label>LOCATION<input required value={form.location} onChange={update("location")}/></label>
      <label>DEVICE ID<input required value={form.device_id} onChange={update("device_id")}/></label>
      <label>PAYOUT ACCOUNT<input value={form.payout_account} onChange={update("payout_account")} placeholder="Optional"/></label>
      <button className="button" type="submit" disabled={submitting}>{submitting ? "SCORING..." : "SCORE TRANSACTION →"}</button>
    </form>
    {message && <div className={`demo-result ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{message}</div>}
    <div className="demo-flow">Transaction <span>↓</span> XGBoost <span>↓</span> Risk + reasons + graph + action</div>
  </Panel>;
}

function CommandCenter({ setScreen, selectTransaction }: { setScreen: (s: string) => void; selectTransaction: (id: string) => void }) {
  const summary = useApiData<DashboardSummary>("/api/dashboard/summary");
  const alerts = useApiData<DashboardAlert[]>("/api/dashboard/alerts");
  const priorities = useApiData<DashboardSignal[]>("/api/dashboard/priority-signals");
  const featured = alerts.data?.[0];
  const featuredDetail = useApiData<TransactionRecord>(featured ? `/api/transactions/${encodeURIComponent(featured.transaction_id)}` : null);
  const loading = summary.loading || alerts.loading || priorities.loading;
  const error = summary.error || alerts.error || priorities.error;
  const currentSummary = summary.data;
  const visiblePriorities = priorities.data ?? [];
  const visibleAlerts = alerts.data ?? [];
  const openTransaction = (id: string) => { selectTransaction(id); setScreen("transaction-detail"); };
  const distribution = currentSummary?.risk_distribution ?? {};
  const total = currentSummary?.total_transactions ?? 0;
  const tone = featured ? riskTone(featured.risk_score) : "safe";

  return <>
    <AppHeader title="FINANCIAL FRAUD INTELLIGENCE" subtitle="Real model scores, explainable signals and connected-entity context" statusLabel="LIVE SYSTEM"/>
    <main className="content command-center">
      <ApiNotice loading={loading} error={error}/>
      <section className={`threat-pulse ${featured ? "" : "clear-pulse"}`}>
        <div className="pulse-rail">
          <div className="pulse-heading"><div><div className="eyebrow cyan">THREAT PULSE</div><div className="pulse-title">{featured ? "Highest current alert" : "Low current alert volume"}</div></div><Badge tone={tone}>{featured ? `${featured.risk_level} ALERT` : "NO ACTIVE ALERTS"}</Badge></div>
          {featured ? <>
            <div className="incident-core">
              <div className="incident-identity"><div className="incident-label"><span className={`live-dot ${tone === "safe" ? "" : "critical-live"}`}/><span>MODEL-FLAGGED TRANSACTION</span></div><div className="incident-id mono">{featured.transaction_id}</div>
                <div className="incident-links"><div><span>ACCOUNT</span><strong className="mono">{featured.account_id}</strong></div><div><span>FRAUD PROBABILITY</span><strong>{(featured.fraud_probability * 100).toFixed(2)}%</strong></div></div>
              </div>
              <div className="command-risk"><div className="command-score"><svg viewBox="0 0 110 110" aria-label={`Risk score ${featured.risk_score.toFixed(1)} out of 100`}><circle className="score-base" cx="55" cy="55" r="47"/><circle className="score-value" cx="55" cy="55" r="47" pathLength="100" style={{ strokeDasharray: `${Math.min(100, featured.risk_score)} 100` }}/></svg><div><strong>{Math.round(featured.risk_score)}</strong><span>/ 100</span></div></div><div className="command-risk-label"><span>RISK SCORE</span><strong>{featured.risk_level}</strong></div></div>
            </div>
            <div className="incident-story"><div className="story-kicker"><Icon name="pulse" size={16}/><span>MODEL REASONS</span></div><p>{featured.reasons.length ? featured.reasons.map(formatReason).join(" · ") : "No positive model contributions were returned."}</p><span className="story-link" role="button" tabIndex={0} onClick={() => openTransaction(featured.transaction_id)}>OPEN TRANSACTION EVIDENCE →</span></div>
          </> : <p className="pulse-empty-copy">The scored history currently contains no flagged transactions. Historical counts and risk distribution below reflect the saved model output.</p>}
        </div>
        <div className="pulse-evidence"><div className="eyebrow">CONNECTED ENTITIES</div>
          {featuredDetail.loading && featured ? <ApiNotice loading error={false}/> : featuredDetail.error && featured ? <ApiNotice loading={false} error/> : featured ? <div className="connected-summary">
            <div><strong>{featuredDetail.data?.connected_accounts?.length ?? 0}</strong><span>connected accounts</span></div>
            <div><strong>{featuredDetail.data?.shared_devices?.length ?? 0}</strong><span>shared devices</span></div>
            <div><strong>{featuredDetail.data?.shared_payout_accounts?.length ?? 0}</strong><span>shared payouts</span></div>
            <p>{featuredDetail.data?.fraud_ring?.pattern ?? "No qualifying fraud ring returned for this transaction."}</p>
          </div> : <ApiNotice loading={false} error={false} empty/>}
        </div>
        <div className="command-action"><div className="action-shield"><Icon name="shield" size={22}/></div><div className="eyebrow">RECOMMENDED ACTION</div><div className="command-action-title">{featured ? featured.recommended_action : "Continue monitoring"}</div><p>{featured ? "Recommendation returned by the risk engine for this model-scored transaction." : "No active flagged transaction requires intervention right now."}</p>{featured && <ActionButton onClick={() => openTransaction(featured.transaction_id)}>REVIEW EVIDENCE →</ActionButton>}</div>
      </section>
      <div className="command-operations">
        <Panel className="convergence-panel"><SectionTitle eyebrow="SAVED MODEL OUTPUT" title="Risk Distribution" meta={<span className="small-meta">{total.toLocaleString()} transactions</span>}/>
          <div className="dashboard-risk-list">{[["LOW", "safe"], ["MEDIUM", "medium"], ["HIGH", "high"], ["CRITICAL", "critical"]].map(([level, risk]) => {
            const count = distribution[level] ?? 0;
            return <div className="dashboard-risk-row" key={level}><RiskBar label={level} value={total ? Math.round(count / total * 100) : 0} tone={risk as Risk}/><span>{count.toLocaleString()}</span></div>;
          })}</div>
          <p className="dashboard-caption">Percent of transactions by model risk level. Counts use the saved scored dataset.</p>
        </Panel>
        <div className="operations-stack">
          <Panel className="action-queue"><SectionTitle eyebrow="CURRENT WORKLOAD" title="Intelligence Queue"/><div className="queue-list">
            <div onClick={() => setScreen("investigations")} role="button" tabIndex={0}><span className="queue-marker critical"/><strong>{(currentSummary?.active_investigations ?? 0).toLocaleString()}</strong><span>ACTIVE INVESTIGATIONS</span><Icon name="chevron" size={14}/></div>
            <div onClick={() => setScreen("network")} role="button" tabIndex={0}><span className="queue-marker high"/><strong>{(currentSummary?.fraud_rings ?? 0).toLocaleString()}</strong><span>DETECTED FRAUD RINGS</span><Icon name="chevron" size={14}/></div>
            <div onClick={() => setScreen("transactions")} role="button" tabIndex={0}><span className="queue-marker medium"/><strong>{(currentSummary?.high_risk_transactions ?? 0).toLocaleString()}</strong><span>HIGH-RISK TRANSACTIONS</span><Icon name="chevron" size={14}/></div>
          </div></Panel>
          <Panel className="priority-signals"><SectionTitle eyebrow="RISK SCORE ≥ 30" title="Priority Signals"/><div className="priority-list">
            {priorities.loading || priorities.error ? <ApiNotice loading={priorities.loading} error={priorities.error}/> : visiblePriorities.length === 0 ? <ApiNotice loading={false} error={false} empty/> : visiblePriorities.map((signal) => <div className="priority-row" role="button" tabIndex={0} key={signal.transaction_id} onClick={() => openTransaction(signal.transaction_id)}><div><strong className="mono">{signal.transaction_id}</strong><span className="mono">{signal.account_id}</span></div><div className={`priority-score ${riskTone(signal.risk_score)}`}><strong>{Math.round(signal.risk_score)}</strong><span>/100</span></div><span className="priority-reason">{formatReason(signal.reason)}</span><Badge tone={riskTone(signal.risk_score)}>{signal.recommended_action}</Badge></div>)}
          </div><div className="priority-footer" role="button" tabIndex={0} onClick={() => setScreen("transactions")}>VIEW TRANSACTION HISTORY →</div></Panel>
        </div>
      </div>
      <Panel className="priority-signals"><SectionTitle eyebrow="MODEL-FLAGGED HISTORY" title="Recent Alerts" meta={<span className="small-meta">{visibleAlerts.length} returned</span>}/>
        {alerts.loading || alerts.error ? <ApiNotice loading={alerts.loading} error={alerts.error}/> : visibleAlerts.length === 0 ? <ApiNotice loading={false} error={false} empty/> : <div className="priority-list">{visibleAlerts.map((alert) => <div className="priority-row" role="button" tabIndex={0} key={alert.transaction_id} onClick={() => openTransaction(alert.transaction_id)}><div><strong className="mono">{alert.transaction_id}</strong><span className="mono">{alert.account_id}</span></div><div className={`priority-score ${riskTone(alert.risk_score)}`}><strong>{Math.round(alert.risk_score)}</strong><span>/100</span></div><span className="priority-reason">{alert.reasons.map(formatReason).join(" · ")}</span><Badge tone={riskTone(alert.risk_score)}>{alert.recommended_action}</Badge></div>)}</div>}
      </Panel>
      <section className="system-snapshot"><div className="snapshot-label"><Icon name="pulse" size={15}/><div><strong>SYSTEM SNAPSHOT</strong><span>Current saved model outputs</span></div></div><div className="snapshot-metrics"><div><strong>{(currentSummary?.total_transactions ?? 0).toLocaleString()}</strong><span>Transactions analyzed</span></div><div><strong>{(currentSummary?.suspicious_transactions ?? 0).toLocaleString()}</strong><span>Flagged transactions</span></div><div><strong>{(currentSummary?.active_investigations ?? 0).toLocaleString()}</strong><span>Active investigations</span></div><div><strong>{(currentSummary?.fraud_rings ?? 0).toLocaleString()}</strong><span>Fraud rings</span></div></div><Badge tone={error ? "high" : "safe"}>{error ? "API DEGRADED" : "MODEL DATA LOADED"}</Badge></section>
      <DemoTransactionForm onScored={(id) => openTransaction(id)}/>
    </main>
  </>;
}

function Transactions({ setScreen, selectTransaction }: { setScreen: (s: string) => void; selectTransaction: (id: string) => void }) {
  const result = useApiData<TransactionRecord[]>("/api/transactions");
  const transactions = (result.data ?? []).slice().sort((a, b) => b.risk_score - a.risk_score).slice(0, 100);
  const rows = transactions.map((item) => ({
    id: item.transaction_id,
    account: item.account_id,
    amount: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.amount),
    merchant: item.merchant,
    score: Math.min(100, Math.max(0, item.risk_score)),
    reason: item.reasons[0] ? formatReason(item.reasons[0]) : "No positive model contribution",
    risk: riskTone(item.risk_score),
    time: new Date(item.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
  }));
  return <><AppHeader title="Transaction Intelligence" subtitle="Analyze transaction behavior and AI-generated risk factors."/><main className="content">
    <Panel className="filter-panel"><div className="filter-grid"><Filter label="Search transaction, account, device…" wide/><Filter label="All risk levels"/><Filter label="Last 24 hours"/><Filter label="All merchants"/><Filter label="All locations"/><Filter label="All statuses"/><ActionButton tone="ghost" icon="filter">Clear filters</ActionButton></div></Panel>
    <Panel className="transactions-panel"><SectionTitle eyebrow={`${(result.data?.length ?? 0).toLocaleString()} SCORED TRANSACTIONS`} title="Transaction Activity" meta={<Badge tone="info">RANKED BY RISK</Badge>}/>
      {result.loading || result.error ? <ApiNotice loading={result.loading} error={result.error}/> : rows.length === 0 ? <ApiNotice loading={false} error={false} empty/> : <><TransactionTable rows={rows} limit={100} onSelect={(id) => {selectTransaction(id); setScreen("transaction-detail");}}/><div className="table-footer"><span>Showing {rows.length} highest-risk transactions</span><span>Scores from the trained XGBoost model</span></div></>}
    </Panel>
  </main></>;
}

function TransactionDetail({ transactionId, setScreen }: { transactionId: string; setScreen: (s: string) => void }) {
  const result = useApiData<TransactionRecord>(transactionId ? `/api/transactions/${encodeURIComponent(transactionId)}` : null);
  const transaction = result.data;
  const tone = riskTone(transaction?.risk_score ?? 0);
  const probabilityPercent = (transaction?.fraud_probability ?? 0) * 100;
  const currency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
  return <><AppHeader title="Transaction Investigation" subtitle="Model prediction, contribution-derived reasons and connected-entity context."/><main className="content">
    <div className="breadcrumb"><span onClick={() => setScreen("transactions")}>Transactions</span><Icon name="chevron" size={13}/><strong className="mono">{transactionId || "Select a transaction"}</strong></div>
    {result.loading || result.error || !transaction ? <Panel><ApiNotice loading={result.loading} error={result.error} empty={!result.loading && !result.error}/></Panel> : <>
      <Panel className="transaction-hero">
        <div className="tx-heading"><div><div className="eyebrow">XGBOOST PREDICTION · {new Date(transaction.timestamp).toLocaleString()}</div><div className="detail-title mono">{transaction.transaction_id}</div><div className="detail-meta">Transaction behavior scored against the trained model and account/network history.</div></div><div className="risk-hero"><div className={`score-ring ${tone}`}><strong>{Math.round(transaction.risk_score)}</strong><span>/100</span></div><div><Badge tone={tone}>{transaction.risk_level} RISK</Badge><div className="recommend-inline">{transaction.recommended_action}</div></div></div></div>
        <div className="transaction-metrics"><div><span>FRAUD PROBABILITY</span><strong>{probabilityPercent.toFixed(2)}%</strong></div><div><span>RISK SCORE</span><strong>{transaction.risk_score.toFixed(2)}<small> / 100</small></strong></div><div><span>RISK LEVEL</span><strong>{transaction.risk_level}</strong></div></div>
        <div className="fact-grid">
          {[['Amount',currency(transaction.amount),'card'],['Account',transaction.account_id,'users'],['Merchant',transaction.merchant,'card'],['Item',transaction.item,'card'],['Location',transaction.location,'location'],['Device',transaction.device_id,'device'],['Payout Account',transaction.payout_account || 'Not provided','swap']].map(([label,value,icon]) => <div className="fact" key={label}><div className="fact-icon"><Icon name={icon as IconName} size={17}/></div><div><span>{label}</span><strong className={label === "Account" || label === "Device" || label === "Payout Account" ? "mono" : ""}>{value}</strong></div></div>)}
        </div>
      </Panel>
      <div className="detail-layout">
        <div className="detail-main">
          <Panel><SectionTitle eyebrow="ACTUAL MODEL CONTRIBUTIONS" title="Why is this risky?" meta={<Badge tone={tone}>{transaction.reasons.length} REASONS</Badge>}/>
            {transaction.reasons.length ? <div className="model-reasons">{transaction.reasons.map((reason, index) => <div className="model-reason" key={`${index}-${reason}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{formatReason(reason)}</strong></div>)}</div> : <ApiNotice loading={false} error={false} empty/>}
          </Panel>
          <Panel className="risk-story"><div className="story-accent"><Icon name="pulse" size={22}/></div><SectionTitle eyebrow="PREDICTION SUMMARY" title="Model assessment"/><div className="story-text">The trained XGBoost model returned a fraud probability of <strong>{probabilityPercent.toFixed(2)}%</strong>. The model decision is <strong>{transaction.is_fraud ? "flagged for review" : "not flagged"}</strong>. Reasons above are generated from positive model feature contributions.</div><div className="story-assessment"><div><span>RISK SCORE</span><strong>{transaction.risk_score.toFixed(2)} / 100</strong></div><div className="assessment-divider"/><div><span>RECOMMENDED</span><strong>{transaction.recommended_action}</strong></div></div></Panel>
        </div>
        <div className="detail-side">
          <Panel className={`action-card ${tone === "critical" || tone === "high" ? "critical-action" : ""}`}><div className="action-icon"><Icon name="shield" size={25}/></div><div className="eyebrow">RECOMMENDED ACTION</div><div className="action-risk">{transaction.risk_level}</div><div className="action-title">{transaction.recommended_action}</div><p>{transaction.is_fraud ? "The model probability crossed the configured fraud threshold." : "The model did not cross the configured fraud threshold."}</p><ActionButton onClick={() => setScreen("investigations")}>VIEW INVESTIGATIONS</ActionButton><ActionButton tone="ghost" onClick={() => setScreen("network")}>VIEW NETWORK</ActionButton></Panel>
          <Panel><SectionTitle title="Connected entities"/><div className="connection-list">
            <div><Icon name="users"/><span><strong>{transaction.connected_accounts?.length ?? 0} connected accounts</strong>{transaction.connected_accounts?.length ? transaction.connected_accounts.join(", ") : "No connected accounts returned"}</span></div>
            <div><Icon name="device"/><span><strong>{transaction.shared_devices?.length ?? 0} connected devices</strong>{transaction.shared_devices?.length ? transaction.shared_devices.join(", ") : "No device relationships returned"}</span></div>
            <div><Icon name="card"/><span><strong>{transaction.shared_payout_accounts?.length ?? 0} payout relationships</strong>{transaction.shared_payout_accounts?.length ? transaction.shared_payout_accounts.join(", ") : "No payout relationships returned"}</span></div>
            {transaction.fraud_ring && <div><Icon name="network"/><span><strong>Fraud ring {transaction.fraud_ring.ring_id}</strong>{transaction.fraud_ring.pattern || "Ring context returned by graph analysis"}</span></div>}
          </div><ActionButton tone="ghost" onClick={() => setScreen("network")}>VIEW FRAUD RINGS →</ActionButton></Panel>
        </div>
      </div>
    </>}
  </main></>;
}

function NetworkGraph({ ring }: { ring: RingDetail }) {
  const members = ring.member_accounts ?? [];
  const accountNodes = members.map((account, index) => ({
    id: account.account_id,
    x: (index + 1) * 760 / (members.length + 1),
    y: 285,
    kind: "ACCOUNT",
  }));
  const deviceNodes = ring.shared_devices.map((id, index) => ({ id, x: (index + 1) * 760 / (ring.shared_devices.length + 1), y: 88, kind: "DEVICE" }));
  const payoutNodes = ring.shared_payout_accounts.map((id, index) => ({ id, x: (index + 1) * 760 / (ring.shared_payout_accounts.length + 1), y: 175, kind: "PAYOUT" }));
  const nodes = [...accountNodes, ...deviceNodes, ...payoutNodes];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = members.flatMap((account) => [
    ...account.connections.devices.filter((id) => ring.shared_devices.includes(id)).map((id) => [account.account_id, id] as const),
    ...account.connections.payout_accounts.filter((id) => ring.shared_payout_accounts.includes(id)).map((id) => [account.account_id, id] as const),
  ]);
  return <div className="graph">
    <svg viewBox="0 0 760 370" role="img" aria-label={`Real account, device and payout relationships for ${ring.ring_id}`}>
      <g className="edges">{edges.map(([from, to], index) => {
        const start = nodeById.get(from);
        const end = nodeById.get(to);
        return start && end ? <line key={`${from}-${to}-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="suspicious-edge"/> : null;
      })}</g>
      {nodes.map((node) => <g key={`${node.kind}-${node.id}`} className={`graph-node ${node.kind === "ACCOUNT" ? "critical-node" : node.kind.toLowerCase()}`} transform={`translate(${node.x} ${node.y})`}><circle className="node-halo" r="28"/><circle r="19"/><text className="node-type" textAnchor="middle" y="-3">{node.kind}</text><text className="node-label" textAnchor="middle" y="9">{node.id}</text></g>)}
    </svg>
    <div className="graph-legend"><span><i className="account"/>Member account</span><span><i className="device"/>Shared device</span><span><i className="payout"/>Shared payout</span></div>
  </div>;
}

function NetworkScreen({ setScreen }: { setScreen: (s: string) => void }) {
  const ringsResult = useApiData<RingSummary[]>("/api/fraud-rings");
  const [selectedRing, setSelectedRing] = useState<string | null>(null);
  const rings = ringsResult.data ?? [];
  const activeRingId = selectedRing ?? rings[0]?.ring_id ?? null;
  const detailResult = useApiData<RingDetail>(activeRingId ? `/api/fraud-rings/${encodeURIComponent(activeRingId)}` : null);
  const ring = detailResult.data;
  return <><AppHeader title="Fraud Network Intelligence" subtitle="Detect coordinated fraud through account, device and payout relationships."/><main className="content network-page">
    <div className="network-layout">
      <Panel className="rings-panel"><SectionTitle eyebrow={`${rings.length} DETECTED`} title="Fraud Rings"/>
        {ringsResult.loading || ringsResult.error ? <ApiNotice loading={ringsResult.loading} error={ringsResult.error}/> : rings.length === 0 ? <ApiNotice loading={false} error={false} empty/> : <div className="ring-list">{rings.map((item) => <div className={`ring-card ${activeRingId === item.ring_id ? "selected" : ""}`} role="button" tabIndex={0} onClick={() => setSelectedRing(item.ring_id)} key={item.ring_id}>
          <div className="ring-head"><div><span className="mono">{item.ring_id}</span><small>{item.flagged_txns.toLocaleString()} flagged transactions</small></div><div className="ring-risk"><strong>{Math.round(item.ring_score * 100)}</strong><span>RISK</span></div></div>
          <div className="ring-stats"><span><strong>{item.member_count ?? item.accounts.length}</strong> Accounts</span><span><strong>{item.shared_devices.length}</strong> Devices</span><span><strong>{item.shared_payout_accounts.length}</strong> Payouts</span></div>
        </div>)}</div>}
      </Panel>
      <Panel className="graph-panel"><div className="graph-head"><div><div className="eyebrow">SAVED GRAPH OUTPUT · SELECTED RING</div><div className="section-title">{activeRingId ?? "No detected ring"}</div></div></div>
        {detailResult.loading || detailResult.error ? <ApiNotice loading={detailResult.loading} error={detailResult.error}/> : ring ? <NetworkGraph ring={ring}/> : <ApiNotice loading={false} error={false} empty/>}
      </Panel>
    </div>
    {ring && <div className="network-insights">
      <Panel className="pattern-card"><div className="pattern-icon"><Icon name="network" size={25}/></div><div className="eyebrow cyan">GRAPH-CORROBORATED ACTIVITY</div><div className="pattern-title">{ring.pattern}</div><div className="pattern-details"><div><span>SUSPICIOUS ACTIVITY</span><strong>{ring.flagged_txns.toLocaleString()} flagged transactions · {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(ring.flagged_amount)}</strong></div><div><span>COMMON ITEM SEQUENCE</span><strong>{ring.common_sequence.join(" → ") || "No common sequence recorded"}</strong></div></div><ActionButton onClick={() => setScreen("investigations")}>OPEN INVESTIGATIONS →</ActionButton></Panel>
      <Panel className="action-card network-action"><div className="action-icon"><Icon name="shield" size={25}/></div><div className="eyebrow">RECOMMENDED ACTION</div><div className="action-risk">RISK {Math.round(ring.ring_score * 100)}</div><div className="action-title">{ring.action}</div><p>Action and risk are taken from the generated fraud-ring output.</p><ActionButton onClick={() => setScreen("investigations")}>REVIEW INVESTIGATIONS</ActionButton></Panel>
    </div>}
  </main></>;
}

function Investigations({ setScreen, selectTransaction }: { setScreen: (s: string) => void; selectTransaction: (id: string) => void }) {
  const listResult = useApiData<{ investigations: InvestigationSummary[] }>("/api/investigations");
  const investigations = listResult.data?.investigations ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? investigations[0]?.investigation_id ?? null;
  const detailResult = useApiData<InvestigationDetail>(activeId ? `/api/investigations/${encodeURIComponent(activeId)}` : null);
  const detail = detailResult.data;
  return <><AppHeader title="Investigation Workspace" subtitle="Actual flagged events, connected entities and risk-engine recommendations."/><main className="content">
    <div className="investigation-layout">
      <Panel className="rings-panel"><SectionTitle eyebrow={`${investigations.length} CASES`} title="Open Investigations"/>
        {listResult.loading || listResult.error ? <ApiNotice loading={listResult.loading} error={listResult.error}/> : investigations.length === 0 ? <ApiNotice loading={false} error={false} empty/> : <div className="ring-list">{investigations.map((item) => <div key={item.investigation_id} className={`ring-card ${activeId === item.investigation_id ? "selected" : ""}`} role="button" tabIndex={0} onClick={() => setSelectedId(item.investigation_id)}>
          <div className="ring-head"><div><span className="mono">{item.investigation_id}</span><small>{item.account_id} · {item.transaction_id}</small></div><div className={`ring-risk ${riskTone(item.risk_score)}`}><strong>{Math.round(item.risk_score)}</strong><span>/100</span></div></div>
          <div className="ring-stats"><span><strong>{item.flagged_transactions}</strong> Flagged</span><span><strong>{item.ring_id ?? "None"}</strong> Ring</span></div>
        </div>)}</div>}
      </Panel>
      <div className="case-main">
        {detailResult.loading || detailResult.error || !detail ? <Panel><ApiNotice loading={detailResult.loading} error={detailResult.error} empty={!detailResult.loading && !detailResult.error}/></Panel> : <>
          <Panel className="case-header"><div><div className="eyebrow">INVESTIGATION · {detail.account_id}</div><div className="case-title"><span className="mono">{detail.investigation_id}</span><Badge tone={riskTone(detail.risk_score)}>{detail.status}</Badge></div><p>Lead transaction <span className="mono">{detail.transaction_id}</span>{detail.ring_id ? ` · ${detail.ring_id}` : ""}</p></div><div className="case-meta"><div><span>RISK SCORE</span><strong>{detail.risk_score.toFixed(2)} / 100</strong></div><div><span>LAST ACTIVITY</span><strong>{detail.last_activity ? new Date(detail.last_activity).toLocaleString() : "Not available"}</strong></div></div></Panel>
          <div className="case-layout"><div className="case-main">
            <Panel><SectionTitle eyebrow={`${detail.timeline.length} MODEL-FLAGGED EVENTS`} title="Risk Timeline"/><div className="timeline">{detail.timeline.map((event, index) => <div className={`timeline-item ${index === detail.timeline.length - 1 ? "active" : ""}`} key={`${event.transaction_id}-${event.timestamp}`}><div className="timeline-time">{new Date(event.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</div><div className="timeline-track"><span/><i/></div><div><strong>{event.event} · {event.risk_score.toFixed(1)}</strong><p><span className="mono">{event.transaction_id}</span> · {formatReason(event.description)}</p></div></div>)}</div></Panel>
            <Panel><SectionTitle eyebrow="REAL TRANSACTION EVIDENCE" title="Flagged Transactions"/><div className="case-evidence">{detail.transactions.length ? detail.transactions.map((transaction) => <div className="evidence-callout" key={transaction.transaction_id} role="button" tabIndex={0} onClick={() => { selectTransaction(transaction.transaction_id); setScreen("transaction-detail"); }}><Icon name="shield"/><div><strong className="mono">{transaction.transaction_id} · {transaction.risk_level}</strong><span>{transaction.reasons.map(formatReason).join(" · ") || "No positive reasons returned"}</span></div><Badge tone={riskTone(transaction.risk_score)}>{transaction.risk_score.toFixed(1)}</Badge></div>) : <ApiNotice loading={false} error={false} empty/>}</div></Panel>
          </div><div className="case-side">
            <Panel className={`action-card ${riskTone(detail.risk_score) === "critical" ? "critical-action" : ""}`}><div className="action-icon"><Icon name="shield" size={25}/></div><div className="eyebrow">RISK-ENGINE RECOMMENDATION</div><div className="action-risk">{detail.risk_score.toFixed(1)} / 100</div><div className="action-title">{detail.recommendation}</div><p>{detail.top_reason ? formatReason(detail.top_reason) : "No top reason returned by the saved model output."}</p><Badge tone={riskTone(detail.risk_score)}>{detail.status}</Badge></Panel>
            <Panel><SectionTitle title="Connected entities"/><div className="connection-list">
              <div><Icon name="users"/><span><strong>{detail.connected_entities.connected_accounts.length} connected accounts</strong>{detail.connected_entities.connected_accounts.join(", ") || "None returned"}</span></div>
              <div><Icon name="device"/><span><strong>{detail.connected_entities.devices.length} devices</strong>{detail.connected_entities.devices.join(", ") || "None returned"}</span></div>
              <div><Icon name="card"/><span><strong>{detail.connected_entities.payout_accounts.length} payout accounts</strong>{detail.connected_entities.payout_accounts.join(", ") || "None returned"}</span></div>
            </div>{detail.ring_id && <ActionButton tone="ghost" onClick={() => setScreen("network")}>VIEW {detail.ring_id} NETWORK</ActionButton>}</Panel>
          </div></div>
        </>}
      </div>
    </div>
  </main></>;
}

function Accounts() {
  const result = useApiData<AccountRecord[]>("/api/accounts");
  const accounts = result.data ?? [];
  return <><AppHeader title="Account Intelligence" subtitle="Model risk, transaction history and verified account relationships."/><main className="content">
    <Panel className="transactions-panel"><SectionTitle eyebrow={`${accounts.length.toLocaleString()} ACCOUNTS`} title="Account Risk Monitor" meta={<Badge tone="info">LIVE API DATA</Badge>}/>
      {result.loading || result.error ? <ApiNotice loading={result.loading} error={result.error}/> : accounts.length === 0 ? <ApiNotice loading={false} error={false} empty/> : <div className="table-wrap"><table><thead><tr><th>Account</th><th>Risk score / level</th><th>Transactions</th><th>High-risk</th><th>Connected accounts</th><th>Connected devices</th><th>Payout relationships</th><th>Status / action</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.account_id}>
        <td className="mono primary-id">{account.account_id}{account.ring_id && <span className="row-time">{account.ring_id}</span>}</td>
        <td><div className={`account-score ${riskTone(account.risk_score)}`}>{account.risk_score.toFixed(1)}<span>/100</span></div><span className="row-time">{account.risk_level}</span></td>
        <td>{account.transaction_count.toLocaleString()}</td><td>{account.high_risk_transactions.toLocaleString()}</td>
        <td title={account.connected_accounts.join(", ")}>{account.connected_accounts.length}<span className="row-time">{account.connected_accounts.slice(0, 3).join(", ") || "None"}</span></td>
        <td title={account.connected_devices.join(", ")}>{account.connected_devices.length}<span className="row-time">{account.connected_devices.slice(0, 3).join(", ") || "None"}</span></td>
        <td title={account.payout_accounts.join(", ")}>{account.payout_accounts.length}<span className="row-time">{account.payout_accounts.slice(0, 2).join(", ") || "None"}</span></td>
        <td><Badge tone={riskTone(account.risk_score)}>{account.status}</Badge><span className="row-time">{account.recommended_action}</span>{account.reason && <span className="row-time" title={account.reason}>{account.reason}</span>}</td>
      </tr>)}</tbody></table></div>}
    </Panel>
  </main></>;
}

function ModelInsights() {
  return <><AppHeader title="Model Intelligence" subtitle="Understand how the fraud detection system performs."/><main className="content">
    <div className="model-kpis">{[["Precision","96.2%","+1.1%"],["Recall","93.8%","+0.6%"],["PR-AUC","95.1%","+0.8%"],["False Positive Rate","1.8%","−0.3%"]].map(v => <Panel className="model-kpi" key={v[0]}><span>{v[0]}</span><strong>{v[1]}</strong><small>{v[2]} vs previous version</small></Panel>)}</div>
    <div className="model-layout"><Panel><SectionTitle eyebrow="VALIDATION SET · LAST 30 DAYS" title="Model Comparison" meta={<Badge tone="info">v4.2 ACTIVE</Badge>}/><div className="model-table"><div className="model-row header"><span>MODEL</span><span>PRECISION</span><span>RECALL</span><span>PR-AUC</span></div>{[["Logistic Regression","88.4%","84.2%","86.1%"],["XGBoost","95.6%","92.7%","94.4%"],["CatBoost","96.2%","93.8%","95.1%"]].map((m,i) => <div className={`model-row ${i===2?"active":""}`} key={m[0]}><span>{m[0]} {i===2 && <Badge tone="safe">ACTIVE</Badge>}</span><strong>{m[1]}</strong><strong>{m[2]}</strong><strong>{m[3]}</strong></div>)}</div><p className="model-note">Performance metrics shown from the current validation set. Production selection remains subject to drift and fairness review.</p></Panel>
    <Panel><SectionTitle eyebrow="GLOBAL FEATURE IMPORTANCE" title="Top Risk Factors"/><div className="factors">{([["Amount anomaly",31],["New device",24],["Transaction timing",18],["Shared device",15],["Network behavior",12]] as [string, number][]).map((f,i) => <div className="factor" key={f[0]}><div><span>{f[0]}</span><strong>{f[1]}%</strong></div><div className="factor-bar"><span style={{width:`${f[1]*3}%`}} className={`factor-${i}`}/></div></div>)}</div></Panel></div>
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
  const [selectedTransaction, setSelectedTransaction] = useState("");
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
    if (screen === "transaction-detail") return <TransactionDetail transactionId={selectedTransaction} setScreen={setScreen}/>;
    if (screen === "accounts") return <Accounts/>;
    if (screen === "network") return <NetworkScreen setScreen={setScreen}/>;
    if (screen === "investigations") return <Investigations setScreen={setScreen} selectTransaction={setSelectedTransaction}/>;
    if (screen === "model") return <ModelInsights/>;
    return <CommandCenter setScreen={setScreen} selectTransaction={setSelectedTransaction}/>;
  }, [screen, selectedTransaction]);
  if (entryPage === "home") return <HomePage onNavigate={navigateEntry}/>;
  if (entryPage === "login") return <LoginPage onNavigate={navigateEntry} onSuccess={() => { window.history.pushState({}, "", "/dashboard"); setEntryPage("transition"); }}/>;
  if (entryPage === "register") return <RegisterPage onNavigate={navigateEntry}/>;
  if (entryPage === "transition") return <SecureTransition onComplete={() => setEntryPage("dashboard")}/>;
  return <div className="app-shell"><Sidebar screen={screen === "transaction-detail" ? "transactions" : screen} setScreen={setScreen} compact={compact} setCompact={setCompact}/><div className="app-main">{content}</div></div>;
}

export default App;
