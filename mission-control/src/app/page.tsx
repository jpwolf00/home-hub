import { ensureBootstrapped } from '@/lib/bootstrap';
import { latestDeploy, queryAgents, queryEvents, queryWorkflows, countWorkflows, countAgents } from '@/lib/db';
import { runtimeState, hasUsableData } from '@/lib/state';
import { isStalled } from '@/lib/stalled';
import type { WorkflowStatus } from '@/lib/types';

const statuses: WorkflowStatus[] = ['Planned', 'In Progress', 'Review', 'Blocked', 'Done'];

function fmt(s?: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default async function HomePage() {
  ensureBootstrapped();

  let workflows = [] as ReturnType<typeof queryWorkflows>;
  let agents = [] as ReturnType<typeof queryAgents>;
  let events = [] as ReturnType<typeof queryEvents>;
  let deploy: ReturnType<typeof latestDeploy> | null = null;
  let hardError: string | null = null;

  try {
    workflows = queryWorkflows();
    agents = queryAgents(undefined, false).slice(0, 20);
    events = queryEvents(10);
    deploy = latestDeploy();
  } catch (e) {
    hardError = String(e);
  }

  const grouped = Object.fromEntries(statuses.map((s) => [s, workflows.filter((w) => w.status === s)]));
  const isDegraded = runtimeState.issues.size > 0 || !hasUsableData();
  const health = isDegraded ? 'Degraded' : 'Healthy';
  const hasData = workflows.length > 0 || agents.length > 0 || events.length > 0;
  const snapshotMissing = runtimeState.checks.snapshot === 'missing';
  const showBanner = snapshotMissing && hasData;

  return (
    <main className="container grid">
      <section className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Mission Control</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/usage" style={{ color: '#fff', textDecoration: 'underline' }}>Usage</a>
          <span className="muted" style={{ marginRight: 10 }}>Last refresh {fmt(runtimeState.lastRefreshAt)}</span>
          <span className={`pill ${isDegraded ? 'pill-degraded' : 'pill-healthy'}`}>{health}</span>
        </div>
      </section>

      {showBanner && (
        <div className="banner">
          Snapshot unavailable — showing seeded/live data
        </div>
      )}

      {!hasData && !hardError && (
        <div className="banner">
          No data available. System is collecting data from active sources.
        </div>
      )}

      {hardError ? (
        <section className="panel error">Mission Control API/data error: {hardError}. Try refresh.</section>
      ) : (
        <>
          <section className="panel">
            <h2>Workflows</h2>
            {workflows.length === 0 ? (
              <div className="muted loading">No tracked workflows yet.</div>
            ) : (
              <div className="columns">
                {statuses.map((status) => (
                  <div key={status} className="panel">
                    <h3>{status}</h3>
                    {grouped[status].length === 0 ? (
                      <div className="muted">No items</div>
                    ) : (
                      grouped[status].map((wf) => (
                        <article key={wf.id} className="card">
                          <strong>{wf.title}</strong>
                          {isStalled(wf.updatedAt) && <span className="stalled">Stalled (&gt;10m)</span>}
                          <div className="muted">{wf.workflow}</div>
                          <div className="muted">Owner: {wf.ownerAgent ?? '—'}</div>
                          <div className="muted">Updated: {fmt(wf.updatedAt)}</div>
                        </article>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Active / Recent Agents</h2>
            {agents.length === 0 ? (
              <div className="muted loading">No active agents detected. Synthetic system agent may be running.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Agent/session</th><th>Status</th><th>Runtime</th><th>Last seen</th><th>Workflow/Task</th></tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.sessionKey}>
                      <td>{a.sessionKey}</td>
                      <td className={`status-${a.status}`}>{a.status}{isStalled(a.lastSeen) ? <span className="stalled">Stalled (&gt;10m)</span> : null}</td>
                      <td>{Math.floor(a.runtimeSeconds / 60)}m</td>
                      <td>{fmt(a.lastSeen)}</td>
                      <td>{a.workflow ?? '—'} / {a.currentTaskId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <h2>Activity</h2>
            <div style={{ marginBottom: 8 }}>
              Deploy: <strong>{deploy?.status?.toUpperCase?.() ?? 'UNKNOWN'}</strong> @ {fmt(deploy?.updatedAt)}
            </div>
            {events.length === 0 ? (
              <div className="muted">No recent activity.</div>
            ) : (
              <ul>
                {events.map((e) => (
                  <li key={e.id}>{e.level.toUpperCase()} [{e.source}] {e.message} ({fmt(e.createdAt)})</li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
