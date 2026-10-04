import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { summarize, SEVERITY_ORDER, SEVERITY_COLORS } from '../lib/analysis';

const URGENCY_CLASS = { now: 'now', plan: 'plan', monitor: 'monitor' };

export default function OverviewPage({ scan, findings, onOpenFinding, onRescan }) {
  const s = summarize(findings);

  const pieData = SEVERITY_ORDER
    .map((sev) => ({ name: sev, value: s.bySeverity[sev] }))
    .filter((d) => d.value > 0);

  const typeEntries = Object.entries(s.byType).sort((a, b) => b[1] - a[1]);
  const barData = typeEntries.map(([type, count]) => ({ type, count }));

  const sorted = [...findings].sort((a, b) => {
    const d = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="fade-in">
      <div className="overview-header">
        <div>
          <h1 className="page-title">Scan results</h1>
          <div className="scan-meta">
            {scan.meta?.scan_id && <span className="meta-chip">{scan.meta.scan_id}</span>}
            <span className="meta-chip">
              {scan.repo
                  ? `GitHub: ${scan.repo.owner}/${scan.repo.repo}`
                  : `${scan.files?.length ?? 0} file${scan.files?.length === 1 ? '' : 's'} scanned`}
              </span>
            <span className="meta-chip">{s.uniqueAlgorithms} algorithms</span>
            <span className="meta-chip">profile: {scan.profile.label} (X={scan.profile.X}, Y={scan.profile.Y})</span>
            <span className="meta-chip">scenario: {scan.scenario.label} (Z={scan.scenario.Z})</span>
            {scan.meta?.duration_ms != null && <span className="meta-chip">{scan.meta.duration_ms} ms</span>}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRescan}>← New scan</button>
      </div>

      <div className="stat-row">
        <StatCard value={s.total} label="Findings" />
        <StatCard value={s.bySeverity.critical} label="Critical" tone="critical" />
        <StatCard value={s.quantumVulnerable} label="Quantum-vulnerable" tone="warn" />
        <StatCard value={s.hardcodedKeys} label="Hardcoded keys" tone="critical" />
        <StatCard value={s.bySeverity.safe} label="Quantum-safe" tone="safe" />
      </div>

      <div className="charts-row">
        <div className="card chart-card">
          <div className="chart-title">Risk severity distribution</div>
          <div className="chart-sub">All findings by severity grade</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={SEVERITY_COLORS[d.name]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} finding${value === 1 ? '' : 's'}`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-inline" style={{ justifyContent: 'center' }}>
            {pieData.map((d) => (
              <span key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: SEVERITY_COLORS[d.name] }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Findings by cryptographic type</div>
          <div className="chart-sub">Where the exposure is concentrated</div>
          <ResponsiveContainer width="100%" height={276}>
            <BarChart data={barData} margin={{ top: 5, right: 12, bottom: 4, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 11, fill: '#7c8794', fontFamily: "'JetBrains Mono', monospace" }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#7c8794' }}
              />
              <Tooltip
                cursor={{ fill: '#e3ecf4' }}
                formatter={(value) => [`${value} finding${value === 1 ? '' : 's'}`, '']}
              />
              <Bar dataKey="count" fill="#3e6b96" radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '18px 20px 0' }}>
          <div className="chart-title">Findings inventory</div>
          <div className="chart-sub">Click any row for the full risk analysis and PQC recommendation</div>
        </div>
        <div className="table-wrap">
          <table className="findings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Algorithm</th>
                <th>Type</th>
                <th>Location</th>
                <th>Library</th>
                <th>Severity</th>
                <th>Quantum risk</th>
                <th>Mosca urgency</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.id} onClick={() => onOpenFinding(f.id)}>
                  <td className="f-id">{f.id}</td>
                  <td className="f-algo">{f.algorithm}</td>
                  <td className="f-loc">{f.type}</td>
                  <td className="f-loc">{f.file}:{f.line}</td>
                  <td className="f-loc">{f.library}</td>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td className={`f-quantum ${f.quantum_vulnerable ? 'yes' : 'no'}`}>
                    {f.quantum_vulnerable ? '⚠ vulnerable' : '✓ safe'}
                  </td>
                  <td><span className={`urgency ${URGENCY_CLASS[f.mosca.urgency.key]}`}>{f.mosca.urgency.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
